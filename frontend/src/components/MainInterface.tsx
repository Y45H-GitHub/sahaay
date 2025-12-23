import React, { useState, useCallback } from 'react';
import VoiceInputButton from './VoiceInputButton';
import CameraCapture from './CameraCapture';
import AudioPlayer from './AudioPlayer';
import {
    triggerProcessingHaptic,
    triggerErrorHaptic,
    triggerEmergencyHaptic
} from '../services/HapticFeedback';
import {
    announceError,
    announceSceneActivated,
    announceTextActivated,
    announceGeneralActivated,
    announceScanningStarted,
    announceScanningCancelled,
    announceEmergencyActivated,
    announceProcessing,
    announceSuccess
} from '../services/VoiceCues';
import apiClient from '../services/ApiClient';
import './MainInterface.css';

/**
 * MainInterface Component
 * 
 * Main interface for the Sahaay voice assistant with three action buttons,
 * language selector, and microphone button. Manages application state and
 * coordinates between child components.
 * 
 * Requirements covered:
 * - 7.3: Three large action buttons: "Describe Scene", "Read Text", "Ask Sahaay"
 * - 7.4: Microphone button at bottom of screen
 * - 7.6: Full-screen button sizes for accessibility
 * - 9.1, 9.2, 9.3: Language support (English, Hindi, Hinglish)
 * - 9.5: Language selector at top of screen
 */

export interface MainInterfaceProps {
    language: string;
    onLanguageChange: (lang: string) => void;
}

// Application state types
type AppState = 'idle' | 'recording' | 'processing' | 'playing' | 'scanning';
type ActionMode = 'scene' | 'text' | 'general' | 'finder' | null;

// Language options
const LANGUAGE_OPTIONS = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'Hindi' },
    { value: 'hinglish', label: 'Hinglish' }
];

const MainInterface: React.FC<MainInterfaceProps> = ({
    language,
    onLanguageChange
}) => {
    const [appState, setAppState] = useState<AppState>('idle');
    const [activeMode, setActiveMode] = useState<ActionMode>(null);
    const [audioUrl, setAudioUrl] = useState<string | undefined>();
    const [audioBase64, setAudioBase64] = useState<string | undefined>();
    const [error, setError] = useState<string | null>(null);
    const [targetObject, setTargetObject] = useState<string>('');
    const [scanningMessage, setScanningMessage] = useState<string>('');

    /**
     * Handle errors with haptic feedback and voice cues
     */
    const handleError = useCallback((error: Error, userMessage: string) => {
        console.error('MainInterface error:', error);
        setError(userMessage);
        setAppState('idle');
        setActiveMode(null);
        setTargetObject('');
        setScanningMessage('');
        triggerErrorHaptic();

        // Provide voice feedback for errors using VoiceCues service
        announceError(userMessage);

        // Clear error after 5 seconds
        setTimeout(() => {
            setError(null);
        }, 5000);
    }, []);

    /**
     * Handle scene description button press
     */
    const handleDescribeScene = useCallback(() => {
        if (appState !== 'idle') return;

        console.log('Describe Scene activated');
        setActiveMode('scene');
        setError(null);

        // Voice cue for scene description activation
        announceSceneActivated();
    }, [appState]);

    /**
     * Handle read text button press
     */
    const handleReadText = useCallback(() => {
        if (appState !== 'idle') return;

        console.log('Read Text activated');
        setActiveMode('text');
        setError(null);

        // Voice cue for text reading activation
        announceTextActivated();
    }, [appState]);

    /**
     * Cancel scanning mode
     */
    const cancelScanning = useCallback(() => {
        if (activeMode === 'finder' && appState === 'scanning') {
            setAppState('idle');
            setActiveMode(null);
            setTargetObject('');
            setScanningMessage('');

            // Provide voice feedback using VoiceCues service
            announceScanningCancelled();
        }
    }, [activeMode, appState]);
    const handleAskSahaay = useCallback(() => {
        if (appState !== 'idle') return;

        console.log('Ask Sahaay activated');
        setActiveMode('general');
        setError(null);

        // Voice cue for general questions activation
        announceGeneralActivated();
    }, [appState]);

    /**
     * Handle camera capture for scene description and text reading
     */
    const handleCameraCapture = useCallback(async (imageBlob: Blob) => {
        if (!activeMode) return;

        // Handle finder mode differently - continuous scanning
        if (activeMode === 'finder') {
            if (appState !== 'scanning') return;

            try {
                console.log(`Scanning for ${targetObject}:`, imageBlob);

                // Send image to find-object API
                const response = await apiClient.findObject(imageBlob, targetObject, language);

                console.log('Object finder response:', response);

                if (response.found) {
                    // Object found! Exit scanning mode and play guidance
                    setAppState('playing');
                    setScanningMessage('');

                    // Set audio for playback
                    if (response.audioUrl) {
                        setAudioUrl(response.audioUrl);
                        setAudioBase64(undefined);
                    } else {
                        // Fallback to browser TTS if no audio URL provided
                        if ('speechSynthesis' in window) {
                            const utterance = new SpeechSynthesisUtterance(response.message);
                            utterance.rate = 0.9;
                            utterance.volume = 1.0;

                            utterance.onstart = () => {
                                setAppState('playing');
                            };

                            utterance.onend = () => {
                                setAppState('idle');
                                setActiveMode(null);
                                setTargetObject('');
                            };

                            speechSynthesis.speak(utterance);
                            return;
                        }
                    }
                } else {
                    // Object not found, continue scanning
                    // Update scanning message occasionally to provide feedback
                    const messages = [
                        `Still looking for ${targetObject}...`,
                        `Scanning for ${targetObject}...`,
                        `Keep moving the camera to help me find ${targetObject}...`
                    ];
                    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                    setScanningMessage(randomMessage);
                }

            } catch (error) {
                handleError(error as Error, `Failed to scan for ${targetObject}. Please try again.`);
            }
            return;
        }

        // Handle scene description and text reading (single capture)
        if (activeMode !== 'scene' && activeMode !== 'text') return;

        setAppState('processing');
        triggerProcessingHaptic();

        // Voice cue for processing state
        announceProcessing();

        try {
            console.log(`Processing ${activeMode} image:`, imageBlob);

            if (activeMode === 'scene') {
                // Send image to scene description API
                const response = await apiClient.getSceneDescription(imageBlob, language);

                console.log('Scene description response:', response);

                // Set audio for playback
                if (response.audioUrl) {
                    setAudioUrl(response.audioUrl);
                    setAudioBase64(undefined);
                } else {
                    // Fallback to browser TTS if no audio URL provided
                    if ('speechSynthesis' in window) {
                        const utterance = new SpeechSynthesisUtterance(response.description);
                        utterance.rate = 0.9;
                        utterance.volume = 1.0;

                        utterance.onstart = () => {
                            setAppState('playing');
                        };

                        utterance.onend = () => {
                            setAppState('idle');
                            setActiveMode(null);
                            // Voice cue for successful completion
                            announceSuccess();
                        };

                        speechSynthesis.speak(utterance);
                        return;
                    }
                }
            } else if (activeMode === 'text') {
                // Send image to text reading API
                const response = await apiClient.readText(imageBlob, language);

                console.log('Text reading response:', response);

                // Set audio for playback
                if (response.audioUrl) {
                    setAudioUrl(response.audioUrl);
                    setAudioBase64(undefined);
                } else {
                    // Fallback to browser TTS if no audio URL provided
                    if ('speechSynthesis' in window) {
                        const utterance = new SpeechSynthesisUtterance(response.text);
                        utterance.rate = 0.9;
                        utterance.volume = 1.0;

                        utterance.onstart = () => {
                            setAppState('playing');
                        };

                        utterance.onend = () => {
                            setAppState('idle');
                            setActiveMode(null);
                            // Voice cue for successful completion
                            announceSuccess();
                        };

                        speechSynthesis.speak(utterance);
                        return;
                    }
                }
            }

        } catch (error) {
            handleError(error as Error, `Failed to process ${activeMode} image. Please try again.`);
        }
    }, [activeMode, language, handleError, appState, targetObject]);

    /**
     * Handle emergency trigger
     */
    const handleEmergencyTrigger = useCallback(async (transcript: string) => {
        console.log('🚨 Emergency triggered:', transcript);

        // Trigger emergency haptic feedback immediately
        triggerEmergencyHaptic();

        // Voice cue for emergency activation
        announceEmergencyActivated();

        // Set state to processing
        setAppState('processing');
        setActiveMode(null);
        setError(null);

        try {
            // Get current location if available
            let location: { latitude: number; longitude: number } | undefined;

            if ('geolocation' in navigator) {
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            timeout: 5000,
                            enableHighAccuracy: true,
                            maximumAge: 60000
                        });
                    });

                    location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };

                    console.log('Emergency location obtained:', location);
                } catch (locationError) {
                    console.warn('Could not get location for emergency:', locationError);
                    // Continue without location - emergency is more important
                }
            }

            // Send emergency notification to backend
            const response = await apiClient.triggerEmergency(location, language);

            console.log('Emergency response:', response);

            // Play urgent TTS confirmation
            if (response.audioUrl) {
                setAudioUrl(response.audioUrl);
                setAudioBase64(undefined);
            } else {
                // Fallback to browser TTS with urgent tone
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(response.message);
                    utterance.rate = 1.1; // Slightly faster for urgency
                    utterance.volume = 1.0;
                    utterance.pitch = 1.2; // Higher pitch for urgency

                    utterance.onstart = () => {
                        setAppState('playing');
                    };

                    utterance.onend = () => {
                        setAppState('idle');
                        setActiveMode(null);
                    };

                    speechSynthesis.speak(utterance);
                    return;
                }
            }

        } catch (error) {
            console.error('Emergency trigger failed:', error);

            // Even if emergency API fails, provide immediate voice feedback
            const fallbackMessage = 'Emergency mode activated. If this is a critical situation, please call emergency services immediately.';

            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(fallbackMessage);
                utterance.rate = 1.1;
                utterance.volume = 1.0;
                utterance.pitch = 1.2;

                utterance.onstart = () => {
                    setAppState('playing');
                };

                utterance.onend = () => {
                    setAppState('idle');
                    setActiveMode(null);
                };

                speechSynthesis.speak(utterance);
            } else {
                // If no TTS available, at least update the UI
                setError(fallbackMessage);
                setAppState('idle');
                setActiveMode(null);
            }
        }
    }, [language]);

    /**
     * Handle voice input transcript
     */
    const handleVoiceTranscript = useCallback(async (transcript: string) => {
        if (!transcript.trim()) return;

        // Check for emergency trigger FIRST - highest priority
        const normalizedTranscript = transcript.toLowerCase().trim();
        if (normalizedTranscript.includes('sahaay emergency') ||
            normalizedTranscript.includes('emergency')) {
            // Trigger emergency immediately, regardless of current mode
            await handleEmergencyTrigger(transcript);
            return;
        }

        // Handle cancel commands during scanning
        if (activeMode === 'finder' && appState === 'scanning') {
            const cancelWords = ['cancel', 'stop', 'quit', 'exit', 'done'];
            if (cancelWords.some(word => transcript.toLowerCase().includes(word))) {
                cancelScanning();
                return;
            }
        }

        // Only process voice queries when in general mode
        if (activeMode !== 'general') return;

        setAppState('processing');
        triggerProcessingHaptic();

        // Voice cue for processing state
        announceProcessing();

        try {
            console.log('Processing voice query:', transcript);

            // Send transcript directly to backend for processing
            // The backend will handle intent classification and response generation
            const response = await apiClient.sendTextQuery(transcript, language);

            console.log('Voice query response:', response);

            // Check if this is a finder intent
            if (response.intent === 'finder') {
                // Extract target object from response or transcript
                const objectMatch = transcript.toLowerCase().match(/(?:find|locate|where is|search for|look for)\s+(?:the\s+)?(.+)/);
                const extractedObject = objectMatch ? objectMatch[1].trim() : 'object';

                setTargetObject(extractedObject);
                setActiveMode('finder');
                setAppState('scanning');
                setScanningMessage(`Scanning for ${extractedObject}...`);

                // Provide voice feedback for starting scan using VoiceCues service
                announceScanningStarted(extractedObject);

                return;
            }

            // Set audio for playback if provided by backend
            if (response.audioUrl) {
                setAudioUrl(response.audioUrl);
                setAudioBase64(response.audioBase64);
            } else {
                // Fallback to browser TTS if no audio URL provided
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(response.response);
                    utterance.rate = 0.9;
                    utterance.volume = 1.0;

                    utterance.onstart = () => {
                        setAppState('playing');
                    };

                    utterance.onend = () => {
                        setAppState('idle');
                        setActiveMode(null);
                        // Voice cue for successful completion
                        announceSuccess();
                    };

                    speechSynthesis.speak(utterance);
                    return;
                }
            }

        } catch (error) {
            handleError(error as Error, 'Failed to process your question. Please try again.');
        }
    }, [activeMode, language, handleError, appState, cancelScanning, handleEmergencyTrigger]);

    /**
     * Handle voice input errors
     */
    const handleVoiceError = useCallback((error: Error) => {
        handleError(error, 'Voice input failed. Please try again.');
    }, [handleError]);

    /**
     * Handle audio playback start
     */
    const handleAudioPlayStart = useCallback(() => {
        setAppState('playing');
    }, []);

    /**
     * Handle audio playback end
     */
    const handleAudioPlayEnd = useCallback(() => {
        setAppState('idle');
        setActiveMode(null);
        setTargetObject('');
        setScanningMessage('');

        // Voice cue for successful completion
        announceSuccess();
    }, []);

    /**
     * Get button disabled state based on app state
     */
    const isButtonDisabled = (buttonMode: ActionMode) => {
        return appState !== 'idle' || (activeMode !== null && activeMode !== buttonMode);
    };

    /**
     * Get current state description for screen readers
     */
    const getStateDescription = () => {
        switch (appState) {
            case 'recording':
                return 'Recording voice input';
            case 'processing':
                return 'Processing request';
            case 'playing':
                return 'Playing audio response';
            case 'scanning':
                return scanningMessage || `Scanning for ${targetObject}`;
            default:
                return 'Ready for input';
        }
    };

    return (
        <div className="main-interface">
            {/* Language Selector at top */}
            <header className="main-interface-header">
                <div className="language-selector">
                    <label htmlFor="language-select" className="language-label">
                        Language:
                    </label>
                    <select
                        id="language-select"
                        value={language}
                        onChange={(e) => onLanguageChange(e.target.value)}
                        className="language-select"
                        disabled={appState !== 'idle'}
                    >
                        {LANGUAGE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="main-interface-content">
                {/* Three Action Buttons */}
                <div className="action-buttons">
                    <button
                        className={`action-button ${activeMode === 'scene' ? 'active' : ''}`}
                        onClick={handleDescribeScene}
                        disabled={isButtonDisabled('scene')}
                        aria-label="Describe what is in front of you using the camera"
                        aria-pressed={activeMode === 'scene'}
                    >
                        Describe Scene
                    </button>

                    <button
                        className={`action-button ${activeMode === 'text' ? 'active' : ''}`}
                        onClick={handleReadText}
                        disabled={isButtonDisabled('text')}
                        aria-label="Read text from an image using the camera"
                        aria-pressed={activeMode === 'text'}
                    >
                        Read Text
                    </button>

                    <button
                        className={`action-button ${activeMode === 'general' ? 'active' : ''}`}
                        onClick={handleAskSahaay}
                        disabled={isButtonDisabled('general')}
                        aria-label="Ask Sahaay a general question using voice"
                        aria-pressed={activeMode === 'general'}
                    >
                        Ask Sahaay
                    </button>
                </div>

                {/* Status Display */}
                <div className="status-display">
                    <div className="status-text">
                        {error ? (
                            <span className="error-text" role="alert">
                                {error}
                            </span>
                        ) : (
                            <span className="state-text">
                                {getStateDescription()}
                            </span>
                        )}
                    </div>
                </div>
            </main>

            {/* Microphone Button at bottom */}
            <footer className="main-interface-footer">
                <VoiceInputButton
                    onTranscript={handleVoiceTranscript}
                    onError={handleVoiceError}
                    language={language}
                    disabled={appState === 'processing' || appState === 'playing'}
                    className="main-microphone-button"
                />
            </footer>

            {/* Camera Capture Component */}
            <CameraCapture
                onCapture={handleCameraCapture}
                mode={activeMode === 'scene' ? 'scene' : activeMode === 'text' ? 'text' : activeMode === 'finder' ? 'finder' : 'scene'}
                continuous={activeMode === 'finder'}
                onError={(error) => handleError(error, 'Camera error occurred.')}
                isActive={activeMode === 'scene' || activeMode === 'text' || activeMode === 'finder'}
            />

            {/* Audio Player Component */}
            <AudioPlayer
                audioUrl={audioUrl}
                audioBase64={audioBase64}
                onPlayStart={handleAudioPlayStart}
                onPlayEnd={handleAudioPlayEnd}
                autoPlay={true}
            />

            {/* Status for screen readers */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
                Current state: {getStateDescription()}.
                Selected language: {LANGUAGE_OPTIONS.find(opt => opt.value === language)?.label}.
                {activeMode && `Active mode: ${activeMode}.`}
                {error && `Error: ${error}`}
            </div>
        </div>
    );
};

export default MainInterface;