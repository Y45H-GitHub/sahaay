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

// Voice Cues exports
export {
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

export type { VoiceCueConfig, StateMessages } from './VoiceCues';

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