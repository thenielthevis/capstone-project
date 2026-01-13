const mongoose = require('mongoose');

const foodLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Analysis timestamp
  analyzedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Input method
  inputMethod: {
    type: String,
    enum: ['image', 'manual', 'multi-dish'],
    required: true
  },
  // Image data (if uploaded)
  imageUrl: {
    type: String,
    default: null
  },
  // Food identification
  foodName: {
    type: String,
    required: true
  },
  dishName: {
    type: String,
    default: null
  },
  // Branded product information
  brandedProduct: {
    isBranded: {
      type: Boolean,
      default: false
    },
    brandName: {
      type: String,
      default: null
    },
    productName: {
      type: String,
      default: null
    },
    ingredients: {
      type: String,
      default: null
    },
    purchaseLinks: {
      lazada: { type: String, default: null },
      shopee: { type: String, default: null },
      puregold: { type: String, default: null }
    }
  },
  // Nutrition sources
  nutritionSources: [{
    source: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    reliability: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    }
  }],
  // Recipe links
  recipeLinks: [{
    title: {
      type: String,
      required: true
    },
    source: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  }],
  // Nutritional values
  calories: {
    type: Number,
    required: true,
    min: 0
  },
  servingSize: {
    type: String,
    required: true
  },
  nutrients: {
    protein: { type: Number, default: 0, min: 0 },
    carbs: { type: Number, default: 0, min: 0 },
    fat: { type: Number, default: 0, min: 0 },
    fiber: { type: Number, default: 0, min: 0 },
    sugar: { type: Number, default: 0, min: 0 },
    saturatedFat: { type: Number, default: 0, min: 0 },
    transFat: { type: Number, default: 0, min: 0 },
    sodium: { type: Number, default: 0, min: 0 },
    cholesterol: { type: Number, default: 0, min: 0 },
    potassium: { type: Number, default: 0, min: 0 },
    vitaminA: { type: Number, default: 0, min: 0 },
    vitaminC: { type: Number, default: 0, min: 0 },
    vitaminD: { type: Number, default: 0, min: 0 },
    calcium: { type: Number, default: 0, min: 0 },
    iron: { type: Number, default: 0, min: 0 }
  },
  // Allergy warnings
  allergyWarnings: {
    detected: [{
      type: String
    }],
    mayContain: [{
      type: String
    }],
    warning: {
      type: String,
      default: null
    }
  },
  // User's allergy input for this analysis
  userAllergies: [{
    type: String
  }],
  // Healthy alternatives
  healthyAlternatives: [{
    name: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    caloriesSaved: {
      type: Number,
      required: true
    }
  }],
  // Analysis metadata
  confidence: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  notes: {
    type: String,
    default: ''
  },
  // Manual input ingredients (if applicable)
  ingredientsList: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
foodLogSchema.index({ userId: 1, analyzedAt: -1 });
foodLogSchema.index({ userId: 1, foodName: 1 });
foodLogSchema.index({ userId: 1, 'brandedProduct.isBranded': 1 });

module.exports = mongoose.model('FoodLog', foodLogSchema);
