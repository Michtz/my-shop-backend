import {
  Product,
  IProduct,
  ProductResponse,
  ProductFilters,
} from '../models/product.model';
import { emitLowStockAlert, emitProductUpdate } from './socket.service';

export const getAllProducts = async (
  filters: ProductFilters = {},
): Promise<ProductResponse> => {
  try {
    const query = { isActive: true, ...filters };
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
): Promise<ProductResponse> => {
  try {
    const existingProduct = await Product.findOne({ name: productData.name });
    if (existingProduct) {
      return {
        success: false,
        error: 'A product with this name already exists.',
      };
    }
    const product = await Product.create(productData);

    emitProductUpdate(product);

    if (product.stockQuantity <= 5) {
      emitLowStockAlert(product);
    }

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
): Promise<ProductResponse> => {
  try {
    const product = await Product.findByIdAndUpdate(
      productId,
      { ...updateData, lastUpdated: Date.now() },
      { new: true, runValidators: true },
    );
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    emitProductUpdate(product);

    if (product.stockQuantity <= 5) {
      emitLowStockAlert(product);
    }

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
    const previousStock = product.stockQuantity;

    product.stockQuantity = quantity;
    product.lastUpdated = new Date();
    await product.save();

    // Produkt-Update-Event senden
    emitProductUpdate(product);

    // Überprüfen, ob ein Alarm für niedrigen Bestand gesendet werden sollte
    if (product.stockQuantity <= 5) {
      emitLowStockAlert(product);
    }

    // Wenn der Bestand von ausreichend zu knapp oder ausverkauft wechselt,
    // könnte man ein spezielles Event senden
    if (previousStock > 5 && product.stockQuantity <= 5) {
      console.log(
        `Product ${product.name} is now low in stock: ${product.stockQuantity} remaining`,
      );
    }

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
    const product = await Product.findByIdAndUpdate(
      productId,
      { isActive: false, lastUpdated: Date.now() },
      { new: true },
    );
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    emitProductUpdate(product);
    return { success: true, data: product };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
