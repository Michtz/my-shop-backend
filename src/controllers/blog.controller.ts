import { Response } from 'express';
import mongoose from 'mongoose';
import * as BlogService from '../services/blog.service';
import { BlogRequest } from '../models/blog.model';

// Public Controllers
export const getAllPublishedPosts = async (
  req: BlogRequest,
  res: Response,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const tag = req.query.tag as string;
    
    const filters: any = {};
    if (tag) {
      filters.tags = { $in: [tag.toLowerCase()] };
    }
    
    const result = await BlogService.getAllPublishedPosts(page, limit, filters);
    const status = result.success ? 200 : 500;
    res.status(status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching blog posts',
    });
  }
};

export const getPostBySlug = async (
  req: BlogRequest,
  res: Response,
): Promise<void> => {
  try {
    const { slug } = req.params;
    
    if (!slug) {
      res.status(400).json({
        success: false,
        error: 'Slug is required',
      });
      return;
    }
    
    const result = await BlogService.getPostBySlug(slug);
    const status = result.success
      ? 200
      : result.error === 'Post not found'
        ? 404
        : 500;
    res.status(status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching blog post',
    });
  }
};

export const getPostsByTag = async (
  req: BlogRequest,
  res: Response,
): Promise<void> => {
  try {
    const { tag } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!tag) {
      res.status(400).json({
        success: false,
        error: 'Tag is required',
      });
      return;
    }
    
    const result = await BlogService.getPostsByTag(tag, page, limit);
    const status = result.success ? 200 : 500;
    res.status(status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching posts by tag',
    });
  }
};

export const getFeaturedPosts = async (
  req: BlogRequest,
  res: Response,
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    
    const result = await BlogService.getFeaturedPosts(limit);
    const status = result.success ? 200 : 500;
    res.status(status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching featured posts',
    });
  }
};

// Admin Controllers
export const createPost = async (
  req: BlogRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }
    
    // Parse JSON data from multipart form if present
    let postData: any = req.body;
    
    if (req.body.data) {
      try {
        postData = JSON.parse(req.body.data);
      } catch (parseError) {
        postData = req.body;
      }
    }
    
    if (!postData.title || !postData.content) {
      res.status(400).json({
        success: false,
        error: 'Title and content are required',
      });
      return;
    }
    
    // Handle tags parsing
    if (typeof postData.tags === 'string') {
      try {
        postData.tags = JSON.parse(postData.tags);
      } catch {
        postData.tags = postData.tags.split(',').map((tag: string) => tag.trim());
      }
    }
    
    // Handle featured image from file upload
    if (req.file) {
      // You can integrate with cloudinary service here similar to product.controller.ts
      // For now, we'll just use the filename
      postData.featured_image = req.file.filename;
    }
    
    const result = await BlogService.createPost(postData, req.user.id);
    const status = result.success ? 201 : 400;
    res.status(status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while creating blog post',
    });
  }
};

export const updatePost = async (
  req: BlogRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }
    
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid post ID',
      });
      return;
    }
    
    // Parse JSON data from multipart form if present
    let updateData: any = req.body;
    
    if (req.body.data) {
      try {
        updateData = JSON.parse(req.body.data);
      } catch (parseError) {
        updateData = req.body;
      }
    }
    
    // Handle tags parsing
    if (typeof updateData.tags === 'string') {
      try {
        updateData.tags = JSON.parse(updateData.tags);
      } catch {
        updateData.tags = updateData.tags.split(',').map((tag: string) => tag.trim());
      }
    }
    
    // Handle featured image from file upload
    if (req.file) {
      updateData.featured_image = req.file.filename;
    }
    
    const result = await BlogService.updatePost(id, updateData, req.user.id);
    const status = result.success
      ? 200
      : result.error === 'Post not found'
        ? 404
        : 400;
    res.status(status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while updating blog post',
    });
  }
};

export const deletePost = async (
  req: BlogRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }
    
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid post ID',
      });
      return;
    }
    
    const result = await BlogService.deletePost(id, req.user.id);
    const status = result.success
      ? 200
      : result.error === 'Post not found'
        ? 404
        : 500;
    
    if (result.success) {
      res.status(status).json({
        success: true,
        message: 'Post deleted successfully',
      });
    } else {
      res.status(status).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while deleting blog post',
    });
  }
};

export const getAllPosts = async (
  req: BlogRequest,
  res: Response,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    
    const filters: any = {};
    if (status && ['draft', 'published', 'archived'].includes(status)) {
      filters.status = status;
    }
    
    const result = await BlogService.getAllPosts(page, limit, filters);
    const responseStatus = result.success ? 200 : 500;
    res.status(responseStatus).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching blog posts',
    });
  }
};

export const getPostById = async (
  req: BlogRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid post ID',
      });
      return;
    }
    
    const result = await BlogService.getPostById(id);
    const status = result.success
      ? 200
      : result.error === 'Post not found'
        ? 404
        : 500;
    res.status(status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching blog post',
    });
  }
};

export const publishPost = async (
  req: BlogRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }
    
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid post ID',
      });
      return;
    }
    
    const result = await BlogService.publishPost(id, req.user.id);
    const status = result.success
      ? 200
      : result.error === 'Post not found'
        ? 404
        : 500;
    
    if (result.success) {
      res.status(status).json({
        ...result,
        message: 'Post published successfully',
      });
    } else {
      res.status(status).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while publishing blog post',
    });
  }
};

export const unpublishPost = async (
  req: BlogRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }
    
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid post ID',
      });
      return;
    }
    
    const result = await BlogService.unpublishPost(id, req.user.id);
    const status = result.success
      ? 200
      : result.error === 'Post not found'
        ? 404
        : 500;
    
    if (result.success) {
      res.status(status).json({
        ...result,
        message: 'Post unpublished successfully',
      });
    } else {
      res.status(status).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while unpublishing blog post',
    });
  }
};