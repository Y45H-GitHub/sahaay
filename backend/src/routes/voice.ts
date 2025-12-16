import { Router, Request, Response } from 'express';
import { uploadAudio } from '../middleware/upload';
import { asyncHandler } from '../middleware/errorHandler';
import { createIntentClassifier } from '../services/IntentClassifier';
import { createLLMService } from '../services/LLMService';
import { createMurfTTSService } from '../services/MurfTTSService';
import { VoiceQueryResponse } from '../types/api';

const router = Router();

// Initialize services
function getIntentClassifier() {
    try {
        return createIntentClassifier();
    } catch (error) {
        console.error('Failed to create Intent Classifier:', error);
        return null;
    }
}

function getLLMService() {
    try {
        return createLLMService();
    } catch (error) {
        console.error('Failed to create LLM service:', error);
        return null;
    }
}

function getTTSService() {
    try {
        return createMurfTTSService();
    } catch (error) {
        console.error('Failed to create TTS service:', error);
        return null;
    }
}

// Mock STT function - in a real implementation, this would use a proper STT service
async function mockSTT(audioBuffer: Buffer, language: string): Promise<{ success: boolean; text?: string; error?: string }> {
    // For now, return a mock transcription based on common test phrases
    // In a real implementation, this would integrate with Web Speech API, Google Speech-to-Text, etc.

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock responses for testing different intents
    const mockTranscriptions = [
        "describe the scene",
        "read the text",
        "what time is it",
        "find my keys",
        "sahaay emergency",
        "what is the weather today"
    ];

    // Return a random mock transcription for testing
    const randomIndex = Math.floor(Math.random() * mockTranscriptions.length);
    const mockText = mockTranscriptions[randomIndex];

    return {
        success: true,
        text: mockText
    };
}

// POST /api/voice-query
router.post('/', uploadAudio, asyncHandler(async (req: Request, res: Response) => {
    const { language = 'en' } = req.body;
    const audioFile = req.file;

    if (!audioFile) {
        return res.status(400).json({
            error: {
                message: 'Audio file is required',
                status: 400
            }
        });
    }

    try {
        // Step 1: Convert audio to text using STT
        const sttResult = await mockSTT(audioFile.buffer, language);

        if (!sttResult.success || !sttResult.text) {
            return res.status(500).json({
                error: {
                    message: sttResult.error || 'Speech-to-text conversion failed',
                    status: 500
                }
            });
        }

        const transcribedText = sttResult.text;

        // Step 2: Classify intent
        const intentClassifier = getIntentClassifier();
        if (!intentClassifier) {
            return res.status(500).json({
                error: {
                    message: 'Intent classification service not available',
                    status: 500
                }
            });
        }

        const intentResult = intentClassifier.classifyIntent(transcribedText);

        if (!intentResult.success) {
            return res.status(500).json({
                error: {
                    message: intentResult.error || 'Intent classification failed',
                    status: 500
                }
            });
        }

        const { intent } = intentResult;
        let responseText = '';

        // Step 3: Route based on intent
        switch (intent.type) {
            case 'scene':
                responseText = 'I understand you want me to describe the scene. Please use the "Describe Scene" button to capture an image, and I\'ll tell you what I see.';
                break;

            case 'text':
                responseText = 'I understand you want me to read text. Please use the "Read Text" button to capture an image of the text, and I\'ll read it aloud for you.';
                break;

            case 'finder':
                const targetObject = intent.parameters?.targetObject || 'the item';
                responseText = `I understand you want me to find ${targetObject}. Please use the camera to scan your surroundings, and I'll help you locate it.`;
                break;

            case 'emergency':
                responseText = 'Emergency mode activated. I understand this is urgent. Please ensure you are in a safe location. If this is a medical emergency, please call emergency services immediately.';
                break;

            case 'general':
            default:
                // Use LLM service for general questions
                const llmService = getLLMService();
                if (llmService) {
                    const llmResult = await llmService.processQuery({
                        prompt: transcribedText,
                        context: 'User is using a voice assistant for visually impaired users'
                    });

                    if (llmResult.success) {
                        responseText = llmResult.response;
                    } else {
                        responseText = 'I apologize, but I cannot process your request right now. Please try again.';
                    }
                } else {
                    responseText = 'I heard your question, but I cannot process general queries right now. Please try again later.';
                }
                break;
        }

        // Step 4: Convert response to audio using TTS
        let audioUrl: string | null = null;
        let audioBase64: string | undefined = undefined;

        const ttsService = getTTSService();
        if (ttsService && responseText) {
            const ttsResult = await ttsService.convertTextToSpeech({
                text: responseText,
                language
            });

            if (ttsResult.success) {
                audioUrl = ttsResult.audioUrl || null;
                audioBase64 = ttsResult.audioBase64;
            } else {
                console.warn('TTS conversion failed:', ttsResult.error);
            }
        }

        // Step 5: Return response
        const response: VoiceQueryResponse = {
            intent: intent.type,
            response: responseText,
            audioUrl
        };

        // Include audioBase64 if available (for frontend compatibility)
        if (audioBase64) {
            (response as any).audioBase64 = audioBase64;
        }

        res.json(response);

    } catch (error) {
        console.error('Voice query processing error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error during voice query processing',
                status: 500
            }
        });
    }
}));

export default router;