// js/features/analytics/calculations.js - Analytics calculation methods

export const analyticCalculationMethods = {
    /**
     * PERFORMANCE: Build topic-to-section map for O(1) lookups
     * This prevents O(n²) nested loops in analytics calculations
     */
    _buildTopicSectionMap() {
        // Cache the map to avoid rebuilding on every analytics calculation
        if (this._topicSectionMap) {
            return this._topicSectionMap;
        }

        const map = new Map();
        Object.entries(this.specificationData).forEach(([sectionKey, section]) => {
            if (section.topics && Array.isArray(section.topics)) {
                section.topics.forEach(topic => {
                    map.set(topic.id, {
                        section,
                        sectionKey,
                        sectionTitle: section.title,
                        paper: section.paper
                    });
                });
            }
        });

        this._topicSectionMap = map;
        return map;
    },

    calculateAnalytics() {
        // PERFORMANCE: Build topic-section map once for O(1) lookups
        const sectionMap = this._buildTopicSectionMap();

        // Get all topics from specification data
        const allTopics = Object.values(this.specificationData).flatMap(section => section.topics);
        const assessedTopics = allTopics.filter(topic => this.confidenceLevels[topic.id] && this.confidenceLevels[topic.id] > 0);

        // Calculate overview metrics
        const totalProgress = allTopics.length > 0 ? Math.round((assessedTopics.length / allTopics.length) * 100) : 0;
        const assessedLevels = assessedTopics.map(topic => this.confidenceLevels[topic.id]);
        const avgConfidence = assessedLevels.length > 0 ?
            (assessedLevels.reduce((sum, level) => sum + level, 0) / assessedLevels.length) : 0;
        const lowConfidenceCount = assessedTopics.filter(topic => this.confidenceLevels[topic.id] <= 2).length;

        // PERFORMANCE: Paper readiness comparison using O(1) map lookups
        const paper1Topics = allTopics.filter(topic => {
            const topicInfo = sectionMap.get(topic.id);
            return topicInfo && topicInfo.paper === 'Paper 1';
        });
        const paper2Topics = allTopics.filter(topic => {
            const topicInfo = sectionMap.get(topic.id);
            return topicInfo && topicInfo.paper === 'Paper 2';
        });

        const paper1Assessed = paper1Topics.filter(topic => this.confidenceLevels[topic.id] && this.confidenceLevels[topic.id] > 0);
        const paper2Assessed = paper2Topics.filter(topic => this.confidenceLevels[topic.id] && this.confidenceLevels[topic.id] > 0);

        const paper1Progress = paper1Topics.length > 0 ? Math.round((paper1Assessed.length / paper1Topics.length) * 100) : 0;
        const paper2Progress = paper2Topics.length > 0 ? Math.round((paper2Assessed.length / paper2Topics.length) * 100) : 0;

        const paper1AvgConfidence = paper1Assessed.length > 0 ?
            (paper1Assessed.reduce((sum, topic) => sum + this.confidenceLevels[topic.id], 0) / paper1Assessed.length) : 0;
        const paper2AvgConfidence = paper2Assessed.length > 0 ?
            (paper2Assessed.reduce((sum, topic) => sum + this.confidenceLevels[topic.id], 0) / paper2Assessed.length) : 0;

        // PERFORMANCE: Calculate critical and strong topics using O(1) map lookups
        const criticalTopics = allTopics
            .filter(topic => this.confidenceLevels[topic.id] && this.confidenceLevels[topic.id] <= 2)
            .map(topic => {
                const topicInfo = sectionMap.get(topic.id);
                return {
                    ...topic,
                    confidence: this.confidenceLevels[topic.id],
                    section: topicInfo?.section,
                    sectionTitle: topicInfo?.sectionTitle || 'Unknown Section'
                };
            })
            .sort((a, b) => a.confidence - b.confidence);

        const strongTopics = allTopics
            .filter(topic => this.confidenceLevels[topic.id] && this.confidenceLevels[topic.id] >= 4)
            .map(topic => {
                const topicInfo = sectionMap.get(topic.id);
                return {
                    ...topic,
                    confidence: this.confidenceLevels[topic.id],
                    section: topicInfo?.section,
                    sectionTitle: topicInfo?.sectionTitle || 'Unknown Section'
                };
            })
            .sort((a, b) => b.confidence - a.confidence);

        const advancedAnalytics = this.calculateAdvancedAnalytics();

        this.analyticsData = {
            overview: {
                totalProgress,
                avgConfidence: avgConfidence.toFixed(1),
                lowConfidenceCount,
                totalTopics: allTopics.length,
                assessedTopics: assessedTopics.length,
                paper1Progress,
                paper2Progress,
                paper1AvgConfidence: paper1AvgConfidence.toFixed(1),
                paper2AvgConfidence: paper2AvgConfidence.toFixed(1)
            },
            charts: {},
            insights: {
                criticalTopics,
                strongTopics
            },
            recommendations: {},
            advanced: advancedAnalytics
        };
    },

    calculateAdvancedAnalytics() {
        // Always calculate mastery progress regardless of history data
        const masteryProgress = this.calculateMasteryProgress();

        // If no history data, return basic structure with zero values
        if (!this.analyticsHistoryData || !this.analyticsHistoryData.length) {
            return {
                studyVelocity: {
                    improvementsLast30Days: 0,
                    declinesLast30Days: 0,
                    netImprovement: 0,
                    improvementRate: 0
                },
                studyPatterns: {
                    totalSessions: 0,
                    avgTopicsPerSession: 0,
                    studyDaysThisMonth: 0,
                    mostActiveDay: 'No data',
                    currentStreak: 0,
                    lastStudyDate: 'Never'
                },
                masteryProgress,
                confidenceTrends: []
            };
        }

        // If we have history data, calculate the full analytics
        const history = this.analyticsHistoryData;
        const now = new Date();

        // Study velocity (improvements per day/week)
        const recentChanges = history.filter(change => {
            const changeDate = new Date(change.timestamp);
            const daysDiff = (now - changeDate) / (1000 * 60 * 60 * 24);
            return daysDiff <= 30; // Last 30 days
        });

        const improvements = recentChanges.filter(change => change.newLevel > change.oldLevel);
        const declines = recentChanges.filter(change => change.newLevel < change.oldLevel);

        // Study sessions analysis
        const sessions = this.groupByStudySessions(recentChanges);
        const avgTopicsPerSession = sessions.length > 0 ?
            (recentChanges.length / sessions.length).toFixed(1) : 0;

        // Learning patterns
        const studyDays = this.getStudyDaysPattern(recentChanges);
        const mostActiveDay = this.getMostActiveDay(recentChanges);
        const studyStreak = this.getCurrentStudyStreak();

        // Confidence trends
        const confidenceTrends = this.calculateConfidenceTrends();

        return {
            studyVelocity: {
                improvementsLast30Days: improvements.length,
                declinesLast30Days: declines.length,
                netImprovement: improvements.length - declines.length,
                improvementRate: recentChanges.length > 0 ?
                    ((improvements.length / recentChanges.length) * 100).toFixed(1) : 0
            },
            studyPatterns: {
                totalSessions: sessions.length,
                avgTopicsPerSession,
                studyDaysThisMonth: studyDays.length,
                mostActiveDay,
                currentStreak: studyStreak,
                lastStudyDate: history[0]?.date || 'Never'
            },
            masteryProgress,
            confidenceTrends
        };
    },

    calculateMasteryProgress() {
        const allTopics = Object.values(this.specificationData).flatMap(section => section.topics);
        const masteryLevels = {
            notStarted: allTopics.filter(topic => !this.confidenceLevels[topic.id]).length,
            beginning: allTopics.filter(topic => this.confidenceLevels[topic.id] === 1).length,
            developing: allTopics.filter(topic => this.confidenceLevels[topic.id] === 2).length,
            competent: allTopics.filter(topic => this.confidenceLevels[topic.id] === 3).length,
            proficient: allTopics.filter(topic => this.confidenceLevels[topic.id] === 4).length,
            mastered: allTopics.filter(topic => this.confidenceLevels[topic.id] === 5).length
        };

        return masteryLevels;
    },

    groupByStudySessions(changes) {
        const sessions = new Map();
        changes.forEach(change => {
            if (!sessions.has(change.studySession)) {
                sessions.set(change.studySession, []);
            }
            sessions.get(change.studySession).push(change);
        });
        return Array.from(sessions.values());
    },

    getStudyDaysPattern(changes) {
        const days = new Set();
        changes.forEach(change => {
            days.add(change.date);
        });
        return Array.from(days);
    },

    getMostActiveDay(changes) {
        const dayCount = {};
        changes.forEach(change => {
            const day = change.dayOfWeek;
            dayCount[day] = (dayCount[day] || 0) + 1;
        });

        let mostActive = 'No data';
        let maxCount = 0;
        Object.entries(dayCount).forEach(([day, count]) => {
            if (count > maxCount) {
                maxCount = count;
                mostActive = day;
            }
        });

        return mostActive;
    },

    getCurrentStudyStreak() {
        if (!this.analyticsHistoryData.length) return 0;

        const today = new Date().toLocaleDateString();
        const studyDates = new Set();

        this.analyticsHistoryData.forEach(change => {
            studyDates.add(change.date);
        });

        const sortedDates = Array.from(studyDates).sort((a, b) => new Date(b) - new Date(a));

        let streak = 0;
        const oneDay = 24 * 60 * 60 * 1000;

        for (let i = 0; i < sortedDates.length; i++) {
            const currentDate = new Date(sortedDates[i]);
            const expectedDate = new Date(Date.now() - (i * oneDay));

            if (Math.abs(currentDate - expectedDate) <= oneDay) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    },

    calculateConfidenceTrends() {
        const last30Days = this.analyticsHistoryData.filter(change => {
            const changeDate = new Date(change.timestamp);
            const daysDiff = (new Date() - changeDate) / (1000 * 60 * 60 * 24);
            return daysDiff <= 30;
        });

        // Group by week for trend analysis
        const weeklyTrends = new Map();
        last30Days.forEach(change => {
            const week = this.getWeekKey(new Date(change.timestamp));
            if (!weeklyTrends.has(week)) {
                weeklyTrends.set(week, { improvements: 0, total: 0 });
            }
            const weekData = weeklyTrends.get(week);
            weekData.total++;
            if (change.newLevel > change.oldLevel) {
                weekData.improvements++;
            }
        });

        return Array.from(weeklyTrends.entries()).map(([week, data]) => ({
            week,
            improvementRate: data.total > 0 ? ((data.improvements / data.total) * 100).toFixed(1) : 0,
            totalActivities: data.total
        }));
    },

    getWeekKey(date) {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        return startOfWeek.toLocaleDateString();
    }
};
