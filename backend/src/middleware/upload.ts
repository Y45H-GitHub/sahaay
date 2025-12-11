import multer from 'multer';
import { Request } from 'express';

// Configure multer for memory storage (files stored in memory as Buffer)
const storage = multer.memoryStorage();

// File filter to accept only images and audio files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept images for scene description, OCR, and object finding
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    // Accept audio files for voice queries
    else if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only images and audio files are allowed.'));
    }
};

// Configure multer with size limits
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1 // Only one file per request
    }
});

// Specific upload configurations for different endpoints
export const uploadImage = upload.single('image');
export const uploadAudio = upload.single('audio');