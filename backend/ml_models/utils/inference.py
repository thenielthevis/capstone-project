# ...existing code...
import os
import json
import re
import numpy as np
import torch
import torch.nn as nn

# base folder: backend/ml_models
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODEL_PATH = os.path.join(BASE_DIR, "trained_models", "disease_prediction_model (1).pth")

# fallback defaults
model = None
scaler = None
diag_cols = None
temperature = None

def _debug_print(msg):
    # quick debug printer - write to stderr so JSON stdout remains clean
    import sys
    print("[inference.py]", msg, file=sys.stderr)

def load_checkpoint():
    global model, scaler, diag_cols, temperature
    if not os.path.exists(MODEL_PATH):
        _debug_print(f"MODEL_PATH not found: {MODEL_PATH}")
        return False
    ckpt = torch.load(MODEL_PATH, map_location="cpu")
    _debug_print(f"Loaded checkpoint type: {type(ckpt)}")
    # Helpful debug: report whether checkpoint contains scaler/diag_cols/temperature metadata
    try:
        has_scaler = 'scaler' in ckpt if isinstance(ckpt, dict) else False
        has_diag = 'diag_cols' in ckpt if isinstance(ckpt, dict) else False
        has_temp = 'temperature' in ckpt if isinstance(ckpt, dict) else False
        _debug_print(f"Checkpoint metadata - scaler: {has_scaler}, diag_cols: {has_diag}, temperature: {has_temp}")
    except Exception:
        pass

    # If it's a dict that contains metadata + state_dict
    if isinstance(ckpt, dict) and "model_state_dict" in ckpt:
        state = ckpt["model_state_dict"]
        diag_cols = ckpt.get("diag_cols", None)
        scaler = ckpt.get("scaler", None)
        # optional temperature stored in checkpoint metadata
        temperature = ckpt.get('temperature', None)
        # fall through to state_dict handling
        state_dict = state
    elif isinstance(ckpt, dict) and all(isinstance(v, torch.Tensor) for v in ckpt.values()):
        # plain state_dict
        state_dict = ckpt
    else:
        # maybe the user saved the whole model object
        try:
            model_obj = ckpt
            model_obj.eval()
            model = model_obj
            _debug_print("Loaded entire model object from checkpoint.")
            return True
        except Exception as e:
            _debug_print(f"Failed to treat checkpoint as model object: {e}")
            return False

    # At this point we have a state_dict (mapping)
    _debug_print(f"State dict keys sample: {list(state_dict.keys())[:20]}")

    # Detect common Sequential MLP saved under 'fc.' namespace (e.g., fc.0.weight, fc.2.weight...)
    fc_pattern = re.compile(r'^fc\.(\d+)\.weight$')
    fc_indices = []
    for k in state_dict.keys():
        m = fc_pattern.match(k)
        if m:
            fc_indices.append(int(m.group(1)))
    if fc_indices:
        max_idx = max(fc_indices)
        # Determine which indices are Linear (have weight tensors)
        linear_idxs = sorted(fc_indices)
        # Build module list of length max_idx+1; fill Linear where weight exists, else ReLU
        modules = []
        for idx in range(max_idx + 1):
            if idx in linear_idxs:
                w = state_dict.get(f'fc.{idx}.weight')
                b = state_dict.get(f'fc.{idx}.bias')
                if w is None:
                    _debug_print(f"Missing weight for fc.{idx}, cannot build Linear")
                    return False
                out_dim, in_dim = tuple(w.shape)
                modules.append(nn.Linear(in_dim, out_dim))
            else:
                # assume activation (commonly ReLU) at these positions
                modules.append(nn.ReLU())

        class ReconstructedMLP(nn.Module):
            def __init__(self, modules_list):
                super().__init__()
                self.fc = nn.Sequential(*modules_list)
            def forward(self, x):
                return self.fc(x)

        model_candidate = ReconstructedMLP(modules)
        try:
            model_candidate.load_state_dict(state_dict)
            model_candidate.eval()
            model = model_candidate
            _debug_print(f"Reconstructed MLP with fc indices {linear_idxs} and loaded state_dict.")
            return True
        except Exception as e:
            _debug_print(f"Failed to load state_dict into reconstructed MLP: {e}")
            return False

    # Fallback: try to detect a single linear layer (old behavior)
    weight_key = None
    for k, v in state_dict.items():
        if k.endswith(".weight"):
            weight_key = k
            break
    if weight_key is not None:
        w = state_dict[weight_key]
        if isinstance(w, torch.Tensor) and w.dim() == 2:
            out_dim, in_dim = w.shape
            _debug_print(f"Detected linear layer weight '{weight_key}' shape: out={out_dim} in={in_dim}")
            class SimpleTabularModel(nn.Module):
                def __init__(self, input_dim, output_dim):
                    super().__init__()
                    self.linear = nn.Linear(input_dim, output_dim)
                def forward(self, x):
                    return self.linear(x)
            model_candidate = SimpleTabularModel(in_dim, out_dim)
            try:
                model_candidate.load_state_dict(state_dict)
                model_candidate.eval()
                model = model_candidate
                _debug_print("Loaded plain state_dict into SimpleTabularModel.")
                return True
            except Exception as e:
                _debug_print(f"Failed to load plain state_dict: {e}")

    _debug_print("Could not auto-load a matching architecture from the checkpoint.")
    return False

def predict_from_array(features):
    """
    features: list or numpy array shape (n_features,) or (batch, n_features)
    returns: dict mapping label->probability (0..1) if diag_cols present, otherwise returns list
    """
    global model, scaler, diag_cols, temperature
    if model is None:
        raise RuntimeError("Model not loaded. Call load_checkpoint() first.")

    x = features
    if isinstance(x, list):
        x = np.array(x, dtype=float)
    if x.ndim == 1:
        x = x.reshape(1, -1)
    # apply scaler if present and it's a sklearn-like object
    try:
        if scaler is not None:
            x = scaler.transform(x)
    except Exception:
        # if scaler wasn't pickled properly, ignore and continue
        pass

    xt = torch.tensor(x, dtype=torch.float32)
    with torch.no_grad():
        logits = model(xt)
        # convert logits to numpy after applying correct activation
        try:
            # flatten logits to tensor
            logits_np = logits.cpu().numpy()
        except Exception:
            logits_np = logits.detach().cpu().numpy()

        # determine activation: if multi-class (more than 1 output) use softmax, else sigmoid
        if logits_np.ndim == 2 and logits_np.shape[1] > 1:
            # softmax with optional temperature scaling (from checkpoint)
            temp = globals().get('temperature', None)
            if temp is None:
                temp = 1.0
            # stable softmax
            exps = np.exp((logits_np - np.max(logits_np, axis=1, keepdims=True)) / float(temp))
            probs = exps / np.sum(exps, axis=1, keepdims=True)
        else:
            # single-output: treat as sigmoid (probability)
            probs = 1.0 / (1.0 + np.exp(-logits_np))
    # if single-sample
    probs = probs.squeeze()
    if diag_cols:
        # return mapping label->prob
        # if probs is 1D (single sample), ensure mapping enumerates correctly
        if probs.ndim == 1:
            return {label: float(probs[i]) for i, label in enumerate(diag_cols)}
        # if batch, return first sample mapping
        return {label: float(probs[0][i]) for i, label in enumerate(diag_cols)}
    # else return list
    return probs.tolist()

# Auto run load for convenience (comment out if you don't want auto load)
_loaded = load_checkpoint()
if not _loaded:
    _debug_print("Model not auto-loaded. Inspect the checkpoint contents using the test script.")

