const FoodLog = require('../models/foodLogModel');
const User = require('../models/userModel');
const { uploadProfilePicture } = require('../utils/cloudinary');
const mongoose = require('mongoose');

// Helper function to update user's daily calorie balance
async function updateUserDailyCalories(userId, calories) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's entry
    let entry = user.dailyCalorieBalance.find(e => {
      const entryDate = new Date(e.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });

    if (!entry) {
      // Calculate goal_kcal if no entry exists
      const { age, gender, physicalMetrics, lifestyle } = user;
      const weight = physicalMetrics?.weight?.value;
      const height = physicalMetrics?.height?.value;
      const targetWeight = physicalMetrics?.targetWeight?.value;
      const activityLevel = lifestyle?.activityLevel;
      
      let goal_kcal = 2000; // Default
      if (weight && height && age && gender) {
        // Mifflin-St Jeor Equation for BMR
        let bmr;
        if (gender === 'male') {
          bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
          bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }
        const activityFactors = {
          sedentary: 1.2,
          lightly_active: 1.375,
          moderately_active: 1.55,
          very_active: 1.725,
          extremely_active: 1.9
        };
        const activityMult = activityFactors[activityLevel] || 1.2;
        goal_kcal = Math.round(bmr * activityMult);
        if (targetWeight && Math.abs(targetWeight - weight) > 1) {
          const diff = targetWeight - weight;
          goal_kcal += diff > 0 ? 250 : -250;
        }
      }

      user.dailyCalorieBalance.push({
        date: today,
        goal_kcal,
        consumed_kcal: calories,
        burned_kcal: 0,
        net_kcal: calories,
        status: calories < goal_kcal - 100 ? 'under' : (calories > goal_kcal + 100 ? 'over' : 'on_target')
      });
    } else {
      // Update existing entry
      entry.consumed_kcal = (entry.consumed_kcal || 0) + calories;
      entry.net_kcal = entry.consumed_kcal - (entry.burned_kcal || 0);
      
      // Update status
      if (entry.net_kcal < entry.goal_kcal - 100) {
        entry.status = 'under';
      } else if (entry.net_kcal > entry.goal_kcal + 100) {
        entry.status = 'over';
      } else {
        entry.status = 'on_target';
      }
    }

    await user.save();
    console.log('[UPDATE DAILY CALORIES] Updated daily calorie balance for user:', userId);
  } catch (error) {
    console.error('[UPDATE DAILY CALORIES] Error:', error.message);
  }
}

// Create a new food log entry
exports.createFoodLog = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id; // From auth middleware
    console.log('[CREATE FOOD LOG] Creating food log for user:', userId);
    const foodData = req.body;

    // Validate required fields
    if (!foodData.foodName) {
      console.log('[CREATE FOOD LOG] Missing required field: foodName');
      return res.status(400).json({
        message: 'Food name is required'
      });
    }

    if (!foodData.calories || !foodData.servingSize) {
      console.log('[CREATE FOOD LOG] Missing required fields: calories or servingSize');
      return res.status(400).json({
        message: 'Calories and serving size are required'
      });
    }

    // Upload image to Cloudinary if provided
    let imageUrl = null;
    if (foodData.imageBase64) {
      try {
        console.log('[CREATE FOOD LOG] Uploading image to Cloudinary...');
        const uploadResult = await uploadProfilePicture(foodData.imageBase64);
        imageUrl = uploadResult.secure_url;
        console.log('[CREATE FOOD LOG] Image uploaded successfully:', imageUrl);
      } catch (uploadError) {
        console.error('[CREATE FOOD LOG] Image upload failed:', uploadError.message);
        // Continue without image if upload fails
      }
    }

    console.log('[CREATE FOOD LOG] Creating food log entry...');
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
    console.log('[CREATE FOOD LOG] Food log saved successfully:', savedLog._id);

    // Automatically update user's daily calorie balance
    await updateUserDailyCalories(userId, foodData.calories);

    res.status(201).json({
      message: 'Food log created successfully',
      foodLog: savedLog
    });
  } catch (error) {
    console.error('[CREATE FOOD LOG] Error creating food log:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all food logs for the authenticated user (admins see all)
exports.getUserFoodLogs = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const { 
      page = 1, 
      limit = 20, 
      startDate, 
      endDate,
      searchQuery,
      sortBy = 'analyzedAt',
      sortOrder = 'desc'
    } = req.query;

    console.log('[GET USER FOOD LOGS] User ID:', userId);
    console.log('[GET USER FOOD LOGS] User Role:', userRole);
    console.log('[GET USER FOOD LOGS] Full user object:', JSON.stringify(req.user));

    let query = {};
    
    // Build the base query
    // If admin, return all food logs; if regular user, filter by userId
    if (userRole === 'admin') {
      console.log('[GET USER FOOD LOGS] Admin user - returning ALL food logs (no userId filter)');
      // Admin sees everything, no filter needed
      query = {};
    } else {
      console.log('[GET USER FOOD LOGS] Regular user - filtering by userId:', userId);
      // Convert string ID to ObjectId for proper MongoDB matching
      query = { userId: new mongoose.Types.ObjectId(userId) };
    }

    // Date range filter (applied to any query type)
    if (startDate || endDate) {
      query.analyzedAt = {};
      if (startDate) query.analyzedAt.$gte = new Date(startDate);
      if (endDate) query.analyzedAt.$lte = new Date(endDate);
    }

    // Search filter (applied to any query type)
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

    console.log('[GET USER FOOD LOGS] Query object:', JSON.stringify(query));

    const foodLogs = await FoodLog.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await FoodLog.countDocuments(query);

    console.log('[GET USER FOOD LOGS] Found', foodLogs.length, 'food logs');
    console.log('[GET USER FOOD LOGS] Total matching count:', totalCount);

    // Log sample data if found
    if (foodLogs.length > 0) {
      console.log('[GET USER FOOD LOGS] First food log ID:', foodLogs[0]._id);
      console.log('[GET USER FOOD LOGS] First food log userId:', foodLogs[0].userId);
      console.log('[GET USER FOOD LOGS] First food log name:', foodLogs[0].foodName);
    }

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
    console.error('[GET USER FOOD LOGS] Error:', error.message);
    console.error('[GET USER FOOD LOGS] Stack:', error.stack);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get a single food log by ID
exports.getFoodLogById = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const { id } = req.params;

    console.log('[GET FOOD LOG BY ID] Getting food log:', id);
    console.log('[GET FOOD LOG BY ID] User ID:', userId);
    console.log('[GET FOOD LOG BY ID] User Role:', userRole);

    const foodLog = await FoodLog.findById(id);

    if (!foodLog) {
      return res.status(404).json({
        message: 'Food log not found'
      });
    }

    // Check ownership if not admin
    if (userRole !== 'admin' && foodLog.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        message: 'Unauthorized'
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
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const { id } = req.params;
    const updateData = req.body;

    console.log('[UPDATE FOOD LOG] Updating food log:', id);
    console.log('[UPDATE FOOD LOG] User ID:', userId);
    console.log('[UPDATE FOOD LOG] User Role:', userRole);

    const foodLog = await FoodLog.findById(id);

    if (!foodLog) {
      return res.status(404).json({
        message: 'Food log not found'
      });
    }

    // Check ownership if not admin
    if (userRole !== 'admin' && foodLog.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        message: 'Unauthorized'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['foodName', 'notes', 'dishName', 'servingSize'];
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        foodLog[field] = updateData[field];
      }
    });

    const updatedLog = await foodLog.save();
    console.log('[UPDATE FOOD LOG] Food log updated successfully');

    res.status(200).json({
      message: 'Food log updated successfully',
      foodLog: updatedLog
    });
  } catch (error) {
    console.error('[UPDATE FOOD LOG] Error:', error.message);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete a food log entry
exports.deleteFoodLog = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const { id } = req.params;

    console.log('[DELETE FOOD LOG] Deleting food log:', id);
    console.log('[DELETE FOOD LOG] User ID:', userId);
    console.log('[DELETE FOOD LOG] User Role:', userRole);

    const foodLog = await FoodLog.findById(id);

    if (!foodLog) {
      return res.status(404).json({
        message: 'Food log not found'
      });
    }

    // Check ownership if not admin
    if (userRole !== 'admin' && foodLog.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        message: 'Unauthorized'
      });
    }

    await FoodLog.findByIdAndDelete(id);
    console.log('[DELETE FOOD LOG] Food log deleted successfully');

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
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const { ids } = req.body; // Array of food log IDs

    console.log('[DELETE FOOD LOGS] Deleting multiple food logs');
    console.log('[DELETE FOOD LOGS] User ID:', userId);
    console.log('[DELETE FOOD LOGS] User Role:', userRole);

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message: 'Please provide an array of food log IDs to delete'
      });
    }

    let query = { _id: { $in: ids } };
    
    // If not admin, only delete their own food logs
    if (userRole !== 'admin') {
      // Convert string ID to ObjectId for proper MongoDB matching
      query.userId = new mongoose.Types.ObjectId(userId);
    }

    const result = await FoodLog.deleteMany(query);
    console.log('[DELETE FOOD LOGS] Deleted', result.deletedCount, 'food logs');

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
