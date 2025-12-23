/**
 * VoiceCues Service
 * 
 * Provides voice feedback for application state changes.
 * Integrates with browser's Speech Synthesis API and backend TTS service.
 * 
 * Requirements covered:
 * - 8.4: State changes trigger voice cues via TTS
 */

export interface VoiceCueConfig {
    rate: number;
    volume: number;
    pitch: number;
}

export interface StateMessages {
    listening: string;
    processing: string;
    success: string;
    error: string;
    sceneActivated: string;
    textActivated: string;
    generalActivated: string;
    scanningStarted: string;
    scanningCancelled: string;
    emergencyActivated: string;
}

/**
 * Voice cue messages for different application states
 */
export const VOICE_CUE_MESSAGES: StateMessages = {
    listening: 'Listening...',
    processing: 'Processing your request...',
    success: 'Request completed successfully.',
    error: 'An error occurred. Please try again.',
    sceneActivated: 'Scene description activated. Point camera at what you want described.',
    textActivated: 'Text reading activated. Point camera at text you want read aloud.',
    generalActivated: 'Ready to answer your question. Press and hold the microphone to speak.',
    scanningStarted: 'Starting object scan. Move your camera around to help me find it.',
    scanningCancelled: 'Scanning cancelled.',
    emergencyActivated: 'Emergency mode activated. Help is being notified.'
};

/**
 * Default voice configuration
 */
export const DEFAULT_VOICE_CONFIG: VoiceCueConfig = {
    rate: 0.9,
    volume: 1.0,
    pitch: 1.0
};

/**
 * Emergency voice configuration (more urgent)
 */
export const EMERGENCY_VOICE_CONFIG: VoiceCueConfig = {
    rate: 1.1,
    volume: 1.0,
    pitch: 1.2
};

/**
 * VoiceCues service class
 */
export class VoiceCues {
    private static isSupported: boolean | null = null;
    private static currentUtterance: SpeechSynthesisUtterance | null = null;

    /**
     * Check if speech synthesis is supported
     */
    private static checkSupport(): boolean {
        if (this.isSupported !== null) {
            return this.isSupported;
        }

        this.isSupported = 'speechSynthesis' in window && typeof window.speechSynthesis.speak === 'function';
        return this.isSupported;
    }

    /**
     * Speak a message using browser's speech synthesis
     */
    private static speak(
        message: string,
        config: VoiceCueConfig = DEFAULT_VOICE_CONFIG,
        onStart?: () => void,
        onEnd?: () => void
    ): void {
        if (!this.checkSupport()) {
            console.warn('Speech synthesis not supported');
            return;
        }

        try {
            // Cancel any ongoing speech
            this.stop();

            const utterance = new SpeechSynthesisUtterance(message);
            utterance.rate = config.rate;
            utterance.volume = config.volume;
            utterance.pitch = config.pitch;

            if (onStart) {
                utterance.onstart = onStart;
            }

            if (onEnd) {
                utterance.onend = onEnd;
            }

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event.error);
                if (onEnd) {
                    onEnd();
                }
            };

            this.currentUtterance = utterance;
            window.speechSynthesis.speak(utterance);

        } catch (error) {
            console.error('Failed to speak voice cue:', error);
            if (onEnd) {
                onEnd();
            }
        }
    }

    /**
     * Stop any ongoing speech
     */
    static stop(): void {
        if (this.checkSupport()) {
            try {
                window.speechSynthesis.cancel();
                this.currentUtterance = null;
            } catch (error) {
                console.error('Failed to stop speech synthesis:', error);
            }
        }
    }

    /**
     * Voice cue for listening state (recording started)
     */
    static announceListening(onStart?: () => void, onEnd?: () => void): void {
        this.speak(VOICE_CUE_MESSAGES.listening, DEFAULT_VOICE_CONFIG, onStart, onEnd);
    }

    /**
     * Voice cue for processing state
     */
    static announceProcessing(onStart?: () => void, onEnd?: () => void): void {
        this.speak(VOICE_CUE_MESSAGES.processing, DEFAULT_VOICE_CONFIG, onStart, onEnd);
    }

    /**
     * Voice cue for success state
     */
    static announceSuccess(onStart?: () => void, onEnd?: () => void): void {
        this.speak(VOICE_CUE_MESSAGES.success, DEFAULT_VOICE_CONFIG, onStart, onEnd);
    }

    /**
     * Voice cue for error state
     */
    static announceError(errorMessage?: string, onStart?: () => void, onEnd?: () => void): void {
        const message = errorMessage || VOICE_CUE_MESSAGES.error;
        this.speak(message, DEFAULT_VOICE_CONFIG, onStart, onEnd);
    }

    /**
     * Voice cue for scene description activation
     */
    static announceSceneActivated(onStart?: () => void, onEnd?: () => void): void {
        this.speak(VOICE_CUE_MESSAGES.sceneActivated, DEFAULT_VOICE_CONFIG, onStart, onEnd);
    }

    /**
     * Voice cue for text reading activation
     */
    static announceTextActivated(onStart?: () => void, onEnd?: () => void): void {
        this.speak(VOICE_CUE_MESSAGES.textActivated, DEFAULT_VOICE_CONFIG, onStart, onEnd);
    }

    /**
     * Voice cue for general question activation
     */
    static announceGeneralActivated(onStart?: () => void, onEnd?: () => void): void {
        this.speak(VOICE_CUE_MESSAGES.generalActivated, DEFAULT_VOICE_CONFIG, onStart, onEnd);
    }

    /**
     * Voice cue for object scanning started
     */
    static announceScanningStarted(objectName: string, onStart?: () => void, onEnd?: () => void): void {
        const message = `Starting to scan for ${objectName}. Move your camera around to help me find it. Say "cancel" to stop scanning.`;
        this.speak(message, DEFAULT_VOICE_CONFIG, onStart, onEnd);
    }

    /**
     * Voice cue for scanning cancelled
     */
    static announceScanningCancelled(onStart?: () => void, onEnd?: () => void): void {
        this.speak(VOICE_CUE_MESSAGES.scanningCancelled, DEFAULT_VOICE_CONFIG, onStart, onEnd);
    }

    /**
     * Voice cue for emergency activation (urgent tone)
     */
    static announceEmergencyActivated(onStart?: () => void, onEnd?: () => void): void {
        this.speak(VOICE_CUE_MESSAGES.emergencyActivated, EMERGENCY_VOICE_CONFIG, onStart, onEnd);
    }

    /**
     * Custom voice cue with specified message and config
     */
    static announceCustom(
        message: string,
        config: VoiceCueConfig = DEFAULT_VOICE_CONFIG,
        onStart?: () => void,
        onEnd?: () => void
    ): void {
        this.speak(message, config, onStart, onEnd);
    }

    /**
     * Check if voice cues are available
     */
    static isAvailable(): boolean {
        return this.checkSupport();
    }

    /**
     * Check if currently speaking
     */
    static isSpeaking(): boolean {
        if (!this.checkSupport()) {
            return false;
        }
        return window.speechSynthesis.speaking;
    }

    /**
     * Get available voices (for future language support)
     */
    static getAvailableVoices(): SpeechSynthesisVoice[] {
        if (!this.checkSupport()) {
            return [];
        }
        return window.speechSynthesis.getVoices();
    }
}

// Export convenience functions for each voice cue type
export const announceListening = (onStart?: () => void, onEnd?: () => void) =>
    VoiceCues.announceListening(onStart, onEnd);

export const announceProcessing = (onStart?: () => void, onEnd?: () => void) =>
    VoiceCues.announceProcessing(onStart, onEnd);

export const announceSuccess = (onStart?: () => void, onEnd?: () => void) =>
    VoiceCues.announceSuccess(onStart, onEnd);

export const announceError = (errorMessage?: string, onStart?: () => void, onEnd?: () => void) =>
    VoiceCues.announceError(errorMessage, onStart, onEnd);

export const announceSceneActivated = (onStart?: () => void, onEnd?: () => void) =>
    VoiceCues.announceSceneActivated(onStart, onEnd);

export const announceTextActivated = (onStart?: () => void, onEnd?: () => void) =>
    VoiceCues.announceTextActivated(onStart, onEnd);

export const announceGeneralActivated = (onStart?: () => void, onEnd?: () => void) =>
    VoiceCues.announceGeneralActivated(onStart, onEnd);

export const announceScanningStarted = (objectName: string, onStart?: () => void, onEnd?: () => void) =>
    VoiceCues.announceScanningStarted(objectName, onStart, onEnd);

export const announceScanningCancelled = (onStart?: () => void, onEnd?: () => void) =>
    VoiceCues.announceScanningCancelled(onStart, onEnd);

export const announceEmergencyActivated = (onStart?: () => void, onEnd?: () => void) =>
    VoiceCues.announceEmergencyActivated(onStart, onEnd);

export const announceCustom = (
    message: string,
    config?: VoiceCueConfig,
    onStart?: () => void,
    onEnd?: () => void
) => VoiceCues.announceCustom(message, config, onStart, onEnd);

export const stopVoiceCues = () => VoiceCues.stop();
export const isVoiceCuesAvailable = () => VoiceCues.isAvailable();
export const isVoiceCuesSpeaking = () => VoiceCues.isSpeaking();

export default VoiceCues;