import { Router } from 'express';
import voiceRoutes from './voice';
import sceneRoutes from './scene';
import textRoutes from './text';
import finderRoutes from './finder';
import emergencyRoutes from './emergency';
import ttsRoutes from './tts';

const router = Router();

// Mount all API routes
router.use('/voice-query', voiceRoutes);
router.use('/scene-description', sceneRoutes);
router.use('/read-text', textRoutes);
router.use('/find-object', finderRoutes);
router.use('/emergency', emergencyRoutes);
router.use('/tts', ttsRoutes);

export default router;