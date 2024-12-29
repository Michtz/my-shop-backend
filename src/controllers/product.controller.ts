import { Request, Response } from 'express';
import mongoose from 'mongoose';
import * as ProductService from '../services/product.service';
import { IProduct } from '../models/product.model';

interface ProductRequest extends Request {
    params: {
        id?: string;
    };
    body: Partial<IProduct> & {
        quantity?: number;
    };
}

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await ProductService.getAllProducts();
        const status = result.success ? 200 : 500;
        res.status(status).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error while fetching products'
        });
    }
};

export const getProductById = async (req: ProductRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                error: 'Invalid product ID'
            });
            return;
        }

        const result = await ProductService.getProductById(id);
        const status = result.success ? 200 : result.error === 'Product not found' ? 404 : 500;
        res.status(status).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error while fetching product'
        });
    }
};

export const createProduct = async (req: ProductRequest, res: Response): Promise<void> => {
    try {
        if (!req.body.name || !req.body.price) {
            res.status(400).json({
                success: false,
                error: 'Name and price are required'
            });
            return;
        }

        const result = await ProductService.createProduct(req.body);
        const status = result.success ? 201 : 400;
        res.status(status).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error while creating product'
        });
    }
};

export const updateProduct = async (req: ProductRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                error: 'Invalid product ID'
            });
            return;
        }

        const result = await ProductService.updateProduct(id, {
            ...req.body,
            lastUpdated: new Date()
        });

        const status = result.success ? 200 : result.error === 'Product not found' ? 404 : 500;
        res.status(status).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error while updating product'
        });
    }
};

export const updateStock = async (req: ProductRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                error: 'Invalid product ID'
            });
            return;
        }

        if (typeof quantity !== 'number') {
            res.status(400).json({
                success: false,
                error: 'Quantity must be a number'
            });
            return;
        }

        const result = await ProductService.updateStock(id, quantity);
        const status = result.success ? 200 : result.error === 'Product not found' ? 404 : 500;
        res.status(status).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error while updating stock'
        });
    }
};

export const deleteProduct = async (req: ProductRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                error: 'Invalid product ID'
            });
            return;
        }

        const result = await ProductService.deleteProduct(id);
        const status = result.success ? 200 : result.error === 'Product not found' ? 404 : 500;
        res.status(status).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error while deleting product'
        });
    }
};