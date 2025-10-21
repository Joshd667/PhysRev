// js/features/analytics/insights.js - Analytics insights and pagination

export const analyticInsightMethods = {
    showAnalytics() {
        this.showingAnalytics = true;
        this.showingMainMenu = false;
        this.showingSpecificSection = false;
        this.showingRevision = false;
        this.calculateAnalytics();

        // Close sidebar on mobile
        if (window.innerWidth < 768) {
            this.sidebarVisible = false;
        }

        this.$nextTick(() => {
            this.renderCharts();
            lucide.createIcons();
        });
    },

    goBackFromAnalytics() {
        this.showingAnalytics = false;
        this.showingMainMenu = true;
        this.viewMode = 'spec'; // Return to spec mode
        this.$nextTick(() => lucide.createIcons());
    },

    // Pagination helpers for analytics
    getCriticalTopicsPage() {
        const pageSize = 5;
        const start = this.criticalTopicsPage * pageSize;
        return this.analyticsData?.insights.criticalTopics.slice(start, start + pageSize) || [];
    },

    getStrongTopicsPage() {
        const pageSize = 5;
        const start = this.strongTopicsPage * pageSize;
        return this.analyticsData?.insights.strongTopics.slice(start, start + pageSize) || [];
    },

    nextCriticalPage() {
        const maxPage = Math.ceil((this.analyticsData?.insights.criticalTopics.length || 0) / 5) - 1;
        if (this.criticalTopicsPage < maxPage) {
            this.criticalTopicsPage++;
        }
    },

    prevCriticalPage() {
        if (this.criticalTopicsPage > 0) {
            this.criticalTopicsPage--;
        }
    },

    nextStrongPage() {
        const maxPage = Math.ceil((this.analyticsData?.insights.strongTopics.length || 0) / 5) - 1;
        if (this.strongTopicsPage < maxPage) {
            this.strongTopicsPage++;
        }
    },

    prevStrongPage() {
        if (this.strongTopicsPage > 0) {
            this.strongTopicsPage--;
        }
    },

    // Navigate to revision for a specific topic
    goToTopicRevision(topicId) {
        const section = window.topicToSectionMapping[topicId];
        if (section && window.revisionMapping[section]) {
            this.openRevisionForTopic(topicId);
        } else {
            console.warn('No revision section found for topic:', topicId);
        }
    }
};
