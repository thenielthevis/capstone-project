const express = require("express");
const router = express.Router();
const {
    createComment,
    getCommentsByPost,
    voteComment,
    reactComment,
    deleteComment,
} = require("../controllers/commentControllers");
const auth = require('../middleware/auth');

// Base: /api/comments

router.route("/").post(auth, createComment); // Create (Reply or Top level)
router.route("/:postId").get(auth, getCommentsByPost); // Get by postId
router.route("/:id").delete(auth, deleteComment);
router.route("/:id/vote").put(auth, voteComment);
router.route("/:id/react").put(auth, reactComment);

module.exports = router;
