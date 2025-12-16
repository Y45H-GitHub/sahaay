import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AudioPlayer from './AudioPlayer'

// Mock HTMLAudioElement
const mockPlay = vi.fn()
const mockPause = vi.fn()
const mockLoad = vi.fn()

Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
    writable: true,
    value: mockPlay,
})

Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
    writable: true,
    value: mockPause,
})

Object.defineProperty(window.HTMLMediaElement.prototype, 'load', {
    writable: true,
    value: mockLoad,
})

describe('AudioPlayer', () => {
    const mockOnPlayStart = vi.fn()
    const mockOnPlayEnd = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        mockPlay.mockResolvedValue(undefined)
    })

    it('renders nothing when no audio source is provided', () => {
        const { container } = render(
            <AudioPlayer
                onPlayStart={mockOnPlayStart}
                onPlayEnd={mockOnPlayEnd}
                autoPlay={false}
            />
        )

        expect(container.firstChild).toBeNull()
    })

    it('renders audio player when audioUrl is provided', () => {
        render(
            <AudioPlayer
                audioUrl="test-audio.mp3"
                onPlayStart={mockOnPlayStart}
                onPlayEnd={mockOnPlayEnd}
                autoPlay={false}
            />
        )

        expect(screen.getByRole('region', { name: /audio player/i })).toBeInTheDocument()
    })

    it('renders audio player when audioBase64 is provided', () => {
        render(
            <AudioPlayer
                audioBase64="data:audio/mp3;base64,SGVsbG8gV29ybGQ="
                onPlayStart={mockOnPlayStart}
                onPlayEnd={mockOnPlayEnd}
                autoPlay={false}
            />
        )

        expect(screen.getByRole('region', { name: /audio player/i })).toBeInTheDocument()
    })

    it('shows manual controls when autoPlay is false', async () => {
        render(
            <AudioPlayer
                audioUrl="test-audio.mp3"
                onPlayStart={mockOnPlayStart}
                onPlayEnd={mockOnPlayEnd}
                autoPlay={false}
            />
        )

        // Simulate audio can play event to exit loading state
        const audio = document.querySelector('audio')
        if (audio) {
            fireEvent.canPlay(audio)
        }

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /play audio/i })).toBeInTheDocument()
        })
    })

    it('does not show manual controls when autoPlay is true', () => {
        render(
            <AudioPlayer
                audioUrl="test-audio.mp3"
                onPlayStart={mockOnPlayStart}
                onPlayEnd={mockOnPlayEnd}
                autoPlay={true}
            />
        )

        expect(screen.queryByRole('button', { name: /play audio/i })).not.toBeInTheDocument()
    })

    it('calls onPlayStart when audio starts playing', async () => {
        render(
            <AudioPlayer
                audioUrl="test-audio.mp3"
                onPlayStart={mockOnPlayStart}
                onPlayEnd={mockOnPlayEnd}
                autoPlay={false}
            />
        )

        // Simulate audio can play event to exit loading state
        const audio = document.querySelector('audio')
        if (audio) {
            fireEvent.canPlay(audio)
        }

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /play audio/i })).toBeInTheDocument()
        })

        const playButton = screen.getByRole('button', { name: /play audio/i })
        fireEvent.click(playButton)

        // Simulate audio play event
        if (audio) {
            fireEvent.play(audio)
        }

        await waitFor(() => {
            expect(mockOnPlayStart).toHaveBeenCalledTimes(1)
        })
    })

    it('calls onPlayEnd when audio ends', async () => {
        render(
            <AudioPlayer
                audioUrl="test-audio.mp3"
                onPlayStart={mockOnPlayStart}
                onPlayEnd={mockOnPlayEnd}
                autoPlay={false}
            />
        )

        // Simulate audio ended event
        const audio = document.querySelector('audio')
        if (audio) {
            fireEvent.ended(audio)
        }

        await waitFor(() => {
            expect(mockOnPlayEnd).toHaveBeenCalledTimes(1)
        })
    })

    it('handles base64 audio data correctly', () => {
        const base64Data = 'SGVsbG8gV29ybGQ='

        render(
            <AudioPlayer
                audioBase64={base64Data}
                onPlayStart={mockOnPlayStart}
                onPlayEnd={mockOnPlayEnd}
                autoPlay={false}
            />
        )

        const audio = document.querySelector('audio')
        expect(audio?.src).toBe(`data:audio/mpeg;base64,${base64Data}`)
    })

    it('handles data URL base64 audio correctly', () => {
        const dataUrl = 'data:audio/wav;base64,SGVsbG8gV29ybGQ='

        render(
            <AudioPlayer
                audioBase64={dataUrl}
                onPlayStart={mockOnPlayStart}
                onPlayEnd={mockOnPlayEnd}
                autoPlay={false}
            />
        )

        const audio = document.querySelector('audio')
        expect(audio?.src).toBe(dataUrl)
    })

    it('displays loading state', () => {
        render(
            <AudioPlayer
                audioUrl="test-audio.mp3"
                onPlayStart={mockOnPlayStart}
                onPlayEnd={mockOnPlayEnd}
                autoPlay={false}
            />
        )

        // Simulate loading state by triggering loadstart event
        const audio = document.querySelector('audio')
        if (audio) {
            fireEvent.loadStart(audio)
        }

        expect(screen.getByText(/loading audio/i)).toBeInTheDocument()
    })

    it('displays error state when audio fails to load', () => {
        render(
            <AudioPlayer
                audioUrl="invalid-audio.mp3"
                onPlayStart={mockOnPlayStart}
                onPlayEnd={mockOnPlayEnd}
                autoPlay={false}
            />
        )

        // Simulate error
        const audio = document.querySelector('audio')
        if (audio) {
            const errorEvent = new Event('error')
            Object.defineProperty(errorEvent, 'target', {
                value: { error: { message: 'Network error' } }
            })
            fireEvent(audio, errorEvent)
        }

        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getAllByText(/audio error/i)).toHaveLength(2) // One in alert, one in screen reader text
    })

    it('provides accessibility features', async () => {
        render(
            <AudioPlayer
                audioUrl="test-audio.mp3"
                onPlayStart={mockOnPlayStart}
                onPlayEnd={mockOnPlayEnd}
                autoPlay={false}
            />
        )

        // Check for ARIA labels and roles
        expect(screen.getByRole('region', { name: /audio player/i })).toBeInTheDocument()

        // Simulate audio can play event to exit loading state
        const audio = document.querySelector('audio')
        if (audio) {
            fireEvent.canPlay(audio)
        }

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /play audio/i })).toBeInTheDocument()
        })

        // Check for screen reader content
        expect(screen.getByText(/audio player status/i)).toBeInTheDocument()
    })
})