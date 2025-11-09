// js/features/confidence/rating.js - Confidence rating methods

export const confidenceRatingMethods = {
    updateConfidence(topicId, level) {
        const oldLevel = this.confidenceLevels[topicId] || 0;
        const newLevel = this.confidenceLevels[topicId] === level ? null : level;

        // Update confidence level
        this.confidenceLevels[topicId] = newLevel;

        // Track historical data for analytics
        if (oldLevel !== (newLevel || 0)) {
            const now = new Date();
            const change = {
                topicId: topicId,
                oldLevel: oldLevel,
                newLevel: newLevel || 0,
                timestamp: now.toISOString(),
                date: now.toLocaleDateString(),
                time: now.toLocaleTimeString(),
                dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
                studySession: this.getStudySessionId(now) // Group activities by session
            };

            // Add to history (keep last 500 changes for better analytics)
            this.analyticsHistoryData.unshift(change);
            if (this.analyticsHistoryData.length > 500) {
                this.analyticsHistoryData = this.analyticsHistoryData.slice(0, 500);
            }
        }

        // Save both confidence levels and analytics history
        this.saveConfidenceLevels();
        this.saveAnalyticsHistory();
    },

    // Helper method to group activities into study sessions
    getStudySessionId(date) {
        // Group activities within 30 minutes as same session
        const roundedTime = Math.floor(date.getTime() / (30 * 60 * 1000)) * (30 * 60 * 1000);
        return new Date(roundedTime).toISOString();
    }
};
