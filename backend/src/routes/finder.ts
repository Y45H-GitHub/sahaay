import { Router, Request, Response } from 'express';
import { uploadImage } from '../middleware/upload';
import { asyncHandler } from '../middleware/errorHandler';
import { createVisionService } from '../services/VisionService';
import { createMurfTTSService } from '../services/MurfTTSService';
import { FindObjectRequest, FindObjectResponse } from '../types/api';

const router = Router();

// Initialize services
function getVisionService() {
    try {
        const service = createVisionService();
        return service;
    } catch (error) {
        console.error('Failed to create Vision service:', error);
        return null;
    }
}

function getTTSService() {
    try {
        const service = createMurfTTSService();
        return service;
    } catch (error) {
        console.error('Failed to create TTS service:', error);
        return null;
    }
}

// POST /api/find-object
router.post('/', uploadImage, asyncHandler(async (req: Request, res: Response) => {
    const { targetObject, language = 'en' } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
        return res.status(400).json({
            error: {
                message: 'Image file is required',
                status: 400
            }
        });
    }

    if (!targetObject || typeof targetObject !== 'string' || targetObject.trim().length === 0) {
        return res.status(400).json({
            error: {
                message: 'Target object name is required and must be a non-empty string',
                status: 400
            }
        });
    }

    const visionService = getVisionService();
    if (!visionService) {
        return res.status(500).json({
            error: {
                message: 'Vision service not available',
                status: 500
            }
        });
    }

    try {
        // Search for the target object using Vision service
        const findResult = await visionService.findObject(imageFile.buffer, targetObject.trim(), imageFile.mimetype);

        if (!findResult.success) {
            return res.status(500).json({
                error: {
                    message: findResult.error || 'Object search failed',
                    status: 500
                }
            });
        }

        // Generate appropriate message based on whether object was found
        let message: string;
        if (findResult.found && findResult.direction) {
            message = `I found the ${targetObject} ${findResult.direction}.`;
        } else {
            message = `I don't see the ${targetObject} in this image. Please try a different angle or move the camera around.`;
        }

        // Convert message to audio using TTS
        let audioUrl: string | null = null;
        let audioBase64: string | undefined = undefined;

        const ttsService = getTTSService();
        if (ttsService) {
            const ttsResult = await ttsService.convertTextToSpeech({
                text: message,
                language
            });

            if (ttsResult.success) {
                audioUrl = ttsResult.audioUrl || null;
                audioBase64 = ttsResult.audioBase64;
            } else {
                console.warn('TTS conversion failed:', ttsResult.error);
            }
        }

        const response: FindObjectResponse = {
            found: findResult.found,
            direction: findResult.direction,
            message,
            audioUrl
        };

        // Include audioBase64 if available (for frontend compatibility)
        if (audioBase64) {
            (response as any).audioBase64 = audioBase64;
        }

        res.json(response);

    } catch (error) {
        console.error('Object finding error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error during object search',
                status: 500
            }
        });
    }
}));

export default router;