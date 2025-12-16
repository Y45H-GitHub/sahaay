import React, { useRef, useState, useCallback, useEffect } from 'react';
import { triggerListeningHaptic, triggerErrorHaptic } from '../services/HapticFeedback';
import './VoiceInputButton.css';

/**
 * VoiceInputButton Component
 * 
 * Provides voice input functionality with press-and-hold recording.
 * Integrates MediaRecorder API for audio capture and Web Speech API for STT.
 * 
 * Requirements covered:
 * - 1.1: Microphone button press initiates recording
 * - 1.2: Recording start triggers haptic feedback
 * - 1.3: Button release stops recording and sends audio
 */

export interface VoiceInputButtonProps {
    onTranscript: (text: string) => void;
    onError: (error: Error) => void;
    language: string;
    disabled?: boolean;
    className?: string;
}

export interface RecordingError extends Error {
    code: string;
    constraint?: string;
}

type RecordingState = 'idle' | 'requesting' | 'recording' | 'processing' | 'error';

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
    onTranscript,
    onError,
    language,
    disabled = false,
    className = ''
}) => {
    const [recordingState, setRecordingState] = useState<RecordingState>('idle');
    const [error, setError] = useState<string | null>(null);

    // Refs for managing recording
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recognitionRef = useRef<any>(null);
    const isRecordingRef = useRef(false);

    /**
     * Handle errors with haptic feedback and voice cues
     */
    const handleError = useCallback((error: Error, userMessage: string) => {
        console.error('Voice input error:', error);
        setError(userMessage);
        setRecordingState('error');
        triggerErrorHaptic();

        // Provide voice feedback for errors
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(userMessage);
            utterance.rate = 0.9;
            utterance.volume = 1.0;
            speechSynthesis.speak(utterance);
        }

        onError(error);

        // Reset to idle after error display
        setTimeout(() => {
            setRecordingState('idle');
            setError(null);
        }, 3000);
    }, [onError]);

    /**
     * Initialize Web Speech API for STT
     */
    const initializeSpeechRecognition = useCallback(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            return null;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        // Set language based on prop
        const langMap: Record<string, string> = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'hinglish': 'en-IN'
        };
        recognition.lang = langMap[language] || 'en-US';

        recognition.onresult = (event) => {
            if (event.results.length > 0) {
                const transcript = event.results[0][0].transcript;
                if (transcript.trim()) {
                    onTranscript(transcript.trim());
                    setRecordingState('idle');
                }
            }
        };

        recognition.onerror = (event) => {
            let errorMessage = 'Speech recognition failed';

            switch (event.error) {
                case 'no-speech':
                    errorMessage = 'No speech detected. Please try again.';
                    break;
                case 'audio-capture':
                    errorMessage = 'Microphone not accessible. Please check permissions.';
                    break;
                case 'not-allowed':
                    errorMessage = 'Microphone permission denied. Please allow access.';
                    break;
                case 'network':
                    errorMessage = 'Network error during speech recognition.';
                    break;
                case 'service-not-allowed':
                    errorMessage = 'Speech recognition service not available.';
                    break;
                default:
                    errorMessage = `Speech recognition error: ${event.error}`;
            }

            handleError(new Error(event.error), errorMessage);
        };

        recognition.onend = () => {
            if (isRecordingRef.current) {
                // Recognition ended while we're still supposed to be recording
                setRecordingState('idle');
                isRecordingRef.current = false;
            }
        };

        return recognition;
    }, [language, onTranscript, handleError]);

    /**
     * Initialize MediaRecorder for audio capture (fallback)
     */
    const initializeMediaRecorder = useCallback(async (): Promise<MediaRecorder | null> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            streamRef.current = stream;

            if (!MediaRecorder.isTypeSupported('audio/webm')) {
                throw new Error('Audio recording not supported');
            }

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm'
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                // For now, we'll primarily use Web Speech API
                // MediaRecorder is kept as fallback for future backend integration
                audioChunksRef.current = [];
            };

            return mediaRecorder;
        } catch (error) {
            handleError(error as Error, 'Failed to access microphone. Please check permissions.');
            return null;
        }
    }, [handleError]);

    /**
     * Start recording - triggered on button press
     */
    const startRecording = useCallback(async () => {
        if (disabled || recordingState !== 'idle') {
            return;
        }

        setRecordingState('requesting');
        setError(null);
        isRecordingRef.current = true;

        try {
            // Trigger haptic feedback for recording start
            triggerListeningHaptic();

            // Initialize speech recognition
            const recognition = initializeSpeechRecognition();
            if (recognition) {
                recognitionRef.current = recognition;
                recognition.start();
                setRecordingState('recording');
            } else {
                // Fallback to MediaRecorder if Speech Recognition not available
                const mediaRecorder = await initializeMediaRecorder();
                if (mediaRecorder) {
                    mediaRecorderRef.current = mediaRecorder;
                    mediaRecorder.start();
                    setRecordingState('recording');
                } else {
                    throw new Error('No recording method available');
                }
            }

        } catch (error) {
            isRecordingRef.current = false;
            handleError(error as Error, 'Failed to start recording. Please check microphone permissions.');
        }
    }, [disabled, recordingState, initializeSpeechRecognition, initializeMediaRecorder, handleError]);

    /**
     * Stop recording - triggered on button release
     */
    const stopRecording = useCallback(() => {
        if (!isRecordingRef.current || recordingState !== 'recording') {
            return;
        }

        isRecordingRef.current = false;
        setRecordingState('processing');

        try {
            // Stop speech recognition
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }

            // Stop media recorder
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }

            // Clean up media stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }

        } catch (error) {
            handleError(error as Error, 'Failed to stop recording.');
        }
    }, [recordingState, handleError]);

    /**
     * Handle mouse/touch events for press-and-hold
     */
    const handleMouseDown = useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        startRecording();
    }, [startRecording]);

    const handleMouseUp = useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        stopRecording();
    }, [stopRecording]);

    const handleTouchStart = useCallback((event: React.TouchEvent) => {
        event.preventDefault();
        startRecording();
    }, [startRecording]);

    const handleTouchEnd = useCallback((event: React.TouchEvent) => {
        event.preventDefault();
        stopRecording();
    }, [stopRecording]);

    /**
     * Handle keyboard events for accessibility
     */
    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            if (recordingState === 'idle') {
                startRecording();
            }
        }
    }, [recordingState, startRecording]);

    const handleKeyUp = useCallback((event: React.KeyboardEvent) => {
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            stopRecording();
        }
    }, [stopRecording]);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    /**
     * Get button text based on state
     */
    const getButtonText = () => {
        switch (recordingState) {
            case 'requesting':
                return 'Starting...';
            case 'recording':
                return 'Recording... (Release to stop)';
            case 'processing':
                return 'Processing...';
            case 'error':
                return 'Error - Try Again';
            default:
                return '🎤';
        }
    };

    /**
     * Get ARIA label based on state
     */
    const getAriaLabel = () => {
        switch (recordingState) {
            case 'requesting':
                return 'Starting voice recording';
            case 'recording':
                return 'Recording voice input. Release button to stop recording.';
            case 'processing':
                return 'Processing voice input';
            case 'error':
                return `Voice input error: ${error}. Press to try again.`;
            default:
                return 'Press and hold to record voice input';
        }
    };

    return (
        <div className="voice-input-container">
            {/* Status for screen readers */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
                Voice input status: {recordingState}
                {error && `. Error: ${error}`}
            </div>

            {/* Main microphone button */}
            <button
                className={`voice-input-button ${className} ${recordingState}`}
                disabled={disabled}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={stopRecording} // Stop if mouse leaves button
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                aria-label={getAriaLabel()}
                aria-pressed={recordingState === 'recording'}
                role="button"
                tabIndex={0}
            >
                <span className="button-text">{getButtonText()}</span>
            </button>

            {/* Error display */}
            {error && recordingState === 'error' && (
                <div className="voice-input-error" role="alert" aria-live="assertive">
                    {error}
                </div>
            )}

            {/* Instructions for users */}
            <div className="voice-input-instructions">
                <p>Press and hold to record, release to stop</p>
            </div>
        </div>
    );
};

export default VoiceInputButton;