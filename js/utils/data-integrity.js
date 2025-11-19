// js/utils/data-integrity.js
// Data integrity verification using HMAC signatures

export class DataIntegrity {
    constructor() {
        this.algorithm = { name: 'HMAC', hash: 'SHA-256' };
        this.keyCache = null;
    }

    /**
     * Get or generate a device-specific secret for HMAC signing
     * This prevents tampering but isn't encryption - data is still readable
     */
    async getDeviceSecret() {
        // Try to get existing secret from localStorage
        let secret = localStorage.getItem('_device_secret');

        if (!secret) {
            // Generate new random secret (32 bytes = 256 bits)
            const randomBytes = new Uint8Array(32);
            crypto.getRandomValues(randomBytes);
            secret = btoa(String.fromCharCode(...randomBytes));
            localStorage.setItem('_device_secret', secret);
        }

        return secret;
    }

    /**
     * Import the signing key
     */
    async getSigningKey() {
        if (this.keyCache) return this.keyCache;

        const secret = await this.getDeviceSecret();
        const encoder = new TextEncoder();

        this.keyCache = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            this.algorithm,
            false,
            ['sign', 'verify']
        );

        return this.keyCache;
    }

    /**
     * Sign data with HMAC
     * @param {any} data - Data to sign
     * @returns {Promise<object>} Signed data package
     */
    async sign(data) {
        const key = await this.getSigningKey();
        const encoder = new TextEncoder();
        const dataString = JSON.stringify(data);

        const signature = await crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(dataString)
        );

        return {
            data,
            signature: btoa(String.fromCharCode(...new Uint8Array(signature))),
            timestamp: Date.now(),
            version: '1.0'
        };
    }

    /**
     * Verify and extract data from signed package
     * @param {object} signedData - Signed data package
     * @returns {Promise<any>} Original data if signature valid
     * @throws {Error} If signature verification fails
     */
    async verify(signedData) {
        if (!signedData || typeof signedData !== 'object') {
            throw new Error('Invalid signed data format');
        }

        if (!signedData.signature || !signedData.data) {
            throw new Error('Missing signature or data in signed package');
        }

        const key = await this.getSigningKey();
        const encoder = new TextEncoder();
        const dataString = JSON.stringify(signedData.data);

        // Decode signature from base64
        const signatureBytes = new Uint8Array(
            atob(signedData.signature).split('').map(c => c.charCodeAt(0))
        );

        // Verify signature
        const valid = await crypto.subtle.verify(
            'HMAC',
            key,
            signatureBytes,
            encoder.encode(dataString)
        );

        if (!valid) {
            throw new Error('Data integrity check failed - data may have been tampered with');
        }

        // Check for stale data (optional - warn if >90 days old)
        if (signedData.timestamp) {
            const age = Date.now() - signedData.timestamp;
            const ninetyDays = 90 * 24 * 60 * 60 * 1000;

            if (age > ninetyDays) {
                console.warn(`⚠️ Data is ${Math.floor(age / (24 * 60 * 60 * 1000))} days old`);
            }
        }

        return signedData.data;
    }

    /**
     * Validate confidence levels to prevent tampering
     * @param {object} confidenceLevels - Confidence levels object
     * @returns {boolean} True if all values are valid
     */
    validateConfidenceLevels(confidenceLevels) {
        if (!confidenceLevels || typeof confidenceLevels !== 'object') {
            return false;
        }

        for (const [key, value] of Object.entries(confidenceLevels)) {
            // Confidence must be integer 1-5
            if (!Number.isInteger(value) || value < 1 || value > 5) {
                console.warn(`Invalid confidence level for ${key}: ${value}`);
                return false;
            }
        }

        return true;
    }

    /**
     * Validate test results to prevent score manipulation
     * @param {array} testResults - Array of test result objects
     * @returns {boolean} True if all results are valid
     */
    validateTestResults(testResults) {
        if (!Array.isArray(testResults)) {
            return false;
        }

        for (const result of testResults) {
            // Check required fields
            if (!result.date || !result.setId) {
                console.warn('Test result missing required fields');
                return false;
            }

            // Score must be between 0-100
            if (typeof result.score !== 'number' || result.score < 0 || result.score > 100) {
                console.warn(`Invalid test score: ${result.score}`);
                return false;
            }

            // Correct/total must make sense
            if (result.correct > result.total || result.correct < 0) {
                console.warn('Invalid correct/total count');
                return false;
            }
        }

        return true;
    }
}

// Create singleton instance
export const dataIntegrity = new DataIntegrity();
