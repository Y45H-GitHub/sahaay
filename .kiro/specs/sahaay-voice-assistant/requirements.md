# Requirements Document

## Introduction

Sahaay is a voice-first accessibility application designed specifically for visually impaired users. The system provides scene description, text reading (OCR), general question answering, object finding, and emergency assistance capabilities. All interactions are voice-driven with high-contrast minimal UI, haptic feedback, and text-to-speech responses powered by Murf Falcon TTS API.

## Glossary

- **Sahaay System**: The complete voice assistant application including frontend mobile/web interface and backend AI services
- **Murf Falcon TTS**: Text-to-speech API service from murf.ai used for generating audio responses
- **STT**: Speech-to-Text conversion service
- **OCR**: Optical Character Recognition for extracting text from images
- **Scene Description**: AI-powered analysis of camera input to describe objects, people, and spatial layout
- **Object Detection**: Computer vision capability to identify and locate objects in images
- **Haptic Feedback**: Physical vibration patterns provided by the device
- **High-Contrast UI**: User interface with maximum contrast ratio (black background, white text)
- **Voice Cue**: Audio feedback provided to the user through TTS

## Requirements

### Requirement 1

**User Story:** As a visually impaired user, I want to interact with the application using voice input, so that I can use the app without needing to see the screen.

#### Acceptance Criteria

1. WHEN the user presses and holds the microphone button, THE Sahaay System SHALL begin recording audio input
2. WHEN audio recording is active, THE Sahaay System SHALL provide haptic feedback with a short pulse
3. WHEN the user releases the microphone button, THE Sahaay System SHALL stop recording and send the audio to the STT service
4. WHEN STT processing completes, THE Sahaay System SHALL send the transcribed text to the backend conversation engine
5. WHEN the backend returns a response, THE Sahaay System SHALL automatically play the Murf Falcon TTS audio response

### Requirement 2

**User Story:** As a visually impaired user, I want the app to describe what is in front of me, so that I can understand my surroundings.

#### Acceptance Criteria

1. WHEN the user activates the "Describe Scene" function, THE Sahaay System SHALL capture a frame from the device camera
2. WHEN an image frame is captured, THE Sahaay System SHALL send the image to the backend for analysis
3. WHEN the backend processes the scene image, THE Sahaay System SHALL perform object detection to identify all visible objects
4. WHEN objects are detected, THE Sahaay System SHALL determine relative positions using directional terms (left, right, ahead, behind)
5. WHEN scene analysis completes, THE Sahaay System SHALL generate a natural language description including object types and spatial relationships
6. WHEN the description is generated, THE Sahaay System SHALL convert the description to audio using Murf Falcon TTS and play it to the user

### Requirement 3

**User Story:** As a visually impaired user, I want the app to read text from images, so that I can access written information in my environment.

#### Acceptance Criteria

1. WHEN the user activates the "Read Text" function, THE Sahaay System SHALL capture an image from the device camera
2. WHEN the text reading image is captured, THE Sahaay System SHALL send the image to the backend OCR service
3. WHEN OCR processing completes, THE Sahaay System SHALL extract all readable text from the image
4. WHEN text is extracted, THE Sahaay System SHALL clean and structure the text content for readability
5. WHEN text content is prepared, THE Sahaay System SHALL convert the text to audio using Murf Falcon TTS and play it to the user

### Requirement 4

**User Story:** As a visually impaired user, I want to ask general questions and get spoken answers, so that I can access information and assistance.

#### Acceptance Criteria

1. WHEN the user activates the "Ask Sahaay" function via voice or button, THE Sahaay System SHALL accept the user query
2. WHEN a general query is received, THE Sahaay System SHALL send the query to the LLM backend for reasoning
3. WHEN the query involves date/time information, THE Sahaay System SHALL provide accurate current date and time
4. WHEN the query involves timer functionality, THE Sahaay System SHALL acknowledge the timer request with confirmation
5. WHEN the LLM generates a response, THE Sahaay System SHALL convert the response to audio using Murf Falcon TTS and play it to the user

### Requirement 5

**User Story:** As a visually impaired user, I want to find specific objects in my environment, so that I can locate items I need.

#### Acceptance Criteria

1. WHEN the user requests to find a specific object via voice, THE Sahaay System SHALL enter object finder scanning mode
2. WHILE in scanning mode, THE Sahaay System SHALL continuously capture and analyze camera frames
3. WHEN each frame is analyzed, THE Sahaay System SHALL run object detection to search for the target object
4. WHEN the target object is detected, THE Sahaay System SHALL determine the relative direction of the object
5. WHEN the object location is determined, THE Sahaay System SHALL generate directional guidance using Murf Falcon TTS and exit scanning mode
6. WHEN the target object is not found after analysis, THE Sahaay System SHALL continue scanning until the object is detected

### Requirement 6

**User Story:** As a visually impaired user, I want to trigger emergency assistance quickly, so that I can get help when needed.

#### Acceptance Criteria

1. WHEN the user speaks the phrase "Sahaay, emergency", THE Sahaay System SHALL immediately recognize the emergency trigger
2. WHEN emergency mode is activated, THE Sahaay System SHALL play an urgent confirmation message using Murf Falcon TTS
3. WHEN emergency is confirmed, THE Sahaay System SHALL send an SMS or trigger a callable endpoint with emergency notification
4. WHEN emergency notification is sent, THE Sahaay System SHALL include the user's current location information
5. WHEN emergency mode is active, THE Sahaay System SHALL provide long haptic vibration feedback

### Requirement 7

**User Story:** As a visually impaired user, I want a high-contrast minimal interface, so that any residual vision I have can be used effectively.

#### Acceptance Criteria

1. THE Sahaay System SHALL use a pure black background (#000000) for all screens
2. THE Sahaay System SHALL use pure white text (#FFFFFF) for all text elements
3. THE Sahaay System SHALL display exactly three large action buttons: "Describe Scene", "Read Text", and "Ask Sahaay"
4. THE Sahaay System SHALL display one large round microphone button at the bottom of the screen
5. THE Sahaay System SHALL render all text with a minimum font size of 18 pixels
6. THE Sahaay System SHALL use full-screen button sizes for all interactive elements
7. THE Sahaay System SHALL use bold typography for all text elements

### Requirement 8

**User Story:** As a visually impaired user, I want haptic and voice feedback for all interactions, so that I can understand the app's state without seeing the screen.

#### Acceptance Criteria

1. WHEN the user starts voice input, THE Sahaay System SHALL provide a short haptic pulse
2. WHEN the system is processing a request, THE Sahaay System SHALL provide a double haptic pulse
3. WHEN an error occurs, THE Sahaay System SHALL provide a long haptic vibration
4. WHEN any state change occurs, THE Sahaay System SHALL provide corresponding voice cues via Murf Falcon TTS

### Requirement 9

**User Story:** As a multilingual visually impaired user, I want to use the app in my preferred language, so that I can understand responses clearly.

#### Acceptance Criteria

1. THE Sahaay System SHALL support English language option
2. THE Sahaay System SHALL support Hindi language option
3. THE Sahaay System SHALL support Hinglish language option
4. WHEN a language is selected, THE Sahaay System SHALL use the corresponding Murf Falcon TTS voice for all audio responses
5. THE Sahaay System SHALL display language selection controls at the top of the screen

### Requirement 10

**User Story:** As a developer, I want clear setup and deployment instructions, so that I can run the application locally and deploy it for demonstrations.

#### Acceptance Criteria

1. THE Sahaay System SHALL include a README file with complete setup instructions
2. THE Sahaay System SHALL include an .env.example file with all required environment variables
3. THE Sahaay System SHALL include instructions for obtaining and configuring Murf API keys
4. THE Sahaay System SHALL be runnable locally on a development machine
5. THE Sahaay System SHALL include a demo script for hackathon presentations
