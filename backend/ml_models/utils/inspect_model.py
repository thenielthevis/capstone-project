import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from utils.inference import load_checkpoint, model, diag_cols

ok = load_checkpoint()
print('loaded:', ok)
print('model is', type(model))
try:
    if model is None:
        print('model is None')
    else:
        sd = model.state_dict()
        print('state_dict keys count:', len(sd.keys()))
        for i,(n,v) in enumerate(sd.items()):
            if i<20:
                print(n, tuple(v.shape))
        # find first 2D weight
        for n,v in sd.items():
            if v.dim()==2:
                print('first 2D weight:', n, tuple(v.shape))
                break
except Exception as e:
    print('error inspecting model:', e)
print('diag_cols length:', len(diag_cols) if diag_cols else None)
