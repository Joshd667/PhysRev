// js/core/watchers.js
// Sets up Alpine.js watchers for the app

export function setupWatchers(app) {
    // Dark mode watcher
    app.$watch('darkMode', () => {
        app.applyDarkMode();
        app.saveToLocalStorage();
    });

    // View mode watcher
    app.$watch('viewMode', () => {
        if (app.viewMode === 'spec') app.selectedPaper = 'All Topics';
        else if (!['Paper 1', 'Paper 2'].includes(app.selectedPaper)) app.selectedPaper = 'Paper 1';
        app.saveToLocalStorage();
    });

    // Selected paper watcher
    app.$watch('selectedPaper', () => {
        app.saveToLocalStorage();
    });

    // Confidence levels watcher (auto-save)
    app.$watch('confidenceLevels', () => app.saveData(), { deep: true });

    // Re-create icons on content changes
    app.$watch('activeSection', () => app.$nextTick(() => { if (window.lucide) lucide.createIcons(); }));
    app.$watch('currentGroups', () => app.$nextTick(() => { if (window.lucide) lucide.createIcons(); }));
    app.$watch('showingRevision', () => app.$nextTick(() => { if (window.lucide) lucide.createIcons(); }));
    app.$watch('viewType', () => app.$nextTick(() => { if (window.lucide) lucide.createIcons(); }));
    app.$watch('userNotes', () => app.$nextTick(() => { if (window.lucide) lucide.createIcons(); }), { deep: true });
    app.$nextTick(() => { if (window.lucide) lucide.createIcons(); });

    // ⚡ PERFORMANCE: Cleanup memory when leaving analytics
    app.$watch('showingAnalytics', (newValue, oldValue) => {
        if (oldValue === true && newValue === false) {
            // Destroy all charts to free memory
            if (typeof app.destroyAllCharts === 'function') {
                app.destroyAllCharts();
            }
            // Clear analytics data to free memory
            app.analyticsData = null;
        }
    });

    // Close analytics when navigating
    app.$watch('activeSection', () => {
        if (app.showingAnalytics) {
            app.showingAnalytics = false;
        }
    });

    app.$watch('showingMainMenu', (newValue) => {
        if (newValue && app.showingAnalytics) {
            app.showingAnalytics = false;
        }
    });

    app.$watch('showingSpecificSection', (newValue) => {
        if (newValue && app.showingAnalytics) {
            app.showingAnalytics = false;
        }
    });

    app.$watch('showingRevision', (newValue) => {
        if (newValue && app.showingAnalytics) {
            app.showingAnalytics = false;
        }
    });

    // Close analytics when dropdowns are toggled
    app.$watch('expandedGroups', () => {
        if (app.showingAnalytics) {
            app.showingAnalytics = false;
        }
    }, { deep: true });

    // Listen for app update events from service worker
    window.addEventListener('app-update-available', () => {
        console.log('📢 App update detected by Alpine.js');
        app.updateAvailable = true;
    });
}
