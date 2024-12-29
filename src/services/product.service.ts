import { Product, IProduct, IProductDocument } from '../models/product.model';

export interface ProductResponse {
    success: boolean;
    data?: IProductDocument | IProductDocument[] | null;
    error?: string;
}

export interface ProductFilters {
    isActive?: boolean;
    category?: string;
    [key: string]: any;
}

export const getAllProducts = async (filters: ProductFilters = {}): Promise<ProductResponse> => {
    try {
        const query = { isActive: true, ...filters };
        const products = await Product.find(query);
        return { success: true, data: products };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

export const getProductById = async (productId: string): Promise<ProductResponse> => {
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return { success: false, error: 'Product not found' };
        }
        return { success: true, data: product };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

export const createProduct = async (productData: Partial<IProduct>): Promise<ProductResponse> => {
    try {
        const existingProduct = await Product.findOne({ name: productData.name });
        if (existingProduct) {
            return {
                success: false,
                error: 'A product with this name already exists.',
            };
        }
        const product = await Product.create(productData);
        return { success: true, data: product };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

export const updateProduct = async (
    productId: string,
    updateData: Partial<IProduct>
): Promise<ProductResponse> => {
    try {
        const product = await Product.findByIdAndUpdate(
            productId,
            { ...updateData, lastUpdated: Date.now() },
            { new: true, runValidators: true }
        );
        if (!product) {
            return { success: false, error: 'Product not found' };
        }
        return { success: true, data: product };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

export const updateStock = async (
    productId: string,
    quantity: number
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

        return { success: true, data: product };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

export const deleteProduct = async (productId: string): Promise<ProductResponse> => {
    try {
        const product = await Product.findByIdAndUpdate(
            productId,
            { isActive: false, lastUpdated: Date.now() },
            { new: true }
        );
        if (!product) {
            return { success: false, error: 'Product not found' };
        }
        return { success: true, data: product };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};