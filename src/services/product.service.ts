import {
  Product,
  IProduct,
  ProductResponse,
  ProductFilters,
} from '../models/product.model';
import {
  uploadProductImage as uploadToCloudinary,
  deleteProductImage,
  extractPublicId,
} from './cloudinary.service';
import { emitProductsUpdated } from './socket.service';

export const getAllProducts = async (
  filters: ProductFilters = {},
): Promise<ProductResponse> => {
  try {
    const query = { ...filters };
    const products = await Product.find(query);

    return { success: true, data: products };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const getProductById = async (
  productId: string,
): Promise<ProductResponse> => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }
    return { success: true, data: product };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const createProduct = async (
  productData: Partial<IProduct>,
  imageFile?: any,
): Promise<ProductResponse> => {
  try {
    const existingProduct = await Product.findOne({ name: productData.name });
    if (existingProduct) {
      return {
        success: false,
        error: 'A product with this name already exists.',
      };
    }

    if (imageFile) {
      const uploadResult = await uploadToCloudinary(imageFile);
      if (!uploadResult.success) {
        return {
          success: false,
          error: `Image upload failed: ${uploadResult.error}`,
        };
      }
      productData.imageUrl = uploadResult.url;
    }

    const product: IProduct = await Product.create(productData);

    emitProductsUpdated([]);
    return { success: true, data: product };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const updateProduct = async (
  productId: string,
  updateData: Partial<IProduct>,
  imageFile?: any,
): Promise<ProductResponse> => {
  try {
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return { success: false, error: 'Product not found' };
    }

    if (imageFile) {
      if (existingProduct.imageUrl) {
        const oldPublicId = extractPublicId(existingProduct.imageUrl);
        if (oldPublicId) {
          await deleteProductImage(oldPublicId);
        }
      }

      const uploadResult = await uploadToCloudinary(imageFile);
      if (!uploadResult.success) {
        return {
          success: false,
          error: `Image upload failed: ${uploadResult.error}`,
        };
      }
      updateData.imageUrl = uploadResult.url;
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { ...updateData, lastUpdated: Date.now() },
      { new: true, runValidators: true },
    );

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    emitProductsUpdated([productId]);

    return { success: true, data: product };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const updateStock = async (
  productId: string,
  quantity: number,
): Promise<ProductResponse> => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }
    if (quantity < 0) {
      return { success: false, error: 'Quantity cannot be negative' };
    }

    product.stockQuantity = quantity;
    product.lastUpdated = new Date();
    await product.save();

    emitProductsUpdated([productId]);

    return { success: true, data: product };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const deleteProduct = async (
  productId: string,
): Promise<ProductResponse> => {
  try {
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return { success: false, error: 'Product not found' };
    }

    // delete picture
    if (existingProduct.imageUrl) {
      const publicId = extractPublicId(existingProduct.imageUrl);
      if (publicId) {
        await deleteProductImage(publicId);
      }
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { isActive: false, lastUpdated: Date.now() },
      { new: true },
    );

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    emitProductsUpdated([]);
    return { success: true, data: product };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
