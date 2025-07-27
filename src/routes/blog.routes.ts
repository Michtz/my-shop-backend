import { Router } from 'express';
import * as BlogController from '../controllers/blog.controller';
import { authenticate, authorize } from '../middleware/auth.middelware';
import {
  uploadProductImage,
  handleUploadError,
} from '../middleware/upload.middleware';

const router = Router();

// Public Routes
// GET all published blog posts (with pagination and filtering)
router.get('/', BlogController.getAllPublishedPosts);

// GET single blog post by slug
router.get('/:slug', BlogController.getPostBySlug);

// GET posts by tag
router.get('/tag/:tag', BlogController.getPostsByTag);

// GET featured posts
router.get('/featured', BlogController.getFeaturedPosts);

// Admin Routes (require authentication and admin role)
// POST create new blog post (with optional image upload)
router.post(
  '/admin',
  authenticate,
  authorize(['admin']),
  uploadProductImage,
  handleUploadError,
  BlogController.createPost,
);

// PUT update blog post (with optional image upload)  
router.put(
  '/admin/:id',
  authenticate,
  authorize(['admin']),
  uploadProductImage,
  handleUploadError,
  BlogController.updatePost,
);

// DELETE blog post
router.delete(
  '/admin/:id',
  authenticate,
  authorize(['admin']),
  BlogController.deletePost,
);

// GET all blog posts for admin (including drafts)
router.get(
  '/admin/posts',
  authenticate,
  authorize(['admin']),
  BlogController.getAllPosts,
);

// GET blog post by ID for admin
router.get(
  '/admin/:id',
  authenticate,
  authorize(['admin']),
  BlogController.getPostById,
);

// PATCH publish blog post
router.patch(
  '/admin/:id/publish',
  authenticate,
  authorize(['admin']),
  BlogController.publishPost,
);

// PATCH unpublish blog post
router.patch(
  '/admin/:id/unpublish',
  authenticate,
  authorize(['admin']),
  BlogController.unpublishPost,
);

export default router;