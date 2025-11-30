# Design Document

## Overview

Sahaay is a voice-first accessibility application built with a React frontend and Node.js/Express backend. The system integrates multiple AI services including Murf Falcon TTS for speech synthesis, speech-to-text for voice input, computer vision for scene understanding and OCR, and LLM for general question answering. The architecture prioritizes accessibility, real-time responsiveness, and ease of deployment.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Voice Input  │  │ Camera       │  │ Audio Player │      │
│  │ Component    │  │ Component    │  │ Component    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ UI Controls  │  │ Haptic       │  │ Language     │      │
│  │ (3 Buttons)  │  │ Feedback     │  │ Selector     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                Backend (Node.js/Express)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ API Routes   │  │ Intent       │  │ Response     │      │
│  │              │  │ Classifier   │  │ Generator    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ External APIs
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Murf Falcon  │  │ Speech-to-   │  │ Computer     │      │
│  │ TTS API      │  │ Text API     │  │ Vision API   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ OCR Service  │  │ LLM API      │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- Web Audio API for audio recording and playback
- MediaDevices API for camera access
- Vibration API for haptic feedback
- CSS Modules for styling

**Backend:**
- Node.js 18+
- Express.js for REST API
- Multer for file uploads
- Axios for external API calls
- dotenv for configuration

**External Services:**
- Murf.ai Falcon TTS API
- Web Speech API (browser-based STT as fallback)
- OpenAI GPT-4 Vision for scene description
- OpenAI GPT-4 for general questions
- Tesseract.js or Google Cloud Vision for OCR

## Components and Interfaces

### Frontend Components

#### VoiceInputButton Component
```typescript
interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  onError: (error: Error) => void;
  language: string;
}
```

Responsibilities:
- Handle press-and-hold microphone button interaction
- Record audio using MediaRecorder API
- Send audio to STT service
- Trigger haptic feedback on recording start
- Return transcribed text to parent component

#### CameraCapture Component
```typescript
interface CameraCaptureProps {
  onCapture: (imageBlob: Blob) => void;
  mode: 'scene' | 'text' | 'finder';
  continuous?: boolean;
}
```

Responsibilities:
- Access device camera
- Capture single frame or continuous stream
- Convert frames to appropriate format (JPEG/PNG)
- Handle camera permissions

#### AudioPlayer Component
```typescript
interface AudioPlayerProps {
  audioUrl?: string;
  audioBase64?: string;
  onPlayStart: () => void;
  onPlayEnd: () => void;
  autoPlay: boolean;
}
```

Responsibilities:
- Play audio from URL or base64 data
- Auto-play responses
- Handle audio loading states
- Provide playback controls

#### HapticFeedback Service
```typescript
interface HapticPattern {
  listening: number[];
  processing: number[];
  error: number[];
}
```

Responsibilities:
- Trigger device vibration patterns
- Map app states to haptic patterns
- Fallback gracefully if vibration not supported

#### MainInterface Component
```typescript
interface MainInterfaceProps {
  language: string;
  onLanguageChange: (lang: string) => void;
}
```

Responsibilities:
- Render three main action buttons
- Render microphone button
- Render language selector
- Coordinate between child components
- Manage application state

### Backend API Endpoints

#### POST /api/voice-query
```typescript
interface VoiceQueryRequest {
  audio: File;
  language: string;
}

interface VoiceQueryResponse {
  intent: string;
  response: string;
  audioUrl: string;
  audioBase64?: string;
}
```

Handles voice input processing, intent classification, and response generation.

#### POST /api/scene-description
```typescript
interface SceneDescriptionRequest {
  image: File;
  language: string;
}

interface SceneDescriptionResponse {
  description: string;
  objects: Array<{
    name: string;
    position: string;
    confidence: number;
  }>;
  audioUrl: string;
}
```

Processes camera images for scene understanding.

#### POST /api/read-text
```typescript
interface ReadTextRequest {
  image: File;
  language: string;
}

interface ReadTextResponse {
  text: string;
  audioUrl: string;
}
```

Extracts and reads text from images.

#### POST /api/find-object
```typescript
interface FindObjectRequest {
  image: File;
  targetObject: string;
  language: string;
}

interface FindObjectResponse {
  found: boolean;
  direction?: string;
  message: string;
  audioUrl: string;
}
```

Searches for specific objects in camera feed.

#### POST /api/emergency
```typescript
interface EmergencyRequest {
  location?: {
    latitude: number;
    longitude: number;
  };
  language: string;
}

interface EmergencyResponse {
  status: string;
  message: string;
  audioUrl: string;
}
```

Handles emergency triggers.

#### POST /api/tts
```typescript
interface TTSRequest {
  text: string;
  language: string;
  voice?: string;
}

interface TTSResponse {
  audioUrl: string;
  audioBase64?: string;
}
```

Converts text to speech using Murf Falcon TTS.

### Backend Services

#### IntentClassifier Service
```typescript
interface Intent {
  type: 'scene' | 'text' | 'general' | 'finder' | 'emergency';
  confidence: number;
  parameters?: Record<string, any>;
}
```

Responsibilities:
- Analyze transcribed text
- Classify user intent
- Extract parameters (e.g., object name for finder mode)
- Route to appropriate handler

#### MurfTTSService
```typescript
interface MurfTTSConfig {
  apiKey: string;
  voiceId: string;
}
```

Responsibilities:
- Interface with Murf Falcon TTS API
- Handle voice selection based on language
- Cache audio responses
- Return audio URL or base64 data

#### VisionService
```typescript
interface DetectedObject {
  label: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

Responsibilities:
- Process images for object detection
- Determine spatial relationships
- Generate natural language descriptions
- Identify people and surfaces

#### OCRService
```typescript
interface OCRResult {
  text: string;
  confidence: number;
  blocks: Array<{
    text: string;
    boundingBox: any;
  }>;
}
```

Responsibilities:
- Extract text from images
- Clean and structure extracted text
- Handle multiple languages
- Return formatted text for TTS

#### LLMService
```typescript
interface LLMQuery {
  prompt: string;
  context?: string;
}
```

Responsibilities:
- Process general questions
- Generate contextual responses
- Handle date/time queries
- Provide explanations

## Data Models

### User Session
```typescript
interface UserSession {
  sessionId: string;
  language: string;
  conversationHistory: Message[];
  preferences: UserPreferences;
}
```

### Message
```typescript
interface Message {
  id: string;
  timestamp: Date;
  type: 'user' | 'system';
  content: string;
  intent?: string;
  audioUrl?: string;
}
```

### UserPreferences
```typescript
interface UserPreferences {
  language: 'en' | 'hi' | 'hinglish';
  voiceId: string;
  hapticEnabled: boolean;
}
```

### DetectionResult
```typescript
interface DetectionResult {
  objects: DetectedObject[];
  description: string;
  timestamp: Date;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing all testable properties from the prework, several redundancies were identified:

- Property 1.2 and 8.1 both test haptic feedback on voice input start - these will be combined
- Properties 2.1 and 3.1 both test camera capture on button activation - these follow the same pattern and can be generalized
- Multiple properties test TTS conversion and playback (2.6, 3.5, 4.5) - these can be consolidated into one comprehensive property
- Properties testing API routing (2.2, 3.2, 4.2) follow the same pattern and can be generalized

The consolidated properties below eliminate redundancy while maintaining complete coverage of all acceptance criteria.

### Voice Input Properties

Property 1: Microphone button press initiates recording
*For any* microphone button press event, the system should transition to recording state and start the MediaRecorder
**Validates: Requirements 1.1**

Property 2: Recording start triggers haptic feedback
*For any* transition to recording state, the system should trigger a short haptic pulse via the Vibration API
**Validates: Requirements 1.2, 8.1**

Property 3: Button release stops recording and sends audio
*For any* microphone button release event while recording, the system should stop the MediaRecorder and send the audio data to the STT service
**Validates: Requirements 1.3**

Property 4: STT completion triggers backend call
*For any* STT result containing transcribed text, the system should make an API call to the backend conversation engine with that text
**Validates: Requirements 1.4**

Property 5: Backend response triggers audio playback
*For any* backend response containing audio data, the system should automatically play the audio through the AudioPlayer component
**Validates: Requirements 1.5**

### Scene Description Properties

Property 6: Action button activation captures camera frame
*For any* action button press (Describe Scene, Read Text), the system should trigger camera capture and obtain an image frame
**Validates: Requirements 2.1, 3.1**

Property 7: Image capture triggers backend API call
*For any* captured image frame, the system should send the image to the appropriate backend endpoint based on the active mode
**Validates: Requirements 2.2, 3.2**

Property 8: Scene images trigger object detection
*For any* image sent to the scene description endpoint, the backend should invoke the vision service and return detected objects
**Validates: Requirements 2.3**

Property 9: Detected objects include relative positions
*For any* set of detected objects with bounding boxes, the system should calculate and include relative directional terms (left, right, ahead, behind) in the response
**Validates: Requirements 2.4**

Property 10: Scene analysis generates natural language description
*For any* detection result containing objects and positions, the system should generate a natural language description that includes both object types and their spatial relationships
**Validates: Requirements 2.5**

### Text Reading Properties

Property 11: OCR service extracts text from images
*For any* image sent to the text reading endpoint, the OCR service should process the image and return extracted text
**Validates: Requirements 3.3**

Property 12: Extracted text is cleaned before TTS
*For any* raw OCR output, the system should normalize whitespace and improve formatting before sending to TTS
**Validates: Requirements 3.4**

### General Question Properties

Property 13: General queries route to LLM
*For any* user query classified as general intent, the system should send the query to the LLM service for processing
**Validates: Requirements 4.2**

Property 14: TTS conversion and playback
*For any* text response generated by the system (scene description, OCR result, LLM answer), the system should convert it to audio using Murf Falcon TTS and automatically play it
**Validates: Requirements 2.6, 3.5, 4.5**

### Object Finder Properties

Property 15: Finder requests activate scanning mode
*For any* voice request to find a specific object, the system should transition to scanning mode and begin continuous frame capture
**Validates: Requirements 5.1**

Property 16: Scanning mode captures frames continuously
*For any* time period while in scanning mode, the system should capture and analyze multiple camera frames
**Validates: Requirements 5.2**

Property 17: Each frame is analyzed for target object
*For any* frame captured in scanning mode, the system should run object detection searching for the specified target object
**Validates: Requirements 5.3**

Property 18: Found objects include directional guidance
*For any* target object detected in scanning mode, the system should calculate the relative direction and include it in the response
**Validates: Requirements 5.4**

Property 19: Object detection exits scanning mode
*For any* successful target object detection, the system should generate TTS guidance and exit scanning mode
**Validates: Requirements 5.5**

Property 20: Scanning persists until object found
*For any* frame analysis that does not detect the target object, the system should continue scanning mode without exiting
**Validates: Requirements 5.6**

### Emergency Properties

Property 21: Emergency activation triggers TTS confirmation
*For any* emergency mode activation, the system should immediately play an urgent confirmation message via Murf Falcon TTS
**Validates: Requirements 6.2**

Property 22: Emergency notification includes location
*For any* emergency notification sent to the backend, the request should include the user's current location data
**Validates: Requirements 6.4**

Property 23: Emergency triggers long haptic vibration
*For any* emergency mode activation, the system should trigger a long haptic vibration pattern
**Validates: Requirements 6.5**

### UI Accessibility Properties

Property 24: All screens use black background
*For any* rendered screen component, the background color should be #000000
**Validates: Requirements 7.1**

Property 25: All text uses white color
*For any* text element rendered in the UI, the color should be #FFFFFF
**Validates: Requirements 7.2**

Property 26: All text meets minimum font size
*For any* text element in the UI, the font-size should be greater than or equal to 18 pixels
**Validates: Requirements 7.5**

Property 27: All buttons use full-screen sizing
*For any* interactive button element, the size should occupy significant screen space appropriate for accessibility
**Validates: Requirements 7.6**

Property 28: All text uses bold typography
*For any* text element in the UI, the font-weight should be bold (>= 600)
**Validates: Requirements 7.7**

### Haptic Feedback Properties

Property 29: Processing state triggers double pulse
*For any* transition to processing state, the system should trigger a double haptic pulse pattern
**Validates: Requirements 8.2**

Property 30: Error state triggers long vibration
*For any* error condition, the system should trigger a long haptic vibration
**Validates: Requirements 8.3**

Property 31: State changes trigger voice cues
*For any* application state transition, the system should generate and play an appropriate voice cue via Murf Falcon TTS
**Validates: Requirements 8.4**

### Language Support Properties

Property 32: Language selection changes TTS voice
*For any* language selection change, all subsequent TTS requests should use the voice ID corresponding to the selected language
**Validates: Requirements 9.4**

## Error Handling

### Frontend Error Handling

**Camera Access Errors:**
- Request camera permissions on first use
- Display voice prompt if permission denied
- Provide haptic feedback for errors
- Offer retry mechanism

**Audio Recording Errors:**
- Handle MediaRecorder not supported
- Fallback to alternative recording methods
- Notify user via TTS if recording fails

**Network Errors:**
- Retry failed API calls with exponential backoff
- Cache last successful response
- Provide offline mode indicators via voice
- Queue requests when offline

**Audio Playback Errors:**
- Handle audio format incompatibilities
- Provide fallback audio formats
- Notify user if playback fails

### Backend Error Handling

**External API Failures:**
- Implement circuit breaker pattern for external services
- Provide fallback responses when APIs unavailable
- Log all API errors for monitoring
- Return user-friendly error messages

**Image Processing Errors:**
- Validate image format and size
- Handle corrupted image data
- Provide meaningful error messages
- Suggest image recapture

**TTS Service Errors:**
- Implement retry logic for Murf API
- Cache successful TTS responses
- Provide fallback TTS service
- Return error audio message

**Rate Limiting:**
- Implement request throttling
- Queue requests during high load
- Provide user feedback for delays
- Cache frequent responses

## Testing Strategy

### Unit Testing

The application will use Jest for unit testing with the following focus areas:

**Frontend Unit Tests:**
- Component rendering and props handling
- Event handler functions
- State management logic
- API client functions
- Utility functions (haptic patterns, audio processing)

**Backend Unit Tests:**
- API route handlers
- Service layer functions
- Intent classification logic
- Response generation
- Error handling middleware

**Example Unit Tests:**
- Date/time query returns current date (Requirements 4.3)
- Timer query returns acknowledgment (Requirements 4.4)
- Emergency phrase "Sahaay, emergency" triggers emergency mode (Requirements 6.1)
- UI renders exactly three action buttons (Requirements 7.3)
- Microphone button is positioned at bottom (Requirements 7.4)
- Language selector includes English, Hindi, Hinglish (Requirements 9.1, 9.2, 9.3)
- Language selector positioned at top (Requirements 9.5)
- README file exists with setup instructions (Requirements 10.1)
- .env.example contains required variables (Requirements 10.2)
- Documentation includes Murf API key instructions (Requirements 10.3)
- Application runs locally after setup (Requirements 10.4)
- Demo script file exists (Requirements 10.5)

### Property-Based Testing

The application will use fast-check (JavaScript/TypeScript property-based testing library) for property-based testing. Each property test will run a minimum of 100 iterations to ensure comprehensive coverage across random inputs.

**Property Test Requirements:**
- Each property-based test MUST be tagged with a comment referencing the design document property
- Tag format: `// Feature: sahaay-voice-assistant, Property {number}: {property_text}`
- Each correctness property MUST be implemented by a SINGLE property-based test
- Tests should generate random valid inputs to verify properties hold universally

**Property Test Coverage:**
- Voice input flow properties (Properties 1-5)
- Scene description properties (Properties 6-10)
- Text reading properties (Properties 11-12)
- General question properties (Properties 13-14)
- Object finder properties (Properties 15-20)
- Emergency properties (Properties 21-23)
- UI accessibility properties (Properties 24-28)
- Haptic feedback properties (Properties 29-31)
- Language support properties (Property 32)

### Integration Testing

**End-to-End Flows:**
- Complete voice query flow from recording to TTS playback
- Scene description from camera capture to audio response
- Text reading from image capture to spoken text
- Object finder continuous scanning flow
- Emergency trigger and notification flow

**API Integration:**
- Murf Falcon TTS API integration
- STT service integration
- Computer vision API integration
- OCR service integration
- LLM API integration

### Testing Tools

- **Jest**: Unit testing framework
- **fast-check**: Property-based testing library
- **React Testing Library**: Component testing
- **Supertest**: API endpoint testing
- **MSW (Mock Service Worker)**: API mocking for tests

## Deployment Strategy

### Local Development

**Prerequisites:**
- Node.js 18+
- npm or yarn
- Modern web browser with camera/microphone support
- Murf.ai API key
- OpenAI API key (or alternative vision/LLM service)

**Setup Steps:**
1. Clone repository
2. Install dependencies (frontend and backend)
3. Configure environment variables
4. Start backend server
5. Start frontend development server
6. Access application in browser

### Production Deployment

**Frontend Deployment Options:**
- Vercel (recommended for React apps)
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

**Backend Deployment Options:**
- Railway
- Render
- Heroku
- AWS Elastic Beanstalk
- DigitalOcean App Platform

**Environment Configuration:**
- Separate .env files for development and production
- Secure API key storage
- CORS configuration for production domains
- HTTPS enforcement

**Performance Optimization:**
- Image compression before upload
- Audio caching
- CDN for static assets
- Response compression
- Request rate limiting

## Security Considerations

**API Key Protection:**
- Never expose API keys in frontend code
- Use environment variables
- Implement backend proxy for external APIs
- Rotate keys regularly

**Data Privacy:**
- No persistent storage of user images
- Temporary file cleanup after processing
- No logging of sensitive user data
- Clear privacy policy

**Input Validation:**
- Validate image file types and sizes
- Sanitize text inputs
- Rate limit API requests
- Implement CSRF protection

**Camera/Microphone Permissions:**
- Request permissions explicitly
- Provide clear permission prompts
- Handle permission denials gracefully
- Respect user privacy preferences

## Performance Requirements

**Response Times:**
- Voice input to STT: < 2 seconds
- Scene description: < 5 seconds
- Text reading: < 4 seconds
- General questions: < 3 seconds
- TTS generation: < 2 seconds

**Resource Usage:**
- Frontend bundle size: < 500KB (gzipped)
- Image upload size limit: 5MB
- Audio recording limit: 30 seconds
- Concurrent user support: 100+ users

**Caching Strategy:**
- Cache TTS responses for common phrases
- Cache vision API results for similar images
- Browser caching for static assets
- Service worker for offline support

## Accessibility Compliance

**WCAG 2.1 Level AA Compliance:**
- Minimum contrast ratio 7:1 (Level AAA achieved with black/white)
- Keyboard navigation support
- Screen reader compatibility
- Focus indicators
- Alternative text for all images

**Voice-First Design:**
- All features accessible via voice
- Minimal reliance on visual UI
- Audio feedback for all actions
- Haptic feedback as secondary channel

**Internationalization:**
- Multi-language support (English, Hindi, Hinglish)
- RTL language support (future)
- Locale-specific date/time formatting
- Cultural considerations in voice responses
