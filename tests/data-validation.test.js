import { describe, it, expect, beforeEach } from 'vitest';
import { enhancedDataManagement } from '../js/features/auth/data-management.js';

describe('Data Validation', () => {
    let mockContext;

    beforeEach(() => {
        mockContext = {
            ...enhancedDataManagement
        };
    });

    it('should reject data with invalid prototype', () => {
        const maliciousData = Object.create({ malicious: true });
        maliciousData.confidenceLevels = { '1a': 3 };

        const result = mockContext.validateBackupData(maliciousData);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid data structure');
    });

    it('should reject confidence levels outside 1-5 range', () => {
        const invalidData = {
            confidenceLevels: {
                '1a': 6,  // Invalid: outside range
                '1b': 3
            }
        };

        const result = mockContext.validateBackupData(invalidData);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid confidence level');
    });

    it('should reject non-integer confidence levels', () => {
        const invalidData = {
            confidenceLevels: {
                '1a': 3.5,  // Invalid: not an integer
                '1b': 3
            }
        };

        const result = mockContext.validateBackupData(invalidData);

        expect(result.valid).toBe(false);
    });

    it('should accept valid backup data', () => {
        const validData = {
            confidenceLevels: {
                '1a': 3,
                '1b': 5
            },
            analyticsHistory: [
                {
                    topicId: '1a',
                    timestamp: '2025-01-01T00:00:00Z'
                }
            ]
        };

        const result = mockContext.validateBackupData(validData);

        expect(result.valid).toBe(true);
    });

    it('should reject analyticsHistory as non-array', () => {
        const invalidData = {
            confidenceLevels: { '1a': 3 },
            analyticsHistory: 'not an array'
        };

        const result = mockContext.validateBackupData(invalidData);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('must be an array');
    });
});
