import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Cloudinary Konfiguration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryResponse {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

export const uploadProductImage = async (
  file: any,
): Promise<CloudinaryResponse> => {
  try {
    if (!file.buffer) {
      throw new Error('No file buffer available');
    }

    const fileExtension = path.extname(file.originalname);
    const publicId = `products/${uuidv4()}${fileExtension}`;

    // Upload from buffer using upload_stream
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          folder: 'myshop/products',
          resource_type: 'image',
          transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        },
      );

      // Write buffer to stream
      uploadStream.end(file.buffer);
    });

    return {
      success: true,
      url: (result as any).secure_url,
      publicId: (result as any).public_id,
    };
  } catch (error) {
    console.error('❌ Upload failed:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

export const deleteProductImage = async (
  publicId: string,
): Promise<CloudinaryResponse> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok' || result.result === 'not found') {
      return { success: true };
    }

    return {
      success: false,
      error: 'Failed to delete image',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
};

export const extractPublicId = (imageUrl: string): string | null => {
  try {
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const publicIdWithExtension = fileName.split('.')[0];
    const folderIndex = urlParts.indexOf('myshop');

    if (folderIndex !== -1) {
      const folderPath = urlParts.slice(folderIndex, -1).join('/');
      return `${folderPath}/${publicIdWithExtension}`;
    }

    return publicIdWithExtension;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};
