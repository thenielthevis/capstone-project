const express = require("express");
const router = express.Router();
const {
    createPost,
    getFeed,
    votePost,
    reactPost,
    deletePost,
} = require("../controllers/postControllers");
const auth = require("../middleware/auth");
const upload = require("../middleware/multer");

// Configure multer for post images (max 10 images)
const postUpload = upload.array("images", 10);

router.route("/").post(auth, postUpload, createPost).get(auth, getFeed);
router.route("/:id").delete(auth, deletePost);
router.route("/:id/vote").put(auth, votePost);
router.route("/:id/react").put(auth, reactPost);

module.exports = router;
