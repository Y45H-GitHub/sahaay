/**
 * Axios type extensions
 * Adds custom properties to axios config
 */

declare module 'axios' {
    export interface AxiosRequestConfig {
        _retryCount?: number;
        metadata?: {
            startTime: number;
        };
    }
}