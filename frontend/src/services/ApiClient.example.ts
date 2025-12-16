/**
 * API Client Usage Examples
 * Demonstrates how to use the API client service
 */

import { apiClient, getSceneDescription, sendVoiceQuery } from './ApiClient';

// Example 1: Using the singleton instance directly
export async function exampleSceneDescription(imageBlob: Blob, language: string) {
    try {
        const result = await apiClient.getSceneDescription(imageBlob, language);
        console.log('Scene description:', result.description);
        console.log('Detected objects:', result.objects);

        // Play audio if available
        if (result.audioUrl) {
            const audio = new Audio(result.audioUrl);
            await audio.play();
        }

        return result;
    } catch (error) {
        console.error('Scene description failed:', error);
        throw error;
    }
}

// Example 2: Using the exported function directly
export async function exampleVoiceQuery(audioBlob: Blob, language: string) {
    try {
        const result = await sendVoiceQuery(audioBlob, language);
        console.log('Voice query result:', result);
        console.log('Detected intent:', result.intent);

        return result;
    } catch (error) {
        console.error('Voice query failed:', error);
        throw error;
    }
}

// Example 3: Handling offline scenarios
export async function exampleWithOfflineHandling(imageBlob: Blob, language: string) {
    // Check if online
    if (!apiClient.getOnlineStatus()) {
        console.log('Currently offline. Request will be queued.');
        console.log('Queued requests:', apiClient.getQueuedRequestCount());
    }

    try {
        // This will either execute immediately (if online) or queue for later (if offline)
        const result = await getSceneDescription(imageBlob, language);
        return result;
    } catch (error) {
        console.error('Request failed:', error);
        throw error;
    }
}

// Example 4: Emergency trigger with location
export async function exampleEmergencyTrigger() {
    try {
        // Get user location
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        };

        // Trigger emergency
        const result = await apiClient.triggerEmergency(location, 'en');
        console.log('Emergency triggered:', result);

        return result;
    } catch (error) {
        console.error('Emergency trigger failed:', error);
        // Trigger emergency without location as fallback
        return await apiClient.triggerEmergency(undefined, 'en');
    }
}

// Example 5: Text-to-speech conversion
export async function exampleTextToSpeech(text: string, language: string) {
    try {
        const result = await apiClient.textToSpeech(text, language);

        if (result.audioUrl) {
            const audio = new Audio(result.audioUrl);
            await audio.play();
        } else if (result.audioBase64) {
            const audio = new Audio(`data:audio/wav;base64,${result.audioBase64}`);
            await audio.play();
        }

        return result;
    } catch (error) {
        console.error('TTS conversion failed:', error);
        throw error;
    }
}