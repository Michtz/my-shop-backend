import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

// Erlaubte Dateiformate
const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Multer Konfiguration für Memory Storage (Cloudinary braucht Buffer)
const storage = multer.memoryStorage();

// File Filter
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed.'));
  }
};

// Multer Instanz
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB Limit
  },
});

// Middleware für optionale Bild-Uploads
export const uploadProductImage = upload.single('image');

// Error Handler für Multer
export const handleUploadError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 5MB.',
      });
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        success: false,
        error: 'Unexpected file field. Use "image" field name.',
      });
      return;
    }
  }

  if (err.message.includes('Invalid file type')) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
    return;
  }

  next(err);
};
