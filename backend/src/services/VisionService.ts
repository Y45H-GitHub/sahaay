import axios, { AxiosResponse } from 'axios';

export interface DetectedObject {
    name: string;
    position: string;
    confidence: number;
    boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export interface VisionAnalysisResult {
    objects: DetectedObject[];
    description: string;
    success: boolean;
    error?: string;
}

export interface VisionServiceConfig {
    apiKey: string;
    apiUrl: string;
}

interface OpenAIVisionResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

export class VisionService {
    private config: VisionServiceConfig;
    private maxRetries: number = 3;
    private retryDelay: number = 1000; // 1 second

    constructor(config: VisionServiceConfig) {
        this.config = config;
    }

    /**
     * Analyze image for scene description and object detection
     */
    async analyzeScene(imageBuffer: Buffer, mimeType: string = 'image/jpeg'): Promise<VisionAnalysisResult> {
        if (!this.config.apiKey) {
            return {
                objects: [],
                description: '',
                success: false,
                error: 'Vision service not configured - API key missing'
            };
        }

        if (!imageBuffer || imageBuffer.length === 0) {
            return {
                objects: [],
                description: '',
                success: false,
                error: 'Invalid image data'
            };
        }

        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await this.makeVisionAPICall(imageBuffer, mimeType);

                if (response.status >= 200 && response.status < 300) {
                    const content = response.data.choices[0]?.message?.content;

                    if (!content) {
                        throw new Error('No content received from Vision API');
                    }

                    const analysisResult = this.parseVisionResponse(content);
                    return {
                        ...analysisResult,
                        success: true
                    };
                } else {
                    throw new Error('Vision analysis failed');
                }
            } catch (error) {
                lastError = error as Error;
                console.error(`Vision analysis attempt ${attempt} failed:`, error);

                // Don't retry on client errors (4xx)
                if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
                    break;
                }

                // Wait before retrying (exponential backoff)
                if (attempt < this.maxRetries) {
                    await this.delay(this.retryDelay * Math.pow(2, attempt - 1));
                }
            }
        }

        return {
            objects: [],
            description: '',
            success: false,
            error: lastError?.message || 'Vision analysis failed after retries'
        };
    }

    /**
     * Find specific object in image
     */
    async findObject(imageBuffer: Buffer, targetObject: string, mimeType: string = 'image/jpeg'): Promise<VisionAnalysisResult & { found: boolean; direction?: string }> {
        const analysisResult = await this.analyzeScene(imageBuffer, mimeType);

        if (!analysisResult.success) {
            return {
                ...analysisResult,
                found: false
            };
        }

        // Look for the target object in detected objects
        const foundObject = analysisResult.objects.find(obj =>
            obj.name.toLowerCase().includes(targetObject.toLowerCase()) ||
            targetObject.toLowerCase().includes(obj.name.toLowerCase())
        );

        if (foundObject) {
            return {
                ...analysisResult,
                found: true,
                direction: foundObject.position
            };
        }

        return {
            ...analysisResult,
            found: false
        };
    }

    /**
     * Make API call to OpenAI Vision API
     */
    private async makeVisionAPICall(imageBuffer: Buffer, mimeType: string): Promise<AxiosResponse<OpenAIVisionResponse>> {
        const base64Image = imageBuffer.toString('base64');

        const payload = {
            model: "gpt-4-vision-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Analyze this image and provide a detailed scene description. Focus on:
1. All visible objects and their types
2. Spatial relationships and positions (use terms like "on the left", "on the right", "in front", "behind", "center")
3. People and their activities
4. Overall scene context

Format your response as JSON with this structure:
{
  "description": "Natural language description of the scene",
  "objects": [
    {
      "name": "object name",
      "position": "relative position (left/right/center/front/back)",
      "confidence": 0.95
    }
  ]
}

Be specific about positions and include all visible objects, people, furniture, and significant elements.`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 1000
        };

        const headers = {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
        };

        return await axios.post(this.config.apiUrl, payload, {
            headers,
            timeout: 30000 // 30 second timeout
        });
    }

    /**
     * Parse the vision API response and extract objects with positions
     */
    private parseVisionResponse(content: string): { objects: DetectedObject[]; description: string } {
        try {
            // Try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);

                const objects: DetectedObject[] = (parsed.objects || []).map((obj: any) => ({
                    name: obj.name || 'Unknown object',
                    position: this.normalizePosition(obj.position || 'center'),
                    confidence: obj.confidence || 0.8
                }));

                return {
                    objects,
                    description: parsed.description || content
                };
            }
        } catch (error) {
            console.warn('Failed to parse JSON from vision response, using fallback parsing');
        }

        // Fallback: extract information from natural language response
        return this.parseNaturalLanguageResponse(content);
    }

    /**
     * Fallback parser for natural language responses
     */
    private parseNaturalLanguageResponse(content: string): { objects: DetectedObject[]; description: string } {
        const objects: DetectedObject[] = [];

        // Simple pattern matching for common objects and positions
        const objectPatterns = [
            /(?:a|an|the)\s+([a-zA-Z\s]+?)\s+(?:on the|to the|in the)?\s*(left|right|center|front|back|middle)/gi,
            /(?:there is|there are|I see|I can see)\s+(?:a|an|the)?\s*([a-zA-Z\s]+?)\s+(?:on the|to the|in the)?\s*(left|right|center|front|back|middle)/gi
        ];

        objectPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const objectName = match[1].trim();
                const position = match[2].toLowerCase();

                if (objectName && position) {
                    objects.push({
                        name: objectName,
                        position: this.normalizePosition(position),
                        confidence: 0.7
                    });
                }
            }
        });

        return {
            objects,
            description: content
        };
    }

    /**
     * Normalize position terms to consistent format
     */
    private normalizePosition(position: string): string {
        const normalized = position.toLowerCase().trim();

        const positionMap: Record<string, string> = {
            'left': 'on the left',
            'right': 'on the right',
            'center': 'in the center',
            'middle': 'in the center',
            'front': 'in front',
            'back': 'behind',
            'behind': 'behind',
            'ahead': 'ahead',
            'forward': 'ahead'
        };

        return positionMap[normalized] || normalized;
    }

    /**
     * Calculate relative positions from bounding boxes (for future enhancement)
     */
    private calculateRelativePosition(boundingBox: { x: number; y: number; width: number; height: number }, imageWidth: number, imageHeight: number): string {
        const centerX = boundingBox.x + boundingBox.width / 2;
        const centerY = boundingBox.y + boundingBox.height / 2;

        const relativeX = centerX / imageWidth;
        const relativeY = centerY / imageHeight;

        let position = '';

        // Horizontal position
        if (relativeX < 0.33) {
            position += 'on the left';
        } else if (relativeX > 0.67) {
            position += 'on the right';
        } else {
            position += 'in the center';
        }

        // Vertical position (optional, for more detailed positioning)
        if (relativeY < 0.33) {
            position += ' and towards the top';
        } else if (relativeY > 0.67) {
            position += ' and towards the bottom';
        }

        return position;
    }

    /**
     * Generate natural language description from detected objects
     */
    generateNaturalDescription(objects: DetectedObject[]): string {
        if (objects.length === 0) {
            return "I don't see any specific objects in this image.";
        }

        const descriptions: string[] = [];

        // Group objects by position
        const positionGroups: Record<string, string[]> = {};
        objects.forEach(obj => {
            if (!positionGroups[obj.position]) {
                positionGroups[obj.position] = [];
            }
            positionGroups[obj.position].push(obj.name);
        });

        // Generate descriptions for each position group
        Object.entries(positionGroups).forEach(([position, objectNames]) => {
            if (objectNames.length === 1) {
                descriptions.push(`There is ${this.addArticle(objectNames[0])} ${position}`);
            } else if (objectNames.length === 2) {
                descriptions.push(`There are ${this.addArticle(objectNames[0])} and ${this.addArticle(objectNames[1])} ${position}`);
            } else {
                const lastObject = objectNames.pop();
                descriptions.push(`There are ${objectNames.map(name => this.addArticle(name)).join(', ')}, and ${this.addArticle(lastObject!)} ${position}`);
            }
        });

        return descriptions.join('. ') + '.';
    }

    /**
     * Add appropriate article (a/an) to object names
     */
    private addArticle(objectName: string): string {
        const vowels = ['a', 'e', 'i', 'o', 'u'];
        const firstLetter = objectName.toLowerCase().charAt(0);
        const article = vowels.includes(firstLetter) ? 'an' : 'a';
        return `${article} ${objectName}`;
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
        return !!(this.config.apiKey && this.config.apiUrl);
    }
}

// Factory function to create Vision service instance
export function createVisionService(): VisionService {
    const config: VisionServiceConfig = {
        apiKey: process.env.OPENAI_API_KEY || '',
        apiUrl: 'https://api.openai.com/v1/chat/completions'
    };

    if (!config.apiKey) {
        console.warn('OPENAI_API_KEY environment variable is not set. Vision service will not be functional.');
    }

    return new VisionService(config);
}