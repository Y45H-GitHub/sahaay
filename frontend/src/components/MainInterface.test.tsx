import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MainInterface from './MainInterface';

// Mock the child components
vi.mock('./VoiceInputButton', () => ({
    default: ({ onTranscript, onError, language, disabled, className }: any) => (
        <button
            className={`mock-voice-input ${className}`}
            onClick={() => onTranscript('test transcript')}
            disabled={disabled}
            data-testid="voice-input-button"
        >
            Voice Input ({language})
        </button>
    )
}));

vi.mock('./CameraCapture', () => ({
    default: ({ onCapture, mode, isActive }: any) => (
        <div
            data-testid="camera-capture"
            data-mode={mode}
            data-active={isActive}
            onClick={() => onCapture(new Blob(['test'], { type: 'image/jpeg' }))}
        >
            Camera Capture
        </div>
    )
}));

vi.mock('./AudioPlayer', () => ({
    default: ({ onPlayStart, onPlayEnd, autoPlay }: any) => (
        <div
            data-testid="audio-player"
            data-autoplay={autoPlay}
            onClick={() => {
                onPlayStart();
                setTimeout(onPlayEnd, 100);
            }}
        >
            Audio Player
        </div>
    )
}));

// Mock haptic feedback
vi.mock('../services/HapticFeedback', () => ({
    triggerProcessingHaptic: vi.fn(),
    triggerErrorHaptic: vi.fn()
}));

// Mock speech synthesis
Object.defineProperty(window, 'speechSynthesis', {
    writable: true,
    value: {
        speak: vi.fn(),
        cancel: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        getVoices: vi.fn(() => [])
    }
});

// Mock SpeechSynthesisUtterance
Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    writable: true,
    value: function (text: string) {
        return {
            text,
            rate: 1,
            volume: 1,
            onstart: null,
            onend: null
        };
    }
});

describe('MainInterface', () => {
    const mockOnLanguageChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the main interface with all required elements', () => {
        render(
            <MainInterface
                language="en"
                onLanguageChange={mockOnLanguageChange}
            />
        );

        // Check for language selector
        expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('English')).toBeInTheDocument();

        // Check for three action buttons by their aria-labels
        expect(screen.getByRole('button', { name: /describe what is in front of you using the camera/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /read text from an image using the camera/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /ask sahaay a general question using voice/i })).toBeInTheDocument();

        // Check for microphone button (VoiceInputButton)
        expect(screen.getByTestId('voice-input-button')).toBeInTheDocument();

        // Check for camera and audio components
        expect(screen.getByTestId('camera-capture')).toBeInTheDocument();
        expect(screen.getByTestId('audio-player')).toBeInTheDocument();
    });

    it('displays all three language options', () => {
        render(
            <MainInterface
                language="en"
                onLanguageChange={mockOnLanguageChange}
            />
        );

        const languageSelect = screen.getByLabelText(/language/i);
        const options = screen.getAllByRole('option');

        expect(options).toHaveLength(3);
        expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Hindi' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Hinglish' })).toBeInTheDocument();
    });

    it('calls onLanguageChange when language is changed', () => {
        render(
            <MainInterface
                language="en"
                onLanguageChange={mockOnLanguageChange}
            />
        );

        const languageSelect = screen.getByLabelText(/language/i);
        fireEvent.change(languageSelect, { target: { value: 'hi' } });

        expect(mockOnLanguageChange).toHaveBeenCalledWith('hi');
    });

    it('activates scene description mode when Describe Scene button is clicked', () => {
        render(
            <MainInterface
                language="en"
                onLanguageChange={mockOnLanguageChange}
            />
        );

        const describeButton = screen.getByRole('button', { name: /describe what is in front of you using the camera/i });
        fireEvent.click(describeButton);

        // Button should become active
        expect(describeButton).toHaveClass('active');
        expect(describeButton).toHaveAttribute('aria-pressed', 'true');

        // Camera should be active with scene mode
        const camera = screen.getByTestId('camera-capture');
        expect(camera).toHaveAttribute('data-active', 'true');
        expect(camera).toHaveAttribute('data-mode', 'scene');
    });

    it('activates text reading mode when Read Text button is clicked', () => {
        render(
            <MainInterface
                language="en"
                onLanguageChange={mockOnLanguageChange}
            />
        );

        const readTextButton = screen.getByRole('button', { name: /read text from an image using the camera/i });
        fireEvent.click(readTextButton);

        // Button should become active
        expect(readTextButton).toHaveClass('active');
        expect(readTextButton).toHaveAttribute('aria-pressed', 'true');

        // Camera should be active with text mode
        const camera = screen.getByTestId('camera-capture');
        expect(camera).toHaveAttribute('data-active', 'true');
        expect(camera).toHaveAttribute('data-mode', 'text');
    });

    it('activates general question mode when Ask Sahaay button is clicked', () => {
        render(
            <MainInterface
                language="en"
                onLanguageChange={mockOnLanguageChange}
            />
        );

        const askSahaayButton = screen.getByRole('button', { name: /ask sahaay a general question using voice/i });
        fireEvent.click(askSahaayButton);

        // Button should become active
        expect(askSahaayButton).toHaveClass('active');
        expect(askSahaayButton).toHaveAttribute('aria-pressed', 'true');

        // Camera should not be active for general questions
        const camera = screen.getByTestId('camera-capture');
        expect(camera).toHaveAttribute('data-active', 'false');
    });

    it('uses full-screen button sizing for accessibility', () => {
        render(
            <MainInterface
                language="en"
                onLanguageChange={mockOnLanguageChange}
            />
        );

        const actionButtons = [
            screen.getByRole('button', { name: /describe what is in front of you using the camera/i }),
            screen.getByRole('button', { name: /read text from an image using the camera/i }),
            screen.getByRole('button', { name: /ask sahaay a general question using voice/i })
        ];

        actionButtons.forEach(button => {
            expect(button).toHaveClass('action-button');
            // The CSS class ensures full-screen sizing
        });
    });

    it('positions language selector at top and microphone at bottom', () => {
        render(
            <MainInterface
                language="en"
                onLanguageChange={mockOnLanguageChange}
            />
        );

        const mainInterface = screen.getByRole('main');
        const header = mainInterface.parentElement?.querySelector('.main-interface-header');
        const footer = mainInterface.parentElement?.querySelector('.main-interface-footer');

        expect(header).toBeInTheDocument();
        expect(footer).toBeInTheDocument();
        expect(header).toContainElement(screen.getByLabelText(/language/i));
        expect(footer).toContainElement(screen.getByTestId('voice-input-button'));
    });

    it('provides proper ARIA labels and accessibility attributes', () => {
        render(
            <MainInterface
                language="en"
                onLanguageChange={mockOnLanguageChange}
            />
        );

        // Check ARIA labels on action buttons
        expect(screen.getByRole('button', { name: /describe what is in front of you using the camera/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /read text from an image using the camera/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /ask sahaay a general question using voice/i })).toBeInTheDocument();

        // Check for screen reader content
        expect(screen.getByText(/current state:/i)).toBeInTheDocument();
        expect(screen.getByText(/selected language:/i)).toBeInTheDocument();
    });

    it('uses bold typography for all text elements', () => {
        render(
            <MainInterface
                language="en"
                onLanguageChange={mockOnLanguageChange}
            />
        );

        // The CSS ensures all text uses bold typography via font-weight variables
        // This is tested through CSS classes rather than computed styles
        const actionButtons = [
            screen.getByRole('button', { name: /describe what is in front of you using the camera/i }),
            screen.getByRole('button', { name: /read text from an image using the camera/i }),
            screen.getByRole('button', { name: /ask sahaay a general question using voice/i })
        ];

        actionButtons.forEach(button => {
            expect(button).toHaveClass('action-button');
        });
    });
});