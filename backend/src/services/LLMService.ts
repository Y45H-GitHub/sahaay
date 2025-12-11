import OpenAI from 'openai';

export interface LLMQuery {
    prompt: string;
    context?: string;
}

export interface LLMResponse {
    response: string;
    success: boolean;
    error?: string;
}

export interface LLMConfig {
    apiKey: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
}

export class LLMService {
    private openai: OpenAI;
    private config: LLMConfig;
    private maxRetries: number = 3;
    private retryDelay: number = 1000; // 1 second

    constructor(config: LLMConfig) {
        this.config = {
            model: 'gpt-4',
            maxTokens: 500,
            temperature: 0.7,
            ...config
        };

        if (!config.apiKey) {
            throw new Error('OpenAI API key is required');
        }

        this.openai = new OpenAI({
            apiKey: config.apiKey
        });
    }

    /**
     * Process general questions and provide context-aware responses
     */
    async processQuery(query: LLMQuery): Promise<LLMResponse> {
        const { prompt, context } = query;

        if (!prompt || prompt.trim().length === 0) {
            return {
                success: false,
                error: 'Query cannot be empty',
                response: ''
            };
        }

        // Check if this is a timer request (check first to avoid conflicts with time keywords)
        if (this.isTimerQuery(prompt)) {
            return this.handleTimerQuery(prompt);
        }

        // Check if this is a date/time query
        if (this.isDateTimeQuery(prompt)) {
            return this.handleDateTimeQuery(prompt);
        }

        // Handle general questions with OpenAI
        return await this.handleGeneralQuery(prompt, context);
    }

    /**
     * Check if the query is a timer request (check this first before date/time)
     */
    private isTimerQuery(prompt: string): boolean {
        const timerKeywords = [
            'timer', 'set timer', 'start timer', 'remind me', 'alarm',
            'wake me up', 'countdown', 'set alarm', 'schedule'
        ];

        const lowerPrompt = prompt.toLowerCase();
        return timerKeywords.some(keyword => lowerPrompt.includes(keyword));
    }

    /**
     * Check if the query is asking for date/time information
     */
    private isDateTimeQuery(prompt: string): boolean {
        // First check if it's a timer query to avoid conflicts
        if (this.isTimerQuery(prompt)) {
            return false;
        }

        const dateTimeKeywords = [
            'what time is it', 'what day is it', 'what is the date',
            'current time', 'current date', 'today', 'now',
            'clock', 'calendar', 'hour', 'minute', 'second', 'day', 'month', 'year'
        ];

        const lowerPrompt = prompt.toLowerCase();

        // Check for specific time/date phrases first
        const specificPhrases = [
            'what time is it', 'what day is it', 'what is the date',
            'current time', 'current date', 'tell me the time', 'show me the time',
            'show me the clock', 'tell me today\'s date', 'current date please',
            'what hour is it'
        ];

        if (specificPhrases.some(phrase => lowerPrompt.includes(phrase))) {
            return true;
        }

        // Check for individual keywords but be more specific
        const timeWords = ['time', 'clock'];
        const dateWords = ['date', 'today', 'day'];

        const hasTimeWord = timeWords.some(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            return regex.test(lowerPrompt);
        });

        const hasDateWord = dateWords.some(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            return regex.test(lowerPrompt);
        });

        return hasTimeWord || hasDateWord;
    }

    /**
     * Handle date/time queries with current timestamp
     */
    private handleDateTimeQuery(prompt: string): LLMResponse {
        try {
            const now = new Date();

            // Format current date and time
            const dateOptions: Intl.DateTimeFormatOptions = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };

            const timeOptions: Intl.DateTimeFormatOptions = {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            };

            const currentDate = now.toLocaleDateString('en-US', dateOptions);
            const currentTime = now.toLocaleTimeString('en-US', timeOptions);

            let response = '';

            // Determine what specific information was requested
            const lowerPrompt = prompt.toLowerCase();
            if (lowerPrompt.includes('time') && !lowerPrompt.includes('date')) {
                response = `The current time is ${currentTime}.`;
            } else if (lowerPrompt.includes('date') && !lowerPrompt.includes('time')) {
                response = `Today is ${currentDate}.`;
            } else {
                response = `Today is ${currentDate}, and the current time is ${currentTime}.`;
            }

            return {
                success: true,
                response: response
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to get current date and time',
                response: 'I apologize, but I cannot retrieve the current date and time right now.'
            };
        }
    }

    /**
     * Handle timer requests with acknowledgment
     */
    private handleTimerQuery(prompt: string): LLMResponse {
        try {
            // Extract time duration if possible
            const timePattern = /(\d+)\s*(minute|minutes|min|hour|hours|hr|second|seconds|sec)/i;
            const match = prompt.match(timePattern);

            let response = '';
            if (match) {
                const duration = match[1];
                const unit = match[2].toLowerCase();
                response = `I understand you want to set a timer for ${duration} ${unit}. `;
            }

            response += 'Timer request acknowledged. Please note that I can only acknowledge timer requests - you will need to use your device\'s built-in timer or alarm functionality to actually set the timer.';

            return {
                success: true,
                response: response
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to process timer request',
                response: 'I apologize, but I cannot process your timer request right now.'
            };
        }
    }

    /**
     * Handle general questions using OpenAI GPT-4
     */
    private async handleGeneralQuery(prompt: string, context?: string): Promise<LLMResponse> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                // Construct the system message for context-aware responses
                const systemMessage = `You are Sahaay, a helpful voice assistant designed for visually impaired users. 
                Provide clear, concise, and helpful responses. Keep your answers brief but informative, 
                as they will be converted to speech. Be empathetic and supportive in your tone.
                ${context ? `Additional context: ${context}` : ''}`;

                const completion = await this.openai.chat.completions.create({
                    model: this.config.model!,
                    messages: [
                        {
                            role: 'system',
                            content: systemMessage
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: this.config.maxTokens,
                    temperature: this.config.temperature
                }, {
                    timeout: 30000 // 30 second timeout
                });

                const response = completion.choices[0]?.message?.content;

                if (!response) {
                    throw new Error('No response generated from OpenAI');
                }

                return {
                    success: true,
                    response: response.trim()
                };

            } catch (error) {
                lastError = error as Error;
                console.error(`LLM attempt ${attempt} failed:`, error);

                // Don't retry on client errors (4xx) or rate limit errors
                if (error instanceof Error) {
                    const errorMessage = error.message.toLowerCase();
                    if (errorMessage.includes('rate limit') ||
                        errorMessage.includes('quota') ||
                        errorMessage.includes('invalid') ||
                        errorMessage.includes('unauthorized')) {
                        break;
                    }
                }

                // Wait before retrying (exponential backoff)
                if (attempt < this.maxRetries) {
                    await this.delay(this.retryDelay * Math.pow(2, attempt - 1));
                }
            }
        }

        return {
            success: false,
            error: lastError?.message || 'Failed to process query after retries',
            response: 'I apologize, but I cannot process your request right now. Please try again later.'
        };
    }

    /**
     * Utility method for delays
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Validate API configuration
     */
    validateConfig(): boolean {
        return !!(this.config.apiKey);
    }

    /**
     * Get current configuration (without sensitive data)
     */
    getConfig(): Omit<LLMConfig, 'apiKey'> {
        const { apiKey, ...safeConfig } = this.config;
        return safeConfig;
    }
}

// Factory function to create LLM service instance
export function createLLMService(): LLMService {
    const config: LLMConfig = {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'gpt-4',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '500'),
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')
    };

    if (!config.apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set. LLM service cannot be initialized.');
    }

    return new LLMService(config);
}