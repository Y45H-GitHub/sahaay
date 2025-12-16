import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import VoiceInputButton from './VoiceInputButton';

// Mock the HapticFeedback service
vi.mock('../services/HapticFeedback', () => ({
    triggerListeningHaptic: vi.fn(),
    triggerErrorHaptic: vi.fn(),
}));

describe('VoiceInputButton', () => {
    const defaultProps = {
        onTranscript: vi.fn(),
        onError: vi.fn(),
        language: 'en',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the microphone button', () => {
        render(<VoiceInputButton {...defaultProps} />);

        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent('🎤');
    });

    it('shows instructions text', () => {
        render(<VoiceInputButton {...defaultProps} />);

        expect(screen.getByText('Press and hold to record, release to stop')).toBeInTheDocument();
    });

    it('is disabled when disabled prop is true', () => {
        render(<VoiceInputButton {...defaultProps} disabled={true} />);

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });

    it('applies custom className', () => {
        render(<VoiceInputButton {...defaultProps} className="custom-class" />);

        const button = screen.getByRole('button');
        expect(button).toHaveClass('custom-class');
    });

    it('has proper accessibility attributes', () => {
        render(<VoiceInputButton {...defaultProps} />);

        const button = screen.getByRole('button');

        expect(button).toHaveAttribute('aria-label');
        expect(button).toHaveAttribute('aria-pressed');
        expect(button).toHaveAttribute('tabIndex', '0');
        expect(button).toHaveAttribute('role', 'button');
    });

    it('renders status information for screen readers', () => {
        render(<VoiceInputButton {...defaultProps} />);

        // Should have screen reader content
        const srContent = document.querySelector('.sr-only');
        expect(srContent).toBeInTheDocument();
        expect(srContent).toHaveAttribute('aria-live', 'polite');
    });

    it('renders instructions container', () => {
        render(<VoiceInputButton {...defaultProps} />);

        const instructions = document.querySelector('.voice-input-instructions');
        expect(instructions).toBeInTheDocument();
    });

    it('has proper button structure', () => {
        render(<VoiceInputButton {...defaultProps} />);

        const container = document.querySelector('.voice-input-container');
        const button = document.querySelector('.voice-input-button');
        const buttonText = document.querySelector('.button-text');

        expect(container).toBeInTheDocument();
        expect(button).toBeInTheDocument();
        expect(buttonText).toBeInTheDocument();
    });
});