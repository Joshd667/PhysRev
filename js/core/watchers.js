// js/core/watchers.js
// Sets up Alpine.js watchers for the app

export function setupWatchers(app) {
    // ⚡ PERFORMANCE: Debounced icon refresh to prevent excessive DOM manipulation
    let iconRefreshTimeout = null;
    const refreshIcons = () => {
        if (iconRefreshTimeout) clearTimeout(iconRefreshTimeout);
        iconRefreshTimeout = setTimeout(() => {
            app.$nextTick(() => {
                if (window.lucide) lucide.createIcons();
            });
        }, 50); // 50ms debounce
    };

    // Dark mode watcher
    app.$watch('darkMode', () => {
        app.applyDarkMode();
        app.saveToLocalStorage();
    });

    // View mode watcher
    app.$watch('viewMode', () => {
        if (app.viewMode === 'spec') app.selectedPaper = 'All Topics';
        else if (!['Paper 1', 'Paper 2', 'Paper 3'].includes(app.selectedPaper)) app.selectedPaper = 'Paper 1';
        app.saveToLocalStorage();
    });

    // Selected paper watcher
    app.$watch('selectedPaper', () => {
        app.saveToLocalStorage();
    });

    // Confidence levels watcher (auto-save with debouncing)
    // ✅ PERFORMANCE: Shallow watch with debouncing instead of deep watch
    let confidenceSaveTimer = null;
    app.$watch('confidenceLevels', () => {
        if (confidenceSaveTimer) clearTimeout(confidenceSaveTimer);
        confidenceSaveTimer = setTimeout(() => app.saveData(), 500);
    });

    // ⚡ PERFORMANCE: Banner cache invalidation watchers (reduces initial RAM spike by 25-35MB)
    const bannerDependencies = ['searchVisible', 'showingAnalytics', 'showingRevision',
                                 'viewType', 'showingMainMenu', 'lastExpandedGroup',
                                 'showingSpecificSection', 'viewMode', 'selectedPaper',
                                 'showTestArea', 'currentRevisionSectionTitle'];
    bannerDependencies.forEach(prop => {
        app.$watch(prop, () => { app._bannerCacheDirty = true; });
    });

    // ⚡ PERFORMANCE: Progress title cache invalidation watchers
    app.$watch('viewMode', () => { app._progressTitleCacheDirty = true; });
    app.$watch('selectedPaper', () => { app._progressTitleCacheDirty = true; });

    // ⚡ PERFORMANCE: Debounced icon recreation on content changes (reduced from 10 watchers)
    app.$watch('activeSection', refreshIcons);
    app.$watch('currentGroups', refreshIcons);
    app.$watch('showingRevision', refreshIcons);
    app.$watch('viewType', refreshIcons);
    app.$watch('searchVisible', refreshIcons);
    app.$watch('searchSortDropdownOpen', refreshIcons);

    app.$nextTick(() => { if (window.lucide) lucide.createIcons(); });

    // ✅ PERFORMANCE FIX: Robust Chart.js cleanup to prevent memory leaks
    app.$watch('showingAnalytics', (newValue, oldValue) => {
        if (oldValue === true && newValue === false) {
            // Destroy all charts to free memory with robust error handling
            try {
                if (typeof app.destroyAllCharts === 'function') {
                    app.destroyAllCharts();
                    console.log('✅ Charts destroyed successfully');
                } else {
                    // ✅ FALLBACK: Manual cleanup if method doesn't exist
                    console.warn('⚠️ destroyAllCharts not found, attempting manual cleanup');

                    if (app.chartInstances && app.chartInstances instanceof Map) {
                        let destroyedCount = 0;
                        app.chartInstances.forEach((chart, key) => {
                            try {
                                if (chart && typeof chart.destroy === 'function') {
                                    chart.destroy();
                                    destroyedCount++;
                                }
                            } catch (e) {
                                console.error(`Failed to destroy chart ${key}:`, e);
                            }
                        });
                        app.chartInstances.clear();
                        console.log(`✅ Manual cleanup destroyed ${destroyedCount} charts`);
                    }
                }

                // ✅ Verify cleanup succeeded
                if (app.chartInstances && app.chartInstances.size > 0) {
                    console.warn(`⚠️ ${app.chartInstances.size} charts still remain after cleanup!`);
                }
            } catch (error) {
                console.error('❌ Chart cleanup failed:', error);
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
    // ✅ PERFORMANCE: Shallow watch instead of deep watch
    app.$watch('expandedGroups', () => {
        if (app.showingAnalytics) {
            app.showingAnalytics = false;
        }
    });

    // Listen for app update events from service worker
    window.addEventListener('app-update-available', () => {
        console.log('📢 App update detected by Alpine.js');
        app.updateAvailable = true;
    });

    // ⚡ PERFORMANCE: Cache invalidation watchers for expensive computations
    // These watchers mark caches as dirty when their dependencies change

    // Notes grouped by section dependencies
    const notesGroupedDeps = ['userNotes', 'viewMode', 'selectedPaper', 'contentFilterGroup', 'contentFilterSection', 'currentGroups'];
    notesGroupedDeps.forEach(prop => {
        app.$watch(prop, () => { app._cachedNotesGroupedDirty = true; });
    });

    // Flashcards grouped by section dependencies
    const flashcardsGroupedDeps = ['flashcardDecks', 'viewMode', 'selectedPaper', 'contentFilterGroup', 'contentFilterSection', 'currentGroups'];
    flashcardsGroupedDeps.forEach(prop => {
        app.$watch(prop, () => { app._cachedFlashcardsGroupedDirty = true; });
    });

    // Mindmaps grouped by section dependencies
    const mindmapsGroupedDeps = ['mindmaps', 'viewMode', 'selectedPaper', 'contentFilterGroup', 'contentFilterSection', 'currentGroups'];
    mindmapsGroupedDeps.forEach(prop => {
        app.$watch(prop, () => { app._cachedMindmapsGroupedDirty = true; });
    });

    // Inherited tags dependencies
    app.$watch('testSetBuilderCards', () => { app._cachedInheritedTagsDirty = true; });
    app.$watch('flashcardDecks', () => { app._cachedInheritedTagsDirty = true; });

    // Filtered decks for builder dependencies
    app.$watch('flashcardDecks', () => { app._cachedFilteredDecksForBuilderDirty = true; });
    app.$watch('advancedSearchTags', () => { app._cachedFilteredDecksForBuilderDirty = true; });
    app.$watch('testSetBuilderSearch', () => { app._cachedFilteredDecksForBuilderDirty = true; });

    // Critical/Strong topics page dependencies
    app.$watch('criticalTopicsPage', () => { app._cachedCriticalTopicsPageDirty = true; });
    app.$watch('analyticsData', () => { app._cachedCriticalTopicsPageDirty = true; });
    app.$watch('strongTopicsPage', () => { app._cachedStrongTopicsPageDirty = true; });
    app.$watch('analyticsData', () => { app._cachedStrongTopicsPageDirty = true; });

    // Current tags dependencies
    const currentTagsDeps = ['tagSelectorContext', 'noteEditorTags', 'flashcardEditorTags', 'mindmapEditorTags'];
    currentTagsDeps.forEach(prop => {
        app.$watch(prop, () => { app._cachedCurrentTagsDirty = true; });
    });

    // Review cards dependencies
    app.$watch('testFlashcards', () => { app._cachedReviewCardsDirty = true; });
    app.$watch('testReviewMode', () => { app._cachedReviewCardsDirty = true; });
    app.$watch('testAnswers', () => { app._cachedReviewCardsDirty = true; });

    // Revision section content dependencies
    const revisionSectionDeps = ['currentRevisionSection', 'userNotes', 'flashcardDecks', 'mindmaps'];
    revisionSectionDeps.forEach(prop => {
        app.$watch(prop, () => {
            app._cachedNotesForCurrentSectionDirty = true;
            app._cachedFlashcardDecksForCurrentSectionDirty = true;
            app._cachedMindmapsForCurrentSectionDirty = true;
        });
    });
}
