// Human-readable disease labels used to map numeric class indices from the ML model
// Edit this list to match the order of classes produced by your model checkpoint.

module.exports = [
  'Diabetes',
  'Hypertension',
  'Ischemic Heart Disease',
  'Stroke',
  'Chronic Kidney Disease',
  'Lung Cancer',
  'Asthma',
  'Arthritis',
  'COPD',
  'Anemia'
];

// If your model has a different number of output classes, extend or reorder this array
// so index 0 corresponds to the first output of the model, index 1 to the second, etc.
