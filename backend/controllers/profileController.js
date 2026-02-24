const User = require('../models/userModel');
const Post = require('../models/postModel');
const Comment = require('../models/commentModel');

// @desc    Get another user's public profile
// @route   GET /api/profile/:userId
// @access  Protected
exports.getPublicProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;

        const user = await User.findById(userId)
            .select('username profilePicture bio profileVisibility followers following registeredDate gamification')
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isOwnProfile = userId === currentUserId;
        const isFollowing = user.followers?.some(f => f.toString() === currentUserId) || false;
        const isFollowedBy = user.following?.some(f => f.toString() === currentUserId) || false;
        const isMutual = isFollowing && isFollowedBy;

        // Check profile visibility
        if (!isOwnProfile) {
            if (user.profileVisibility === 'hidden') {
                return res.status(200).json({
                    profile: {
                        id: user._id,
                        username: user.username,
                        profilePicture: user.profilePicture,
                        bio: '',
                        isPrivate: true,
                        privacyMessage: 'This profile is hidden.',
                        followersCount: user.followers?.length || 0,
                        followingCount: user.following?.length || 0,
                        postCount: 0,
                        posts: [],
                        isFollowing,
                        isFollowedBy,
                        isMutual,
                        isOwnProfile,
                    }
                });
            }
            if (user.profileVisibility === 'mutuals' && !isMutual) {
                return res.status(200).json({
                    profile: {
                        id: user._id,
                        username: user.username,
                        profilePicture: user.profilePicture,
                        bio: user.bio || '',
                        isPrivate: true,
                        privacyMessage: 'This profile is visible to mutuals only.',
                        followersCount: user.followers?.length || 0,
                        followingCount: user.following?.length || 0,
                        postCount: 0,
                        posts: [],
                        isFollowing,
                        isFollowedBy,
                        isMutual,
                        isOwnProfile,
                    }
                });
            }
        }

        // Fetch user's posts (visible ones)
        const postFilter = isOwnProfile
            ? { user: userId }
            : {
                user: userId,
                $or: [
                    { visibility: 'public' },
                    ...(isMutual ? [{ visibility: 'friends' }] : [])
                ]
            };

        const posts = await Post.find(postFilter)
            .sort({ createdAt: -1 })
            .populate('user', 'username profilePicture')
            .lean();

        // Add comment counts
        const postsWithCounts = await Promise.all(posts.map(async (post) => {
            const commentCount = await Comment.countDocuments({ post: post._id });
            const reactionCount = post.reactions?.length || 0;
            return {
                ...post,
                commentCount,
                reactionCount,
                // Provide a thumbnail: first image or null
                thumbnail: post.images && post.images.length > 0 ? post.images[0] : null,
            };
        }));

        res.status(200).json({
            profile: {
                id: user._id,
                username: user.username,
                profilePicture: user.profilePicture,
                bio: user.bio || '',
                isPrivate: false,
                followersCount: user.followers?.length || 0,
                followingCount: user.following?.length || 0,
                postCount: posts.length,
                posts: postsWithCounts,
                isFollowing,
                isFollowedBy,
                isMutual,
                isOwnProfile,
                registeredDate: user.registeredDate,
                gamification: user.gamification ? {
                    points: user.gamification.points || 0,
                    coins: user.gamification.coins || 0,
                } : null,
            }
        });
    } catch (error) {
        console.error('getPublicProfile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Follow a user
// @route   POST /api/profile/:userId/follow
// @access  Protected
exports.followUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;

        if (userId === currentUserId) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const currentUser = await User.findById(currentUserId);

        // Check if already following
        const alreadyFollowing = currentUser.following?.includes(userId);
        if (alreadyFollowing) {
            return res.status(400).json({ message: 'You are already following this user' });
        }

        // Add to following/followers
        await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: userId } });
        await User.findByIdAndUpdate(userId, { $addToSet: { followers: currentUserId } });

        // Check if now mutual
        const isMutual = targetUser.following?.some(f => f.toString() === currentUserId) || false;

        res.status(200).json({
            message: 'Successfully followed user',
            isFollowing: true,
            isMutual,
            followersCount: (targetUser.followers?.length || 0) + 1,
        });
    } catch (error) {
        console.error('followUser error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Unfollow a user
// @route   DELETE /api/profile/:userId/follow
// @access  Protected
exports.unfollowUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;

        if (userId === currentUserId) {
            return res.status(400).json({ message: 'You cannot unfollow yourself' });
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove from following/followers
        await User.findByIdAndUpdate(currentUserId, { $pull: { following: userId } });
        await User.findByIdAndUpdate(userId, { $pull: { followers: currentUserId } });

        res.status(200).json({
            message: 'Successfully unfollowed user',
            isFollowing: false,
            isMutual: false,
            followersCount: Math.max((targetUser.followers?.length || 0) - 1, 0),
        });
    } catch (error) {
        console.error('unfollowUser error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get followers list
// @route   GET /api/profile/:userId/followers
// @access  Protected
exports.getFollowers = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId)
            .populate('followers', 'username profilePicture bio')
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ followers: user.followers || [] });
    } catch (error) {
        console.error('getFollowers error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get following list
// @route   GET /api/profile/:userId/following
// @access  Protected
exports.getFollowing = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId)
            .populate('following', 'username profilePicture bio')
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ following: user.following || [] });
    } catch (error) {
        console.error('getFollowing error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update profile visibility
// @route   PATCH /api/profile/visibility
// @access  Protected
exports.updateProfileVisibility = async (req, res) => {
    try {
        const { visibility } = req.body;
        const currentUserId = req.user.id;

        if (!['public', 'mutuals', 'hidden'].includes(visibility)) {
            return res.status(400).json({ message: 'Invalid visibility. Must be public, mutuals, or hidden.' });
        }

        await User.findByIdAndUpdate(currentUserId, { profileVisibility: visibility });

        res.status(200).json({
            message: 'Profile visibility updated',
            profileVisibility: visibility,
        });
    } catch (error) {
        console.error('updateProfileVisibility error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update bio
// @route   PATCH /api/profile/bio
// @access  Protected
exports.updateBio = async (req, res) => {
    try {
        const { bio } = req.body;
        const currentUserId = req.user.id;

        if (bio && bio.length > 150) {
            return res.status(400).json({ message: 'Bio must be 150 characters or less.' });
        }

        await User.findByIdAndUpdate(currentUserId, { bio: bio || '' });

        res.status(200).json({
            message: 'Bio updated',
            bio: bio || '',
        });
    } catch (error) {
        console.error('updateBio error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
