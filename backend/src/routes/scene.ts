import { Router, Request, Response } from 'express';
import { uploadImage } from '../middleware/upload';
import { asyncHandler } from '../middleware/errorHandler';
import { createVisionService } from '../services/VisionService';
import { createMurfTTSService } from '../services/MurfTTSService';
import { SceneDescriptionRequest, SceneDescriptionResponse } from '../types/api';

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

// POST /api/scene-description
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
        // Analyze the scene using Vision service
        const analysisResult = await visionService.analyzeScene(imageFile.buffer, imageFile.mimetype);

        if (!analysisResult.success) {
            return res.status(500).json({
                error: {
                    message: analysisResult.error || 'Scene analysis failed',
                    status: 500
                }
            });
        }

        // Generate enhanced description if needed
        let description = analysisResult.description;
        if (!description || description.trim().length === 0) {
            description = visionService.generateNaturalDescription(analysisResult.objects);
        }

        // Convert description to audio using TTS
        let audioUrl: string | null = null;
        let audioBase64: string | undefined = undefined;

        const ttsService = getTTSService();
        if (ttsService && description) {
            const ttsResult = await ttsService.convertTextToSpeech({
                text: description,
                language
            });

            if (ttsResult.success) {
                audioUrl = ttsResult.audioUrl || null;
                audioBase64 = ttsResult.audioBase64;
            } else {
                console.warn('TTS conversion failed:', ttsResult.error);
            }
        }

        const response: SceneDescriptionResponse = {
            description,
            objects: analysisResult.objects,
            audioUrl
        };

        // Include audioBase64 if available (for frontend compatibility)
        if (audioBase64) {
            (response as any).audioBase64 = audioBase64;
        }

        res.json(response);

    } catch (error) {
        console.error('Scene description error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error during scene analysis',
                status: 500
            }
        });
    }
}));

export default router;