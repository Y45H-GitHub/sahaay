import { Router, Request, Response } from 'express';
import { uploadImage } from '../middleware/upload';
import { asyncHandler } from '../middleware/errorHandler';
import { createOCRService } from '../services/OCRService';
import { createMurfTTSService } from '../services/MurfTTSService';
import { ReadTextResponse } from '../types/api';

const router = Router();
const ocrService = createOCRService();

function getTTSService() {
    try {
        return createMurfTTSService();
    } catch (error) {
        console.error('Failed to create TTS service:', error);
        return null;
    }
}

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

    try {
        // Extract text from image using OCR
        console.log('Starting OCR processing...');
        const ocrResult = await ocrService.extractText(imageFile.buffer, language);
        console.log('OCR processing completed:', ocrResult);

        if (!ocrResult.success) {
            console.error('OCR failed:', ocrResult.error);
            return res.status(500).json({
                error: {
                    message: ocrResult.error || 'OCR processing failed',
                    status: 500
                }
            });
        }

        // Check if any meaningful text was extracted
        if (!ocrResult.text || ocrResult.text.trim().length === 0) {
            const noTextMessage = 'No readable text found in the image';

            // Convert "no text found" message to speech
            const ttsService = getTTSService();
            const ttsResult = ttsService ? await ttsService.convertTextToSpeech({
                text: noTextMessage,
                language: language
            }) : { success: false };

            const response: ReadTextResponse = {
                text: noTextMessage,
                audioUrl: ttsResult.success ? (ttsResult.audioUrl || null) : null
            };

            return res.json(response);
        }

        // Convert extracted text to speech
        const ttsService = getTTSService();
        const ttsResult = ttsService ? await ttsService.convertTextToSpeech({
            text: ocrResult.text,
            language: language
        }) : { success: false };

        const response: ReadTextResponse = {
            text: ocrResult.text,
            audioUrl: ttsResult.success ? (ttsResult.audioUrl || null) : null
        };

        res.json(response);

    } catch (error) {
        console.error('Text reading error:', error);
        res.status(500).json({
            error: {
                message: 'Failed to process text reading request',
                status: 500
            }
        });
    }
}));

export default router;