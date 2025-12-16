import request from 'supertest';
import express from 'express';
import cors from 'cors';
import apiRoutes from '../index';
import { errorHandler, notFoundHandler } from '../../middleware/errorHandler';

// Create test app
const createTestApp = () => {
    const app = express();

    // Middleware
    app.use(cors());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // API routes
    app.use('/api', apiRoutes);

    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
};

describe('API Routes Integration', () => {
    let app: express.Application;

    beforeEach(() => {
        app = createTestApp();
    });

    describe('POST /api/voice-query', () => {
        it('should return 400 when no audio file is provided', async () => {
            const response = await request(app)
                .post('/api/voice-query')
                .send({ language: 'en' });

            expect(response.status).toBe(400);
            expect(response.body.error.message).toBe('Audio file is required');
        });

        it('should process voice query with mock audio file', async () => {
            // Create a mock audio buffer
            const mockAudioBuffer = Buffer.from('mock audio data');

            const response = await request(app)
                .post('/api/voice-query')
                .attach('audio', mockAudioBuffer, 'test.wav')
                .field('language', 'en');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('intent');
            expect(response.body).toHaveProperty('response');
            expect(response.body).toHaveProperty('audioUrl');
        });
    });

    describe('POST /api/emergency', () => {
        it('should handle emergency request without location', async () => {
            const response = await request(app)
                .post('/api/emergency')
                .send({ language: 'en' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('audioUrl');
            expect(response.body.status).toBe('acknowledged');
        });

        it('should handle emergency request with location', async () => {
            const response = await request(app)
                .post('/api/emergency')
                .send({
                    language: 'en',
                    location: {
                        latitude: 40.7128,
                        longitude: -74.0060
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('message');
            expect(response.body.status).toBe('acknowledged');
        });
    });

    describe('POST /api/scene-description', () => {
        it('should return 400 when no image file is provided', async () => {
            const response = await request(app)
                .post('/api/scene-description')
                .send({ language: 'en' });

            expect(response.status).toBe(400);
            expect(response.body.error.message).toBe('Image file is required');
        });
    });

    describe('POST /api/read-text', () => {
        it('should return 400 when no image file is provided', async () => {
            const response = await request(app)
                .post('/api/read-text')
                .send({ language: 'en' });

            expect(response.status).toBe(400);
            expect(response.body.error.message).toBe('Image file is required');
        });
    });

    describe('POST /api/find-object', () => {
        it('should return 400 when no image file is provided', async () => {
            const response = await request(app)
                .post('/api/find-object')
                .send({ language: 'en', targetObject: 'keys' });

            expect(response.status).toBe(400);
            expect(response.body.error.message).toBe('Image file is required');
        });

        it('should return 400 when no target object is provided', async () => {
            const mockImageBuffer = Buffer.from('mock image data');

            const response = await request(app)
                .post('/api/find-object')
                .attach('image', mockImageBuffer, 'test.jpg')
                .field('language', 'en');

            expect(response.status).toBe(400);
            expect(response.body.error.message).toBe('Target object name is required and must be a non-empty string');
        });
    });

    describe('POST /api/tts', () => {
        it('should return 400 when no text is provided', async () => {
            const response = await request(app)
                .post('/api/tts')
                .send({ language: 'en' });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Text is required and must be a non-empty string');
        });

        it('should return 400 when text is too long', async () => {
            const longText = 'a'.repeat(5001);

            const response = await request(app)
                .post('/api/tts')
                .send({ text: longText, language: 'en' });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Text is too long (maximum 5000 characters)');
        });
    });

    describe('GET /api/tts/languages', () => {
        it('should return available languages', async () => {
            const response = await request(app)
                .get('/api/tts/languages');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('languages');
        });
    });

    describe('GET /api/tts/health', () => {
        it('should return TTS service health status', async () => {
            const response = await request(app)
                .get('/api/tts/health');

            // Should return either 200 (healthy) or 503 (unhealthy)
            expect([200, 503]).toContain(response.status);
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('status');
        });
    });
});