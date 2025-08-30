import mongoose, { Document, Schema } from 'mongoose';
import { Request } from 'express';

export interface BlogResponse {
  success: boolean;
  data?: IBlogDocument | IBlogDocument[] | null;
  error?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalPosts: number;
    postsPerPage: number;
  };
}

export interface BlogFilters {
  status?: 'draft' | 'published' | 'archived';
  author_id?: string;
  tag?: string;
  [key: string]: any;
}

export interface IBlog {
  title: string;
  content: string;
  excerpt?: string;
  author_id: mongoose.Types.ObjectId;
  slug: string;
  featured_image?: string;
  status: 'draft' | 'published' | 'archived';
  meta_title?: string;
  meta_description?: string;
  tags: string[];
  published_at?: Date;
}

export interface BlogRequest extends Omit<Request, 'file'> {
  params: {
    id?: string;
    slug?: string;
    tag?: string;
  };
  body: {
    title?: string;
    content?: string;
    excerpt?: string;
    slug?: string;
    featured_image?: string;
    status?: 'draft' | 'published' | 'archived';
    meta_title?: string;
    meta_description?: string;
    tags?: string[];
    published_at?: Date;
    data?: string;
    [key: string]: any;
  };
  query: {
    page?: string;
    limit?: string;
    tag?: string;
    status?: string;
    [key: string]: any;
  };
  file?: any;
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export interface IBlogDocument extends IBlog, Document {
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlogDocument>(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Blog content is required'],
    },
    excerpt: {
      type: String,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    author_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
      index: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    featured_image: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    meta_title: {
      type: String,
      maxlength: [60, 'Meta title cannot exceed 60 characters'],
    },
    meta_description: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters'],
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    published_at: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for performance
blogSchema.index({ status: 1, published_at: -1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ author_id: 1, status: 1 });

// Pre-save middleware to generate slug if not provided
blogSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Set published_at when status changes to published
  if (this.status === 'published' && !this.published_at) {
    this.published_at = new Date();
  }
  
  next();
});

// Ensure JSON output includes virtual fields
blogSchema.set('toJSON', { virtuals: true });
blogSchema.set('toObject', { virtuals: true });

export const Blog = mongoose.model<IBlogDocument>('Blog', blogSchema);