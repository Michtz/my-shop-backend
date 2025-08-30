import { Readable } from 'stream';

// Custom Multer File interface
export interface CustomMulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
  filename?: string;
  path?: string;
  stream?: Readable;
  destination?: string;
}