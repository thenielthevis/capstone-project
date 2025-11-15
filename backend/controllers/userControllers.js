const User = require('../models/userModel');
const { uploadProfilePicture } = require('../utils/cloudinary');

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
        console.log("[LoginUser] User logged in:", user);
        console.log("[LoginUser] Generated token:", token);
        res.status(200).json(
          { message: 'Login successful',
            token,
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
        console.log("[LoginUser] User logged in:", user);
        console.log("[LoginUser] Generated token:", token);
        res.status(200).json({
            message: "Google authentication successful",
            token,
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
                activityLevel: ['sedentary','lightly_active','moderately_active','very_active','extremely_active'][Math.floor(Math.random()*5)],
                sleepHours: 5 + Math.floor(Math.random()*4)
            },
            dietaryProfile: {
                preferences: ['vegetarian','vegan','pescatarian'].slice(0, Math.floor(Math.random()*2)+1),
                allergies: [],
                dailyWaterIntake: parseFloat((1 + Math.random()*2).toFixed(1)),
                mealFrequency: 3
            },
            healthProfile: {
                currentConditions: [],
                familyHistory: [],
                medications: [],
                bloodType: ['A+','A-','B+','B-','AB+','AB-','O+','O-'][Math.floor(Math.random()*8)]
            },
            environmentalFactors: {
                pollutionExposure: ['low','medium','high'][Math.floor(Math.random()*3)],
                occupationType: ['sedentary','physical','mixed'][Math.floor(Math.random()*3)]
            },
            riskFactors: {
                addictions: [],
                stressLevel: ['low','moderate','high'][Math.floor(Math.random()*3)]
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