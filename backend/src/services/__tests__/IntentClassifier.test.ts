import { IntentClassifier, Intent, IntentClassificationResult } from '../IntentClassifier';

describe('IntentClassifier', () => {
    let intentClassifier: IntentClassifier;

    beforeEach(() => {
        intentClassifier = new IntentClassifier();
    });

    describe('Emergency Intent Detection', () => {
        it('should detect "Sahaay, emergency" phrase - Requirements 6.1', () => {
            // Arrange
            const emergencyPhrases = [
                'Sahaay, emergency',
                'sahaay emergency',
                'SAHAAY EMERGENCY',
                'Sahaay emergency help me',
                'I need help sahaay emergency'
            ];

            for (const phrase of emergencyPhrases) {
                // Act
                const result = intentClassifier.classifyIntent(phrase);

                // Assert - Property: Emergency phrase detection
                expect(result.success).toBe(true);
                expect(result.intent.type).toBe('emergency');
                expect(result.intent.confidence).toBeGreaterThan(0.6);
                expect(result.intent.parameters?.trigger).toBe('voice_command');
            }
        });

        it('should detect other emergency keywords with lower confidence', () => {
            // Arrange
            const emergencyPhrases = [
                'help me urgent',
                'medical emergency',
                'I need assistance',
                'this is urgent',
                'call for help'
            ];

            for (const phrase of emergencyPhrases) {
                // Act
                const result = intentClassifier.classifyIntent(phrase);

                // Assert
                expect(result.success).toBe(true);
                expect(result.intent.type).toBe('emergency');
                expect(result.intent.confidence).toBeGreaterThan(0);
                expect(result.intent.confidence).toBeLessThan(1.0);
            }
        });

        it('should prioritize emergency over other intents', () => {
            // Arrange
            const mixedPhrase = 'sahaay emergency find my keys';

            // Act
            const result = intentClassifier.classifyIntent(mixedPhrase);

            // Assert
            expect(result.success).toBe(true);
            expect(result.intent.type).toBe('emergency');
            expect(result.intent.confidence).toBeGreaterThan(0.7);
        });
    });

    describe('Finder Intent Detection', () => {
        it('should detect finder requests and extract object names - Requirements 5.1', () => {
            // Arrange
            const finderQueries = [
                { query: 'find my keys', expectedObject: 'keys' },
                { query: 'where is the remote control', expectedObject: 'remote control' },
                { query: 'help me find my phone', expectedObject: 'phone' },
                { query: 'locate the coffee mug', expectedObject: 'coffee mug' },
                { query: 'search for my glasses', expectedObject: 'glasses' }
            ];

            for (const { query, expectedObject } of finderQueries) {
                // Act
                const result = intentClassifier.classifyIntent(query);

                // Assert - Property: Finder intent detection and parameter extraction
                expect(result.success).toBe(true);
                expect(result.intent.type).toBe('finder');
                expect(result.intent.confidence).toBeGreaterThan(0.4);
                expect(result.intent.parameters?.targetObject).toBe(expectedObject);
                expect(result.intent.parameters?.originalText).toBe(query);
            }
        });

        it('should handle finder queries without clear object names', () => {
            // Arrange
            const vagueQueries = [
                'find something',
                'where is it',
                'help me locate'
            ];

            for (const query of vagueQueries) {
                // Act
                const result = intentClassifier.classifyIntent(query);

                // Assert
                expect(result.success).toBe(true);
                expect(result.intent.type).toBe('finder');
                expect(result.intent.confidence).toBeGreaterThan(0.4);
                expect(result.intent.parameters?.targetObject).toBeDefined();
            }
        });

        it('should extract multi-word object names correctly', () => {
            // Arrange
            const complexQueries = [
                { query: 'find my car keys', expectedObject: 'car keys' },
                { query: 'where is the television remote', expectedObject: 'television remote' },
                { query: 'locate my reading glasses', expectedObject: 'reading glasses' }
            ];

            for (const { query, expectedObject } of complexQueries) {
                // Act
                const result = intentClassifier.classifyIntent(query);

                // Assert
                expect(result.success).toBe(true);
                expect(result.intent.type).toBe('finder');
                expect(result.intent.parameters?.targetObject).toBe(expectedObject);
            }
        });
    });

    describe('Scene Description Intent Detection', () => {
        it('should detect scene description requests - Requirements 1.4', () => {
            // Arrange
            const sceneQueries = [
                'describe the scene',
                'what do you see',
                'tell me about my surroundings',
                'what is in front of me',
                'describe the environment',
                'look around and tell me',
                'what objects are there'
            ];

            for (const query of sceneQueries) {
                // Act
                const result = intentClassifier.classifyIntent(query);

                // Assert - Property: Scene description intent detection
                expect(result.success).toBe(true);
                expect(result.intent.type).toBe('scene');
                expect(result.intent.confidence).toBeGreaterThan(0.4);
                expect(result.intent.parameters?.mode).toBe('description');
            }
        });

        it('should handle variations in scene description requests', () => {
            // Arrange
            const variations = [
                'camera view please',
                'visual description',
                'what\'s in the room',
                'describe this space'
            ];

            for (const query of variations) {
                // Act
                const result = intentClassifier.classifyIntent(query);

                // Assert
                expect(result.success).toBe(true);
                expect(result.intent.type).toBe('scene');
                expect(result.intent.confidence).toBeGreaterThan(0);
            }
        });
    });

    describe('Text Reading Intent Detection', () => {
        it('should detect text reading requests - Requirements 1.4', () => {
            // Arrange
            const textQueries = [
                'read the text',
                'what does this say',
                'read this document',
                'tell me what\'s written',
                'read the sign',
                'what\'s on the paper',
                'read the menu'
            ];

            for (const query of textQueries) {
                // Act
                const result = intentClassifier.classifyIntent(query);

                // Assert - Property: Text reading intent detection
                expect(result.success).toBe(true);
                expect(result.intent.type).toBe('text');
                expect(result.intent.confidence).toBeGreaterThan(0.4);
                expect(result.intent.parameters?.mode).toBe('ocr');
            }
        });

        it('should handle various text-related keywords', () => {
            // Arrange
            const textVariations = [
                'read the label',
                'what\'s written here',
                'text on screen',
                'read the instructions'
            ];

            for (const query of textVariations) {
                // Act
                const result = intentClassifier.classifyIntent(query);

                // Assert
                expect(result.success).toBe(true);
                expect(result.intent.type).toBe('text');
                expect(result.intent.confidence).toBeGreaterThan(0);
            }
        });
    });

    describe('General Intent Fallback', () => {
        it('should fallback to general intent for ambiguous inputs - Requirements 1.4', () => {
            // Arrange
            const generalQueries = [
                'what is the weather like',
                'tell me a joke',
                'how are you',
                'what time is it',
                'calculate 2 plus 2',
                'random question here'
            ];

            for (const query of generalQueries) {
                // Act
                const result = intentClassifier.classifyIntent(query);

                // Assert - Property: Ambiguous inputs fallback to general
                expect(result.success).toBe(true);
                expect(result.intent.type).toBe('general');
                expect(result.intent.confidence).toBe(0.5);
                expect(result.intent.parameters?.originalText).toBe(query);
            }
        });

        it('should handle mixed intent queries by choosing highest confidence', () => {
            // Arrange - Query that could match multiple intents but scene should win
            const mixedQuery = 'describe what you see and read any text';

            // Act
            const result = intentClassifier.classifyIntent(mixedQuery);

            // Assert - Should pick the intent with highest confidence
            expect(result.success).toBe(true);
            expect(['scene', 'text']).toContain(result.intent.type);
            expect(result.intent.confidence).toBeGreaterThan(0.4);
        });
    });

    describe('Input Validation', () => {
        it('should handle empty or invalid inputs gracefully', () => {
            // Arrange
            const invalidInputs = ['', '   ', '\n\t', null as any, undefined as any];

            for (const input of invalidInputs) {
                // Act
                const result = intentClassifier.classifyIntent(input);

                // Assert
                expect(result.success).toBe(false);
                expect(result.error).toBe('Input text cannot be empty');
                expect(result.intent.type).toBe('general');
                expect(result.intent.confidence).toBe(0);
            }
        });
    });

    describe('Intent Priority and Confidence', () => {
        it('should respect intent priority hierarchy', () => {
            // Emergency should have highest priority
            const emergencyMixed = 'sahaay emergency find my keys describe scene';
            const emergencyResult = intentClassifier.classifyIntent(emergencyMixed);
            expect(emergencyResult.intent.type).toBe('emergency');

            // Finder should have higher priority than scene/text
            const finderMixed = 'find my book and read the text';
            const finderResult = intentClassifier.classifyIntent(finderMixed);
            expect(finderResult.intent.type).toBe('finder');
        });

        it('should return appropriate confidence levels', () => {
            // High confidence cases
            const highConfidenceQueries = [
                { query: 'sahaay emergency', expectedType: 'emergency' },
                { query: 'find my keys', expectedType: 'finder' },
                { query: 'describe the scene', expectedType: 'scene' },
                { query: 'read the text', expectedType: 'text' }
            ];

            for (const { query, expectedType } of highConfidenceQueries) {
                const result = intentClassifier.classifyIntent(query);
                expect(result.intent.type).toBe(expectedType);
                if (expectedType === 'emergency') {
                    expect(result.intent.confidence).toBeGreaterThan(0.6);
                } else {
                    expect(result.intent.confidence).toBeGreaterThan(0.4);
                }
            }
        });
    });

    describe('Service Configuration and Utilities', () => {
        it('should return supported intent types', () => {
            // Act
            const supportedIntents = intentClassifier.getSupportedIntents();

            // Assert
            expect(supportedIntents).toEqual(['scene', 'text', 'general', 'finder', 'emergency']);
        });

        it('should return confidence thresholds', () => {
            // Act
            const thresholds = intentClassifier.getConfidenceThresholds();

            // Assert
            expect(thresholds).toEqual({
                emergency: 0.6,
                finder: 0.4,
                scene: 0.4,
                text: 0.4,
                general: 0.0
            });
        });

        it('should allow adding custom keywords', () => {
            // Act
            const success = intentClassifier.addKeywords('scene', ['panorama', 'vista']);

            // Assert
            expect(success).toBe(true);

            // Test that new keywords work
            const result = intentClassifier.classifyIntent('show me the panorama');
            expect(result.intent.type).toBe('scene');
        });

        it('should reject invalid intent types for keyword addition', () => {
            // Act
            const success = intentClassifier.addKeywords('invalid', ['test']);

            // Assert
            expect(success).toBe(false);
        });

        it('should return current keywords', () => {
            // Act
            const allKeywords = intentClassifier.getKeywords();
            const sceneKeywords = intentClassifier.getKeywords('scene');

            // Assert
            expect(allKeywords).toHaveProperty('scene');
            expect(allKeywords).toHaveProperty('text');
            expect(allKeywords).toHaveProperty('finder');
            expect(allKeywords).toHaveProperty('emergency');
            expect(Array.isArray(sceneKeywords)).toBe(true);
            expect((sceneKeywords as string[]).length).toBeGreaterThan(0);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle very long input text', () => {
            // Arrange
            const longText = 'find my keys '.repeat(100) + 'please help me locate them';

            // Act
            const result = intentClassifier.classifyIntent(longText);

            // Assert
            expect(result.success).toBe(true);
            expect(result.intent.type).toBe('finder');
        });

        it('should handle special characters and punctuation', () => {
            // Arrange
            const specialQueries = [
                'find my keys!!!',
                'what do you see???',
                'read this... please',
                'sahaay, emergency!!!'
            ];

            for (const query of specialQueries) {
                // Act
                const result = intentClassifier.classifyIntent(query);

                // Assert
                expect(result.success).toBe(true);
                expect(result.intent.confidence).toBeGreaterThan(0);
            }
        });

        it('should handle case insensitive matching', () => {
            // Arrange
            const caseVariations = [
                'FIND MY KEYS',
                'Describe The Scene',
                'READ THE TEXT',
                'SAHAAY EMERGENCY'
            ];

            for (const query of caseVariations) {
                // Act
                const result = intentClassifier.classifyIntent(query);

                // Assert
                expect(result.success).toBe(true);
                expect(result.intent.confidence).toBeGreaterThan(0.6);
            }
        });
    });
});