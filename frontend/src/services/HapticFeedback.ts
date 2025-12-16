/**
 * HapticFeedback Service
 * 
 * Provides haptic feedback patterns for different application states.
 * Implements vibration API wrapper with graceful fallback for unsupported devices.
 * 
 * Requirements covered:
 * - 1.2: Recording start triggers haptic feedback
 * - 8.1: Voice input start provides short haptic pulse
 * - 8.2: Processing state triggers double haptic pulse
 * - 8.3: Error state triggers long haptic vibration
 * - 6.5: Emergency mode triggers long haptic vibration
 */

export interface HapticPattern {
    listening: number[];
    processing: number[];
    error: number[];
    emergency: number[];
}

/**
 * Haptic vibration patterns in milliseconds
 * - listening: Short single pulse for recording start
 * - processing: Double pulse for processing state
 * - error: Long vibration for errors
 * - emergency: Long vibration for emergency mode
 */
export const HAPTIC_PATTERNS: HapticPattern = {
    listening: [200], // Short pulse (200ms)
    processing: [150, 100, 150], // Double pulse (150ms, pause 100ms, 150ms)
    error: [500], // Long vibration (500ms)
    emergency: [800], // Extra long vibration for emergency (800ms)
};

/**
 * HapticFeedback service class
 */
export class HapticFeedback {
    private static isSupported: boolean | null = null;

    /**
     * Check if vibration API is supported by the device/browser
     */
    private static checkSupport(): boolean {
        if (this.isSupported !== null) {
            return this.isSupported;
        }

        this.isSupported = 'vibrate' in navigator && typeof navigator.vibrate === 'function';
        return this.isSupported;
    }

    /**
     * Trigger vibration with the given pattern
     * @param pattern - Array of vibration durations in milliseconds
     */
    private static vibrate(pattern: number[]): void {
        if (!this.checkSupport()) {
            console.warn('Haptic feedback not supported on this device');
            return;
        }

        try {
            navigator.vibrate(pattern);
        } catch (error) {
            console.error('Failed to trigger haptic feedback:', error);
        }
    }

    /**
     * Trigger haptic feedback for recording start (listening state)
     * Requirements: 1.2, 8.1
     */
    static triggerListening(): void {
        this.vibrate(HAPTIC_PATTERNS.listening);
    }

    /**
     * Trigger haptic feedback for processing state
     * Requirements: 8.2
     */
    static triggerProcessing(): void {
        this.vibrate(HAPTIC_PATTERNS.processing);
    }

    /**
     * Trigger haptic feedback for error state
     * Requirements: 8.3
     */
    static triggerError(): void {
        this.vibrate(HAPTIC_PATTERNS.error);
    }

    /**
     * Trigger haptic feedback for emergency mode
     * Requirements: 6.5
     */
    static triggerEmergency(): void {
        this.vibrate(HAPTIC_PATTERNS.emergency);
    }

    /**
     * Check if haptic feedback is available
     */
    static isAvailable(): boolean {
        return this.checkSupport();
    }

    /**
     * Stop any ongoing vibration
     */
    static stop(): void {
        if (this.checkSupport()) {
            try {
                navigator.vibrate(0);
            } catch (error) {
                console.error('Failed to stop haptic feedback:', error);
            }
        }
    }
}

// Export convenience functions for each pattern type
export const triggerListeningHaptic = () => HapticFeedback.triggerListening();
export const triggerProcessingHaptic = () => HapticFeedback.triggerProcessing();
export const triggerErrorHaptic = () => HapticFeedback.triggerError();
export const triggerEmergencyHaptic = () => HapticFeedback.triggerEmergency();
export const stopHaptic = () => HapticFeedback.stop();
export const isHapticAvailable = () => HapticFeedback.isAvailable();

export default HapticFeedback;