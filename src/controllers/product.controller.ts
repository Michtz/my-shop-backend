import { Response } from 'express';
import mongoose from 'mongoose';
import * as ProductService from '../services/product.service';
import { ProductRequest } from '../models/product.model';

export const getAllProducts = async (
  req: any,
  res: Response,
): Promise<void> => {
  try {
    const result = await ProductService.getAllProducts();
    const status = result.success ? 200 : 500;
    res.status(status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching products',
    });
  }
};

export const getProductById = async (
  req: ProductRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid product ID',
      });
      return;
    }

    const result = await ProductService.getProductById(id);
    const status = result.success
      ? 200
      : result.error === 'Product not found'
        ? 404
        : 500;
    res.status(status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching product',
    });
  }
};

export const createProduct = async (
  req: ProductRequest,
  res: Response,
): Promise<void> => {
  try {
    let productData: any = req.body;

    if (req.body.data) {
      try {
        productData = JSON.parse(req.body.data);
      } catch (parseError) {
        productData = req.body;
      }
    }

    if (!productData.name || !productData.price) {
      res.status(400).json({
        success: false,
        error: 'Name and price are required',
      });
      return;
    }

    if (typeof productData.price === 'string') {
      productData.price = parseFloat(productData.price);
    }
    if (typeof productData.stockQuantity === 'string') {
      productData.stockQuantity = parseInt(productData.stockQuantity, 10);
    }

    const result = await ProductService.createProduct(productData, req.file);
    const status = result.success ? 201 : 400;
    res.status(status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while creating product',
    });
  }
};

export const updateProduct = async (
  req: ProductRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid product ID',
      });
      return;
    }

    let updateData: any = req.body;

    if (req.body.data) {
      try {
        updateData = JSON.parse(req.body.data);
      } catch (parseError) {
        updateData = req.body;
      }
    }

    if (typeof updateData.price === 'string') {
      updateData.price = parseFloat(updateData.price);
    }
    if (typeof updateData.stockQuantity === 'string') {
      updateData.stockQuantity = parseInt(updateData.stockQuantity, 10);
    }

    const result = await ProductService.updateProduct(
      id,
      { ...updateData, lastUpdated: new Date() },
      req.file,
    );

    const status = result.success
      ? 200
      : result.error === 'Product not found'
        ? 404
        : 500;
    res.status(status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while updating product',
    });
  }
};

export const deleteProduct = async (
  req: ProductRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid product ID',
      });
      return;
    }

    const result = await ProductService.deleteProduct(id);
    const status = result.success
      ? 200
      : result.error === 'Product not found'
        ? 404
        : 500;
    res.status(status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while deleting product',
    });
  }
};
