const express = require("express");
const router = express.Router();
const {
    createPost,
    getFeed,
    getPost,
    votePost,
    reactPost,
    deletePost,
    updatePost,
} = require("../controllers/postControllers");
const auth = require("../middleware/auth");
const upload = require("../middleware/multer");

// Configure multer for post images (max 10 images)
const postUpload = upload.array("images", 10);

router.route("/").post(auth, postUpload, createPost).get(auth, getFeed);
router.route("/:id")
    .get(auth, getPost)
    .delete(auth, deletePost)
    .put(auth, postUpload, updatePost); // Handle updates with potential images
router.route("/:id/vote").put(auth, votePost);
router.route("/:id/react").put(auth, reactPost);

module.exports = router;
