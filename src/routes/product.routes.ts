import { Router, Response, Request } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller';
import {
  uploadProductImage,
  handleUploadError,
} from '../middleware/upload.middleware';

const router = Router();

router
  .route('/')
  .get((req: Request, res: Response) => getAllProducts(req, res))
  .post(uploadProductImage, handleUploadError, (req: Request, res: Response) =>
    createProduct(req, res),
  );

router
  .route('/:id')
  .get((req: Request, res: Response) => getProductById(req, res))
  .put(uploadProductImage, handleUploadError, (req: Request, res: Response) =>
    updateProduct(req, res),
  )
  .delete((req: Request, res: Response) => deleteProduct(req, res));

router
  .route('/all')
  .get((req: Request, res: Response) => getAllProducts(req, res));
export default router;
