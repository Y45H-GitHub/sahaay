import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { createMurfTTSService } from '../services/MurfTTSService';
import { EmergencyRequest, EmergencyResponse } from '../types/api';

const router = Router();

// Initialize TTS service
function getTTSService() {
    try {
        return createMurfTTSService();
    } catch (error) {
        console.error('Failed to create TTS service:', error);
        return null;
    }
}

// Mock emergency notification function
async function sendEmergencyNotification(location?: { latitude: number; longitude: number }): Promise<{ success: boolean; error?: string }> {
    try {
        // In a real implementation, this would:
        // 1. Send SMS to emergency contacts
        // 2. Call emergency services API
        // 3. Send push notifications to caregivers
        // 4. Log emergency event to database

        const emergencyData = {
            timestamp: new Date().toISOString(),
            location: location || null,
            type: 'voice_triggered',
            status: 'acknowledged'
        };

        // Log emergency for now (in production, this would be sent to external services)
        console.log('🚨 EMERGENCY TRIGGERED:', emergencyData);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 200));

        // For demo purposes, always return success
        // In production, this would handle actual emergency service integration
        return { success: true };

    } catch (error) {
        console.error('Emergency notification failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// POST /api/emergency
router.post('/', asyncHandler(async (req: Request, res: Response) => {
    const { location, language = 'en' }: EmergencyRequest = req.body;

    try {
        // Log emergency trigger immediately
        console.log('🚨 Emergency endpoint called:', {
            timestamp: new Date().toISOString(),
            location: location || 'Location not provided',
            language
        });

        // Send emergency notification
        const notificationResult = await sendEmergencyNotification(location);

        let message: string;
        let status: string;

        if (notificationResult.success) {
            status = 'acknowledged';
            message = 'Emergency alert has been triggered. Help is being notified. Please stay calm and remain in a safe location if possible.';
        } else {
            status = 'failed';
            message = 'Emergency alert could not be sent at this time. Please try calling emergency services directly if this is a critical situation.';
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
                console.warn('Emergency TTS conversion failed:', ttsResult.error);
            }
        }

        const response: EmergencyResponse = {
            status,
            message,
            audioUrl
        };

        // Include audioBase64 if available (for frontend compatibility)
        if (audioBase64) {
            (response as any).audioBase64 = audioBase64;
        }

        // Return appropriate HTTP status
        const httpStatus = notificationResult.success ? 200 : 500;
        res.status(httpStatus).json(response);

    } catch (error) {
        console.error('Emergency endpoint error:', error);

        // Even if there's an error, we should try to provide a helpful response
        const errorMessage = 'Emergency system encountered an error. Please call emergency services directly if this is a critical situation.';

        let audioUrl: string | null = null;
        const ttsService = getTTSService();
        if (ttsService) {
            try {
                const ttsResult = await ttsService.convertTextToSpeech({
                    text: errorMessage,
                    language
                });
                if (ttsResult.success) {
                    audioUrl = ttsResult.audioUrl || null;
                }
            } catch (ttsError) {
                console.error('Emergency error TTS failed:', ttsError);
            }
        }

        res.status(500).json({
            status: 'error',
            message: errorMessage,
            audioUrl,
            error: {
                message: 'Internal server error during emergency processing',
                status: 500
            }
        });
    }
}));

export default router;