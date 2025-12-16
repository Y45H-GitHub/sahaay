/**
 * Services index file
 * Exports all frontend services for easy importing
 */

export {
    HapticFeedback,
    HAPTIC_PATTERNS,
    triggerListeningHaptic,
    triggerProcessingHaptic,
    triggerErrorHaptic,
    triggerEmergencyHaptic,
    stopHaptic,
    isHapticAvailable
} from './HapticFeedback';

export type { HapticPattern } from './HapticFeedback';