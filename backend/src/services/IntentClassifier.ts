export interface Intent {
    type: 'scene' | 'text' | 'general' | 'finder' | 'emergency';
    confidence: number;
    parameters?: Record<string, any>;
}

export interface IntentClassificationResult {
    intent: Intent;
    success: boolean;
    error?: string;
}

export class IntentClassifier {
    private sceneKeywords: string[] = [
        'describe', 'scene', 'what do you see', 'what is in front', 'what\'s around',
        'surroundings', 'environment', 'look around', 'what\'s there', 'objects',
        'people', 'room', 'area', 'space', 'view', 'sight', 'visual', 'camera'
    ];

    private textKeywords: string[] = [
        'read', 'text', 'words', 'writing', 'document', 'paper', 'sign',
        'label', 'book', 'letter', 'message', 'note', 'page', 'screen',
        'display', 'menu', 'instructions', 'receipt', 'bill', 'card',
        'what does this say', 'what\'s written', 'what\'s on'
    ];

    private finderKeywords: string[] = [
        'find', 'locate', 'where is', 'search for', 'look for', 'help me find',
        'can you find', 'spot', 'detect', 'identify location', 'point me to',
        'direction to', 'guide me to', 'show me where'
    ];

    private emergencyKeywords: string[] = [
        'sahaay emergency', 'emergency', 'urgent', 'crisis',
        'danger', 'accident', 'medical emergency', 'call for help',
        'need assistance', 'trouble', 'panic', 'distress'
    ];

    /**
     * Classify the intent of user input text
     */
    classifyIntent(text: string): IntentClassificationResult {
        if (!text || text.trim().length === 0) {
            return {
                success: false,
                error: 'Input text cannot be empty',
                intent: {
                    type: 'general',
                    confidence: 0
                }
            };
        }

        const normalizedText = text.toLowerCase().trim();

        try {
            // Check for emergency intent first (highest priority)
            const emergencyResult = this.checkEmergencyIntent(normalizedText);
            if (emergencyResult.confidence > 0.6) {
                return {
                    success: true,
                    intent: emergencyResult
                };
            }

            // Check for finder intent (second priority)
            const finderResult = this.checkFinderIntent(normalizedText);
            if (finderResult.confidence > 0.4) {
                return {
                    success: true,
                    intent: finderResult
                };
            }

            // Check for scene description intent
            const sceneResult = this.checkSceneIntent(normalizedText);
            if (sceneResult.confidence > 0.4) {
                return {
                    success: true,
                    intent: sceneResult
                };
            }

            // Check for text reading intent
            const textResult = this.checkTextIntent(normalizedText);
            if (textResult.confidence > 0.4) {
                return {
                    success: true,
                    intent: textResult
                };
            }

            // Default to general intent for ambiguous inputs
            return {
                success: true,
                intent: {
                    type: 'general',
                    confidence: 0.5,
                    parameters: {
                        originalText: text
                    }
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during intent classification',
                intent: {
                    type: 'general',
                    confidence: 0
                }
            };
        }
    }

    /**
     * Check for emergency intent
     */
    private checkEmergencyIntent(text: string): Intent {
        let confidence = 0;

        // Exact match for "sahaay emergency" gets highest confidence
        if (text.includes('sahaay emergency')) {
            confidence = 1.0;
        } else {
            // Check for other emergency keywords (excluding "sahaay emergency")
            const matchedKeywords = this.emergencyKeywords.filter(keyword =>
                keyword !== 'sahaay emergency' && text.includes(keyword)
            );

            if (matchedKeywords.length > 0) {
                confidence = Math.min(0.9, 0.5 + (matchedKeywords.length * 0.2));
            }
        }

        return {
            type: 'emergency',
            confidence,
            parameters: confidence > 0 ? { trigger: 'voice_command' } : undefined
        };
    }

    /**
     * Check for finder intent and extract object name
     */
    private checkFinderIntent(text: string): Intent {
        let confidence = 0;
        let targetObject = '';

        const matchedKeywords = this.finderKeywords.filter(keyword =>
            text.includes(keyword)
        );

        if (matchedKeywords.length > 0) {
            confidence = Math.min(0.9, 0.4 + (matchedKeywords.length * 0.2));

            // Extract object name after finder keywords
            targetObject = this.extractObjectName(text, matchedKeywords);
        }

        return {
            type: 'finder',
            confidence,
            parameters: confidence > 0 ? {
                targetObject: targetObject || 'unknown object',
                originalText: text
            } : undefined
        };
    }

    /**
     * Check for scene description intent
     */
    private checkSceneIntent(text: string): Intent {
        let confidence = 0;

        const matchedKeywords = this.sceneKeywords.filter(keyword =>
            text.includes(keyword)
        );

        if (matchedKeywords.length > 0) {
            confidence = Math.min(0.9, 0.4 + (matchedKeywords.length * 0.15));
        }

        return {
            type: 'scene',
            confidence,
            parameters: confidence > 0 ? { mode: 'description' } : undefined
        };
    }

    /**
     * Check for text reading intent
     */
    private checkTextIntent(text: string): Intent {
        let confidence = 0;

        const matchedKeywords = this.textKeywords.filter(keyword =>
            text.includes(keyword)
        );

        if (matchedKeywords.length > 0) {
            confidence = Math.min(0.9, 0.4 + (matchedKeywords.length * 0.15));
        }

        return {
            type: 'text',
            confidence,
            parameters: confidence > 0 ? { mode: 'ocr' } : undefined
        };
    }

    /**
     * Extract object name from finder queries
     */
    private extractObjectName(text: string, matchedKeywords: string[]): string {
        // Find the longest matched keyword to use as anchor
        const longestKeyword = matchedKeywords.reduce((longest, current) =>
            current.length > longest.length ? current : longest
        );

        // Extract text after the finder keyword
        const keywordIndex = text.indexOf(longestKeyword);
        if (keywordIndex === -1) return '';

        const afterKeyword = text.substring(keywordIndex + longestKeyword.length).trim();

        // Remove common articles and prepositions
        const cleanedText = afterKeyword
            .replace(/^(the|a|an|my|for|to)\s+/i, '')
            .trim();

        // Take the first few words as the object name (max 3 words)
        const words = cleanedText.split(/\s+/).slice(0, 3);
        return words.join(' ').trim();
    }

    /**
     * Get all supported intent types
     */
    getSupportedIntents(): string[] {
        return ['scene', 'text', 'general', 'finder', 'emergency'];
    }

    /**
     * Get confidence threshold for each intent type
     */
    getConfidenceThresholds(): Record<string, number> {
        return {
            emergency: 0.6,
            finder: 0.4,
            scene: 0.4,
            text: 0.4,
            general: 0.0 // Always fallback to general
        };
    }

    /**
     * Add custom keywords for specific intent types
     */
    addKeywords(intentType: string, keywords: string[]): boolean {
        try {
            switch (intentType) {
                case 'scene':
                    this.sceneKeywords.push(...keywords);
                    break;
                case 'text':
                    this.textKeywords.push(...keywords);
                    break;
                case 'finder':
                    this.finderKeywords.push(...keywords);
                    break;
                case 'emergency':
                    this.emergencyKeywords.push(...keywords);
                    break;
                default:
                    return false;
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get current keywords for debugging/testing
     */
    getKeywords(intentType?: string): Record<string, string[]> | string[] {
        const allKeywords = {
            scene: this.sceneKeywords,
            text: this.textKeywords,
            finder: this.finderKeywords,
            emergency: this.emergencyKeywords
        };

        if (intentType) {
            return allKeywords[intentType as keyof typeof allKeywords] || [];
        }

        return allKeywords;
    }
}

// Factory function to create IntentClassifier instance
export function createIntentClassifier(): IntentClassifier {
    return new IntentClassifier();
}