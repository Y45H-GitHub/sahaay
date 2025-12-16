import React, { useState } from 'react';
import VoiceInputButton from './VoiceInputButton';

/**
 * Demo component showing how to use VoiceInputButton
 * This is for development and testing purposes
 */
const VoiceInputDemo: React.FC = () => {
    const [transcript, setTranscript] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [language, setLanguage] = useState<string>('en');

    const handleTranscript = (text: string) => {
        console.log('Transcript received:', text);
        setTranscript(text);
        setError(''); // Clear any previous errors
    };

    const handleError = (err: Error) => {
        console.error('Voice input error:', err);
        setError(err.message);
        setTranscript(''); // Clear transcript on error
    };

    const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(event.target.value);
    };

    return (
        <div style={{
            padding: '2rem',
            backgroundColor: '#000000',
            color: '#ffffff',
            minHeight: '100vh',
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 'bold'
        }}>
            <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>
                Voice Input Component Demo
            </h1>

            {/* Language Selector */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <label htmlFor="language-select" style={{ marginRight: '1rem' }}>
                    Language:
                </label>
                <select
                    id="language-select"
                    value={language}
                    onChange={handleLanguageChange}
                    style={{
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        border: '2px solid #ffffff',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        fontSize: '18px',
                        fontWeight: 'bold'
                    }}
                >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="hinglish">Hinglish</option>
                </select>
            </div>

            {/* Voice Input Button */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '2rem'
            }}>
                <VoiceInputButton
                    onTranscript={handleTranscript}
                    onError={handleError}
                    language={language}
                />
            </div>

            {/* Results Display */}
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                {transcript && (
                    <div style={{
                        backgroundColor: '#000000',
                        border: '2px solid #00ff00',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem'
                    }}>
                        <h3 style={{ color: '#00ff00', marginTop: 0 }}>
                            Transcript:
                        </h3>
                        <p style={{ fontSize: '18px', lineHeight: '1.4' }}>
                            {transcript}
                        </p>
                    </div>
                )}

                {error && (
                    <div style={{
                        backgroundColor: '#000000',
                        border: '2px solid #ff6b6b',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem'
                    }}>
                        <h3 style={{ color: '#ff6b6b', marginTop: 0 }}>
                            Error:
                        </h3>
                        <p style={{ fontSize: '18px', lineHeight: '1.4' }}>
                            {error}
                        </p>
                    </div>
                )}

                {!transcript && !error && (
                    <div style={{
                        backgroundColor: '#000000',
                        border: '2px solid #ffffff',
                        borderRadius: '8px',
                        padding: '1rem',
                        textAlign: 'center'
                    }}>
                        <p style={{ fontSize: '18px', opacity: 0.8 }}>
                            Press and hold the microphone button to start recording.
                            Release to stop and process your speech.
                        </p>
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div style={{
                maxWidth: '600px',
                margin: '2rem auto 0',
                textAlign: 'center',
                opacity: 0.7
            }}>
                <h3>How to use:</h3>
                <ul style={{ textAlign: 'left', fontSize: '16px' }}>
                    <li>Select your preferred language from the dropdown</li>
                    <li>Press and hold the microphone button</li>
                    <li>Speak clearly into your device's microphone</li>
                    <li>Release the button when you're done speaking</li>
                    <li>The transcript will appear below</li>
                </ul>
                <p style={{ fontSize: '14px', marginTop: '1rem' }}>
                    Note: This demo requires microphone permissions and a modern browser with Web Speech API support.
                </p>
            </div>
        </div>
    );
};

export default VoiceInputDemo;