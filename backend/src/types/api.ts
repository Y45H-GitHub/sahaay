// Voice Query Types
export interface VoiceQueryRequest {
    audio: Express.Multer.File;
    language: string;
}

export interface VoiceQueryResponse {
    intent: string;
    response: string;
    audioUrl: string | null;
    audioBase64?: string;
}

// Scene Description Types
export interface SceneDescriptionRequest {
    image: Express.Multer.File;
    language: string;
}

export interface DetectedObject {
    name: string;
    position: string;
    confidence: number;
}

export interface SceneDescriptionResponse {
    description: string;
    objects: DetectedObject[];
    audioUrl: string | null;
}

// Text Reading Types
export interface ReadTextRequest {
    image: Express.Multer.File;
    language: string;
}

export interface ReadTextResponse {
    text: string;
    audioUrl: string | null;
}

// Object Finder Types
export interface FindObjectRequest {
    image: Express.Multer.File;
    targetObject: string;
    language: string;
}

export interface FindObjectResponse {
    found: boolean;
    direction?: string;
    message: string;
    audioUrl: string | null;
}

// Emergency Types
export interface EmergencyRequest {
    location?: {
        latitude: number;
        longitude: number;
    };
    language: string;
}

export interface EmergencyResponse {
    status: string;
    message: string;
    audioUrl: string | null;
}

// TTS Types
export interface TTSRequest {
    text: string;
    language: string;
    voice?: string;
}

export interface TTSResponse {
    audioUrl: string | null;
    audioBase64?: string;
}

// Common Error Response
export interface ErrorResponse {
    error: {
        message: string;
        status: number;
        stack?: string;
    };
}