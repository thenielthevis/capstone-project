const User = require('../models/userModel');

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
        console.log("[LoginUser] User logged in:", user);
        res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Google User Registration/Login
exports.googleUserController = async (req, res) => {
  const { username, email, googleId } = req.body;
  try {
    console.log("[GoogleUserController] Received:", req.body);
    let user = await User.findOne({ email });
    if (!user) {
      // Use default password for Google accounts
      const password = "google-auth";
      user = new User({ username, email, password, googleId });
      await user.save();
      console.log("[GoogleUserController] New user created:", user);
    } else {
      console.log("[GoogleUserController] User already exists:", user);
    }
    res.status(200).json({ message: "Google user registered/logged in" });
  } catch (error) {
    console.log("[GoogleUserController] Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};