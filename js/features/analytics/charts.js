// js/features/analytics/charts.js - Chart.js rendering methods

export const analyticChartMethods = {
    destroyChart(chartId) {
        if (this.chartInstances.has(chartId)) {
            this.chartInstances.get(chartId).destroy();
            this.chartInstances.delete(chartId);
        }
    },

    destroyAllCharts() {
        this.chartInstances.forEach((chart, id) => {
            chart.destroy();
        });
        this.chartInstances.clear();
    },

    renderCharts() {
        if (!this.analyticsData) return;

        // Destroy all existing charts before rendering new ones
        this.destroyAllCharts();

        this.$nextTick(() => {
            // Confidence Distribution Chart
            this.renderConfidenceChart();

            // Subject Progress Chart
            this.renderSubjectProgressChart();

            // Paper Readiness Charts
            this.renderPaperReadinessCharts();
        });
    },

    renderConfidenceChart() {
        const ctx = document.getElementById('confidenceChart');
        if (!ctx) return;

        this.destroyChart('confidenceChart');

        // Calculate confidence distribution
        const distribution = [0, 0, 0, 0, 0]; // [1s, 2s, 3s, 4s, 5s]
        Object.entries(this.confidenceLevels).forEach(([topicId, level]) => {
            if (level >= 1 && level <= 5) {
                distribution[level - 1]++;
            }
        });

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['1 (Low)', '2', '3 (Medium)', '4', '5 (High)'],
                datasets: [{
                    label: 'Number of Topics',
                    data: distribution,
                    backgroundColor: ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#22c55e'],
                    borderColor: ['#dc2626', '#ea580c', '#ca8a04', '#2563eb', '#16a34a'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Confidence Distribution Across All Topics'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

        this.chartInstances.set('confidenceChart', chart);
    },

    renderSubjectProgressChart() {
        const ctx = document.getElementById('subjectChart');
        if (!ctx) return;

        this.destroyChart('subjectChart');

        // Calculate subject progress
        const subjectData = this.specModeGroups["All Topics"]
            .filter(group => group.type === 'group')
            .map(group => {
                const groupTopics = group.sections.flatMap(sectionKey =>
                    this.specificationData[sectionKey]?.topics || []
                );
                const groupAssessed = groupTopics.filter(topic =>
                    this.confidenceLevels[topic.id] && this.confidenceLevels[topic.id] > 0
                );
                const progress = groupTopics.length > 0 ?
                    Math.round((groupAssessed.length / groupTopics.length) * 100) : 0;

                return {
                    subject: group.title.replace(/^\d+\.\d+\s*/, ''), // Remove numbering
                    progress: progress,
                    assessed: groupAssessed.length,
                    total: groupTopics.length
                };
            });

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: subjectData.map(d => d.subject),
                datasets: [{
                    label: 'Progress %',
                    data: subjectData.map(d => d.progress),
                    backgroundColor: subjectData.map(d => {
                        if (d.progress >= 80) return '#22c55e';
                        if (d.progress >= 60) return '#3b82f6';
                        if (d.progress >= 40) return '#eab308';
                        if (d.progress >= 20) return '#f97316';
                        return '#ef4444';
                    }),
                    borderColor: '#1f2937',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Progress by Subject Area'
                    },
                    tooltip: {
                        callbacks: {
                            afterBody: function(context) {
                                const index = context[0].dataIndex;
                                const item = subjectData[index];
                                return [`Assessed: ${item.assessed}/${item.total} topics`];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });

        this.chartInstances.set('subjectChart', chart);
    },

    renderPaperChart(paperNumber, chartId, canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        this.destroyChart(chartId);

        // Calculate confidence distribution for the specified paper
        const distribution = [0, 0, 0, 0, 0];
        const allTopics = Object.values(this.specificationData).flatMap(section => section.topics);
        const paperTopics = allTopics.filter(topic => {
            const section = Object.values(this.specificationData).find(s => s.topics.some(t => t.id === topic.id));
            return section && section.paper === `Paper ${paperNumber}`;
        });

        paperTopics.forEach(topic => {
            const level = this.confidenceLevels[topic.id];
            if (level >= 1 && level <= 5) {
                distribution[level - 1]++;
            }
        });

        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['1 (Low)', '2', '3 (Medium)', '4', '5 (High)'],
                datasets: [{
                    data: distribution,
                    backgroundColor: ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#22c55e'],
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: `Paper ${paperNumber} Confidence Distribution`
                    }
                }
            }
        });

        this.chartInstances.set(chartId, chart);
    },

    renderPaperReadinessCharts() {
        this.renderPaperChart(1, 'paper1Chart', 'paper1Chart');
        this.renderPaperChart(2, 'paper2Chart', 'paper2Chart');
    }
};
