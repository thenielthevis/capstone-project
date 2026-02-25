const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const {
    getPublicProfile,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    updateProfileVisibility,
    updateBio,
} = require('../controllers/profileController');

// Profile visibility & bio (must be before :userId routes)
router.patch('/visibility', auth, updateProfileVisibility);
router.patch('/bio', auth, updateBio);

// Public profile
router.get('/:userId', auth, getPublicProfile);

// Follow / Unfollow
router.post('/:userId/follow', auth, followUser);
router.delete('/:userId/follow', auth, unfollowUser);

// Followers & Following lists
router.get('/:userId/followers', auth, getFollowers);
router.get('/:userId/following', auth, getFollowing);

module.exports = router;
