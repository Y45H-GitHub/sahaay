import { useState } from 'react'
import { MainInterface } from './components'
import './App.css'

// Language options for the voice assistant
type Language = 'en' | 'hi' | 'hinglish'

function App() {
  const [language, setLanguage] = useState<Language>('en')

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as Language)
  }

  return (
    <div className="app">
      <MainInterface
        language={language}
        onLanguageChange={handleLanguageChange}
      />
    </div>
  )
}

export default App
