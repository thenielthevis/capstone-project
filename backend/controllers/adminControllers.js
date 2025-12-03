const User = require('../models/userModel');

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
            premiumUsers: 0, // Add premium subscription logic if you have it
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
