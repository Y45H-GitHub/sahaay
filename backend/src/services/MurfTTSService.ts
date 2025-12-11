import axios, { AxiosResponse } from 'axios';

export interface TTSRequest {
    text: string;
    language: string;
    voice?: string;
}

export interface TTSResponse {
    audioUrl?: string;
    audioBase64?: string;
    success: boolean;
    error?: string;
}

export interface MurfTTSConfig {
    apiKey: string;
    apiUrl: string;
}

export interface MurfAPIResponse {
    audio_url?: string;
    audio_base64?: string;
    status: string;
    message?: string;
}

export class MurfTTSService {
    private config: MurfTTSConfig;
    private languageVoiceMapping: Record<string, string>;
    private maxRetries: number = 3;
    private retryDelay: number = 1000; // 1 second

    constructor(config: MurfTTSConfig) {
        this.config = config;

        // Language to voice ID mapping for Murf Falcon TTS
        this.languageVoiceMapping = {
            'en': 'en-US-neural-male-1', // English voice
            'english': 'en-US-neural-male-1',
            'hi': 'hi-IN-neural-female-1', // Hindi voice
            'hindi': 'hi-IN-neural-female-1',
            'hinglish': 'en-IN-neural-male-1', // Hinglish (Indian English) voice
            'en-in': 'en-IN-neural-male-1'
        };
    }

    /**
     * Convert text to speech using Murf Falcon TTS API
     */
    async convertTextToSpeech(request: TTSRequest): Promise<TTSResponse> {
        const { text, language, voice } = request;

        if (!text || text.trim().length === 0) {
            return {
                success: false,
                error: 'Text cannot be empty'
            };
        }

        if (!this.config.apiKey) {
            return {
                success: false,
                error: 'TTS service not configured - API key missing'
            };
        }

        const voiceId = voice || this.getVoiceForLanguage(language);

        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await this.makeAPICall(text, voiceId);

                if (response.data.status === 'success') {
                    return {
                        audioUrl: response.data.audio_url,
                        audioBase64: response.data.audio_base64,
                        success: true
                    };
                } else {
                    throw new Error(response.data.message || 'TTS conversion failed');
                }
            } catch (error) {
                lastError = error as Error;
                console.error(`TTS attempt ${attempt} failed:`, error);

                // Don't retry on client errors (4xx)
                if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
                    break;
                }

                // Wait before retrying (exponential backoff)
                if (attempt < this.maxRetries) {
                    await this.delay(this.retryDelay * Math.pow(2, attempt - 1));
                }
            }
        }

        return {
            success: false,
            error: lastError?.message || 'TTS conversion failed after retries'
        };
    }

    /**
     * Get voice ID for a given language
     */
    private getVoiceForLanguage(language: string): string {
        const normalizedLanguage = language.toLowerCase().trim();
        return this.languageVoiceMapping[normalizedLanguage] || this.languageVoiceMapping['en'];
    }

    /**
     * Make API call to Murf Falcon TTS
     */
    private async makeAPICall(text: string, voiceId: string): Promise<AxiosResponse<MurfAPIResponse>> {
        const payload = {
            text: text,
            voice_id: voiceId,
            format: 'mp3',
            sample_rate: 22050,
            return_base64: true // Request both URL and base64
        };

        const headers = {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        return await axios.post(`${this.config.apiUrl}/tts/generate`, payload, {
            headers,
            timeout: 30000 // 30 second timeout
        });
    }

    /**
     * Utility method for delays
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get available languages
     */
    getAvailableLanguages(): string[] {
        return Object.keys(this.languageVoiceMapping);
    }

    /**
     * Get voice ID for a language (public method)
     */
    getVoiceId(language: string): string {
        return this.getVoiceForLanguage(language);
    }

    /**
     * Validate API configuration
     */
    validateConfig(): boolean {
        return !!(this.config.apiKey && this.config.apiUrl);
    }
}

// Factory function to create TTS service instance
export function createMurfTTSService(): MurfTTSService {
    const config: MurfTTSConfig = {
        apiKey: process.env.MURF_API_KEY || '',
        apiUrl: process.env.MURF_API_URL || 'https://api.murf.ai/v1'
    };

    if (!config.apiKey) {
        console.warn('MURF_API_KEY environment variable is not set. TTS service will not be functional.');
    }

    return new MurfTTSService(config);
}