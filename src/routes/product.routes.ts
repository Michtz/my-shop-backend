import { Router, Request, Response } from 'express';
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    updateStock,
    deleteProduct
} from '../controllers/product.controller';

const router = Router();

interface ProductRequest extends Request {
    params: {
        id?: string;
    };
    body: {
        name?: string;
        description?: string;
        price?: number;
        stockQuantity?: number;
        category?: string;
    };
}

// Base route: /api/products
router.route('/')
    .get((req: Request, res: Response) => getAllProducts(req, res))
    .post((req: ProductRequest, res: Response) => createProduct(req, res));

router.route('/:id')
    .get((req: ProductRequest, res: Response) => getProductById(req, res))
    .put((req: ProductRequest, res: Response) => updateProduct(req, res))
    .delete((req: ProductRequest, res: Response) => deleteProduct(req, res));

router.route('/:id/stock')
    .patch((req: ProductRequest, res: Response) => updateStock(req, res));

export default router;