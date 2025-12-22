const { calculateGoalKcal } = require('../utils/calorieCalculator');

function calculateNetCalories(consumed, burned) {
    return consumed - burned;
}

const User = require('../models/userModel');
const { uploadProfilePicture } = require('../utils/cloudinary');

//Check logged in user-------------------------------------
exports.currentlyLoggedInUser = async (req, res) => {
    try {
        const userId = req.user.id; // Extracted from JWT middleware

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "Current logged-in user data fetched successfully",
            user
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching user data",
            error: error.message
        });
    }
};

//User Registration
exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        const newUser = new User({ username, email, password });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

//User Login
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Use bcrypt to compare passwords
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = user.generateAuthToken();
        const refreshToken = user.generateRefreshToken();
        console.log("[LoginUser] User logged in:", user);
        console.log("[LoginUser] Generated token:", token);
        res.status(200).json(
            {
                message: 'Login successful',
                token,
                refreshToken,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Google User Registration/Login
exports.googleUserController = async (req, res) => {
    const { username, email, googleId, profilePicture } = req.body;
    try {
        let user = await User.findOne({ email });
        let cloudinaryUrl = null;

        if (profilePicture) {
            try {
                const uploadResult = await uploadProfilePicture(profilePicture, googleId);
                cloudinaryUrl = uploadResult.secure_url;
            } catch (err) {
                console.warn("Cloudinary upload failed:", err.message);
            }
        }
        if (!user) {
            const password = "google-auth-" + Math.random().toString(36).slice(-8);
            user = new User({
                username,
                email,
                password,
                googleId,
                profilePicture: cloudinaryUrl || null,
            });
            await user.save();
        } else {
            if (!user.googleId && googleId) {
                user.googleId = googleId;
            }
            if (cloudinaryUrl && !user.profilePicture) {
                user.profilePicture = cloudinaryUrl;
            }
            await user.save();
        }
        const token = user.generateAuthToken();
        const refreshToken = user.generateRefreshToken();
        console.log("[LoginUser] User logged in:", user);
        console.log("[LoginUser] Generated token:", token);
        res.status(200).json({
            message: "Google authentication successful",
            token,
            refreshToken,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.log("[GoogleUserController] Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Dev: list users (non-auth) - return all user fields except sensitive ones (password)
exports.listUsers = async (req, res) => {
    try {
        // Exclude password and internal __v field. Use lean() for plain objects.
        const users = await User.find({}).select('-password -__v').lean().exec();
        return res.json({ count: users.length, users });
    } catch (err) {
        console.error('listUsers error', err);
        return res.status(500).json({ error: 'could not list users', details: err && err.message });
    }
};

// Dev-only: create or update a full user document (fills many fields except lastPrediction)
exports.devCreateFullUser = async (req, res) => {
    try {
        const { email, username, googleId, profilePicture } = req.body || {};
        if (!email) return res.status(400).json({ message: 'email required' });

        let user = await User.findOne({ email }).exec();
        const rand = Math.random().toString(36).slice(-6);
        const baseUsername = username || (email.split('@')[0] + '_' + rand);
        const password = 'temp-' + rand; // will be hashed by schema pre-save

        const fullData = {
            username: baseUsername,
            email,
            password,
            role: 'user',
            verified: true,
            googleId: googleId || null,
            profilePicture: profilePicture || null,
            age: 28 + Math.floor(Math.random() * 20),
            gender: Math.random() > 0.5 ? 'male' : 'female',
            physicalMetrics: {
                height: { value: 160 + Math.floor(Math.random() * 30) },
                weight: { value: 55 + Math.floor(Math.random() * 40) },
                bmi: parseFloat((18 + Math.random() * 12).toFixed(1)),
                waistCircumference: 70 + Math.floor(Math.random() * 30)
            },
            lifestyle: {
                activityLevel: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'][Math.floor(Math.random() * 5)],
                sleepHours: 5 + Math.floor(Math.random() * 4)
            },
            dietaryProfile: {
                preferences: ['vegetarian', 'vegan', 'pescatarian'].slice(0, Math.floor(Math.random() * 2) + 1),
                allergies: [],
                dailyWaterIntake: parseFloat((1 + Math.random() * 2).toFixed(1)),
                mealFrequency: 3
            },
            healthProfile: {
                currentConditions: [],
                familyHistory: [],
                medications: [],
                bloodType: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'][Math.floor(Math.random() * 8)]
            },
            environmentalFactors: {
                pollutionExposure: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
                occupationType: ['sedentary', 'physical', 'mixed'][Math.floor(Math.random() * 3)]
            },
            riskFactors: {
                addictions: [],
                stressLevel: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)]
            }
        };

        if (!user) {
            user = new User(fullData);
            await user.save();
            // don't return password
            const { password: _pw, __v, ...rest } = user.toObject();
            return res.status(201).json({ message: 'User created', user: rest });
        }

        // If user exists, update all fields except lastPrediction
        // Preserve lastPrediction
        const preservedLastPrediction = user.lastPrediction;
        Object.assign(user, fullData);
        user.lastPrediction = preservedLastPrediction;
        await user.save();
        const { password: _pw2, __v: _v2, ...rest2 } = user.toObject();
        return res.json({ message: 'User updated', user: rest2 });
    } catch (err) {
        console.error('devCreateFullUser error', err);
        return res.status(500).json({ error: 'could not create/update user', details: err && err.message });
    }
};

// Dev-only: update user fields by email (partial update). Preserves lastPrediction unless provided.
exports.devUpdateUser = async (req, res) => {
    try {
        const { email, ...updates } = req.body || {};
        if (!email) return res.status(400).json({ message: 'email required' });

        const user = await User.findOne({ email }).exec();
        if (!user) return res.status(404).json({ message: 'user not found' });

        // If updates include lastPrediction, allow it, otherwise preserve existing
        const preserveLastPrediction = updates.lastPrediction === undefined;
        if (preserveLastPrediction) delete updates.lastPrediction;

        // Assign updates onto user (this will run validators on save)
        Object.assign(user, updates);

        // Ensure we don't accidentally overwrite password if not provided
        if (!updates.password) {
            user.markModified('password'); // no-op; avoids re-hashing unless password changed
        }

        await user.save();
        const { password: _pw, __v, ...rest } = user.toObject();
        return res.json({ message: 'User updated', user: rest });
    } catch (err) {
        console.error('devUpdateUser error', err);
        return res.status(500).json({ error: 'could not update user', details: err && err.message });
    }
};

// Refreh Tokens
exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    try {
        if (!refreshToken) {
            return res.status(400).json({ message: "No refresh token provided" });
        }
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const newToken = user.generateAuthToken();
        res.status(200).json({ token: newToken });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Update current user's health assessment
exports.submitHealthAssessment = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            age,
            gender,
            physicalMetrics,
            lifestyle,
            dietaryProfile,
            healthProfile,
            environmentalFactors,
            riskFactors
        } = req.body;
        console.log("[SubmitHealthAssessment] Received data:", req.body);

        // Auto-calculate BMI if height and weight are provided
        let updatedPhysicalMetrics = physicalMetrics;
        if (
            physicalMetrics &&
            physicalMetrics.height &&
            physicalMetrics.height.value &&
            physicalMetrics.weight &&
            physicalMetrics.weight.value
        ) {
            const heightM = physicalMetrics.height.value / 100; // convert cm to meters
            const weightKg = physicalMetrics.weight.value;
            const bmi = +(weightKg / (heightM * heightM)).toFixed(2);
            updatedPhysicalMetrics = {
                ...physicalMetrics,
                bmi
            };
        }

        // Update only the relevant fields
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                age,
                gender,
                physicalMetrics: updatedPhysicalMetrics,
                lifestyle,
                dietaryProfile,
                healthProfile,
                environmentalFactors,
                riskFactors,
                // IMPORTANT: Clear lastPrediction so next /predict/me call regenerates with new data
                lastPrediction: null
            },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Health assessment submitted", user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Create or update today's dailyCalorieBalance entry for the user
exports.createOrUpdateDailyCalorieBalance = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Extract needed fields
        const { age, gender, physicalMetrics, lifestyle } = user;
        const weight = physicalMetrics?.weight?.value;
        const height = physicalMetrics?.height?.value;
        const targetWeight = physicalMetrics?.targetWeight?.value;
        const activityLevel = lifestyle?.activityLevel;
        if (!weight || !height || !age || !gender) {
            return res.status(400).json({ message: 'Missing user metrics for calorie goal calculation.' });
        }
        const goal_kcal = calculateGoalKcal({
            weight,
            height,
            age,
            gender,
            activityLevel,
            targetWeight
        });

        // Find today's entry
        let entry = user.dailyCalorieBalance.find(e => {
            const entryDate = new Date(e.date);
            entryDate.setHours(0, 0, 0, 0);
            return entryDate.getTime() === today.getTime();
        });
        if (entry) {
            entry.goal_kcal = goal_kcal;
        } else {
            user.dailyCalorieBalance.push({
                date: today,
                goal_kcal,
                consumed_kcal: 0,
                burned_kcal: 0,
                net_kcal: 0,
                status: 'on_target'
            });
        }
        await user.save();
        // Return today's entry
        entry = user.dailyCalorieBalance.find(e => {
            const entryDate = new Date(e.date);
            entryDate.setHours(0, 0, 0, 0);
            return entryDate.getTime() === today.getTime();
        });
        res.status(200).json({ message: 'Daily calorie balance entry created/updated', entry });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET: Get user's allergies and dietary preferences
exports.getUserAllergies = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('dietaryProfile.allergies dietaryProfile.preferences');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User allergies fetched successfully',
            allergies: user.dietaryProfile?.allergies || [],
            dietaryPreferences: user.dietaryProfile?.preferences || []
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET: Get today's calorie balance for the user
exports.getTodayCalorieBalance = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const entry = user.dailyCalorieBalance.find(e => {
            const entryDate = new Date(e.date);
            entryDate.setHours(0, 0, 0, 0);
            return entryDate.getTime() === today.getTime();
        });

        if (!entry) {
            // Return default values if no entry exists
            return res.status(200).json({
                message: 'No calorie balance entry for today',
                entry: null
            });
        }

        res.status(200).json({
            message: 'Today\'s calorie balance fetched successfully',
            entry
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// PATCH: Update today's calories and automate net_kcal
exports.updateDailyCalories = async (req, res) => {
    try {
        const userId = req.user.id;
        const { consumed_kcal, burned_kcal } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let entry = user.dailyCalorieBalance.find(e => {
            const entryDate = new Date(e.date);
            entryDate.setHours(0, 0, 0, 0);
            return entryDate.getTime() === today.getTime();
        });
        if (!entry) {
            return res.status(404).json({ message: 'No dailyCalorieBalance entry for today. Please create one first.' });
        }
        if (typeof consumed_kcal === 'number') entry.consumed_kcal = consumed_kcal;
        if (typeof burned_kcal === 'number') entry.burned_kcal = burned_kcal;
        // Always recalculate net_kcal
        entry.net_kcal = calculateNetCalories(entry.consumed_kcal, entry.burned_kcal);
        // Update status
        if (entry.net_kcal < entry.goal_kcal - 100) {
            entry.status = 'under';
        } else if (entry.net_kcal > entry.goal_kcal + 100) {
            entry.status = 'over';
        } else {
            entry.status = 'on_target';
        }
        await user.save();
        res.status(200).json({ message: 'Calories updated', entry });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET: Get full user profile (comprehensive profile data)
exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('-password -__v').lean();
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Calculate additional profile stats
        const memberSince = user.registeredDate ? new Date(user.registeredDate) : null;
        const daysSinceRegistration = memberSince 
            ? Math.floor((new Date() - memberSince) / (1000 * 60 * 60 * 24)) 
            : 0;

        // Calculate BMI if height and weight are available
        let calculatedBMI = null;
        if (user.physicalMetrics?.height?.value && user.physicalMetrics?.weight?.value) {
            const heightInMeters = user.physicalMetrics.height.value / 100;
            calculatedBMI = parseFloat((user.physicalMetrics.weight.value / (heightInMeters * heightInMeters)).toFixed(1));
        }

        // Get completion percentage for profile
        const profileFields = [
            user.username,
            user.email,
            user.profilePicture,
            user.birthdate || user.age,
            user.gender,
            user.physicalMetrics?.height?.value,
            user.physicalMetrics?.weight?.value,
            user.lifestyle?.activityLevel,
            user.lifestyle?.sleepHours,
            user.dietaryProfile?.dailyWaterIntake,
            user.healthProfile?.bloodType,
        ];
        const filledFields = profileFields.filter(field => field !== null && field !== undefined).length;
        const profileCompletion = Math.round((filledFields / profileFields.length) * 100);

        res.status(200).json({
            message: 'User profile fetched successfully',
            profile: {
                // Basic Info
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                role: user.role,
                verified: user.verified,
                registeredDate: user.registeredDate,
                daysSinceRegistration,
                
                // Personal Info
                birthdate: user.birthdate,
                age: user.age,
                gender: user.gender,
                
                // Physical Metrics
                physicalMetrics: {
                    height: user.physicalMetrics?.height?.value || null,
                    weight: user.physicalMetrics?.weight?.value || null,
                    targetWeight: user.physicalMetrics?.targetWeight?.value || null,
                    bmi: calculatedBMI || user.physicalMetrics?.bmi || null,
                    waistCircumference: user.physicalMetrics?.waistCircumference || null,
                },
                
                // Lifestyle
                lifestyle: {
                    activityLevel: user.lifestyle?.activityLevel || null,
                    sleepHours: user.lifestyle?.sleepHours || null,
                },
                
                // Dietary Profile
                dietaryProfile: {
                    preferences: user.dietaryProfile?.preferences || [],
                    allergies: user.dietaryProfile?.allergies || [],
                    dailyWaterIntake: user.dietaryProfile?.dailyWaterIntake || null,
                    mealFrequency: user.dietaryProfile?.mealFrequency || null,
                },
                
                // Health Profile
                healthProfile: {
                    currentConditions: user.healthProfile?.currentConditions || [],
                    familyHistory: user.healthProfile?.familyHistory || [],
                    medications: user.healthProfile?.medications || [],
                    bloodType: user.healthProfile?.bloodType || null,
                },
                
                // Environmental Factors
                environmentalFactors: {
                    pollutionExposure: user.environmentalFactors?.pollutionExposure || null,
                    occupationType: user.environmentalFactors?.occupationType || null,
                },
                
                // Risk Factors
                riskFactors: {
                    addictions: user.riskFactors?.addictions || [],
                    stressLevel: user.riskFactors?.stressLevel || null,
                },
                
                // Last Prediction Summary
                lastPrediction: user.lastPrediction ? {
                    disease: user.lastPrediction.disease,
                    probability: user.lastPrediction.probability,
                    predictedAt: user.lastPrediction.predictedAt,
                    source: user.lastPrediction.source,
                } : null,
                
                // Profile Stats
                profileCompletion,
            }
        });
    } catch (error) {
        console.error('getUserProfile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// PATCH: Update user profile
exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updates = req.body;
        
        // Fields that can be updated
        const allowedUpdates = [
            'username',
            'birthdate',
            'age',
            'gender',
            'physicalMetrics',
            'lifestyle',
            'dietaryProfile',
            'healthProfile',
            'environmentalFactors',
            'riskFactors',
        ];

        // Filter out non-allowed fields
        const filteredUpdates = {};
        for (const key of allowedUpdates) {
            if (updates[key] !== undefined) {
                filteredUpdates[key] = updates[key];
            }
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Handle nested updates properly
        if (filteredUpdates.physicalMetrics) {
            user.physicalMetrics = {
                ...user.physicalMetrics?.toObject?.() || user.physicalMetrics || {},
                ...filteredUpdates.physicalMetrics,
            };
            delete filteredUpdates.physicalMetrics;
        }

        if (filteredUpdates.lifestyle) {
            user.lifestyle = {
                ...user.lifestyle?.toObject?.() || user.lifestyle || {},
                ...filteredUpdates.lifestyle,
            };
            delete filteredUpdates.lifestyle;
        }

        if (filteredUpdates.dietaryProfile) {
            user.dietaryProfile = {
                ...user.dietaryProfile?.toObject?.() || user.dietaryProfile || {},
                ...filteredUpdates.dietaryProfile,
            };
            delete filteredUpdates.dietaryProfile;
        }

        if (filteredUpdates.healthProfile) {
            user.healthProfile = {
                ...user.healthProfile?.toObject?.() || user.healthProfile || {},
                ...filteredUpdates.healthProfile,
            };
            delete filteredUpdates.healthProfile;
        }

        if (filteredUpdates.environmentalFactors) {
            user.environmentalFactors = {
                ...user.environmentalFactors?.toObject?.() || user.environmentalFactors || {},
                ...filteredUpdates.environmentalFactors,
            };
            delete filteredUpdates.environmentalFactors;
        }

        if (filteredUpdates.riskFactors) {
            user.riskFactors = {
                ...user.riskFactors?.toObject?.() || user.riskFactors || {},
                ...filteredUpdates.riskFactors,
            };
            delete filteredUpdates.riskFactors;
        }

        // Apply remaining simple updates
        Object.assign(user, filteredUpdates);

        await user.save();

        // Return updated profile
        const updatedUser = await User.findById(userId).select('-password -__v').lean();
        
        res.status(200).json({
            message: 'Profile updated successfully',
            profile: updatedUser,
        });
    } catch (error) {
        console.error('updateUserProfile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// POST: Update profile picture
exports.updateProfilePicture = async (req, res) => {
    try {
        const userId = req.user.id;
        const { profilePicture } = req.body;
        
        if (!profilePicture) {
            return res.status(400).json({ message: 'Profile picture URL or base64 required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If base64 is provided, upload to Cloudinary
        let imageUrl = profilePicture;
        if (profilePicture.startsWith('data:') || profilePicture.length > 500) {
            try {
                const uploadResult = await uploadProfilePicture(profilePicture, userId);
                imageUrl = uploadResult.secure_url;
            } catch (uploadError) {
                console.error('Cloudinary upload error:', uploadError);
                return res.status(500).json({ message: 'Failed to upload image', error: uploadError.message });
            }
        }

        user.profilePicture = imageUrl;
        await user.save();

        res.status(200).json({
            message: 'Profile picture updated successfully',
            profilePicture: imageUrl,
        });
    } catch (error) {
        console.error('updateProfilePicture error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET: Search users for chat
exports.searchUsers = async (req, res) => {
    try {
        const keyword = req.query.search
            ? {
                $or: [
                    { username: { $regex: req.query.search, $options: "i" } },
                    { email: { $regex: req.query.search, $options: "i" } },
                ],
            }
            : {};

        const users = await User.find(keyword)
            .find({ _id: { $ne: req.user.id } })
            .select('_id username email profilePicture')
            .limit(20);

        res.json(users);
    } catch (error) {
        console.error('searchUsers error:', error);
        res.status(500).json({ message: 'Error searching users', error: error.message });
    }
};

// GET: Get all users for chat (limited)
exports.getAllUsersForChat = async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user.id } })
            .select('_id username email profilePicture')
            .limit(50);

        res.json(users);
    } catch (error) {
        console.error('getAllUsersForChat error:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};