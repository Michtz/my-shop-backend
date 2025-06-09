import { Router } from 'express';
import * as ProductController from '../controllers/product.controller';
import {
  uploadProductImage,
  handleUploadError,
} from '../middleware/upload.middleware';

const router = Router();

// GET alle Produkte
router.get('/', ProductController.getAllProducts);

// GET Produkt nach ID
router.get('/:id', ProductController.getProductById);

// POST neues Produkt (mit optionalem Bild-Upload)
router.post(
  '/',
  uploadProductImage,
  handleUploadError,
  ProductController.createProduct,
);

// PUT Produkt updaten (mit optionalem Bild-Upload)
router.put(
  '/:id',
  uploadProductImage,
  handleUploadError,
  ProductController.updateProduct,
);

// PATCH Stock updaten (kein Bild-Upload)
router.patch('/:id/stock', ProductController.updateStock);

// DELETE Produkt (Soft Delete)
router.delete('/:id', ProductController.deleteProduct);

export default router;
