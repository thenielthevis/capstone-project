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
          { message: 'Login successful',
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
                riskFactors
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