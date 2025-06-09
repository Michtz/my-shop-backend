import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Cloudinary Konfiguration
cloudinary.config({
  cloud_name: 'de2rhuwpw',
  api_key: '948596732986297',
  api_secret: 'G5UP7y2NxG9a1KWXScClOTa9uVk',
});

export interface CloudinaryResponse {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

export const uploadProductImage = async (
  file: Express.Multer.File,
): Promise<CloudinaryResponse> => {
  try {
    const fileExtension = path.extname(file.originalname);
    const publicId = `products/${uuidv4()}${fileExtension}`;

    const result = await cloudinary.uploader.upload(file.path, {
      public_id: publicId,
      folder: 'myshop/products',
      resource_type: 'image',
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
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
