const FoodLog = require('../models/foodLogModel');
const { uploadProfilePicture } = require('../utils/cloudinary');
const mongoose = require('mongoose');

// Create a new food log entry
exports.createFoodLog = async (req, res) => {
  try {
    console.log('[foodLogController] Creating food log for user:', req.user.id);
    const userId = req.user.id; // From auth middleware
    const foodData = req.body;

    // Validate required fields
    if (!foodData.foodName) {
      console.log('[foodLogController] Missing required field: foodName');
      return res.status(400).json({
        message: 'Food name is required'
      });
    }

    if (!foodData.calories || !foodData.servingSize) {
      console.log('[foodLogController] Missing required fields: calories or servingSize');
      return res.status(400).json({
        message: 'Calories and serving size are required'
      });
    }

    // Upload image to Cloudinary if provided
    let imageUrl = null;
    if (foodData.imageBase64) {
      try {
        console.log('[foodLogController] Uploading image to Cloudinary...');
        const uploadResult = await uploadProfilePicture(foodData.imageBase64);
        imageUrl = uploadResult.secure_url;
        console.log('[foodLogController] Image uploaded successfully:', imageUrl);
      } catch (uploadError) {
        console.error('[foodLogController] Image upload failed:', uploadError.message);
        // Continue without image if upload fails
      }
    }

    console.log('[foodLogController] Creating food log entry...');
    const newFoodLog = new FoodLog({
      userId,
      inputMethod: foodData.inputMethod || 'image',
      imageUrl,
      foodName: foodData.foodName,
      dishName: foodData.dishName || null,
      brandedProduct: foodData.brandedProduct || {
        isBranded: false,
        brandName: null,
        productName: null,
        ingredients: null,
        purchaseLinks: { lazada: null, shopee: null, puregold: null }
      },
      nutritionSources: foodData.nutritionSources || [],
      recipeLinks: foodData.recipeLinks || [],
      calories: foodData.calories,
      servingSize: foodData.servingSize,
      nutrients: foodData.nutrients || {},
      allergyWarnings: foodData.allergyWarnings || {
        detected: [],
        mayContain: [],
        warning: null
      },
      userAllergies: foodData.userAllergies || [],
      healthyAlternatives: foodData.healthyAlternatives || [],
      confidence: foodData.confidence || 'medium',
      notes: foodData.notes || '',
      ingredientsList: foodData.ingredientsList || null
    });

    const savedLog = await newFoodLog.save();
    console.log('[foodLogController] Food log saved successfully:', savedLog._id);

    res.status(201).json({
      message: 'Food log created successfully',
      foodLog: savedLog
    });
  } catch (error) {
    console.error('[foodLogController] Error creating food log:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all food logs for the authenticated user
exports.getUserFoodLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      startDate, 
      endDate,
      searchQuery,
      sortBy = 'analyzedAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { userId };

    // Date range filter
    if (startDate || endDate) {
      query.analyzedAt = {};
      if (startDate) query.analyzedAt.$gte = new Date(startDate);
      if (endDate) query.analyzedAt.$lte = new Date(endDate);
    }

    // Search filter
    if (searchQuery) {
      query.$or = [
        { foodName: { $regex: searchQuery, $options: 'i' } },
        { dishName: { $regex: searchQuery, $options: 'i' } },
        { 'brandedProduct.brandName': { $regex: searchQuery, $options: 'i' } },
        { 'brandedProduct.productName': { $regex: searchQuery, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const foodLogs = await FoodLog.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await FoodLog.countDocuments(query);

    res.status(200).json({
      message: 'Food logs retrieved successfully',
      foodLogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error retrieving food logs:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get a single food log by ID
exports.getFoodLogById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const foodLog = await FoodLog.findOne({ _id: id, userId });

    if (!foodLog) {
      return res.status(404).json({
        message: 'Food log not found'
      });
    }

    res.status(200).json({
      message: 'Food log retrieved successfully',
      foodLog
    });
  } catch (error) {
    console.error('Error retrieving food log:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get nutrition statistics for a user
exports.getUserNutritionStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, period = 'week' } = req.query;

    // Calculate date range based on period if not provided
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        analyzedAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      const now = new Date();
      const periodStart = new Date();
      
      switch (period) {
        case 'day':
          periodStart.setDate(now.getDate() - 1);
          break;
        case 'week':
          periodStart.setDate(now.getDate() - 7);
          break;
        case 'month':
          periodStart.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          periodStart.setFullYear(now.getFullYear() - 1);
          break;
        default:
          periodStart.setDate(now.getDate() - 7);
      }
      
      dateFilter = {
        analyzedAt: { $gte: periodStart, $lte: now }
      };
    }

    const stats = await FoodLog.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId), ...dateFilter }
      },
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          totalCalories: { $sum: '$calories' },
          avgCalories: { $avg: '$calories' },
          totalProtein: { $sum: '$nutrients.protein' },
          totalCarbs: { $sum: '$nutrients.carbs' },
          totalFat: { $sum: '$nutrients.fat' },
          totalFiber: { $sum: '$nutrients.fiber' },
          totalSugar: { $sum: '$nutrients.sugar' },
          totalSodium: { $sum: '$nutrients.sodium' },
          avgProtein: { $avg: '$nutrients.protein' },
          avgCarbs: { $avg: '$nutrients.carbs' },
          avgFat: { $avg: '$nutrients.fat' }
        }
      }
    ]);

    // Get most logged foods
    const topFoods = await FoodLog.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId), ...dateFilter }
      },
      {
        $group: {
          _id: '$foodName',
          count: { $sum: 1 },
          avgCalories: { $avg: '$calories' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.status(200).json({
      message: 'Nutrition statistics retrieved successfully',
      stats: stats.length > 0 ? stats[0] : null,
      topFoods
    });
  } catch (error) {
    console.error('Error retrieving nutrition stats:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Update a food log entry
exports.updateFoodLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updateData = req.body;

    const foodLog = await FoodLog.findOne({ _id: id, userId });

    if (!foodLog) {
      return res.status(404).json({
        message: 'Food log not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['notes', 'dishName', 'servingSize'];
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        foodLog[field] = updateData[field];
      }
    });

    const updatedLog = await foodLog.save();

    res.status(200).json({
      message: 'Food log updated successfully',
      foodLog: updatedLog
    });
  } catch (error) {
    console.error('Error updating food log:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete a food log entry
exports.deleteFoodLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const foodLog = await FoodLog.findOneAndDelete({ _id: id, userId });

    if (!foodLog) {
      return res.status(404).json({
        message: 'Food log not found'
      });
    }

    res.status(200).json({
      message: 'Food log deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting food log:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete multiple food logs
exports.deleteFoodLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ids } = req.body; // Array of food log IDs

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message: 'Please provide an array of food log IDs to delete'
      });
    }

    const result = await FoodLog.deleteMany({
      _id: { $in: ids },
      userId
    });

    res.status(200).json({
      message: 'Food logs deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting food logs:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};
