import { useState } from 'react'
import './App.css'

// Language options for the voice assistant
type Language = 'en' | 'hi' | 'hinglish'

// Application state types
type AppState = 'idle' | 'recording' | 'processing' | 'playing'

function App() {
  const [language, setLanguage] = useState<Language>('en')
  const [appState] = useState<AppState>('idle')

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
  }

  const handleDescribeScene = () => {
    console.log('Describe Scene activated')
    // TODO: Implement scene description functionality
  }

  const handleReadText = () => {
    console.log('Read Text activated')
    // TODO: Implement text reading functionality
  }

  const handleAskSahaay = () => {
    console.log('Ask Sahaay activated')
    // TODO: Implement general question functionality
  }

  const handleVoiceInput = () => {
    console.log('Voice input activated')
    // TODO: Implement voice input functionality
  }

  return (
    <div className="app">
      {/* Language Selector at top */}
      <header className="app-header">
        <div className="language-selector">
          <label htmlFor="language-select" className="sr-only">
            Select Language
          </label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="language-select"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="hinglish">Hinglish</option>
          </select>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main">
        {/* Three Action Buttons */}
        <div className="action-buttons">
          <button
            className="action-button"
            onClick={handleDescribeScene}
            aria-label="Describe what is in front of you using the camera"
          >
            Describe Scene
          </button>

          <button
            className="action-button"
            onClick={handleReadText}
            aria-label="Read text from an image using the camera"
          >
            Read Text
          </button>

          <button
            className="action-button"
            onClick={handleAskSahaay}
            aria-label="Ask Sahaay a general question using voice"
          >
            Ask Sahaay
          </button>
        </div>
      </main>

      {/* Microphone Button at bottom */}
      <footer className="app-footer">
        <button
          className="microphone-button"
          onClick={handleVoiceInput}
          aria-label="Press and hold to record voice input"
        >
          🎤
        </button>
      </footer>

      {/* Status indicator for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Current state: {appState}. Selected language: {language}.
      </div>
    </div>
  )
}

export default App
