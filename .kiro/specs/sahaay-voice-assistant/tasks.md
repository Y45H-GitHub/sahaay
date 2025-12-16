# Implementation Plan

- [x] 1. Set up project structure and dependencies




  - Create root directory with frontend and backend folders
  - Initialize React + TypeScript project with Vite in frontend/
  - Initialize Node.js + Express + TypeScript project in backend/
  - Install frontend dependencies: react, react-dom, typescript, vite
  - Install backend dependencies: express, multer, axios, dotenv, cors
  - Create .env.example files for both frontend and backend
  - Set up TypeScript configurations for both projects
  - Create basic folder structure (components, services, routes, etc.)
  - **Git commit and push: "I nitial project setup with frontend and backend structure"**
  - _Requirements: 10.1, 10.2_

- [x] 2. Implement backend API foundation




  - Create Express server with CORS and JSON middleware
  - Set up Multer for file upload handling
  - Create API route structure (/api/voice-query, /api/scene-description, etc.)
  - Implement basic error handling middleware
  - Create health check endpoint
  - **Git commit and push: "Add backend API foundation with Express server and routes"**
  - _Requirements: 1.4, 2.2, 3.2_

- [x] 3. Implement Murf Falcon TTS service









  - Create MurfTTSService class with API integration
  - Implement text-to-speech conversion function
  - Add language-to-voice mapping (English, Hindi, Hinglish)
  - Handle API errors with retry logic
  - Return audio URL or base64 data
  - **Git commit and push: "Implement Murf Falcon TTS service with multi-language support"**
  - _Requirements: 1.5, 2.6, 3.5, 4.5, 9.4_

- [x]* 3.1 Write property test for TTS service
  - **Property 14: TTS conversion and playback**
  - **Validates: Requirements 2.6, 3.5, 4.5**

- [x]* 3.2 Write property test for language-voice mapping
  - **Property 32: Language selection changes TTS voice**
  - **Validates: Requirements 9.4**

- [x] 4. Implement vision and scene description service





  - Create VisionService class for object detection
  - Integrate with OpenAI GPT-4 Vision API or alternative
  - Implement object detection with bounding boxes
  - Calculate relative positions (left, right, ahead, behind) from bounding boxes
  - Generate natural language descriptions from detection results
  - **Git commit and push: "Add vision service for scene description and object detection"**
  - _Requirements: 2.3, 2.4, 2.5_

- [ ]* 4.1 Write property test for relative position calculation
  - **Property 9: Detected objects include relative positions**
  - **Validates: Requirements 2.4**

- [ ]* 4.2 Write property test for description generation
  - **Property 10: Scene analysis generates natural language description**
  - **Validates: Requirements 2.5**

- [x] 5. Implement OCR service





  - Create OCRService class
  - Integrate with Tesseract.js or Google Cloud Vision
  - Implement text extraction from images
  - Add text cleaning and formatting logic
  - Handle multiple languages
  - **Git commit and push: "Implement OCR service for text reading functionality"**
  - _Requirements: 3.3, 3.4_

- [ ]* 5.1 Write property test for text cleaning
  - **Property 12: Extracted text is cleaned before TTS**
  - **Validates: Requirements 3.4**

- [x] 6. Implement LLM service for general questions





  - Create LLMService class
  - Integrate with OpenAI GPT-4 or alternative
  - Handle date/time queries with current timestamp
  - Handle timer requests with acknowledgment
  - Implement context-aware responses
  - **Git commit and push: "Add LLM service for general question answering"**
  - _Requirements: 4.2, 4.3, 4.4_

- [ ]* 6.1 Write unit test for date/time queries
  - Test that date/time queries return accurate current date and time
  - _Requirements: 4.3_

- [ ]* 6.2 Write unit test for timer queries
  - Test that timer queries return acknowledgment responses
  - _Requirements: 4.4_

- [x] 7. Implement intent classification service





  - Create IntentClassifier class
  - Implement keyword-based intent detection
  - Classify intents: scene, text, general, finder, emergency
  - Extract parameters (e.g., object name for finder)
  - Handle ambiguous inputs with fallback to general
  - **Git commit and push: "Add intent classification service for voice commands"**
  - _Requirements: 1.4, 5.1, 6.1_

- [ ]* 7.1 Write unit test for emergency phrase detection
  - Test that "Sahaay, emergency" triggers emergency intent
  - _Requirements: 6.1_

- [x] 8. Implement backend API routes





  - Implement POST /api/scene-description endpoint
  - Implement POST /api/read-text endpoint
  - Implement POST /api/voice-query endpoint with intent routing
  - Implement POST /api/find-object endpoint
  - Implement POST /api/emergency endpoint
  - Implement POST /api/tts endpoint
  - Wire all services together in route handlers
  - **Git commit and push: "Complete backend API routes with all service integrations"**
  - _Requirements: 1.4, 2.2, 3.2, 4.2, 5.3, 6.3_

- [ ]* 8.1 Write property test for scene description endpoint
  - **Property 8: Scene images trigger object detection**
  - **Validates: Requirements 2.3**

- [ ]* 8.2 Write property test for OCR endpoint
  - **Property 11: OCR service extracts text from images**
  - **Validates: Requirements 3.3**

- [ ]* 8.3 Write property test for general query routing
  - **Property 13: General queries route to LLM**
  - **Validates: Requirements 4.2**


- [x] 9. Checkpoint - Ensure backend tests pass




  - Ensure all tests pass, ask the user if questions arise.




- [x] 10. Implement frontend foundation


  - Create main App component with routing
  - Set up global styles with high-contrast theme (#000000 background, #FFFFFF text)
  - Create CSS variables for colors, fonts, and spacing
  - Implement responsive layout structure
  - Set minimum font size to 18px globally
  - Apply bold typography to all text
  - **Git commit and push: "Set up frontend foundation with high-contrast accessible UI"**
  - _Requirements: 7.1, 7.2, 7.5, 7.7_

- [ ]* 10.1 Write property test for background color
  - **Property 24: All screens use black background**
  - **Validates: Requirements 7.1**

- [ ]* 10.2 Write property test for text color
  - **Property 25: All text uses white color**
  - **Validates: Requirements 7.2**

- [ ]* 10.3 Write property test for font size
  - **Property 26: All text meets minimum font size**
  - **Validates: Requirements 7.5**

- [ ]* 10.4 Write property test for font weight
  - **Property 28: All text uses bold typography**
  - **Validates: Requirements 7.7**

- [x] 11. Implement haptic feedback service




  - Create HapticFeedback service class
  - Define haptic patterns (listening: short pulse, processing: double pulse, error: long)
  - Implement vibration API wrapper with fallback
  - Export functions for each pattern type
  - **Git commit and push: "Add haptic feedback service with vibration patterns"**
  - _Requirements: 1.2, 8.1, 8.2, 8.3, 6.5_

- [ ]* 11.1 Write property test for recording haptic feedback
  - **Property 2: Recording start triggers haptic feedback**
  - **Validates: Requirements 1.2, 8.1**

- [ ]* 11.2 Write property test for processing haptic feedback
  - **Property 29: Processing state triggers double pulse**
  - **Validates: Requirements 8.2**

- [ ]* 11.3 Write property test for error haptic feedback
  - **Property 30: Error state triggers long vibration**
  - **Validates: Requirements 8.3**

- [ ]* 11.4 Write property test for emergency haptic feedback
  - **Property 23: Emergency triggers long haptic vibration**
  - **Validates: Requirements 6.5**

- [x] 12. Implement audio player component




  - Create AudioPlayer component with auto-play support
  - Handle both URL and base64 audio sources
  - Implement playback state management
  - Add loading and error states
  - Emit onPlayStart and onPlayEnd events
  - **Git commit and push: "Implement audio player component with auto-play"**
  - _Requirements: 1.5_

- [ ]* 12.1 Write property test for audio auto-play
  - **Property 5: Backend response triggers audio playback**
  - **Validates: Requirements 1.5**


- [x] 13. Implement camera capture component



  - Create CameraCapture component
  - Request camera permissions
  - Implement single frame capture mode
  - Implement continuous capture mode for object finder
  - Convert frames to JPEG/PNG blobs
  - Handle camera errors with voice feedback
  - **Git commit and push: "Add camera capture component with single and continuous modes"**
  - _Requirements: 2.1, 3.1, 5.2_

- [ ]* 13.1 Write property test for camera capture
  - **Property 6: Action button activation captures camera frame**
  - **Validates: Requirements 2.1, 3.1**

- [ ]* 13.2 Write property test for continuous capture
  - **Property 16: Scanning mode captures frames continuously**
  - **Validates: Requirements 5.2**

- [x] 14. Implement voice input component





  - Create VoiceInputButton component with large microphone button
  - Implement press-and-hold recording logic
  - Use MediaRecorder API for audio capture
  - Integrate with Web Speech API for STT (or send to backend)
  - Trigger haptic feedback on press and release
  - Handle recording errors
  - **Git commit and push: "Implement voice input component with press-and-hold recording"**
  - _Requirements: 1.1, 1.2, 1.3_

- [ ]* 14.1 Write property test for recording initiation
  - **Property 1: Microphone button press initiates recording**
  - **Validates: Requirements 1.1**

- [ ]* 14.2 Write property test for recording stop
  - **Property 3: Button release stops recording and sends audio**
  - **Validates: Requirements 1.3**

- [x] 15. Implement API client service




  - Create API client with axios
  - Implement functions for all backend endpoints
  - Add request/response interceptors
  - Handle network errors with retry logic
  - Implement request queuing for offline mode
  - **Git commit and push: "Add API client service with error handling and retry logic"**
  - _Requirements: 1.4, 2.2, 3.2_

- [ ]* 15.1 Write property test for API routing
  - **Property 7: Image capture triggers backend API call**
  - **Validates: Requirements 2.2, 3.2**

- [ ]* 15.2 Write property test for STT to backend flow
  - **Property 4: STT completion triggers backend call**
  - **Validates: Requirements 1.4**

- [x] 16. Implement main interface with action buttons





  - Create MainInterface component
  - Implement three large action buttons: "Describe Scene", "Read Text", "Ask Sahaay"
  - Position microphone button at bottom
  - Add language selector at top (English, Hindi, Hinglish)
  - Wire buttons to camera and voice components
  - Manage application state (idle, recording, processing, playing)
  - **Git commit and push: "Create main interface with action buttons and language selector"**
  - _Requirements: 7.3, 7.4, 7.6, 9.1, 9.2, 9.3, 9.5_

- [ ]* 16.1 Write unit test for UI structure
  - Test that exactly three action buttons are rendered with correct labels
  - Test that microphone button exists and is positioned at bottom
  - Test that language selector is positioned at top
  - _Requirements: 7.3, 7.4, 9.5_

- [ ]* 16.2 Write unit test for language options
  - Test that English, Hindi, and Hinglish options are available
  - _Requirements: 9.1, 9.2, 9.3_

- [ ]* 16.3 Write property test for button sizing
  - **Property 27: All buttons use full-screen sizing**
  - **Validates: Requirements 7.6**



- [x] 17. Implement scene description flow


  - Wire "Describe Scene" button to camera capture
  - Send captured image to /api/scene-description
  - Display processing state with haptic feedback
  - Play returned TTS audio automatically
  - Handle errors with voice feedback
  - **Git commit and push: "Implement scene description flow with camera integration"**
  - _Requirements: 2.1, 2.2, 2.6_

- [ ] 18. Implement text reading flow

  - Wire "Read Text" button to camera capture
  - Send captured image to /api/read-text
  - Display processing state with haptic feedback
  - Play returned TTS audio automatically
  - Handle errors with voice feedback
  - **Git commit and push: "Implement text reading flow with OCR integration"**
  - _Requirements: 3.1, 3.2, 3.5_

- [ ] 19. Implement general question flow
  - Wire "Ask Sahaay" button to voice input
  - Send transcribed query to /api/voice-query
  - Display processing state with haptic feedback
  - Play returned TTS audio automatically
  - Handle errors with voice feedback
  - **Git commit and push: "Implement general question flow with voice input"**
  - _Requirements: 4.1, 4.2, 4.5_

- [ ] 20. Implement object finder mode
  - Detect finder intent from voice input
  - Enter scanning mode with continuous camera capture
  - Send frames to /api/find-object with target object name
  - Continue scanning until object found
  - Play directional guidance when found
  - Exit scanning mode after detection
  - **Git commit and push: "Implement object finder mode with continuous scanning"**
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ]* 20.1 Write property test for scanning mode activation
  - **Property 15: Finder requests activate scanning mode**
  - **Validates: Requirements 5.1**

- [ ]* 20.2 Write property test for frame analysis
  - **Property 17: Each frame is analyzed for target object**
  - **Validates: Requirements 5.3**

- [ ]* 20.3 Write property test for directional guidance
  - **Property 18: Found objects include directional guidance**
  - **Validates: Requirements 5.4**

- [ ]* 20.4 Write property test for scanning exit
  - **Property 19: Object detection exits scanning mode**
  - **Validates: Requirements 5.5**

- [ ]* 20.5 Write property test for scanning persistence
  - **Property 20: Scanning persists until object found**
  - **Validates: Requirements 5.6**

- [ ] 21. Implement emergency trigger
  - Detect "Sahaay, emergency" phrase in voice input
  - Trigger emergency mode immediately
  - Play urgent TTS confirmation
  - Send emergency notification to /api/emergency with location
  - Trigger long haptic vibration
  - **Git commit and push: "Implement emergency trigger with location sharing"**
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 21.1 Write property test for emergency TTS
  - **Property 21: Emergency activation triggers TTS confirmation**
  - **Validates: Requirements 6.2**

- [ ]* 21.2 Write property test for emergency location
  - **Property 22: Emergency notification includes location**
  - **Validates: Requirements 6.4**

- [ ] 22. Implement voice cues for state changes
  - Create voice cue messages for each state transition
  - Trigger TTS for state changes (listening, processing, error, success)
  - Integrate with haptic feedback
  - **Git commit and push: "Add voice cues for all state transitions"**
  - _Requirements: 8.4_

- [ ]* 22.1 Write property test for state change voice cues
  - **Property 31: State changes trigger voice cues**
  - **Validates: Requirements 8.4**

- [ ] 23. Checkpoint - Ensure all frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 24. Create comprehensive documentation
  - Write README.md with project overview
  - Add setup instructions for local development
  - Document environment variables in .env.example
  - Add instructions for obtaining Murf API keys
  - Add instructions for obtaining OpenAI API keys
  - Document API endpoints and request/response formats
  - Create troubleshooting section
  - **Git commit and push: "Add comprehensive documentation and setup instructions"**
  - _Requirements: 10.1, 10.2, 10.3_

- [ ]* 24.1 Verify documentation completeness
  - Test that README exists with setup instructions
  - Test that .env.example contains all required variables
  - Test that API key instructions are present
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 25. Create demo script and test data
  - Write DEMO.md with hackathon presentation script
  - Create sample images for testing (scene, text, objects)
  - Document demo flow and talking points
  - Add tips for showcasing accessibility features
  - **Git commit and push: "Add demo script and test data for hackathon presentation"**
  - _Requirements: 10.5_

- [ ]* 25.1 Verify demo script exists
  - Test that DEMO.md file exists
  - _Requirements: 10.5_

- [ ] 26. Add deployment instructions
  - Document frontend deployment to Vercel/Netlify
  - Document backend deployment to Railway/Render
  - Add production environment configuration guide
  - Document CORS and security settings
  - Add performance optimization tips
  - **Git commit and push: "Add deployment instructions for production"**
  - _Requirements: 10.4_

- [ ] 27. Create startup scripts
  - Add npm scripts for development (dev, start, build)
  - Create root-level package.json for running both frontend and backend
  - Add concurrently for running both servers
  - Test local startup process
  - **Git commit and push: "Add startup scripts for easy local development"**
  - _Requirements: 10.4_

- [ ]* 27.1 Verify local runability
  - Test that application runs locally after following setup instructions
  - _Requirements: 10.4_

- [ ] 28. Final integration testing and polish
  - Test complete voice query flow end-to-end
  - Test scene description with real camera
  - Test text reading with printed text
  - Test object finder with common objects
  - Test emergency trigger
  - Verify all haptic feedback patterns
  - Verify all voice cues
  - Test language switching
  - Verify high-contrast UI on different devices
  - Test accessibility with screen readers
  - **Git commit and push: "Final polish and integration testing complete"**
  - _Requirements: All_

- [ ] 29. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
