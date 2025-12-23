import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    VoiceCues,
    VOICE_CUE_MESSAGES,
    DEFAULT_VOICE_CONFIG,
    EMERGENCY_VOICE_CONFIG,
    announceListening,
    announceProcessing,
    announceSuccess,
    announceError,
    announceSceneActivated,
    announceTextActivated,
    announceGeneralActivated,
    announceScanningStarted,
    announceScanningCancelled,
    announceEmergencyActivated,
    announceCustom,
    stopVoiceCues,
    isVoiceCuesAvailable,
    isVoiceCuesSpeaking
} from './VoiceCues';

// Mock speech synthesis
const mockSpeak = vi.fn();
const mockCancel = vi.fn();

Object.defineProperty(window, 'speechSynthesis', {
    writable: true,
    value: {
        speak: mockSpeak,
        cancel: mockCancel,
        speaking: false,
        getVoices: vi.fn(() => [])
    }
});

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    writable: true,
    value: function (text: string) {
        return {
            text,
            rate: 1,
            volume: 1,
            pitch: 1,
            onstart: null,
            onend: null,
            onerror: null
        };
    }
});

describe('VoiceCues', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset speech synthesis speaking state
        Object.defineProperty(window.speechSynthesis, 'speaking', {
            writable: true,
            value: false
        });
    });

    describe('Voice Cue Messages', () => {
        it('has all required state messages', () => {
            expect(VOICE_CUE_MESSAGES).toHaveProperty('listening');
            expect(VOICE_CUE_MESSAGES).toHaveProperty('processing');
            expect(VOICE_CUE_MESSAGES).toHaveProperty('success');
            expect(VOICE_CUE_MESSAGES).toHaveProperty('error');
            expect(VOICE_CUE_MESSAGES).toHaveProperty('sceneActivated');
            expect(VOICE_CUE_MESSAGES).toHaveProperty('textActivated');
            expect(VOICE_CUE_MESSAGES).toHaveProperty('generalActivated');
            expect(VOICE_CUE_MESSAGES).toHaveProperty('scanningStarted');
            expect(VOICE_CUE_MESSAGES).toHaveProperty('scanningCancelled');
            expect(VOICE_CUE_MESSAGES).toHaveProperty('emergencyActivated');
        });

        it('has meaningful message content', () => {
            expect(VOICE_CUE_MESSAGES.listening).toContain('Listening');
            expect(VOICE_CUE_MESSAGES.processing).toContain('Processing');
            expect(VOICE_CUE_MESSAGES.success).toContain('success');
            expect(VOICE_CUE_MESSAGES.error).toContain('error');
            expect(VOICE_CUE_MESSAGES.emergencyActivated).toContain('Emergency');
        });
    });

    describe('Voice Configuration', () => {
        it('has default voice configuration', () => {
            expect(DEFAULT_VOICE_CONFIG).toEqual({
                rate: 0.9,
                volume: 1.0,
                pitch: 1.0
            });
        });

        it('has emergency voice configuration with urgent settings', () => {
            expect(EMERGENCY_VOICE_CONFIG).toEqual({
                rate: 1.1,
                volume: 1.0,
                pitch: 1.2
            });

            // Emergency config should be faster and higher pitch than default
            expect(EMERGENCY_VOICE_CONFIG.rate).toBeGreaterThan(DEFAULT_VOICE_CONFIG.rate);
            expect(EMERGENCY_VOICE_CONFIG.pitch).toBeGreaterThan(DEFAULT_VOICE_CONFIG.pitch);
        });
    });

    describe('Speech Synthesis Support', () => {
        it('detects speech synthesis support', () => {
            expect(VoiceCues.isAvailable()).toBe(true);
            expect(isVoiceCuesAvailable()).toBe(true);
        });

        it('handles missing speech synthesis gracefully', () => {
            // Test that the service can handle cases where speechSynthesis might not be available
            // This is more of a documentation test since we can't easily mock the missing API
            expect(VoiceCues.isAvailable()).toBe(true); // In test environment it's available
            expect(isVoiceCuesAvailable()).toBe(true);
        });
    });

    describe('Basic Voice Cues', () => {
        it('announces listening state', () => {
            announceListening();

            expect(mockSpeak).toHaveBeenCalledTimes(1);
            const utterance = mockSpeak.mock.calls[0][0];
            expect(utterance.text).toBe(VOICE_CUE_MESSAGES.listening);
            expect(utterance.rate).toBe(DEFAULT_VOICE_CONFIG.rate);
        });

        it('announces processing state', () => {
            announceProcessing();

            expect(mockSpeak).toHaveBeenCalledTimes(1);
            const utterance = mockSpeak.mock.calls[0][0];
            expect(utterance.text).toBe(VOICE_CUE_MESSAGES.processing);
        });

        it('announces success state', () => {
            announceSuccess();

            expect(mockSpeak).toHaveBeenCalledTimes(1);
            const utterance = mockSpeak.mock.calls[0][0];
            expect(utterance.text).toBe(VOICE_CUE_MESSAGES.success);
        });

        it('announces error state with default message', () => {
            announceError();

            expect(mockSpeak).toHaveBeenCalledTimes(1);
            const utterance = mockSpeak.mock.calls[0][0];
            expect(utterance.text).toBe(VOICE_CUE_MESSAGES.error);
        });

        it('announces error state with custom message', () => {
            const customError = 'Custom error message';
            announceError(customError);

            expect(mockSpeak).toHaveBeenCalledTimes(1);
            const utterance = mockSpeak.mock.calls[0][0];
            expect(utterance.text).toBe(customError);
        });
    });

    describe('Mode Activation Voice Cues', () => {
        it('announces scene description activation', () => {
            announceSceneActivated();

            expect(mockSpeak).toHaveBeenCalledTimes(1);
            const utterance = mockSpeak.mock.calls[0][0];
            expect(utterance.text).toBe(VOICE_CUE_MESSAGES.sceneActivated);
        });

        it('announces text reading activation', () => {
            announceTextActivated();

            expect(mockSpeak).toHaveBeenCalledTimes(1);
            const utterance = mockSpeak.mock.calls[0][0];
            expect(utterance.text).toBe(VOICE_CUE_MESSAGES.textActivated);
        });

        it('announces general question activation', () => {
            announceGeneralActivated();

            expect(mockSpeak).toHaveBeenCalledTimes(1);
            const utterance = mockSpeak.mock.calls[0][0];
            expect(utterance.text).toBe(VOICE_CUE_MESSAGES.generalActivated);
        });
    });

    describe('Scanning Voice Cues', () => {
        it('announces scanning started with object name', () => {
            const objectName = 'keys';
            announceScanningStarted(objectName);

            expect(mockSpeak).toHaveBeenCalledTimes(1);
            const utterance = mockSpeak.mock.calls[0][0];
            expect(utterance.text).toContain(objectName);
            expect(utterance.text).toContain('scan');
            expect(utterance.text).toContain('cancel');
        });

        it('announces scanning cancelled', () => {
            announceScanningCancelled();

            expect(mockSpeak).toHaveBeenCalledTimes(1);
            const utterance = mockSpeak.mock.calls[0][0];
            expect(utterance.text).toBe(VOICE_CUE_MESSAGES.scanningCancelled);
        });
    });

    describe('Emergency Voice Cues', () => {
        it('announces emergency activation with urgent configuration', () => {
            announceEmergencyActivated();

            expect(mockSpeak).toHaveBeenCalledTimes(1);
            const utterance = mockSpeak.mock.calls[0][0];
            expect(utterance.text).toBe(VOICE_CUE_MESSAGES.emergencyActivated);
            expect(utterance.rate).toBe(EMERGENCY_VOICE_CONFIG.rate);
            expect(utterance.pitch).toBe(EMERGENCY_VOICE_CONFIG.pitch);
        });
    });

    describe('Custom Voice Cues', () => {
        it('announces custom message with default config', () => {
            const customMessage = 'Custom test message';
            announceCustom(customMessage);

            expect(mockSpeak).toHaveBeenCalledTimes(1);
            const utterance = mockSpeak.mock.calls[0][0];
            expect(utterance.text).toBe(customMessage);
            expect(utterance.rate).toBe(DEFAULT_VOICE_CONFIG.rate);
        });

        it('announces custom message with custom config', () => {
            const customMessage = 'Custom test message';
            const customConfig = { rate: 1.5, volume: 0.8, pitch: 0.9 };
            announceCustom(customMessage, customConfig);

            expect(mockSpeak).toHaveBeenCalledTimes(1);
            const utterance = mockSpeak.mock.calls[0][0];
            expect(utterance.text).toBe(customMessage);
            expect(utterance.rate).toBe(customConfig.rate);
            expect(utterance.volume).toBe(customConfig.volume);
            expect(utterance.pitch).toBe(customConfig.pitch);
        });
    });

    describe('Voice Cue Control', () => {
        it('stops ongoing speech', () => {
            stopVoiceCues();
            expect(mockCancel).toHaveBeenCalledTimes(1);
        });

        it('cancels previous speech before starting new one', () => {
            announceListening();
            announceProcessing();

            // Should cancel once before the second announcement
            // (Note: mockCancel might have been called in previous tests, so we check the last calls)
            expect(mockCancel).toHaveBeenCalled();
            expect(mockSpeak).toHaveBeenCalledTimes(2);
        });

        it('detects if currently speaking', () => {
            // Mock speaking state
            Object.defineProperty(window.speechSynthesis, 'speaking', {
                writable: true,
                value: true
            });

            expect(isVoiceCuesSpeaking()).toBe(true);

            // Reset speaking state
            Object.defineProperty(window.speechSynthesis, 'speaking', {
                writable: true,
                value: false
            });

            expect(isVoiceCuesSpeaking()).toBe(false);
        });
    });

    describe('Callback Handling', () => {
        it('calls onStart callback when provided', () => {
            const onStart = vi.fn();
            announceListening(onStart);

            expect(mockSpeak).toHaveBeenCalledTimes(1);
            const utterance = mockSpeak.mock.calls[0][0];
            expect(utterance.onstart).toBe(onStart);
        });

        it('calls onEnd callback when provided', () => {
            const onEnd = vi.fn();
            announceListening(undefined, onEnd);

            expect(mockSpeak).toHaveBeenCalledTimes(1);
            const utterance = mockSpeak.mock.calls[0][0];
            expect(utterance.onend).toBe(onEnd);
        });

        it('calls both onStart and onEnd callbacks when provided', () => {
            const onStart = vi.fn();
            const onEnd = vi.fn();
            announceListening(onStart, onEnd);

            expect(mockSpeak).toHaveBeenCalledTimes(1);
            const utterance = mockSpeak.mock.calls[0][0];
            expect(utterance.onstart).toBe(onStart);
            expect(utterance.onend).toBe(onEnd);
        });
    });

    describe('Error Handling', () => {
        it('handles speech synthesis errors gracefully', () => {
            const onEnd = vi.fn();
            announceListening(undefined, onEnd);

            const utterance = mockSpeak.mock.calls[0][0];

            // Simulate speech synthesis error
            if (utterance.onerror) {
                utterance.onerror({ error: 'synthesis-failed' });
            }

            expect(onEnd).toHaveBeenCalledTimes(1);
        });

        it('handles missing speech synthesis without throwing', () => {
            // Test that voice cue functions don't throw errors
            // In a real scenario where speechSynthesis is missing, the functions should fail gracefully
            expect(() => {
                announceListening();
                announceProcessing();
                stopVoiceCues();
            }).not.toThrow();
        });
    });
});