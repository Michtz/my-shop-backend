import { Router, Response, Request } from 'express';
import {
  getAllPublishedPosts,
  getPostBySlug,
  getPostsByTag,
  getFeaturedPosts,
  createPost,
  updatePost,
  deletePost,
  getAllPosts,
  getPostById,
  publishPost,
  unpublishPost,
} from '../controllers/blog.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  uploadProductImage,
  handleUploadError,
} from '../middleware/upload.middleware';

const router = Router();

router
  .route('/')
  .get((req: Request, res: Response) => getAllPublishedPosts(req, res));

router
  .route('/featured')
  .get((req: Request, res: Response) => getFeaturedPosts(req, res));

router
  .route('/tag/:tag')
  .get((req: Request, res: Response) => getPostsByTag(req, res));

router
  .route('/:slug')
  .get((req: Request, res: Response) => getPostBySlug(req, res));

router
  .route('/admin/posts')
  .get(authenticate, authorize(['admin']), (req: Request, res: Response) =>
    getAllPosts(req, res),
  );

router
  .route('/admin')
  .post(
    authenticate,
    authorize(['admin']),
    uploadProductImage,
    handleUploadError,
    (req: Request, res: Response) => createPost(req, res),
  );

router
  .route('/admin/:id')
  .get(authenticate, authorize(['admin']), (req: Request, res: Response) =>
    getPostById(req, res),
  )
  .put(
    authenticate,
    authorize(['admin']),
    uploadProductImage,
    handleUploadError,
    (req: Request, res: Response) => updatePost(req, res),
  )
  .delete(authenticate, authorize(['admin']), (req: Request, res: Response) =>
    deletePost(req, res),
  );

router
  .route('/admin/:id/publish')
  .patch(authenticate, authorize(['admin']), (req: Request, res: Response) =>
    publishPost(req, res),
  );

router
  .route('/admin/:id/unpublish')
  .patch(authenticate, authorize(['admin']), (req: Request, res: Response) =>
    unpublishPost(req, res),
  );

export default router;
