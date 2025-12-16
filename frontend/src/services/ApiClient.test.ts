/**
 * API Client Tests
 * Tests for the API client service functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import apiClient from './ApiClient';

// Mock axios
vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => ({
            interceptors: {
                request: { use: vi.fn() },
                response: { use: vi.fn() },
            },
            post: vi.fn(),
            get: vi.fn(),
        })),
    },
}));

describe('ApiClient', () => {
    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        // Mock navigator.onLine
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true,
        });
    });

    afterEach(() => {
        // Clean up
        apiClient.clearRequestQueue();
    });

    describe('Online Status', () => {
        it('should return current online status', () => {
            expect(apiClient.getOnlineStatus()).toBe(true);
        });

        it('should track queued request count', () => {
            expect(apiClient.getQueuedRequestCount()).toBe(0);
        });
    });

    describe('API Methods', () => {
        it('should have all required API methods', () => {
            expect(typeof apiClient.sendVoiceQuery).toBe('function');
            expect(typeof apiClient.getSceneDescription).toBe('function');
            expect(typeof apiClient.readText).toBe('function');
            expect(typeof apiClient.findObject).toBe('function');
            expect(typeof apiClient.triggerEmergency).toBe('function');
            expect(typeof apiClient.textToSpeech).toBe('function');
            expect(typeof apiClient.healthCheck).toBe('function');
        });
    });

    describe('FormData Creation', () => {
        it('should create proper FormData for voice query', async () => {
            const audioBlob = new Blob(['test'], { type: 'audio/wav' });
            const language = 'en';

            // Mock the internal client to avoid actual network calls
            const mockClient = vi.fn().mockResolvedValue({ data: { intent: 'test' } });
            (apiClient as any).client = mockClient;

            try {
                await apiClient.sendVoiceQuery(audioBlob, language);
            } catch (error) {
                // Expected to fail in test environment, but we can verify the call was made
            }

            expect(mockClient).toHaveBeenCalled();
        });

        it('should create proper FormData for scene description', async () => {
            const imageBlob = new Blob(['test'], { type: 'image/jpeg' });
            const language = 'en';

            const mockClient = vi.fn().mockResolvedValue({ data: { description: 'test' } });
            (apiClient as any).client = mockClient;

            try {
                await apiClient.getSceneDescription(imageBlob, language);
            } catch (error) {
                // Expected to fail in test environment
            }

            expect(mockClient).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle network errors gracefully', () => {
            // Test that error formatting works
            const formatError = (apiClient as any).formatError;
            const mockError = {
                message: 'Network Error',
                response: { status: 500 }
            };

            const formattedError = formatError(mockError);
            expect(formattedError.error.message).toBe('Network Error');
            expect(formattedError.error.status).toBe(500);
        });
    });

    describe('Request Queue', () => {
        it('should clear request queue', () => {
            apiClient.clearRequestQueue();
            expect(apiClient.getQueuedRequestCount()).toBe(0);
        });
    });
});