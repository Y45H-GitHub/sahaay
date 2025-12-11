import { Router, Request, Response } from 'express';
import { createMurfTTSService, TTSRequest } from '../services/MurfTTSService';

const router = Router();

// Initialize TTS service
function getTTSService() {
    try {
        const service = createMurfTTSService();
        return service;
    } catch (error) {
        console.error('Failed to create TTS service:', error);
        return null;
    }
}

/**
 * POST /api/tts
 * Convert text to speech using Murf Falcon TTS
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const ttsService = getTTSService();
        if (!ttsService) {
            return res.status(500).json({
                success: false,
                error: 'TTS service not available'
            });
        }

        const { text, language = 'en', voice } = req.body as TTSRequest;

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Text is required and must be a non-empty string'
            });
        }

        if (text.length > 5000) {
            return res.status(400).json({
                success: false,
                error: 'Text is too long (maximum 5000 characters)'
            });
        }

        const result = await ttsService.convertTextToSpeech({
            text,
            language,
            voice
        });

        if (result.success) {
            res.json({
                audioUrl: result.audioUrl,
                audioBase64: result.audioBase64,
                success: true
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('TTS endpoint error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/tts/languages
 * Get available languages and voices
 */
router.get('/languages', (req: Request, res: Response) => {
    try {
        const ttsService = getTTSService();
        if (!ttsService) {
            return res.status(500).json({
                success: false,
                error: 'TTS service not available'
            });
        }

        const languages = ttsService.getAvailableLanguages();
        const languageMap = languages.reduce((acc, lang) => {
            acc[lang] = ttsService.getVoiceId(lang);
            return acc;
        }, {} as Record<string, string>);

        res.json({
            success: true,
            languages: languageMap
        });
    } catch (error) {
        console.error('TTS languages endpoint error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/tts/health
 * Health check for TTS service
 */
router.get('/health', (req: Request, res: Response) => {
    try {
        const ttsService = getTTSService();
        if (!ttsService) {
            return res.status(503).json({
                success: false,
                error: 'TTS service not initialized'
            });
        }

        const isConfigValid = ttsService.validateConfig();

        if (isConfigValid) {
            res.json({
                success: true,
                status: 'healthy',
                message: 'TTS service is operational'
            });
        } else {
            res.status(503).json({
                success: false,
                status: 'unhealthy',
                error: 'TTS service configuration is invalid (missing API key)'
            });
        }
    } catch (error) {
        console.error('TTS health check error:', error);
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: 'Health check failed'
        });
    }
});

export default router;