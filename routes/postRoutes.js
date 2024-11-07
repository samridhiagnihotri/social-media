import express from 'express';
import { commentPost, createPost, deletePost, getPost, getPosts, getPostsBySearch, likePost, updatePost } from '../controllers/postController.js';

const router = express.Router();

router.get('/', getPosts);
router.get('/search', getPostsBySearch);
router.get('/:id', getPost);

router.post('/', createPost);
router.patch('/:id', updatePost);
router.delete('/:id', deletePost);
router.patch('/:id/likePost', likePost);
router.post('/:id/commentPost', commentPost);

export default router;