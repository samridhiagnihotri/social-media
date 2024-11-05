const express = require('express');
const postController = require('../controllers/postController');
const { authenticate } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', authenticate, postController.createPost);
router.get('/', authenticate, postController.getPosts);
router.post('/:postId/comment', authenticate, postController.commentOnPost);
router.post('/:postId/like', authenticate, postController.likePost);

module.exports = router;
