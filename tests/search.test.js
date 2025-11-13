import { describe, it, expect, beforeEach } from 'vitest';
import { searchMethods } from '../js/features/search/index.js';

describe('Search Functionality', () => {
    let mockContext;

    beforeEach(() => {
        mockContext = {
            searchQuery: '',
            searchResults: [],
            searchTimer: null,
            specificationData: {
                section1: {
                    title: 'Test Section',
                    paper: 'Paper 1',
                    topics: [
                        {
                            id: '1a',
                            title: 'Test Topic',
                            prompt: 'Learn about testing',
                            learningObjectives: ['Objective 1'],
                            examples: ['Example 1']
                        }
                    ]
                }
            },
            confidenceLevels: {},
            ...searchMethods
        };
    });

    it('should sanitize HTML in search snippets', () => {
        const mockTopic = {
            prompt: '<script>alert("xss")</script>Test prompt',
            title: 'Test'
        };

        const result = mockContext.createSearchSnippet(
            '<script>alert("xss")</script>test prompt',
            'test',
            mockTopic
        );

        expect(result).not.toContain('<script>');
        expect(result).toContain('&lt;script&gt;');
    });

    it('should escape regex characters in search query', () => {
        const result = mockContext.escapeRegex('test.*query');
        expect(result).toBe('test\\.\\*query');
    });

    it('should return empty results for empty query', () => {
        mockContext.searchQuery = '';
        mockContext.performSearch();

        expect(mockContext.searchResults).toEqual([]);
    });
});
