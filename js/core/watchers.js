import { logger } from '../utils/logger.js';

export function setupWatchers(app) {
    // ⚡ PERFORMANCE: Debounced icon refresh prevents excessive DOM manipulation
    let iconRefreshTimeout = null;
    const refreshIcons = () => {
        if (iconRefreshTimeout) clearTimeout(iconRefreshTimeout);
        iconRefreshTimeout = setTimeout(() => {
            app.$nextTick(() => {
                if (window.lucide) lucide.createIcons();
            });
        }, 50);
    };

    app.$watch('darkMode', () => {
        app.applyDarkMode();
        app.saveToLocalStorage();
    });

    app.$watch('viewMode', () => {
        if (app.viewMode === 'spec') app.selectedPaper = 'All Topics';
        else if (!['Paper 1', 'Paper 2', 'Paper 3'].includes(app.selectedPaper)) app.selectedPaper = 'Paper 1';
        app.saveToLocalStorage();
    });

    app.$watch('selectedPaper', () => {
        app.saveToLocalStorage();
        // Close note preview when changing paper
        if (app.notePreviewId) {
            app.notePreviewId = null;
        }
    });

    // ⚡ PERFORMANCE: Debounced confidence save prevents excessive writes
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

    app.$watch('showingAnalytics', (newValue, oldValue) => {
        if (oldValue === true && newValue === false) {
            try {
                if (typeof app.destroyAllCharts === 'function') {
                    app.destroyAllCharts();
                    logger.log('✅ Charts destroyed successfully');
                } else {
                    logger.warn('⚠️ destroyAllCharts not found, attempting manual cleanup');

                    if (app.chartInstances && app.chartInstances instanceof Map) {
                        let destroyedCount = 0;
                        app.chartInstances.forEach((chart, key) => {
                            try {
                                if (chart && typeof chart.destroy === 'function') {
                                    chart.destroy();
                                    destroyedCount++;
                                }
                            } catch (e) {
                                logger.error(`Failed to destroy chart ${key}:`, e);
                            }
                        });
                        app.chartInstances.clear();
                        logger.log(`✅ Manual cleanup destroyed ${destroyedCount} charts`);
                    }
                }

                if (app.chartInstances && app.chartInstances.size > 0) {
                    logger.warn(`⚠️ ${app.chartInstances.size} charts still remain after cleanup!`);
                }
            } catch (error) {
                logger.error('❌ Chart cleanup failed:', error);
            }

            app.analyticsData = null;
        }
    });

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

    app.$watch('expandedGroups', () => {
        if (app.showingAnalytics) {
            app.showingAnalytics = false;
        }
    });

    // Close note preview when switching between notes/flashcards/mindmaps/audit
    app.$watch('viewType', () => {
        if (app.notePreviewId) {
            app.notePreviewId = null;
        }
    });

    window.addEventListener('app-update-available', () => {
        logger.log('📢 App update detected by Alpine.js');
        app.updateAvailable = true;
    });

    // ⚡ PERFORMANCE: Cache invalidation watchers mark caches dirty when dependencies change
    const notesGroupedDeps = ['userNotes', 'viewMode', 'selectedPaper', 'contentFilterGroup', 'contentFilterSection', 'currentGroups'];
    notesGroupedDeps.forEach(prop => {
        app.$watch(prop, () => { app._cachedNotesGroupedDirty = true; });
    });

    const flashcardsGroupedDeps = ['flashcardDecks', 'viewMode', 'selectedPaper', 'contentFilterGroup', 'contentFilterSection', 'currentGroups'];
    flashcardsGroupedDeps.forEach(prop => {
        app.$watch(prop, () => { app._cachedFlashcardsGroupedDirty = true; });
    });

    const mindmapsGroupedDeps = ['mindmaps', 'viewMode', 'selectedPaper', 'contentFilterGroup', 'contentFilterSection', 'currentGroups'];
    mindmapsGroupedDeps.forEach(prop => {
        app.$watch(prop, () => { app._cachedMindmapsGroupedDirty = true; });
    });

    app.$watch('testSetBuilderCards', () => { app._cachedInheritedTagsDirty = true; });
    app.$watch('flashcardDecks', () => { app._cachedInheritedTagsDirty = true; });

    app.$watch('flashcardDecks', () => { app._cachedFilteredDecksForBuilderDirty = true; });
    app.$watch('advancedSearchTags', () => { app._cachedFilteredDecksForBuilderDirty = true; });
    app.$watch('testSetBuilderSearch', () => { app._cachedFilteredDecksForBuilderDirty = true; });

    app.$watch('criticalTopicsPage', () => { app._cachedCriticalTopicsPageDirty = true; });
    app.$watch('analyticsData', () => { app._cachedCriticalTopicsPageDirty = true; });
    app.$watch('strongTopicsPage', () => { app._cachedStrongTopicsPageDirty = true; });
    app.$watch('analyticsData', () => { app._cachedStrongTopicsPageDirty = true; });

    const currentTagsDeps = ['tagSelectorContext', 'noteEditorTags', 'flashcardEditorTags', 'mindmapEditorTags'];
    currentTagsDeps.forEach(prop => {
        app.$watch(prop, () => { app._cachedCurrentTagsDirty = true; });
    });

    app.$watch('testFlashcards', () => { app._cachedReviewCardsDirty = true; });
    app.$watch('testReviewMode', () => { app._cachedReviewCardsDirty = true; });
    app.$watch('testAnswers', () => { app._cachedReviewCardsDirty = true; });

    const revisionSectionDeps = ['currentRevisionSection', 'userNotes', 'flashcardDecks', 'mindmaps'];
    revisionSectionDeps.forEach(prop => {
        app.$watch(prop, () => {
            app._cachedNotesForCurrentSectionDirty = true;
            app._cachedFlashcardDecksForCurrentSectionDirty = true;
            app._cachedMindmapsForCurrentSectionDirty = true;
        });
    });
}
