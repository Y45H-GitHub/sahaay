import { MurfTTSService, TTSRequest, TTSResponse, MurfTTSConfig } from '../MurfTTSService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MurfTTSService', () => {
    let ttsService: MurfTTSService;
    let mockConfig: MurfTTSConfig;

    beforeEach(() => {
        mockConfig = {
            apiKey: 'test-api-key',
            apiUrl: 'https://api.murf.ai/v1'
        };
        ttsService = new MurfTTSService(mockConfig);
        jest.clearAllMocks();
    });

    describe('Property 14: TTS conversion and playback', () => {
        it('should successfully convert text to speech and return audio data', async () => {
            // Arrange
            const mockResponse = {
                status: 200,
                data: {
                    audioFile: 'base64-encoded-audio-data',
                    audioUrl: 'https://example.com/audio.mp3',
                    audioLengthInSeconds: 5.2
                }
            };
            mockedAxios.post.mockResolvedValue(mockResponse);

            const request: TTSRequest = {
                text: 'Hello, this is a test message',
                language: 'en'
            };

            // Act
            const result = await ttsService.convertTextToSpeech(request);

            // Assert - Property: TTS conversion returns audio data for playback
            expect(result.success).toBe(true);
            expect(result.audioBase64).toBeDefined();
            expect(result.audioBase64).toBe('base64-encoded-audio-data');
            expect(result.audioUrl).toBeDefined();
            expect(result.error).toBeUndefined();

            // Verify API was called with correct parameters
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.murf.ai/v1/speech/generate',
                expect.objectContaining({
                    text: 'Hello, this is a test message',
                    voiceId: 'en-US-edmund',
                    encodeAsBase64: true
                }),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'api-key': 'test-api-key'
                    })
                })
            );
        });

        it('should handle empty text input gracefully', async () => {
            // Arrange
            const request: TTSRequest = {
                text: '',
                language: 'en'
            };

            // Act
            const result = await ttsService.convertTextToSpeech(request);

            // Assert - Property: Empty text should fail gracefully
            expect(result.success).toBe(false);
            expect(result.error).toBe('Text cannot be empty');
            expect(result.audioBase64).toBeUndefined();
            expect(mockedAxios.post).not.toHaveBeenCalled();
        });

        it('should handle API errors with retry logic', async () => {
            // Arrange
            mockedAxios.post
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({
                    status: 200,
                    data: {
                        audioFile: 'base64-audio-after-retry'
                    }
                });

            const request: TTSRequest = {
                text: 'Test retry logic',
                language: 'en'
            };

            // Act
            const result = await ttsService.convertTextToSpeech(request);

            // Assert - Property: Service should retry on failures and eventually succeed
            expect(result.success).toBe(true);
            expect(result.audioBase64).toBe('base64-audio-after-retry');
            expect(mockedAxios.post).toHaveBeenCalledTimes(3);
        });

        it('should fail after maximum retries', async () => {
            // Arrange
            mockedAxios.post.mockRejectedValue(new Error('Persistent network error'));

            const request: TTSRequest = {
                text: 'Test max retries',
                language: 'en'
            };

            // Act
            const result = await ttsService.convertTextToSpeech(request);

            // Assert - Property: Service should fail after max retries
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toMatch(/TTS conversion failed after retries|Persistent network error/);
            expect(mockedAxios.post).toHaveBeenCalledTimes(3); // Max retries
        });
    });

    describe('Property 32: Language selection changes TTS voice', () => {
        it('should map English language to correct voice ID', async () => {
            // Arrange
            const mockResponse = {
                status: 200,
                data: { audioFile: 'english-audio' }
            };
            mockedAxios.post.mockResolvedValue(mockResponse);

            // Act
            await ttsService.convertTextToSpeech({
                text: 'English text',
                language: 'english'
            });

            // Assert - Property: English language maps to en-US-edmund voice
            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    voiceId: 'en-US-edmund'
                }),
                expect.any(Object)
            );
        });

        it('should map Hindi language to correct voice ID', async () => {
            // Arrange
            const mockResponse = {
                status: 200,
                data: { audioFile: 'hindi-audio' }
            };
            mockedAxios.post.mockResolvedValue(mockResponse);

            // Act
            await ttsService.convertTextToSpeech({
                text: 'हिंदी टेक्स्ट',
                language: 'hindi'
            });

            // Assert - Property: Hindi language maps to hi-IN-kabir voice
            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    voiceId: 'hi-IN-kabir'
                }),
                expect.any(Object)
            );
        });

        it('should map Hinglish language to correct voice ID', async () => {
            // Arrange
            const mockResponse = {
                status: 200,
                data: { audioFile: 'hinglish-audio' }
            };
            mockedAxios.post.mockResolvedValue(mockResponse);

            // Act
            await ttsService.convertTextToSpeech({
                text: 'Hinglish mixed text',
                language: 'hinglish'
            });

            // Assert - Property: Hinglish language maps to en-AU-mitch voice
            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    voiceId: 'en-AU-mitch'
                }),
                expect.any(Object)
            );
        });

        it('should default to English voice for unknown languages', async () => {
            // Arrange
            const mockResponse = {
                status: 200,
                data: { audioFile: 'default-audio' }
            };
            mockedAxios.post.mockResolvedValue(mockResponse);

            // Act
            await ttsService.convertTextToSpeech({
                text: 'Unknown language text',
                language: 'unknown-language'
            });

            // Assert - Property: Unknown languages default to English voice
            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    voiceId: 'en-US-edmund'
                }),
                expect.any(Object)
            );
        });

        it('should handle case-insensitive language matching', async () => {
            // Arrange
            const mockResponse = {
                status: 200,
                data: { audioFile: 'case-insensitive-audio' }
            };
            mockedAxios.post.mockResolvedValue(mockResponse);

            // Act - Test various case combinations
            const testCases = [
                { language: 'ENGLISH', expectedVoice: 'en-US-edmund' },
                { language: 'Hindi', expectedVoice: 'hi-IN-kabir' },
                { language: 'HINGLISH', expectedVoice: 'en-AU-mitch' },
                { language: 'en', expectedVoice: 'en-US-edmund' },
                { language: 'HI', expectedVoice: 'hi-IN-kabir' }
            ];

            for (const testCase of testCases) {
                mockedAxios.post.mockClear();
                mockedAxios.post.mockResolvedValue(mockResponse);

                await ttsService.convertTextToSpeech({
                    text: 'Test text',
                    language: testCase.language
                });

                // Assert - Property: Language matching is case-insensitive
                expect(mockedAxios.post).toHaveBeenCalledWith(
                    expect.any(String),
                    expect.objectContaining({
                        voiceId: testCase.expectedVoice
                    }),
                    expect.any(Object)
                );
            }
        });

        it('should allow custom voice override', async () => {
            // Arrange
            const mockResponse = {
                status: 200,
                data: { audioFile: 'custom-voice-audio' }
            };
            mockedAxios.post.mockResolvedValue(mockResponse);

            // Act
            await ttsService.convertTextToSpeech({
                text: 'Custom voice text',
                language: 'english',
                voice: 'custom-voice-id'
            });

            // Assert - Property: Custom voice overrides language mapping
            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    voiceId: 'custom-voice-id'
                }),
                expect.any(Object)
            );
        });
    });

    describe('Service utility methods', () => {
        it('should return available languages', () => {
            // Act
            const languages = ttsService.getAvailableLanguages();

            // Assert
            expect(languages).toContain('en');
            expect(languages).toContain('english');
            expect(languages).toContain('hi');
            expect(languages).toContain('hindi');
            expect(languages).toContain('hinglish');
            expect(languages).toContain('en-in');
        });

        it('should validate configuration correctly', () => {
            // Act & Assert - Valid config
            expect(ttsService.validateConfig()).toBe(true);

            // Invalid config
            const invalidService = new MurfTTSService({
                apiKey: '',
                apiUrl: 'https://api.murf.ai/v1'
            });
            expect(invalidService.validateConfig()).toBe(false);
        });

        it('should return correct voice ID for language', () => {
            // Act & Assert
            expect(ttsService.getVoiceId('english')).toBe('en-US-edmund');
            expect(ttsService.getVoiceId('hindi')).toBe('hi-IN-kabir');
            expect(ttsService.getVoiceId('hinglish')).toBe('en-AU-mitch');
            expect(ttsService.getVoiceId('unknown')).toBe('en-US-edmund');
        });
    });
});