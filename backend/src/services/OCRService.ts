import { createWorker, Worker } from 'tesseract.js';

export interface OCRResult {
    text: string;
    confidence: number;
    blocks: Array<{
        text: string;
        boundingBox: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    }>;
}

export interface OCRServiceResult {
    text: string;
    confidence: number;
    success: boolean;
    error?: string;
}

export interface OCRServiceConfig {
    languages: string[];
    enableLogging: boolean;
}

export class OCRService {
    private worker: Worker | null = null;
    private config: OCRServiceConfig;
    private isInitialized: boolean = false;
    private maxRetries: number = 3;
    private retryDelay: number = 1000; // 1 second

    constructor(config?: Partial<OCRServiceConfig>) {
        this.config = {
            languages: ['eng', 'hin'], // English and Hindi support
            enableLogging: false,
            ...config
        };
    }

    /**
     * Initialize the OCR worker
     */
    private async initializeWorker(language?: string): Promise<void> {
        if (this.isInitialized && this.worker) {
            return;
        }

        try {
            // Use the requested language or default to English
            const tesseractLanguage = language ? this.mapLanguageCode(language) : 'eng';

            const workerOptions: any = {};
            if (this.config.enableLogging) {
                workerOptions.logger = (m: any) => console.log(m);
            }

            this.worker = await createWorker(tesseractLanguage, 1, workerOptions);
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize OCR worker:', error);
            throw new Error('OCR service initialization failed');
        }
    }

    /**
     * Extract text from image buffer
     */
    async extractText(imageBuffer: Buffer, language: string = 'eng'): Promise<OCRServiceResult> {
        if (!imageBuffer || imageBuffer.length === 0) {
            return {
                text: '',
                confidence: 0,
                success: false,
                error: 'Invalid image data'
            };
        }

        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                await this.initializeWorker(language);

                if (!this.worker) {
                    throw new Error('OCR worker not initialized');
                }

                // Perform OCR
                const { data } = await this.worker.recognize(imageBuffer);

                if (!data) {
                    throw new Error('No OCR data received');
                }

                // Extract and clean text
                const rawText = data.text || '';
                const cleanedText = this.cleanText(rawText);
                const confidence = data.confidence || 0;

                // Extract blocks for detailed analysis
                const blocks = this.extractBlocks(data);

                return {
                    text: cleanedText,
                    confidence: confidence / 100, // Convert to 0-1 scale
                    success: true
                };

            } catch (error) {
                lastError = error as Error;
                console.error(`OCR attempt ${attempt} failed:`, error);

                // Wait before retrying
                if (attempt < this.maxRetries) {
                    await this.delay(this.retryDelay * Math.pow(2, attempt - 1));
                }
            }
        }

        return {
            text: '',
            confidence: 0,
            success: false,
            error: lastError?.message || 'OCR processing failed after retries'
        };
    }

    /**
     * Extract text with detailed block information
     */
    async extractTextWithBlocks(imageBuffer: Buffer, language: string = 'eng'): Promise<OCRResult> {
        await this.initializeWorker(language);

        if (!this.worker) {
            throw new Error('OCR worker not initialized');
        }

        const { data } = await this.worker.recognize(imageBuffer);

        const rawText = data.text || '';
        const cleanedText = this.cleanText(rawText);
        const confidence = (data.confidence || 0) / 100;
        const blocks = this.extractBlocks(data);

        return {
            text: cleanedText,
            confidence,
            blocks
        };
    }

    /**
     * Clean and format extracted text
     */
    private cleanText(rawText: string): string {
        if (!rawText) {
            return '';
        }

        let cleaned = rawText;

        // Remove excessive whitespace
        cleaned = cleaned.replace(/\s+/g, ' ');

        // Remove leading and trailing whitespace
        cleaned = cleaned.trim();

        // Fix common OCR errors
        cleaned = this.fixCommonOCRErrors(cleaned);

        // Normalize line breaks
        cleaned = cleaned.replace(/\n\s*\n/g, '\n\n'); // Multiple line breaks to double
        cleaned = cleaned.replace(/\n/g, ' '); // Single line breaks to spaces

        // Remove special characters that might interfere with TTS
        cleaned = cleaned.replace(/[^\w\s.,!?;:()\-'"]/g, '');

        // Ensure proper sentence spacing
        cleaned = cleaned.replace(/([.!?])\s*([A-Z])/g, '$1 $2');

        return cleaned.trim();
    }

    /**
     * Fix common OCR recognition errors
     */
    private fixCommonOCRErrors(text: string): string {
        let fixed = text;

        // Common character substitutions
        const corrections: Record<string, string> = {
            '0': 'O', // Zero to O in words
            '1': 'I', // One to I in words
            '5': 'S', // Five to S in words
            '8': 'B', // Eight to B in words
            'rn': 'm', // Common OCR error
            'cl': 'd', // Common OCR error
            'vv': 'w', // Common OCR error
        };

        // Apply corrections contextually (only in word contexts)
        Object.entries(corrections).forEach(([wrong, correct]) => {
            // Only replace if it's likely a word character error
            const regex = new RegExp(`\\b${wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[a-z])`, 'gi');
            fixed = fixed.replace(regex, correct);
        });

        return fixed;
    }

    /**
     * Extract block information from Tesseract data
     */
    private extractBlocks(data: any): Array<{
        text: string;
        boundingBox: { x: number; y: number; width: number; height: number };
    }> {
        const blocks: Array<{
            text: string;
            boundingBox: { x: number; y: number; width: number; height: number };
        }> = [];

        if (data.blocks) {
            data.blocks.forEach((block: any) => {
                if (block.text && block.text.trim()) {
                    blocks.push({
                        text: block.text.trim(),
                        boundingBox: {
                            x: block.bbox.x0,
                            y: block.bbox.y0,
                            width: block.bbox.x1 - block.bbox.x0,
                            height: block.bbox.y1 - block.bbox.y0
                        }
                    });
                }
            });
        }

        return blocks;
    }

    /**
     * Map language codes to Tesseract language codes
     */
    private mapLanguageCode(language: string): string {
        const languageMap: Record<string, string> = {
            'en': 'eng',
            'english': 'eng',
            'hi': 'hin',
            'hindi': 'hin',
            'hinglish': 'eng+hin', // Support both English and Hindi
            'en-in': 'eng+hin'
        };

        const normalized = language.toLowerCase().trim();
        return languageMap[normalized] || 'eng';
    }

    /**
     * Check if text extraction was successful based on confidence and content
     */
    isExtractionSuccessful(result: OCRServiceResult): boolean {
        return result.success &&
            result.confidence > 0.3 && // Minimum confidence threshold
            result.text.length > 0 &&
            result.text.trim().length > 0;
    }

    /**
     * Get supported languages
     */
    getSupportedLanguages(): string[] {
        return ['en', 'english', 'hi', 'hindi', 'hinglish', 'en-in'];
    }

    /**
     * Utility method for delays
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Cleanup resources
     */
    async cleanup(): Promise<void> {
        if (this.worker) {
            try {
                await this.worker.terminate();
                this.worker = null;
                this.isInitialized = false;
            } catch (error) {
                console.error('Error terminating OCR worker:', error);
            }
        }
    }

    /**
     * Validate service configuration
     */
    validateConfig(): boolean {
        return Array.isArray(this.config.languages) && this.config.languages.length > 0;
    }
}

// Factory function to create OCR service instance
export function createOCRService(): OCRService {
    const config: Partial<OCRServiceConfig> = {
        languages: ['eng', 'hin'], // English and Hindi
        enableLogging: process.env.NODE_ENV === 'development'
    };

    return new OCRService(config);
}