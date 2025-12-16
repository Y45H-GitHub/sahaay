import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CameraCapture from './CameraCapture'

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn()
const mockStream = {
    getTracks: vi.fn(() => [{ stop: vi.fn() }])
}

Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    value: {
        getUserMedia: mockGetUserMedia
    }
})

// Mock HTMLVideoElement
Object.defineProperty(HTMLVideoElement.prototype, 'play', {
    writable: true,
    value: vi.fn().mockResolvedValue(undefined)
})

// Mock HTMLCanvasElement
const mockToBlob = vi.fn()
const mockGetContext = vi.fn(() => ({
    drawImage: vi.fn()
}))

Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
    writable: true,
    value: mockToBlob
})

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    writable: true,
    value: mockGetContext
})

// Mock speechSynthesis and SpeechSynthesisUtterance
Object.defineProperty(window, 'speechSynthesis', {
    writable: true,
    value: {
        speak: vi.fn()
    }
})

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    writable: true,
    value: function (text) {
        return {
            text,
            rate: 1,
            volume: 1
        }
    }
})

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
    writable: true,
    value: vi.fn()
})

describe('CameraCapture', () => {
    const mockOnCapture = vi.fn()
    const mockOnError = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        mockGetUserMedia.mockResolvedValue(mockStream)
        mockToBlob.mockImplementation((callback) => {
            callback(new Blob(['test'], { type: 'image/jpeg' }))
        })
    })

    it('renders nothing when not active', () => {
        const { container } = render(
            <CameraCapture
                onCapture={mockOnCapture}
                mode="scene"
                isActive={false}
            />
        )

        expect(container.firstChild).toBeNull()
    })

    it('renders camera capture component when active', () => {
        render(
            <CameraCapture
                onCapture={mockOnCapture}
                mode="scene"
                isActive={true}
            />
        )

        expect(screen.getByText(/requesting camera access/i)).toBeInTheDocument()
    })

    it('requests camera permissions when activated', async () => {
        render(
            <CameraCapture
                onCapture={mockOnCapture}
                mode="scene"
                isActive={true}
            />
        )

        await waitFor(() => {
            expect(mockGetUserMedia).toHaveBeenCalledWith({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            })
        })
    })

    it('shows camera ready status when permission granted', async () => {
        render(
            <CameraCapture
                onCapture={mockOnCapture}
                mode="scene"
                isActive={true}
            />
        )

        await waitFor(() => {
            expect(screen.getByText(/camera ready/i)).toBeInTheDocument()
        })
    })

    it('handles camera permission denied error', async () => {
        const permissionError = new Error('Permission denied')
        permissionError.name = 'NotAllowedError'
        mockGetUserMedia.mockRejectedValue(permissionError)

        render(
            <CameraCapture
                onCapture={mockOnCapture}
                mode="scene"
                isActive={true}
                onError={mockOnError}
            />
        )

        await waitFor(() => {
            expect(screen.getByText(/camera permission denied/i)).toBeInTheDocument()
        })
    })

    it('handles camera not found error', async () => {
        const notFoundError = new Error('No camera found')
        notFoundError.name = 'NotFoundError'
        mockGetUserMedia.mockRejectedValue(notFoundError)

        render(
            <CameraCapture
                onCapture={mockOnCapture}
                mode="scene"
                isActive={true}
                onError={mockOnError}
            />
        )

        await waitFor(() => {
            expect(screen.getByText(/no camera found/i)).toBeInTheDocument()
        })
    })

    it('handles camera in use error', async () => {
        const inUseError = new Error('Camera in use')
        inUseError.name = 'NotReadableError'
        mockGetUserMedia.mockRejectedValue(inUseError)

        render(
            <CameraCapture
                onCapture={mockOnCapture}
                mode="scene"
                isActive={true}
                onError={mockOnError}
            />
        )

        await waitFor(() => {
            expect(screen.getByText(/camera is already in use/i)).toBeInTheDocument()
        })
    })

    it('shows scanning status in continuous mode', async () => {
        render(
            <CameraCapture
                onCapture={mockOnCapture}
                mode="finder"
                continuous={true}
                isActive={true}
            />
        )

        await waitFor(() => {
            expect(screen.getByText(/camera ready/i)).toBeInTheDocument()
        })

        // Wait for continuous capture to start
        await waitFor(() => {
            expect(screen.getByText(/scanning for objects/i)).toBeInTheDocument()
        }, { timeout: 1000 })
    })

    it('provides accessibility features', async () => {
        render(
            <CameraCapture
                onCapture={mockOnCapture}
                mode="scene"
                isActive={true}
            />
        )

        // Check for screen reader content
        const statusElement = screen.getByText(/requesting camera access/i)
        expect(statusElement).toHaveAttribute('aria-live', 'polite')

        await waitFor(() => {
            expect(screen.getByText(/camera ready/i)).toBeInTheDocument()
        })
    })

    it('cleans up resources when deactivated', async () => {
        const { rerender } = render(
            <CameraCapture
                onCapture={mockOnCapture}
                mode="scene"
                isActive={true}
            />
        )

        await waitFor(() => {
            expect(mockGetUserMedia).toHaveBeenCalled()
            expect(screen.getByText(/camera ready/i)).toBeInTheDocument()
        })

        // Deactivate component
        rerender(
            <CameraCapture
                onCapture={mockOnCapture}
                mode="scene"
                isActive={false}
            />
        )

        // Component should render nothing when inactive
        expect(screen.queryByText(/camera ready/i)).not.toBeInTheDocument()
    })

    it('shows development test button in development mode', async () => {
        // Mock NODE_ENV for development
        const originalEnv = process.env.NODE_ENV
        process.env.NODE_ENV = 'development'

        render(
            <CameraCapture
                onCapture={mockOnCapture}
                mode="scene"
                isActive={true}
            />
        )

        await waitFor(() => {
            expect(screen.getByText(/camera ready/i)).toBeInTheDocument()
        })

        expect(screen.getByText(/test capture/i)).toBeInTheDocument()

        // Restore original NODE_ENV
        process.env.NODE_ENV = originalEnv
    })

    it('handles unsupported browser gracefully', async () => {
        // Mock unsupported browser
        Object.defineProperty(navigator, 'mediaDevices', {
            writable: true,
            value: undefined
        })

        render(
            <CameraCapture
                onCapture={mockOnCapture}
                mode="scene"
                isActive={true}
                onError={mockOnError}
            />
        )

        await waitFor(() => {
            expect(screen.getByText(/failed to access camera/i)).toBeInTheDocument()
        })

        // Restore mediaDevices
        Object.defineProperty(navigator, 'mediaDevices', {
            writable: true,
            value: {
                getUserMedia: mockGetUserMedia
            }
        })
    })
})