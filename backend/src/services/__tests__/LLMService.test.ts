import { LLMService, LLMQuery, LLMResponse, LLMConfig } from '../LLMService';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');
const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

describe('LLMService', () => {
    let llmService: LLMService;
    let mockConfig: LLMConfig;
    let mockCreate: jest.Mock;

    beforeEach(() => {
        mockConfig = {
            apiKey: 'test-openai-key',
            model: 'gpt-4',
            maxTokens: 500,
            temperature: 0.7
        };

        // Create mock for the create method
        mockCreate = jest.fn();

        // Mock the OpenAI constructor to return an object with the mocked methods
        MockedOpenAI.mockImplementation(() => ({
            chat: {
                completions: {
                    create: mockCreate
                }
            }
        } as any));

        llmService = new LLMService(mockConfig);
        jest.clearAllMocks();
    });

    describe('Date/Time Query Handling', () => {
        it('should handle date/time queries with current timestamp - Requirements 4.3', async () => {
            // Arrange
            const dateTimeQueries = [
                'What time is it?',
                'What is the current date?',
                'Tell me the time and date',
                'What day is today?',
                'Current time please'
            ];

            for (const query of dateTimeQueries) {
                // Act
                const result = await llmService.processQuery({ prompt: query });

                // Assert - Property: Date/time queries return accurate current date and time
                expect(result.success).toBe(true);
                expect(result.response).toBeDefined();
                expect(result.response.length).toBeGreaterThan(0);

                // Should not call OpenAI for date/time queries
                expect(mockCreate).not.toHaveBeenCalled();

                // Response should contain time or date information
                const lowerResponse = result.response.toLowerCase();
                const hasTimeInfo = lowerResponse.includes('time') ||
                    lowerResponse.includes('am') ||
                    lowerResponse.includes('pm') ||
                    lowerResponse.includes(':');
                const hasDateInfo = lowerResponse.includes('today') ||
                    lowerResponse.includes('day') ||
                    lowerResponse.includes('date') ||
                    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/.test(lowerResponse);

                expect(hasTimeInfo || hasDateInfo).toBe(true);

                // Clear mock for next iteration
                jest.clearAllMocks();
            }
        });

        it('should provide specific time when only time is requested', async () => {
            // Arrange
            const timeQuery = 'What time is it?';

            // Act
            const result = await llmService.processQuery({ prompt: timeQuery });

            // Assert
            expect(result.success).toBe(true);
            expect(result.response.toLowerCase()).toContain('time');
            expect(result.response.toLowerCase()).not.toContain('today is');
        });

        it('should provide specific date when only date is requested', async () => {
            // Arrange
            const dateQuery = 'What is the date today?';

            // Act
            const result = await llmService.processQuery({ prompt: dateQuery });

            // Assert
            expect(result.success).toBe(true);
            expect(result.response.toLowerCase()).toContain('today is');
            expect(result.response.toLowerCase()).not.toContain('current time');
        });
    });

    describe('Timer Query Handling', () => {
        it('should handle timer requests with acknowledgment - Requirements 4.4', async () => {
            // Arrange
            const timerQueries = [
                'Set a timer for 5 minutes',
                'Start timer for 1 hour',
                'Remind me in 30 seconds',
                'Set alarm for 2 hours',
                'Timer for 10 minutes please'
            ];

            for (const query of timerQueries) {
                // Act
                const result = await llmService.processQuery({ prompt: query });

                // Assert - Property: Timer queries return acknowledgment responses
                expect(result.success).toBe(true);
                expect(result.response).toBeDefined();
                expect(result.response.length).toBeGreaterThan(0);

                // Should not call OpenAI for timer queries
                expect(mockCreate).not.toHaveBeenCalled();

                // Response should acknowledge the timer request
                const lowerResponse = result.response.toLowerCase();
                expect(lowerResponse).toMatch(/timer|acknowledge|understand|note/);

                // Clear mock for next iteration
                jest.clearAllMocks();
            }
        });

        it('should extract timer duration when specified', async () => {
            // Arrange
            const timerQuery = 'Set a timer for 15 minutes';

            // Act
            const result = await llmService.processQuery({ prompt: timerQuery });

            // Assert
            expect(result.success).toBe(true);
            expect(result.response).toContain('15');
            expect(result.response.toLowerCase()).toContain('minute');
        });

        it('should handle timer requests without specific duration', async () => {
            // Arrange
            const timerQuery = 'Set a timer';

            // Act
            const result = await llmService.processQuery({ prompt: timerQuery });

            // Assert
            expect(result.success).toBe(true);
            expect(result.response.toLowerCase()).toMatch(/timer|acknowledge/);
        });
    });

    describe('General Query Handling', () => {
        it('should route general queries to LLM - Requirements 4.2', async () => {
            // Arrange
            const mockResponse = {
                choices: [{
                    message: {
                        content: 'This is a helpful response from the AI assistant.'
                    }
                }]
            };
            mockCreate.mockResolvedValue(mockResponse);

            const generalQuery = 'What is the capital of France?';

            // Act
            const result = await llmService.processQuery({ prompt: generalQuery });

            // Assert - Property: General queries route to LLM
            expect(result.success).toBe(true);
            expect(result.response).toBe('This is a helpful response from the AI assistant.');
            expect(mockCreate).toHaveBeenCalledWith({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: expect.stringContaining('You are Sahaay')
                    },
                    {
                        role: 'user',
                        content: generalQuery
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            }, {
                timeout: 30000
            });
        });

        it('should include context in system message when provided', async () => {
            // Arrange
            const mockResponse = {
                choices: [{
                    message: {
                        content: 'Contextual response'
                    }
                }]
            };
            mockCreate.mockResolvedValue(mockResponse);

            const query: LLMQuery = {
                prompt: 'Tell me about this',
                context: 'User is looking at a red car'
            };

            // Act
            const result = await llmService.processQuery(query);

            // Assert
            expect(result.success).toBe(true);
            expect(mockCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    messages: expect.arrayContaining([
                        expect.objectContaining({
                            role: 'system',
                            content: expect.stringContaining('User is looking at a red car')
                        })
                    ])
                }),
                expect.objectContaining({
                    timeout: 30000
                })
            );
        });

        it('should handle OpenAI API errors with retry logic', async () => {
            // Arrange
            mockCreate
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({
                    choices: [{
                        message: {
                            content: 'Success after retry'
                        }
                    }]
                });

            const query = 'Test retry logic';

            // Act
            const result = await llmService.processQuery({ prompt: query });

            // Assert
            expect(result.success).toBe(true);
            expect(result.response).toBe('Success after retry');
            expect(mockCreate).toHaveBeenCalledTimes(3);
        });

        it('should fail gracefully after maximum retries', async () => {
            // Arrange
            mockCreate.mockRejectedValue(new Error('Persistent error'));

            const query = 'Test max retries';

            // Act
            const result = await llmService.processQuery({ prompt: query });

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.response).toContain('cannot process your request');
            expect(mockCreate).toHaveBeenCalledTimes(3);
        });

        it('should not retry on client errors', async () => {
            // Arrange
            mockCreate.mockRejectedValue(new Error('Invalid API key'));

            const query = 'Test no retry on client error';

            // Act
            const result = await llmService.processQuery({ prompt: query });

            // Assert
            expect(result.success).toBe(false);
            expect(mockCreate).toHaveBeenCalledTimes(1); // No retries
        });
    });

    describe('Input Validation', () => {
        it('should handle empty queries gracefully', async () => {
            // Arrange
            const emptyQueries = ['', '   ', '\n\t'];

            for (const query of emptyQueries) {
                // Act
                const result = await llmService.processQuery({ prompt: query });

                // Assert
                expect(result.success).toBe(false);
                expect(result.error).toBe('Query cannot be empty');
                expect(mockCreate).not.toHaveBeenCalled();

                // Clear mock for next iteration
                jest.clearAllMocks();
            }
        });
    });

    describe('Service Configuration', () => {
        it('should validate configuration correctly', () => {
            // Act & Assert - Valid config
            expect(llmService.validateConfig()).toBe(true);
        });

        it('should throw error for missing API key', () => {
            // Act & Assert
            expect(() => {
                new LLMService({ apiKey: '' });
            }).toThrow('OpenAI API key is required');
        });

        it('should return safe configuration without API key', () => {
            // Act
            const config = llmService.getConfig();

            // Assert
            expect(config).toEqual({
                model: 'gpt-4',
                maxTokens: 500,
                temperature: 0.7
            });
            expect(config).not.toHaveProperty('apiKey');
        });
    });

    describe('Intent Classification', () => {
        it('should correctly identify date/time queries', async () => {
            // Arrange
            const dateTimeQueries = [
                'what time is it',
                'current date please',
                'tell me today\'s date',
                'what hour is it',
                'show me the clock'
            ];

            for (const query of dateTimeQueries) {
                // Act
                const result = await llmService.processQuery({ prompt: query });

                // Assert - Should be handled as date/time, not sent to OpenAI
                expect(result.success).toBe(true);
                expect(mockCreate).not.toHaveBeenCalled();

                // Clear mock for next iteration
                jest.clearAllMocks();
            }
        });

        it('should correctly identify timer queries', async () => {
            // Arrange
            const timerQueries = [
                'set timer for 5 minutes',
                'start alarm in 1 hour',
                'remind me in 30 seconds',
                'countdown 10 minutes'
            ];

            for (const query of timerQueries) {
                // Act
                const result = await llmService.processQuery({ prompt: query });

                // Assert - Should be handled as timer, not sent to OpenAI
                expect(result.success).toBe(true);
                expect(mockCreate).not.toHaveBeenCalled();

                // Clear mock for next iteration
                jest.clearAllMocks();
            }
        });

        it('should route non-date/timer queries to OpenAI', async () => {
            // Arrange
            const mockResponse = {
                choices: [{
                    message: {
                        content: 'General response'
                    }
                }]
            };
            mockCreate.mockResolvedValue(mockResponse);

            const generalQueries = [
                'What is the weather like?',
                'Tell me a joke',
                'How do I cook pasta?',
                'What is artificial intelligence?'
            ];

            for (const query of generalQueries) {
                // Act
                const result = await llmService.processQuery({ prompt: query });

                // Assert - Should be sent to OpenAI
                expect(result.success).toBe(true);
                expect(mockCreate).toHaveBeenCalled();

                // Clear mock for next iteration
                jest.clearAllMocks();
            }
        });
    });
});