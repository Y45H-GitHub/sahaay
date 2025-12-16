import React, { useRef, useEffect, useState } from 'react';
import { triggerErrorHaptic } from '../services/HapticFeedback';
import './CameraCapture.css';

/**
 * CameraCapture Component
 * 
 * Provides camera access and image capture functionality for the Sahaay voice assistant.
 * Supports both single frame capture and continuous capture modes.
 * 
 * Requirements covered:
 * - 2.1: Action button activation captures camera frame
 * - 3.1: Read Text button captures camera frame
 * - 5.2: Scanning mode captures frames continuously
 */

export interface CameraCaptureProps {
    onCapture: (imageBlob: Blob) => void;
    mode: 'scene' | 'text' | 'finder';
    continuous?: boolean;
    onError?: (error: Error) => void;
    isActive?: boolean;
}

export interface CameraError extends Error {
    code: string;
    constraint?: string;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
    onCapture,
    mode,
    continuous = false,
    onError,
    isActive = false
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<number | null>(null);

    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Handle camera errors with voice feedback
     */
    const handleError = (error: Error, userMessage: string) => {
        console.error('Camera error:', error);
        setError(userMessage);
        triggerErrorHaptic();

        // Provide voice feedback for camera errors
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(userMessage);
            utterance.rate = 0.9;
            utterance.volume = 1.0;
            speechSynthesis.speak(utterance);
        }

        if (onError) {
            onError(error);
        }
    };

    /**
     * Request camera permissions and initialize video stream
     */
    const initializeCamera = async () => {
        try {
            setError(null);

            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera access not supported by this browser');
            }

            // Request camera permission with appropriate constraints
            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: 'environment', // Use back camera for better scene capture
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            setHasPermission(true);

        } catch (error) {
            setHasPermission(false);

            if (error instanceof Error) {
                const err = error as any;

                // Handle specific camera errors
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    handleError(error, 'Camera permission denied. Please allow camera access to use this feature.');
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    handleError(error, 'No camera found on this device.');
                } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                    handleError(error, 'Camera is already in use by another application.');
                } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
                    handleError(error, 'Camera does not support the required settings.');
                } else {
                    handleError(error, 'Failed to access camera. Please check your device settings.');
                }
            }
        }
    };

    /**
     * Capture a single frame from the video stream
     */
    const captureFrame = async (): Promise<Blob | null> => {
        if (!videoRef.current || !canvasRef.current || !streamRef.current) {
            return null;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) {
            handleError(new Error('Canvas context not available'), 'Failed to capture image.');
            return null;
        }

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    handleError(new Error('Failed to create image blob'), 'Failed to capture image.');
                    resolve(null);
                }
            }, 'image/jpeg', 0.8); // Use JPEG with 80% quality for good balance of size/quality
        });
    };

    /**
     * Capture single frame and call onCapture callback
     */
    const captureSingleFrame = async () => {
        if (isCapturing) return;

        setIsCapturing(true);

        try {
            const blob = await captureFrame();
            if (blob) {
                onCapture(blob);
            }
        } catch (error) {
            handleError(error as Error, 'Failed to capture image.');
        } finally {
            setIsCapturing(false);
        }
    };

    /**
     * Start continuous capture mode for object finder
     */
    const startContinuousCapture = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        setIsCapturing(true);

        // Capture frames every 500ms for object finder
        intervalRef.current = setInterval(async () => {
            try {
                const blob = await captureFrame();
                if (blob) {
                    onCapture(blob);
                }
            } catch (error) {
                handleError(error as Error, 'Failed to capture frame during scanning.');
            }
        }, 500);
    };

    /**
     * Stop continuous capture mode
     */
    const stopContinuousCapture = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsCapturing(false);
    };

    /**
     * Clean up camera resources
     */
    const cleanup = () => {
        stopContinuousCapture();

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setHasPermission(null);
    };

    // Initialize camera when component becomes active
    useEffect(() => {
        if (isActive && hasPermission === null) {
            initializeCamera();
        } else if (!isActive) {
            cleanup();
        }

        return cleanup;
    }, [isActive]);

    // Auto-capture for scene and text modes when camera is ready
    useEffect(() => {
        if (isActive && hasPermission === true && !continuous && (mode === 'scene' || mode === 'text')) {
            // Small delay to ensure video is ready
            const timer = setTimeout(() => {
                captureSingleFrame();
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [isActive, hasPermission, continuous, mode]);

    // Handle continuous vs single capture mode
    useEffect(() => {
        if (!isActive || hasPermission !== true) return;

        if (continuous && mode === 'finder') {
            startContinuousCapture();
        } else {
            stopContinuousCapture();
        }

        return stopContinuousCapture;
    }, [continuous, mode, isActive, hasPermission]);

    if (!isActive) {
        return null;
    }

    return (
        <div className="camera-capture">
            {/* Hidden video element for camera stream */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ display: 'none' }}
                aria-hidden="true"
            />

            {/* Hidden canvas for frame capture */}
            <canvas
                ref={canvasRef}
                style={{ display: 'none' }}
                aria-hidden="true"
            />

            {/* Status indicators for screen readers */}
            <div className="sr-only" aria-live="polite">
                {hasPermission === null && 'Requesting camera access...'}
                {hasPermission === false && 'Camera access denied or unavailable.'}
                {hasPermission === true && !isCapturing && 'Camera ready.'}
                {hasPermission === true && isCapturing && continuous && 'Scanning for objects...'}
                {hasPermission === true && isCapturing && !continuous && 'Capturing image...'}
                {error && `Camera error: ${error}`}
            </div>

            {/* Manual capture button for testing (hidden in production) */}
            {import.meta.env.DEV && hasPermission === true && (
                <button
                    onClick={captureSingleFrame}
                    disabled={isCapturing}
                    style={{
                        position: 'fixed',
                        bottom: '100px',
                        right: '20px',
                        zIndex: 1000,
                        padding: '10px',
                        backgroundColor: '#333',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px'
                    }}
                >
                    {isCapturing ? 'Capturing...' : 'Test Capture'}
                </button>
            )}
        </div>
    );
};

export default CameraCapture;