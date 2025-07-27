import {
  Blog,
  IBlog,
  BlogResponse,
  BlogFilters,
} from '../models/blog.model';
import mongoose from 'mongoose';

// Helper function to generate unique slug
const generateUniqueSlug = async (baseSlug: string): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;
  
  while (await Blog.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
};

// Helper function to create slug from title
const createSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Public endpoints
export const getAllPublishedPosts = async (
  page: number = 1,
  limit: number = 10,
  filters: BlogFilters = {}
): Promise<BlogResponse> => {
  try {
    const skip = (page - 1) * limit;
    const query = { 
      status: 'published',
      ...filters 
    };
    
    // Remove pagination params from filters if they exist
    if ('page' in query) delete query.page;
    if ('limit' in query) delete query.limit;
    
    const posts = await Blog.find(query)
      .populate('author_id', 'firstName lastName email')
      .sort({ published_at: -1 })
      .skip(skip)
      .limit(limit);
      
    const totalPosts = await Blog.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / limit);
    
    return {
      success: true,
      data: posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        postsPerPage: limit,
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const getPostBySlug = async (slug: string): Promise<BlogResponse> => {
  try {
    const post = await Blog.findOne({ slug, status: 'published' })
      .populate('author_id', 'firstName lastName email');
      
    if (!post) {
      return { success: false, error: 'Post not found' };
    }
    
    return { success: true, data: post };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const getPostsByTag = async (
  tag: string,
  page: number = 1,
  limit: number = 10
): Promise<BlogResponse> => {
  try {
    const skip = (page - 1) * limit;
    const query = {
      status: 'published',
      tags: { $in: [tag.toLowerCase()] }
    };
    
    const posts = await Blog.find(query)
      .populate('author_id', 'firstName lastName email')
      .sort({ published_at: -1 })
      .skip(skip)
      .limit(limit);
      
    const totalPosts = await Blog.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / limit);
    
    return {
      success: true,
      data: posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        postsPerPage: limit,
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const getFeaturedPosts = async (limit: number = 5): Promise<BlogResponse> => {
  try {
    // For now, return most recent published posts
    // In future, you could add a 'featured' field to the schema
    const posts = await Blog.find({ status: 'published' })
      .populate('author_id', 'firstName lastName email')
      .sort({ published_at: -1 })
      .limit(limit);
      
    return { success: true, data: posts };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Admin endpoints
export const createPost = async (
  postData: Partial<IBlog>,
  adminId: string
): Promise<BlogResponse> => {
  try {
    if (!postData.title || !postData.content) {
      return {
        success: false,
        error: 'Title and content are required',
      };
    }
    
    // Generate slug if not provided
    let slug = postData.slug;
    if (!slug && postData.title) {
      slug = createSlug(postData.title);
    }
    
    // Ensure slug is unique
    if (slug) {
      slug = await generateUniqueSlug(slug);
    }
    
    // Clean and validate tags
    const tags = postData.tags?.map(tag => tag.toLowerCase().trim()).filter(Boolean) || [];
    
    const post = await Blog.create({
      ...postData,
      author_id: new mongoose.Types.ObjectId(adminId),
      slug,
      tags,
      published_at: postData.status === 'published' ? new Date() : undefined,
    });
    
    const populatedPost = await Blog.findById(post._id)
      .populate('author_id', 'firstName lastName email');
    
    return { success: true, data: populatedPost };
  } catch (error) {
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return {
        success: false,
        error: 'A post with this slug already exists',
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const updatePost = async (
  postId: string,
  updateData: Partial<IBlog>,
  adminId: string
): Promise<BlogResponse> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return { success: false, error: 'Invalid post ID' };
    }
    
    const existingPost = await Blog.findById(postId);
    if (!existingPost) {
      return { success: false, error: 'Post not found' };
    }
    
    // Update slug if title changed
    if (updateData.title && updateData.title !== existingPost.title) {
      const newSlug = createSlug(updateData.title);
      if (newSlug !== existingPost.slug) {
        updateData.slug = await generateUniqueSlug(newSlug);
      }
    }
    
    // Clean and validate tags
    if (updateData.tags) {
      updateData.tags = updateData.tags.map(tag => tag.toLowerCase().trim()).filter(Boolean);
    }
    
    // Set published_at when status changes to published
    if (updateData.status === 'published' && existingPost.status !== 'published') {
      updateData.published_at = new Date();
    }
    
    const post = await Blog.findByIdAndUpdate(
      postId,
      updateData,
      { new: true, runValidators: true }
    ).populate('author_id', 'firstName lastName email');
    
    if (!post) {
      return { success: false, error: 'Post not found' };
    }
    
    return { success: true, data: post };
  } catch (error) {
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return {
        success: false,
        error: 'A post with this slug already exists',
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const deletePost = async (
  postId: string,
  adminId: string
): Promise<BlogResponse> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return { success: false, error: 'Invalid post ID' };
    }
    
    const post = await Blog.findByIdAndDelete(postId);
    if (!post) {
      return { success: false, error: 'Post not found' };
    }
    
    return { success: true, data: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const getAllPosts = async (
  page: number = 1,
  limit: number = 10,
  filters: BlogFilters = {}
): Promise<BlogResponse> => {
  try {
    const skip = (page - 1) * limit;
    const query = { ...filters };
    
    // Remove pagination params from filters if they exist
    if ('page' in query) delete query.page;
    if ('limit' in query) delete query.limit;
    
    const posts = await Blog.find(query)
      .populate('author_id', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const totalPosts = await Blog.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / limit);
    
    return {
      success: true,
      data: posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        postsPerPage: limit,
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const getPostById = async (postId: string): Promise<BlogResponse> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return { success: false, error: 'Invalid post ID' };
    }
    
    const post = await Blog.findById(postId)
      .populate('author_id', 'firstName lastName email');
      
    if (!post) {
      return { success: false, error: 'Post not found' };
    }
    
    return { success: true, data: post };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const publishPost = async (
  postId: string,
  adminId: string
): Promise<BlogResponse> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return { success: false, error: 'Invalid post ID' };
    }
    
    const post = await Blog.findByIdAndUpdate(
      postId,
      { 
        status: 'published',
        published_at: new Date()
      },
      { new: true, runValidators: true }
    ).populate('author_id', 'firstName lastName email');
    
    if (!post) {
      return { success: false, error: 'Post not found' };
    }
    
    return { success: true, data: post };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const unpublishPost = async (
  postId: string,
  adminId: string
): Promise<BlogResponse> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return { success: false, error: 'Invalid post ID' };
    }
    
    const post = await Blog.findByIdAndUpdate(
      postId,
      { status: 'draft' },
      { new: true, runValidators: true }
    ).populate('author_id', 'firstName lastName email');
    
    if (!post) {
      return { success: false, error: 'Post not found' };
    }
    
    return { success: true, data: post };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};