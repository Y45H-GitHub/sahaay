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
    audioFile?: string; // Base64 encoded audio
    encodedAudio?: string; // Alternative field name
    audioUrl?: string;
    audioLengthInSeconds?: number;
    wordDurations?: Array<{
        word: string;
        startMs: number;
        endMs: number;
        sourceWordIndex: number;
        pitchScaleMinimum: number;
        pitchScaleMaximum: number;
    }>;
    warning?: string;
    consumedCharacterCount?: number;
    remainingCharacterCount?: number;
}

export class MurfTTSService {
    private config: MurfTTSConfig;
    private languageVoiceMapping: Record<string, string>;
    private maxRetries: number = 3;
    private retryDelay: number = 1000; // 1 second

    constructor(config: MurfTTSConfig) {
        this.config = config;

        // Language to voice ID mapping for Murf Falcon TTS
        // Updated with actual Murf voice IDs from API
        this.languageVoiceMapping = {
            'en': 'en-US-edmund', // English voice (US)
            'english': 'en-US-edmund',
            'hi': 'hi-IN-kabir', // Hindi voice (Male)
            'hindi': 'hi-IN-kabir',
            'hinglish': 'en-AU-mitch', // Hinglish (supports en-IN locale)
            'en-in': 'en-AU-mitch'
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

                // Check if response is successful (status 200-299)
                if (response.status >= 200 && response.status < 300) {
                    const audioBase64 = response.data.audioFile || response.data.encodedAudio;

                    if (!audioBase64) {
                        throw new Error('No audio data received from Murf API');
                    }

                    return {
                        audioUrl: response.data.audioUrl,
                        audioBase64: audioBase64,
                        success: true
                    };
                } else {
                    throw new Error('TTS conversion failed');
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
        // Updated payload format based on Murf API documentation
        const payload = {
            voiceId: voiceId,
            style: "Conversational",
            text: text,
            rate: 0,
            pitch: 0,
            sampleRate: 24000, // Valid sample rate according to API
            format: "MP3",
            channelType: "MONO",
            pronunciationDictionary: {},
            encodeAsBase64: true
        };

        const headers = {
            'api-key': this.config.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        // Updated endpoint based on Murf API documentation
        return await axios.post(`${this.config.apiUrl}/speech/generate`, payload, {
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