const User = require('../models/userModel');
const FoodLog = require('../models/foodLogModel');
const Workout = require('../models/workoutModel');
const Program = require('../models/programModel');
const Achievement = require('../models/achievementModel');
const UserAchievement = require('../models/userAchievementModel');

// Get dashboard stats - Admin only
exports.getStats = async (req, res) => {
    try {
        console.log('[getStats] Fetching statistics...');
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalAdmins = await User.countDocuments({ role: 'admin' });
        
        console.log('[getStats] Stats calculated - Users:', totalUsers, 'Admins:', totalAdmins);
        
        // You can add more stats as needed
        res.status(200).json({
            totalUsers,
            totalAdmins,
        });
    } catch (error) {
        console.error('[getStats] Error:', error);
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
};

// Create new admin - Admin only
exports.createAdmin = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Create new admin user
        const newAdmin = new User({
            username,
            email,
            password,
            role: 'admin',
            verified: true, // Auto-verify admin accounts
        });

        await newAdmin.save();

        res.status(201).json({
            message: 'Admin account created successfully',
            user: {
                id: newAdmin._id,
                username: newAdmin.username,
                email: newAdmin.email,
                role: newAdmin.role,
            }
        });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ message: 'Failed to create admin account' });
    }
};

// Get all users - Admin only
exports.getAllUsers = async (req, res) => {
    try {
        const { role, page = 1, limit = 10 } = req.query;

        console.log('[getAllUsers] Query params:', { role, page, limit });

        let query = {};
        if (role) {
            query.role = role;
        }

        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;

        console.log('[getAllUsers] Filter:', query, 'Skip:', skip, 'Limit:', limitNum);

        const users = await User.find(query)
            .select('-password')
            .sort({ registeredDate: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await User.countDocuments(query);

        console.log('[getAllUsers] Found users:', users.length, 'Total:', total);

        res.status(200).json({
            users,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
            }
        });
    } catch (error) {
        console.error('[getAllUsers] Error:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};

// Get user by ID - Admin only
exports.getUserById = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Failed to fetch user' });
    }
};

// Delete user - Admin only
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Prevent deleting the requesting admin
        if (userId === req.user.id) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }

        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Failed to delete user' });
    }
};

// Get all food logs from all users - Admin only
exports.getAllFoodLogs = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            startDate, 
            endDate,
            searchQuery,
            userId,
            sortBy = 'analyzedAt',
            sortOrder = 'desc'
        } = req.query;

        console.log('[getAllFoodLogs] Admin fetching all food logs with filters:', {
            page, limit, startDate, endDate, searchQuery, userId, sortBy, sortOrder
        });

        let query = {};

        // Filter by specific user if provided
        if (userId) {
            query.userId = userId;
        }

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

        console.log('[getAllFoodLogs] Query:', JSON.stringify(query));

        const foodLogs = await FoodLog.find(query)
            .populate('userId', 'username email profilePicture')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const totalCount = await FoodLog.countDocuments(query);

        console.log('[getAllFoodLogs] Found', foodLogs.length, 'food logs, Total:', totalCount);

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
        console.error('[getAllFoodLogs] Error:', error);
        res.status(500).json({ message: 'Failed to fetch food logs', error: error.message });
    }
};

// Get food log statistics for admin dashboard - Admin only
exports.getFoodLogStats = async (req, res) => {
    try {
        const totalFoodLogs = await FoodLog.countDocuments();
        const totalUsers = await User.countDocuments({ role: 'user' });
        
        // Get logs from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentLogs = await FoodLog.countDocuments({
            analyzedAt: { $gte: sevenDaysAgo }
        });

        // Get most active users
        const topUsers = await FoodLog.aggregate([
            {
                $group: {
                    _id: '$userId',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 5
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    userId: '$_id',
                    username: '$user.username',
                    email: '$user.email',
                    logCount: '$count'
                }
            }
        ]);

        // Get most logged foods
        const topFoods = await FoodLog.aggregate([
            {
                $group: {
                    _id: '$foodName',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            },
            {
                $project: {
                    foodName: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]);

        res.status(200).json({
            totalFoodLogs,
            totalUsers,
            recentLogs,
            averageLogsPerUser: totalUsers > 0 ? (totalFoodLogs / totalUsers).toFixed(2) : 0,
            topUsers,
            topFoods
        });
    } catch (error) {
        console.error('[getFoodLogStats] Error:', error);
        res.status(500).json({ message: 'Failed to fetch food log statistics', error: error.message });
    }
};

// Delete a food log by admin - Admin only
exports.deleteFoodLog = async (req, res) => {
    try {
        const { foodLogId } = req.params;

        console.log('[Admin deleteFoodLog] Deleting food log:', foodLogId);

        const foodLog = await FoodLog.findByIdAndDelete(foodLogId);

        if (!foodLog) {
            return res.status(404).json({ message: 'Food log not found' });
        }

        res.status(200).json({ message: 'Food log deleted successfully' });
    } catch (error) {
        console.error('[Admin deleteFoodLog] Error:', error);
        res.status(500).json({ message: 'Failed to delete food log', error: error.message });
    }
};

// Get all workouts - Admin only
exports.getAllWorkouts = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            category,
            type,
            searchQuery,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        console.log('[Admin getAllWorkouts] Fetching all workouts with filters:', {
            page, limit, category, type, searchQuery, sortBy, sortOrder
        });

        let query = {};

        // Filter by category if provided
        if (category) {
            query.category = category;
        }

        // Filter by type if provided
        if (type) {
            query.type = type;
        }

        // Search filter
        if (searchQuery) {
            query.$or = [
                { name: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { equipment_needed: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        console.log('[Admin getAllWorkouts] Query:', JSON.stringify(query));

        const workouts = await Workout.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const totalCount = await Workout.countDocuments(query);

        console.log('[Admin getAllWorkouts] Found', workouts.length, 'workouts, Total:', totalCount);

        res.status(200).json({
            message: 'Workouts retrieved successfully',
            workouts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalItems: totalCount,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('[Admin getAllWorkouts] Error:', error);
        res.status(500).json({ message: 'Failed to fetch workouts', error: error.message });
    }
};

// Get workout statistics for admin dashboard - Admin only
exports.getWorkoutStats = async (req, res) => {
    try {
        const totalWorkouts = await Workout.countDocuments();
        const bodyweightWorkouts = await Workout.countDocuments({ category: 'bodyweight' });
        const equipmentWorkouts = await Workout.countDocuments({ category: 'equipment' });
        
        // Get workouts by type
        const workoutsByType = await Workout.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $project: {
                    type: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]);

        // Get workouts by category
        const workoutsByCategory = await Workout.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    category: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]);

        console.log('[Admin getWorkoutStats] Stats retrieved successfully');

        res.status(200).json({
            totalWorkouts,
            bodyweightWorkouts,
            equipmentWorkouts,
            workoutsByType,
            workoutsByCategory
        });
    } catch (error) {
        console.error('[Admin getWorkoutStats] Error:', error);
        res.status(500).json({ message: 'Failed to fetch workout statistics', error: error.message });
    }
};

// Delete a workout by admin - Admin only
exports.deleteWorkout = async (req, res) => {
    try {
        const { workoutId } = req.params;

        console.log('[Admin deleteWorkout] Deleting workout:', workoutId);

        const workout = await Workout.findByIdAndDelete(workoutId);

        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        res.status(200).json({ message: 'Workout deleted successfully' });
    } catch (error) {
        console.error('[Admin deleteWorkout] Error:', error);
        res.status(500).json({ message: 'Failed to delete workout', error: error.message });
    }
};

// ============= PROGRAM MANAGEMENT =============

// Get all programs - Admin only
exports.getAllPrograms = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            userId,
            searchQuery,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        console.log('[Admin getAllPrograms] Fetching all programs with filters:', {
            page, limit, userId, searchQuery, sortBy, sortOrder
        });

        let query = {};

        // Filter by specific user if provided
        if (userId) {
            query.user_id = userId;
        }

        // Search filter
        if (searchQuery) {
            query.$or = [
                { name: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        console.log('[Admin getAllPrograms] Query:', JSON.stringify(query));

        const programs = await Program.find(query)
            .populate('user_id', 'username email profilePicture')
            .populate('workouts.workout_id', 'name type category')
            .populate('geo_activities.activity_id', 'name description')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const totalCount = await Program.countDocuments(query);

        console.log('[Admin getAllPrograms] Found', programs.length, 'programs, Total:', totalCount);

        res.status(200).json({
            message: 'Programs retrieved successfully',
            programs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalItems: totalCount,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('[Admin getAllPrograms] Error:', error);
        res.status(500).json({ message: 'Failed to fetch programs', error: error.message });
    }
};

// Get program statistics for admin dashboard - Admin only
exports.getProgramStats = async (req, res) => {
    try {
        const totalPrograms = await Program.countDocuments();
        
        // Get unique program creators
        const programCreators = await Program.distinct('user_id');
        const totalCreators = programCreators.length;
        
        // Get programs from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentPrograms = await Program.countDocuments({
            created_at: { $gte: sevenDaysAgo }
        });

        // Get top program creators
        const topCreators = await Program.aggregate([
            {
                $group: {
                    _id: '$user_id',
                    programCount: { $sum: 1 }
                }
            },
            {
                $sort: { programCount: -1 }
            },
            {
                $limit: 5
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    userId: '$_id',
                    username: '$user.username',
                    email: '$user.email',
                    programCount: 1
                }
            }
        ]);

        // Get average workouts and activities per program
        const programStats = await Program.aggregate([
            {
                $project: {
                    workoutCount: { $size: '$workouts' },
                    activityCount: { $size: '$geo_activities' }
                }
            },
            {
                $group: {
                    _id: null,
                    avgWorkouts: { $avg: '$workoutCount' },
                    avgActivities: { $avg: '$activityCount' }
                }
            }
        ]);

        console.log('[Admin getProgramStats] Stats retrieved successfully');

        res.status(200).json({
            totalPrograms,
            totalCreators,
            recentPrograms,
            averageProgramsPerCreator: totalCreators > 0 ? (totalPrograms / totalCreators).toFixed(2) : '0',
            topCreators,
            avgWorkoutsPerProgram: programStats[0]?.avgWorkouts?.toFixed(2) || '0',
            avgActivitiesPerProgram: programStats[0]?.avgActivities?.toFixed(2) || '0'
        });
    } catch (error) {
        console.error('[Admin getProgramStats] Error:', error);
        res.status(500).json({ message: 'Failed to fetch program statistics', error: error.message });
    }
};

// Create a new program - Admin only
exports.createProgram = async (req, res) => {
    try {
        const {
            user_id,
            group_id,
            name,
            description,
            workouts,
            geo_activities
        } = req.body;

        console.log('[Admin createProgram] Creating program:', name);

        if (!user_id || !name) {
            return res.status(400).json({ message: 'User ID and name are required' });
        }

        const program = new Program({
            user_id,
            group_id,
            name,
            description,
            workouts: workouts || [],
            geo_activities: geo_activities || []
        });

        await program.save();

        // Populate the program before returning
        const populatedProgram = await Program.findById(program._id)
            .populate('user_id', 'username email profilePicture')
            .populate('workouts.workout_id', 'name type category')
            .populate('geo_activities.activity_id', 'name description');

        console.log('[Admin createProgram] Program created successfully:', program._id);

        res.status(201).json({
            message: 'Program created successfully',
            program: populatedProgram
        });
    } catch (error) {
        console.error('[Admin createProgram] Error:', error);
        res.status(500).json({ message: 'Failed to create program', error: error.message });
    }
};

// Update a program - Admin only
exports.updateProgram = async (req, res) => {
    try {
        const { programId } = req.params;
        const updateData = req.body;

        console.log('[Admin updateProgram] Updating program:', programId);

        const program = await Program.findByIdAndUpdate(
            programId,
            updateData,
            { new: true, runValidators: true }
        )
        .populate('user_id', 'username email profilePicture')
        .populate('workouts.workout_id', 'name type category')
        .populate('geo_activities.activity_id', 'name description');

        if (!program) {
            return res.status(404).json({ message: 'Program not found' });
        }

        console.log('[Admin updateProgram] Program updated successfully');

        res.status(200).json({
            message: 'Program updated successfully',
            program
        });
    } catch (error) {
        console.error('[Admin updateProgram] Error:', error);
        res.status(500).json({ message: 'Failed to update program', error: error.message });
    }
};

// Delete a program by admin - Admin only
exports.deleteProgram = async (req, res) => {
    try {
        const { programId } = req.params;

        console.log('[Admin deleteProgram] Deleting program:', programId);

        const program = await Program.findByIdAndDelete(programId);

        if (!program) {
            return res.status(404).json({ message: 'Program not found' });
        }

        res.status(200).json({ message: 'Program deleted successfully' });
    } catch (error) {
        console.error('[Admin deleteProgram] Error:', error);
        res.status(500).json({ message: 'Failed to delete program', error: error.message });
    }
};

// ============= ACHIEVEMENT MANAGEMENT =============

// Get all achievements - Admin only
exports.getAllAchievements = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            category,
            tier,
            isActive,
            searchQuery,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        console.log('[Admin getAllAchievements] Fetching all achievements with filters:', {
            page, limit, category, tier, isActive, searchQuery, sortBy, sortOrder
        });

        let query = {};

        if (category) query.category = category;
        if (tier) query.tier = tier;
        if (isActive !== undefined) query.is_active = isActive === 'true';

        if (searchQuery) {
            query.$or = [
                { name: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        console.log('[Admin getAllAchievements] Query:', JSON.stringify(query));

        const achievements = await Achievement.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const totalCount = await Achievement.countDocuments(query);

        // For each achievement, get the count of users who earned it
        const achievementsWithStats = await Promise.all(achievements.map(async (achievement) => {
            const earnedCount = await UserAchievement.countDocuments({ 
                achievement_id: achievement._id, 
                completed: true 
            });
            return {
                ...achievement.toObject(),
                earnedCount
            };
        }));

        console.log('[Admin getAllAchievements] Found', achievements.length, 'achievements, Total:', totalCount);

        res.status(200).json({
            message: 'Achievements retrieved successfully',
            achievements: achievementsWithStats,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalItems: totalCount,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('[Admin getAllAchievements] Error:', error);
        res.status(500).json({ message: 'Failed to fetch achievements', error: error.message });
    }
};

// Get achievement statistics for admin dashboard - Admin only
exports.getAchievementStats = async (req, res) => {
    try {
        const totalAchievements = await Achievement.countDocuments();
        const activeAchievements = await Achievement.countDocuments({ is_active: true });
        const totalUserAchievements = await UserAchievement.countDocuments();
        const completedAchievements = await UserAchievement.countDocuments({ completed: true });
        
        // Get achievements by category
        const achievementsByCategory = await Achievement.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $project: {
                    category: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]);

        // Get achievements by tier
        const achievementsByTier = await Achievement.aggregate([
            {
                $group: {
                    _id: '$tier',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    tier: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]);

        // Get top achievers
        const topAchievers = await UserAchievement.aggregate([
            {
                $match: { completed: true }
            },
            {
                $group: {
                    _id: '$user_id',
                    achievementCount: { $sum: 1 }
                }
            },
            {
                $sort: { achievementCount: -1 }
            },
            {
                $limit: 5
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    userId: '$_id',
                    username: '$user.username',
                    email: '$user.email',
                    achievementCount: 1
                }
            }
        ]);

        // Get most earned achievements
        const mostEarnedAchievements = await UserAchievement.aggregate([
            {
                $match: { completed: true }
            },
            {
                $group: {
                    _id: '$achievement_id',
                    earnedCount: { $sum: 1 }
                }
            },
            {
                $sort: { earnedCount: -1 }
            },
            {
                $limit: 5
            },
            {
                $lookup: {
                    from: 'achievements',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'achievement'
                }
            },
            {
                $unwind: '$achievement'
            },
            {
                $project: {
                    achievementId: '$_id',
                    name: '$achievement.name',
                    category: '$achievement.category',
                    tier: '$achievement.tier',
                    earnedCount: 1
                }
            }
        ]);

        console.log('[Admin getAchievementStats] Stats retrieved successfully');

        res.status(200).json({
            totalAchievements,
            activeAchievements,
            totalUserAchievements,
            completedAchievements,
            completionRate: totalUserAchievements > 0 ? ((completedAchievements / totalUserAchievements) * 100).toFixed(2) + '%' : '0%',
            achievementsByCategory,
            achievementsByTier,
            topAchievers,
            mostEarnedAchievements
        });
    } catch (error) {
        console.error('[Admin getAchievementStats] Error:', error);
        res.status(500).json({ message: 'Failed to fetch achievement statistics', error: error.message });
    }
};

// Create a new achievement - Admin only
exports.createAchievement = async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            icon,
            badge_image,
            criteria,
            points,
            tier,
            is_active
        } = req.body;

        console.log('[Admin createAchievement] Creating achievement:', name);

        if (!name || !description || !category || !criteria) {
            return res.status(400).json({ message: 'Name, description, category, and criteria are required' });
        }

        const achievement = new Achievement({
            name,
            description,
            category,
            icon,
            badge_image,
            criteria,
            points,
            tier,
            is_active
        });

        await achievement.save();

        console.log('[Admin createAchievement] Achievement created successfully:', achievement._id);

        res.status(201).json({
            message: 'Achievement created successfully',
            achievement
        });
    } catch (error) {
        console.error('[Admin createAchievement] Error:', error);
        res.status(500).json({ message: 'Failed to create achievement', error: error.message });
    }
};

// Update an achievement - Admin only
exports.updateAchievement = async (req, res) => {
    try {
        const { achievementId } = req.params;
        const updateData = req.body;

        console.log('[Admin updateAchievement] Updating achievement:', achievementId);

        const achievement = await Achievement.findByIdAndUpdate(
            achievementId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }

        console.log('[Admin updateAchievement] Achievement updated successfully');

        res.status(200).json({
            message: 'Achievement updated successfully',
            achievement
        });
    } catch (error) {
        console.error('[Admin updateAchievement] Error:', error);
        res.status(500).json({ message: 'Failed to update achievement', error: error.message });
    }
};

// Delete an achievement by admin - Admin only
exports.deleteAchievement = async (req, res) => {
    try {
        const { achievementId } = req.params;

        console.log('[Admin deleteAchievement] Deleting achievement:', achievementId);

        const achievement = await Achievement.findByIdAndDelete(achievementId);

        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }

        // Also delete all user achievements for this achievement
        await UserAchievement.deleteMany({ achievement_id: achievementId });

        res.status(200).json({ message: 'Achievement deleted successfully' });
    } catch (error) {
        console.error('[Admin deleteAchievement] Error:', error);
        res.status(500).json({ message: 'Failed to delete achievement', error: error.message });
    }
};
