/**
 * API Client Service
 * Handles all communication with the backend API
 * Includes retry logic, error handling, and offline request queuing
 */

import axios from 'axios';

// API Response Types (matching backend types)
export interface VoiceQueryResponse {
    intent: string;
    response: string;
    audioUrl: string | null;
    audioBase64?: string;
}

export interface DetectedObject {
    name: string;
    position: string;
    confidence: number;
}

export interface SceneDescriptionResponse {
    description: string;
    objects: DetectedObject[];
    audioUrl: string | null;
}

export interface ReadTextResponse {
    text: string;
    audioUrl: string | null;
}

export interface FindObjectResponse {
    found: boolean;
    direction?: string;
    message: string;
    audioUrl: string | null;
}

export interface EmergencyResponse {
    status: string;
    message: string;
    audioUrl: string | null;
}

export interface TTSResponse {
    audioUrl: string | null;
    audioBase64?: string;
}

export interface ErrorResponse {
    error: {
        message: string;
        status: number;
        stack?: string;
    };
}

// Request queue for offline mode
interface QueuedRequest {
    id: string;
    config: any;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timestamp: number;
}

class ApiClient {
    private client: any;
    private requestQueue: QueuedRequest[] = [];
    private isOnline: boolean = navigator.onLine;
    private retryAttempts: number = 3;
    private retryDelay: number = 1000; // 1 second base delay

    constructor() {
        // Get base URL from environment or default to localhost
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

        this.client = (axios as any).create({
            baseURL,
            timeout: 30000, // 30 second timeout
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        this.setupInterceptors();
        this.setupOnlineStatusListener();
    }

    /**
     * Setup request and response interceptors
     */
    private setupInterceptors(): void {
        // Request interceptor
        this.client.interceptors.request.use(
            (config: any) => {
                // Add timestamp to requests
                config.metadata = { startTime: Date.now() };
                console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error: any) => {
                console.error('[API] Request error:', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response: any) => {
                const duration = Date.now() - (response.config.metadata?.startTime || 0);
                console.log(`[API] ${response.status} ${response.config.url} (${duration}ms)`);
                return response;
            },
            async (error: any) => {
                const config = error.config;

                // Don't retry if no config or already retried max times
                if (!config || config._retryCount >= this.retryAttempts) {
                    console.error('[API] Response error (max retries reached):', error.message);
                    return Promise.reject(this.formatError(error));
                }

                // Initialize retry count
                config._retryCount = config._retryCount || 0;
                config._retryCount++;

                // Calculate exponential backoff delay
                const delay = this.retryDelay * Math.pow(2, config._retryCount - 1);

                console.warn(`[API] Retrying request (${config._retryCount}/${this.retryAttempts}) after ${delay}ms`);

                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delay));

                return this.client(config);
            }
        );
    }

    /**
     * Setup online/offline status listener
     */
    private setupOnlineStatusListener(): void {
        window.addEventListener('online', () => {
            console.log('[API] Connection restored, processing queued requests');
            this.isOnline = true;
            this.processRequestQueue();
        });

        window.addEventListener('offline', () => {
            console.log('[API] Connection lost, queueing requests');
            this.isOnline = false;
        });
    }

    /**
     * Process queued requests when coming back online
     */
    private async processRequestQueue(): Promise<void> {
        while (this.requestQueue.length > 0 && this.isOnline) {
            const queuedRequest = this.requestQueue.shift();
            if (!queuedRequest) continue;

            try {
                const response = await this.client(queuedRequest.config);
                queuedRequest.resolve(response.data);
            } catch (error) {
                queuedRequest.reject(error);
            }
        }
    }

    /**
     * Format axios error into consistent error response
     */
    private formatError(error: any): ErrorResponse {
        if (error.response?.data) {
            return error.response.data as ErrorResponse;
        }

        return {
            error: {
                message: error.message || 'Network error occurred',
                status: error.response?.status || 0,
            }
        };
    }

    /**
     * Make API request with offline queueing support
     */
    private async makeRequest<T>(config: any): Promise<T> {
        if (!this.isOnline) {
            // Queue request for when connection is restored
            return new Promise<T>((resolve, reject) => {
                const queuedRequest: QueuedRequest = {
                    id: Date.now().toString(),
                    config,
                    resolve,
                    reject,
                    timestamp: Date.now(),
                };
                this.requestQueue.push(queuedRequest);
                console.log('[API] Request queued for offline mode');
            });
        }

        try {
            const response = await this.client(config);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Send voice query to backend
     */
    async sendVoiceQuery(audioBlob: Blob, language: string): Promise<VoiceQueryResponse> {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.wav');
        formData.append('language', language);

        return this.makeRequest<VoiceQueryResponse>({
            method: 'POST',
            url: '/api/voice-query',
            data: formData,
        });
    }

    /**
     * Send text query to backend (for when we already have transcript)
     */
    async sendTextQuery(text: string, language: string): Promise<VoiceQueryResponse> {
        const data = {
            text,
            language,
        };

        return this.makeRequest<VoiceQueryResponse>({
            method: 'POST',
            url: '/api/voice-query',
            data,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Request scene description
     */
    async getSceneDescription(imageBlob: Blob, language: string): Promise<SceneDescriptionResponse> {
        const formData = new FormData();
        formData.append('image', imageBlob, 'scene.jpg');
        formData.append('language', language);

        return this.makeRequest<SceneDescriptionResponse>({
            method: 'POST',
            url: '/api/scene-description',
            data: formData,
        });
    }

    /**
     * Request text reading from image
     */
    async readText(imageBlob: Blob, language: string): Promise<ReadTextResponse> {
        const formData = new FormData();
        formData.append('image', imageBlob, 'text.jpg');
        formData.append('language', language);

        return this.makeRequest<ReadTextResponse>({
            method: 'POST',
            url: '/api/read-text',
            data: formData,
        });
    }

    /**
     * Find object in image
     */
    async findObject(imageBlob: Blob, targetObject: string, language: string): Promise<FindObjectResponse> {
        const formData = new FormData();
        formData.append('image', imageBlob, 'finder.jpg');
        formData.append('targetObject', targetObject);
        formData.append('language', language);

        return this.makeRequest<FindObjectResponse>({
            method: 'POST',
            url: '/api/find-object',
            data: formData,
        });
    }

    /**
     * Trigger emergency notification
     */
    async triggerEmergency(location?: { latitude: number; longitude: number }, language: string = 'en'): Promise<EmergencyResponse> {
        const data = {
            location,
            language,
        };

        return this.makeRequest<EmergencyResponse>({
            method: 'POST',
            url: '/api/emergency',
            data,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Convert text to speech
     */
    async textToSpeech(text: string, language: string, voice?: string): Promise<TTSResponse> {
        const data = {
            text,
            language,
            voice,
        };

        return this.makeRequest<TTSResponse>({
            method: 'POST',
            url: '/api/tts',
            data,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Health check endpoint
     */
    async healthCheck(): Promise<{ status: string; timestamp: number }> {
        return this.makeRequest<{ status: string; timestamp: number }>({
            method: 'GET',
            url: '/api/health',
        });
    }

    /**
     * Get current online status
     */
    getOnlineStatus(): boolean {
        return this.isOnline;
    }

    /**
     * Get number of queued requests
     */
    getQueuedRequestCount(): number {
        return this.requestQueue.length;
    }

    /**
     * Clear request queue (useful for cleanup)
     */
    clearRequestQueue(): void {
        // Reject all queued requests
        this.requestQueue.forEach(request => {
            request.reject(new Error('Request queue cleared'));
        });
        this.requestQueue = [];
    }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;

// Export individual methods for easier importing
export const {
    sendVoiceQuery,
    sendTextQuery,
    getSceneDescription,
    readText,
    findObject,
    triggerEmergency,
    textToSpeech,
    healthCheck,
    getOnlineStatus,
    getQueuedRequestCount,
    clearRequestQueue,
} = apiClient;