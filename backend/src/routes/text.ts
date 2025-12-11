import { Router, Request, Response } from 'express';
import { uploadImage } from '../middleware/upload';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// POST /api/read-text
router.post('/', uploadImage, asyncHandler(async (req: Request, res: Response) => {
    const { language = 'en' } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
        return res.status(400).json({
            error: {
                message: 'Image file is required',
                status: 400
            }
        });
    }

    // TODO: Implement OCR text extraction
    // For now, return a placeholder response
    res.json({
        text: 'OCR text extraction not yet implemented',
        audioUrl: null,
        message: 'This endpoint will extract and read text from images'
    });
}));

export default router;