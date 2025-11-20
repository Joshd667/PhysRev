import { logger } from './utils/logger.js';

(async function() {
    try {
        const url = new URL(window.location.href);
        if (url.searchParams.has('_refresh')) {
            url.searchParams.delete('_refresh');
            window.history.replaceState({}, document.title, url.toString());
        }

        const startTime = performance.now();

        const initPromises = [
            import('./utils/storage.js').then(({ storageUtils }) => {
                return storageUtils.init();
            }),

            import('./template-loader.js').then(({ loadTemplates }) => {
                return loadTemplates();
            }),

            import('https://cdn.jsdelivr.net/npm/alpinejs@3.13.3/dist/module.esm.js').then(module => {
                window.Alpine = module.default;
                return module.default;
            }),

            Promise.resolve(null),

            import('./core/app.js').then(module => module.createApp),

            loadDataWithFallback()
        ];

        const results = await Promise.allSettled(initPromises);

        const loadTime = performance.now() - startTime;

        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
            logger.error('Full failure details:', failures);
        }

        const [idbInit, templatesLoaded, Alpine, _unused, createApp, dataResult] = results.map(r =>
            r.status === 'fulfilled' ? r.value : null
        );


        if (!Alpine || !createApp || !dataResult) {
            const failedResources = [];
            if (!Alpine) failedResources.push('Alpine.js');
            if (!createApp) failedResources.push('App creator');
            if (!dataResult) failedResources.push('Data');

            logger.error('❌ Failed resources:', failedResources);
            logger.error('All results:', results);
            throw new Error(`Critical resources failed to load: ${failedResources.join(', ')}`);
        }

        // Register pagination helpers before starting Alpine
        const { registerPaginationHelpers } = await import('./components/paginated-list.js');
        registerPaginationHelpers(Alpine);

        Alpine.data('physicsAuditTool', createApp(
            dataResult.specificationData,
            dataResult.paperModeGroups,
            dataResult.specModeGroups,
            Alpine
        ));

        const originalEvaluate = Alpine.evaluate;
        Alpine.evaluate = function(el, expression, extras = {}) {
            try {
                return originalEvaluate.call(this, el, expression, extras);
            } catch (error) {
                logger.error('❌ Alpine expression error:', {
                    expression,
                    element: el,
                    error
                });

                if (error.message.includes('is not a function') || error.message.includes('Cannot read')) {
                    const fallback = document.getElementById('error-fallback');
                    const errorMessage = document.getElementById('error-message');
                    if (fallback && errorMessage) {
                        fallback.classList.remove('hidden');
                        errorMessage.textContent = `Alpine.js Error: ${error.message}`;
                    }
                }

                return undefined;
            }
        };

        Alpine.start();

    } catch (error) {
        logger.error('❌ Failed to initialize Physics Audit Tool:', error);
        showErrorScreen(error);
    }
})();

async function loadDataWithFallback() {
    try {
        const startTime = performance.now();
        
        const response = await fetch('./resources/combined-data.json', {
            cache: 'default'
        });
        
        if (!response.ok) {
            throw new Error(`JSON not available (${response.status})`);
        }
        
        const data = await response.json();

        window.getResourcesForSection = await createOptimizedResourceGetter(data.resourceData);

        if (data.revisionMappings) {
            window.revisionMapping = data.revisionMappings.revisionMapping || {};
            window.topicToSectionMapping = data.revisionMappings.topicToSectionMapping || {};
            window.revisionSectionTitles = data.revisionSectionTitles || {};
        } else {
            window.revisionMapping = {};
            window.topicToSectionMapping = {};
            window.revisionSectionTitles = {};
        }

        let paperModeGroups = {};
        let specModeGroups = {};

        if (data.paperModeGroups && data.specModeGroups) {
            paperModeGroups = data.paperModeGroups;
            specModeGroups = data.specModeGroups;
        } else {
            const { loadGroups } = await import('./data/unified-csv-loader.js');
            const groups = await loadGroups();
            paperModeGroups = groups.paperModeGroups;
            specModeGroups = groups.specModeGroups;
        }

        return {
            specificationData: data.specificationData,
            resourcesLoaded: true,
            paperModeGroups: paperModeGroups,
            specModeGroups: specModeGroups
        };

        } catch (jsonError) {
            // Import and use existing CSV loader
            const { loadAllData, getResourcesForSection } = await import('./data/unified-csv-loader.js');
            const result = await loadAllData();

            window.getResourcesForSection = getResourcesForSection;

            return {
                specificationData: result.specificationData,
                resourcesLoaded: result.resourcesLoaded,
                paperModeGroups: result.paperModeGroups,
                specModeGroups: result.specModeGroups
            };
        }
}

async function createOptimizedResourceGetter(resourceData) {
    const startTime = performance.now();

    const { getResourceCreator, createRevisionSection } = await import('./utils/resource-schema.js');

    const indexes = {
        videos: new Map(),
        notes: new Map(),
        simulations: new Map(),
        questions: new Map(),
        sections: new Map()
    };

    const resourceTypes = [
        { key: 'videos', data: resourceData.videos },
        { key: 'notes', data: resourceData.notes },
        { key: 'simulations', data: resourceData.simulations },
        { key: 'questions', data: resourceData.questions }
    ];

    resourceTypes.forEach(({ key, data }) => {
        if (!data) return;

        const resourceCreator = getResourceCreator(key);

        data.forEach(item => {
            const sectionId = item.section_id?.toString().trim();
            if (!sectionId) return;

            if (!indexes[key].has(sectionId)) {
                indexes[key].set(sectionId, []);
            }

            const optimizedItem = resourceCreator(item);
            indexes[key].get(sectionId).push(optimizedItem);
        });
    });

    if (resourceData.revisionsections) {
        resourceData.revisionsections.forEach(section => {
            const sectionId = section.section_id?.toString().trim();
            if (!sectionId) return;

            indexes.sections.set(sectionId, createRevisionSection(section));
        });
    }

    return function getResourcesForSection(sectionId) {
        const sectionIdStr = sectionId?.toString().trim() || '';

        return {
            section: indexes.sections.get(sectionIdStr) || null,
            videos: indexes.videos.get(sectionIdStr) || [],
            notes: indexes.notes.get(sectionIdStr) || [],
            simulations: indexes.simulations.get(sectionIdStr) || [],
            questions: indexes.questions.get(sectionIdStr) || []
        };
    };
}

function showErrorScreen(error) {
    document.body.innerHTML = `
        <div style="padding: 2rem; text-align: center; font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626;">⚠️ Application Failed to Load</h1>
            <p>The Physics Audit Tool encountered an error during startup.</p>
            
            <div style="margin: 1.5rem 0; padding: 1.5rem; background: #fef3c7; border-radius: 0.75rem; text-align: left;">
                <h3 style="margin-top: 0; color: #92400e;">🚀 Speed Optimization</h3>
                <p style="margin-bottom: 1rem;">For <strong>ultra-fast</strong> loading:</p>
                <ol style="margin: 0; padding-left: 1.5rem;">
                    <li>Open <strong>csv-converter.html</strong></li>
                    <li>Convert your CSVs to optimized JSON</li>
                    <li>Place at <code>js/data/combined-data.json</code></li>
                    <li>Reload for <strong>sub-second</strong> loading!</li>
                </ol>
            </div>
            
            <details style="margin-top: 1rem; text-align: left; background: #f3f4f6; padding: 1rem; border-radius: 0.5rem;">
                <summary style="cursor: pointer; font-weight: bold;">🔧 Technical Details</summary>
                <pre style="margin-top: 0.5rem; white-space: pre-wrap; font-size: 0.875rem;">${error.message}\n\n${error.stack}</pre>
            </details>
            
            <div style="margin-top: 2rem;">
                <button onclick="location.reload()" style="padding: 0.75rem 1.5rem; background: #3b82f6; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 1rem; margin-right: 0.5rem;">
                    🔄 Retry
                </button>
                <button onclick="window.open('csv-converter.html', '_blank')" style="padding: 0.75rem 1.5rem; background: #10b981; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 1rem;">
                    🚀 Optimize
                </button>
            </div>
        </div>
    `;
}
