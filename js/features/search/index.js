// js/modules/search.js

export const searchMethods = {
    toggleSearch() {
        this.searchVisible = !this.searchVisible;
        if (this.searchVisible) {
            this.$nextTick(() => document.getElementById('searchInput')?.focus());
        } else {
            this.searchQuery = '';
            this.searchResults = [];
        }
        this.$nextTick(() => lucide.createIcons());
    },

    performSearch() {
        // Debounce search
        clearTimeout(this.searchTimer);

        if (!this.searchQuery || !this.searchQuery.trim()) {
            this.searchResults = [];
            return;
        }

        this.searchTimer = setTimeout(() => {
            this._executeSearch();
        }, 300); // 300ms debounce
    },

    _executeSearch() {
        const query = this.searchQuery.toLowerCase().trim();
        const results = [];
        Object.entries(this.specificationData).forEach(([sectionKey, section]) => {
            if (!section.topics) return;
            section.topics.forEach(topic => {
                const searchableFields = [topic.id || '', topic.title || '', topic.prompt || '', ...(topic.learningObjectives || []), ...(topic.examples || [])];
                const searchText = searchableFields.join(' ').toLowerCase();
                if (searchText.includes(query)) {
                    results.push({
                        topicId: topic.id,
                        topicTitle: topic.title,
                        topicPrompt: topic.prompt,
                        sectionKey: sectionKey,
                        sectionTitle: section.title,
                        paper: section.paper,
                        confidence: this.confidenceLevels[topic.id] || null,
                        snippet: this.createSearchSnippet(searchText, query, topic)
                    });
                }
            });
        });
        results.sort((a, b) => (b.topicTitle.toLowerCase().includes(query) ? 1 : 0) - (a.topicTitle.toLowerCase().includes(query) ? 1 : 0));
        this.searchResults = results.slice(0, 10);
    },

    createSearchSnippet(searchText, query, topic) {
        const index = searchText.indexOf(query);
        if (index === -1) {
            const fallback = (topic.prompt || topic.title || '');
            return this.sanitizeHTML(fallback.substring(0, 100)) + (fallback.length > 100 ? '...' : '');
        }
        const start = Math.max(0, index - 30);
        const end = Math.min(searchText.length, index + query.length + 30);
        let snippet = searchText.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < searchText.length) snippet = snippet + '...';

        // Sanitize before highlighting
        snippet = this.sanitizeHTML(snippet);
        query = this.sanitizeHTML(query);

        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return snippet.replace(regex, '**$1**');
    },

    sanitizeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    navigateToSearchResult(result) {
        this.activeSection = result.sectionKey;
        const parentGroup = this.currentGroups.find(item => item.type === "group" && item.sections?.includes(result.sectionKey));
        if (parentGroup) {
            this.lastExpandedGroup = parentGroup.title;
            this.expandedGroups[parentGroup.title] = true;
        }
        this.showingSpecificSection = true;
        this.showingMainMenu = false;
        this.searchVisible = false;
        this.searchQuery = '';
        this.searchResults = [];
        if (window.innerWidth < 768) this.sidebarVisible = false;
        this.$nextTick(() => {
            setTimeout(() => {
                const topicElement = document.querySelector(`[data-topic-id="${result.topicId}"]`);
                if (topicElement) {
                    topicElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    topicElement.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                    setTimeout(() => { topicElement.style.backgroundColor = ''; }, 2000);
                }
            }, 100);
        });
    },
};