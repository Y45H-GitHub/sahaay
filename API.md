# Sahaay API Documentation

This document provides detailed information about the Sahaay backend API endpoints, request/response formats, and usage examples.

## Base URL

```
http://localhost:3001/api
```

For production deployments, replace `localhost:3001` with your deployed backend URL.

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

## Content Types

- **File Uploads**: `multipart/form-data`
- **JSON Requests**: `application/json`
- **Responses**: `application/json`

## Common Response Format

All API responses follow a consistent structure:

```json
{
  "success": true,
  "data": {
    // Response data specific to each endpoint
  },
  "error": null
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

## Endpoints

### 1. Voice Query Processing

**Endpoint:** `POST /api/voice-query`

Process voice input, classify intent, and return appropriate response.

#### Request

- **Content-Type:** `multipart/form-data`
- **Body Parameters:**
  - `audio` (File, required): Audio file containing voice input
  - `language` (string, required): Language code (`en`, `hi`, `hinglish`)

#### Response

```json
{
  "success": true,
  "data": {
    "intent": "scene|text|general|finder|emergency",
    "response": "Generated response text",
    "audioUrl": "https://example.com/audio.mp3",
    "audioBase64": "base64_encoded_audio_data",
    "parameters": {
      "targetObject": "chair" // Only for finder intent
    }
  }
}
```

#### Example Usage

```javascript
const formData = new FormData();
formData.append('audio', audioBlob);
formData.append('language', 'en');

const response = await fetch('/api/voice-query', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

### 2. Scene Description

**Endpoint:** `POST /api/scene-description`

Analyze camera image and provide detailed scene description with object detection.

#### Request

- **Content-Type:** `multipart/form-data`
- **Body Parameters:**
  - `image` (File, required): Image file to analyze
  - `language` (string, required): Language code for response

#### Response

```json
{
  "success": true,
  "data": {
    "description": "There is a wooden chair on the left side of the room and a table in the center...",
    "objects": [
      {
        "name": "chair",
        "position": "left",
        "confidence": 0.95,
        "boundingBox": {
          "x": 100,
          "y": 150,
          "width": 200,
          "height": 300
        }
      }
    ],
    "audioUrl": "https://example.com/scene-audio.mp3"
  }
}
```

#### Example Usage

```javascript
const formData = new FormData();
formData.append('image', imageBlob);
formData.append('language', 'en');

const response = await fetch('/api/scene-description', {
  method: 'POST',
  body: formData
});
```

### 3. Text Reading (OCR)

**Endpoint:** `POST /api/read-text`

Extract and read text from images using OCR technology.

#### Request

- **Content-Type:** `multipart/form-data`
- **Body Parameters:**
  - `image` (File, required): Image containing text to extract
  - `language` (string, required): Language code for TTS response

#### Response

```json
{
  "success": true,
  "data": {
    "text": "Welcome to the Sahaay application. This is a voice-first accessibility tool...",
    "confidence": 0.92,
    "audioUrl": "https://example.com/text-audio.mp3",
    "blocks": [
      {
        "text": "Welcome to the Sahaay application.",
        "boundingBox": {
          "x": 50,
          "y": 100,
          "width": 400,
          "height": 50
        }
      }
    ]
  }
}
```

#### Example Usage

```javascript
const formData = new FormData();
formData.append('image', imageBlob);
formData.append('language', 'en');

const response = await fetch('/api/read-text', {
  method: 'POST',
  body: formData
});
```

### 4. Object Finder

**Endpoint:** `POST /api/find-object`

Search for specific objects in camera feed and provide directional guidance.

#### Request

- **Content-Type:** `multipart/form-data`
- **Body Parameters:**
  - `image` (File, required): Image to search in
  - `targetObject` (string, required): Name of object to find
  - `language` (string, required): Language code for response

#### Response

```json
{
  "success": true,
  "data": {
    "found": true,
    "direction": "slightly to your left",
    "message": "I found a chair slightly to your left",
    "audioUrl": "https://example.com/finder-audio.mp3",
    "confidence": 0.88,
    "position": {
      "x": 150,
      "y": 200,
      "relative": "left"
    }
  }
}
```

When object is not found:

```json
{
  "success": true,
  "data": {
    "found": false,
    "direction": null,
    "message": "I don't see a chair in this view. Please try moving the camera around.",
    "audioUrl": "https://example.com/not-found-audio.mp3"
  }
}
```

#### Example Usage

```javascript
const formData = new FormData();
formData.append('image', imageBlob);
formData.append('targetObject', 'chair');
formData.append('language', 'en');

const response = await fetch('/api/find-object', {
  method: 'POST',
  body: formData
});
```

### 5. Emergency Assistance

**Endpoint:** `POST /api/emergency`

Handle emergency triggers and send notifications.

#### Request

- **Content-Type:** `application/json`
- **Body:**

```json
{
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10
  },
  "language": "en",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "status": "emergency_triggered",
    "message": "Emergency assistance has been notified. Help is on the way.",
    "audioUrl": "https://example.com/emergency-audio.mp3",
    "notificationId": "emg_123456789",
    "estimatedResponse": "5-10 minutes"
  }
}
```

#### Example Usage

```javascript
navigator.geolocation.getCurrentPosition(async (position) => {
  const response = await fetch('/api/emergency', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      location: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      },
      language: 'en',
      timestamp: new Date().toISOString()
    })
  });
});
```

### 6. Text-to-Speech

**Endpoint:** `POST /api/tts`

Convert text to speech using Murf Falcon TTS API.

#### Request

- **Content-Type:** `application/json`
- **Body:**

```json
{
  "text": "Hello, welcome to Sahaay!",
  "language": "en",
  "voice": "en-US-neural-female-1",
  "speed": 1.0,
  "pitch": 1.0
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "audioUrl": "https://example.com/tts-audio.mp3",
    "audioBase64": "data:audio/mp3;base64,//uQx...",
    "duration": 2.5,
    "voice": "en-US-neural-female-1"
  }
}
```

#### Example Usage

```javascript
const response = await fetch('/api/tts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'Hello, welcome to Sahaay!',
    language: 'en'
  })
});
```

## Language Support

The API supports three languages:

- `en`: English
- `hi`: Hindi
- `hinglish`: Hinglish (Hindi-English mix)

Each language uses different TTS voices:

- **English**: `en-US-neural-female-1`
- **Hindi**: `hi-IN-neural-female-1`
- **Hinglish**: `en-IN-neural-female-1`

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_FILE_FORMAT` | Uploaded file format not supported |
| `FILE_TOO_LARGE` | File size exceeds maximum limit |
| `MISSING_PARAMETERS` | Required parameters not provided |
| `API_KEY_INVALID` | External API key is invalid or expired |
| `RATE_LIMIT_EXCEEDED` | Too many requests in a short time |
| `PROCESSING_ERROR` | Error during image/audio processing |
| `NETWORK_ERROR` | Network connectivity issues |
| `INTERNAL_ERROR` | Unexpected server error |

## Rate Limits

- **General endpoints**: 100 requests per minute per IP
- **File upload endpoints**: 20 requests per minute per IP
- **Emergency endpoint**: 5 requests per minute per IP

## File Size Limits

- **Images**: Maximum 5MB
- **Audio**: Maximum 10MB

## Supported File Formats

### Images
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

### Audio
- MP3 (.mp3)
- WAV (.wav)
- WebM (.webm)
- OGG (.ogg)

## Health Check

**Endpoint:** `GET /api/health`

Check if the API server is running and healthy.

#### Response

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0",
    "services": {
      "murf_tts": "connected",
      "openai": "connected",
      "ocr": "available"
    }
  }
}
```

## WebSocket Support (Future)

The API is designed to support WebSocket connections for real-time features:

- Live object tracking
- Continuous scene description
- Real-time voice processing

WebSocket endpoint: `ws://localhost:3001/ws`

## SDK and Client Libraries

### JavaScript/TypeScript Client

```javascript
import { SahaayClient } from 'sahaay-client';

const client = new SahaayClient({
  baseUrl: 'http://localhost:3001/api',
  language: 'en'
});

// Scene description
const scene = await client.describeScene(imageBlob);

// Text reading
const text = await client.readText(imageBlob);

// Voice query
const response = await client.processVoice(audioBlob);
```

## Testing the API

### Using cURL

```bash
# Health check
curl -X GET http://localhost:3001/api/health

# TTS request
curl -X POST http://localhost:3001/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "language": "en"}'

# Scene description
curl -X POST http://localhost:3001/api/scene-description \
  -F "image=@/path/to/image.jpg" \
  -F "language=en"
```

### Using Postman

1. Import the Postman collection (if available)
2. Set the base URL to `http://localhost:3001/api`
3. Configure form-data for file uploads
4. Set appropriate headers for JSON requests

## Deployment Considerations

### Environment Variables

Ensure all required environment variables are set in production:

- `MURF_API_KEY`
- `OPENAI_API_KEY`
- `FRONTEND_URL` (for CORS)

### Security

- Enable HTTPS in production
- Configure proper CORS policies
- Implement rate limiting
- Add request validation
- Monitor API usage

### Performance

- Use CDN for audio file delivery
- Implement response caching
- Optimize image processing
- Monitor memory usage

### Monitoring

- Set up logging for all API requests
- Monitor external API quotas
- Track error rates and response times
- Set up alerts for service failures