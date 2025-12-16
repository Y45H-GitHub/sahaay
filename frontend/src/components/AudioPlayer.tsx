import { useEffect, useRef, useState } from 'react'
import './AudioPlayer.css'

interface AudioPlayerProps {
    audioUrl?: string;
    audioBase64?: string;
    onPlayStart: () => void;
    onPlayEnd: () => void;
    autoPlay: boolean;
}

type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'

const AudioPlayer: React.FC<AudioPlayerProps> = ({
    audioUrl,
    audioBase64,
    onPlayStart,
    onPlayEnd,
    autoPlay
}) => {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [playbackState, setPlaybackState] = useState<PlaybackState>('idle')
    const [error, setError] = useState<string | null>(null)

    // Reset state when audio source changes
    useEffect(() => {
        setPlaybackState('idle')
        setError(null)
    }, [audioUrl, audioBase64])

    // Handle audio source setup and auto-play
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        // Clear previous source
        audio.src = ''
        audio.load()

        // Set new audio source
        if (audioUrl) {
            setPlaybackState('loading')
            audio.src = audioUrl
        } else if (audioBase64) {
            setPlaybackState('loading')
            // Handle base64 audio data
            const mimeType = audioBase64.startsWith('data:')
                ? audioBase64.split(';')[0].split(':')[1]
                : 'audio/mpeg' // default to mp3

            if (audioBase64.startsWith('data:')) {
                audio.src = audioBase64
            } else {
                audio.src = `data:${mimeType};base64,${audioBase64}`
            }
        } else {
            setPlaybackState('idle')
            return
        }

        // Auto-play if enabled
        if (autoPlay) {
            const playPromise = audio.play()
            if (playPromise !== undefined) {
                playPromise.catch((err) => {
                    console.error('Auto-play failed:', err)
                    setError('Auto-play failed. User interaction may be required.')
                    setPlaybackState('error')
                })
            }
        }
    }, [audioUrl, audioBase64, autoPlay])

    // Audio event handlers
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleLoadStart = () => {
            setPlaybackState('loading')
            setError(null)
        }

        const handleCanPlay = () => {
            if (playbackState === 'loading') {
                setPlaybackState('idle')
            }
        }

        const handlePlay = () => {
            setPlaybackState('playing')
            onPlayStart()
        }

        const handlePause = () => {
            if (playbackState === 'playing') {
                setPlaybackState('paused')
            }
        }

        const handleEnded = () => {
            setPlaybackState('ended')
            onPlayEnd()
        }

        const handleError = (event: Event) => {
            const target = event.target as HTMLAudioElement
            const errorMessage = target.error
                ? `Audio error: ${target.error.message}`
                : 'Unknown audio error occurred'

            setError(errorMessage)
            setPlaybackState('error')
            console.error('Audio playback error:', target.error)
        }

        const handleLoadedData = () => {
            setError(null)
        }

        // Add event listeners
        audio.addEventListener('loadstart', handleLoadStart)
        audio.addEventListener('canplay', handleCanPlay)
        audio.addEventListener('play', handlePlay)
        audio.addEventListener('pause', handlePause)
        audio.addEventListener('ended', handleEnded)
        audio.addEventListener('error', handleError)
        audio.addEventListener('loadeddata', handleLoadedData)

        // Cleanup
        return () => {
            audio.removeEventListener('loadstart', handleLoadStart)
            audio.removeEventListener('canplay', handleCanPlay)
            audio.removeEventListener('play', handlePlay)
            audio.removeEventListener('pause', handlePause)
            audio.removeEventListener('ended', handleEnded)
            audio.removeEventListener('error', handleError)
            audio.removeEventListener('loadeddata', handleLoadedData)
        }
    }, [playbackState, onPlayStart, onPlayEnd])

    // Manual play function
    const handlePlay = async () => {
        const audio = audioRef.current
        if (!audio) return

        try {
            await audio.play()
        } catch (err) {
            console.error('Manual play failed:', err)
            setError('Playback failed')
            setPlaybackState('error')
        }
    }

    // Manual pause function
    const handlePause = () => {
        const audio = audioRef.current
        if (!audio) return

        audio.pause()
    }

    // Manual stop function
    const handleStop = () => {
        const audio = audioRef.current
        if (!audio) return

        audio.pause()
        audio.currentTime = 0
        setPlaybackState('idle')
    }

    // Don't render anything if no audio source
    if (!audioUrl && !audioBase64) {
        return null
    }

    return (
        <div className="audio-player" role="region" aria-label="Audio Player">
            <audio
                ref={audioRef}
                preload="auto"
                style={{ display: 'none' }}
                aria-hidden="true"
            />

            {/* Status for screen readers */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
                Audio player status: {playbackState}
                {error && `. Error: ${error}`}
            </div>

            {/* Loading indicator */}
            {playbackState === 'loading' && (
                <div className="audio-loading" aria-label="Loading audio">
                    Loading audio...
                </div>
            )}

            {/* Error display */}
            {playbackState === 'error' && error && (
                <div className="audio-error" role="alert" aria-label={`Audio error: ${error}`}>
                    Audio Error: {error}
                </div>
            )}

            {/* Manual controls (for accessibility and fallback) */}
            {!autoPlay && (audioUrl || audioBase64) && (
                <div className="audio-controls">
                    {playbackState === 'idle' || playbackState === 'paused' || playbackState === 'ended' ? (
                        <button
                            onClick={handlePlay}
                            className="audio-control-button"
                            aria-label="Play audio"
                            disabled={false}
                        >
                            ▶️ Play
                        </button>
                    ) : playbackState === 'playing' ? (
                        <button
                            onClick={handlePause}
                            className="audio-control-button"
                            aria-label="Pause audio"
                        >
                            ⏸️ Pause
                        </button>
                    ) : null}

                    {(playbackState === 'playing' || playbackState === 'paused') && (
                        <button
                            onClick={handleStop}
                            className="audio-control-button"
                            aria-label="Stop audio"
                        >
                            ⏹️ Stop
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

export default AudioPlayer