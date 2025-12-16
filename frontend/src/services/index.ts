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

// API Client exports
export { default as apiClient } from './ApiClient';
export {
    sendVoiceQuery,
    getSceneDescription,
    readText,
    findObject,
    triggerEmergency,
    textToSpeech,
    healthCheck,
    getOnlineStatus,
    getQueuedRequestCount,
    clearRequestQueue,
} from './ApiClient';

export type {
    VoiceQueryResponse,
    DetectedObject,
    SceneDescriptionResponse,
    ReadTextResponse,
    FindObjectResponse,
    EmergencyResponse,
    TTSResponse,
    ErrorResponse,
} from './ApiClient';