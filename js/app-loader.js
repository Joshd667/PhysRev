// js/app-loader.js - ULTRA-FAST VERSION with parallel loading

(async function() {
    try {
        // Clean up force refresh parameter from URL if present
        const url = new URL(window.location.href);
        if (url.searchParams.has('_refresh')) {
            url.searchParams.delete('_refresh');
            window.history.replaceState({}, document.title, url.toString());
        }

        const startTime = performance.now();

        // Start ALL async operations in parallel
        const initPromises = [
            // 0. Initialize IndexedDB and migrate from localStorage
            import('./utils/storage.js').then(({ storageUtils }) => {
                return storageUtils.init();
            }),

            // 1. Load HTML templates
            import('./template-loader.js').then(({ loadTemplates }) => {
                return loadTemplates();
            }),

            // 2. Load Alpine.js in parallel (pinned version for stability)
            import('https://cdn.jsdelivr.net/npm/alpinejs@3.13.3/dist/module.esm.js').then(module => {
                window.Alpine = module.default;
                return module.default;
            }),

            // 3. Placeholder for group configurations (loaded with data below)
            Promise.resolve(null),

            // 4. Load physics audit tool (refactored)
            import('./core/app.js').then(module => module.createApp),

            // 5. Load data (JSON first, CSV fallback) - includes revision mappings
            loadDataWithFallback()
        ];

        // Wait for all parallel operations (graceful degradation on failures)
        const results = await Promise.allSettled(initPromises);

        const loadTime = performance.now() - startTime;

        // Check for failures
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
            console.warn(`⚠️ ${failures.length} resource(s) failed to load:`, failures.map(f => f.reason));
            console.error('Full failure details:', failures);
        }

        // Extract successful results
        const [idbInit, templatesLoaded, Alpine, _unused, createApp, dataResult] = results.map(r =>
            r.status === 'fulfilled' ? r.value : null
        );

        // Log IndexedDB initialization status
        if (idbInit && idbInit.success) {
            console.log('✅ IndexedDB initialized and migration complete');
        } else {
            console.warn('⚠️ IndexedDB initialization had issues');
        }

        // Verify critical resources loaded
        if (!Alpine || !createApp || !dataResult) {
            const failedResources = [];
            if (!Alpine) failedResources.push('Alpine.js');
            if (!createApp) failedResources.push('App creator');
            if (!dataResult) failedResources.push('Data');

            console.error('❌ Failed resources:', failedResources);
            console.error('All results:', results);
            throw new Error(`Critical resources failed to load: ${failedResources.join(', ')}`);
        }

        // Create and start the app (groups now come from dataResult)
        Alpine.data('physicsAuditTool', createApp(
            dataResult.specificationData,
            dataResult.paperModeGroups,
            dataResult.specModeGroups,
            Alpine
        ));

        // ✅ ERROR BOUNDARY: Alpine.js error interception
        // Wrap Alpine methods to catch errors in reactive expressions
        const originalEvaluate = Alpine.evaluate;
        Alpine.evaluate = function(el, expression, extras = {}) {
            try {
                return originalEvaluate.call(this, el, expression, extras);
            } catch (error) {
                console.error('❌ Alpine expression error:', {
                    expression,
                    element: el,
                    error
                });

                // Show error fallback for critical errors
                if (error.message.includes('is not a function') || error.message.includes('Cannot read')) {
                    const fallback = document.getElementById('error-fallback');
                    const errorMessage = document.getElementById('error-message');
                    if (fallback && errorMessage) {
                        fallback.classList.remove('hidden');
                        errorMessage.textContent = `Alpine.js Error: ${error.message}`;
                    }
                }

                // Return safe default to prevent cascade
                return undefined;
            }
        };

        Alpine.start();

        const totalTime = performance.now() - startTime;
        console.log(`🎉 App ready in ${totalTime.toFixed(0)}ms`);

    } catch (error) {
        console.error('❌ Failed to initialize Physics Audit Tool:', error);
        showErrorScreen(error);
    }
})();

// Optimized data loading with smart fallback
async function loadDataWithFallback() {
    try {
        console.log('⚡ Attempting JSON loading...');
        const startTime = performance.now();
        
        const response = await fetch('./resources/combined-data.json', {
            cache: 'default'
        });
        
        if (!response.ok) {
            throw new Error(`JSON not available (${response.status})`);
        }
        
        const data = await response.json();

        // Set up instant resource lookup
        window.getResourcesForSection = await createOptimizedResourceGetter(data.resourceData);

        // Initialize revision mappings from JSON (if available)
        if (data.revisionMappings) {
            window.revisionMapping = data.revisionMappings.revisionMapping || {};
            window.topicToSectionMapping = data.revisionMappings.topicToSectionMapping || {};
            window.revisionSectionTitles = data.revisionSectionTitles || {};
        } else {
            console.warn('⚠️ JSON file missing revision mappings - regenerate using csv-converter-unified.html');
            window.revisionMapping = {};
            window.topicToSectionMapping = {};
            window.revisionSectionTitles = {};
        }

        // Load groups from JSON (v2.0+) or fallback to CSV
        let paperModeGroups = {};
        let specModeGroups = {};

        if (data.paperModeGroups && data.specModeGroups) {
            // Groups included in JSON (v2.0+)
            paperModeGroups = data.paperModeGroups;
            specModeGroups = data.specModeGroups;
        } else {
            // Fallback: Load groups from CSV (old JSON files)
            console.warn('⚠️ JSON file missing groups - loading from CSV (regenerate JSON for optimal performance)');
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
            console.log('📝 JSON not found, using CSV fallback...');
            console.log('💡 Run csv-converter.html to create combined-data.json for 10x faster loading');

            // Import and use existing CSV loader
            const { loadAllData, getResourcesForSection } = await import('./data/unified-csv-loader.js');
            const result = await loadAllData();

            // ✅ Set up the global function for CSV path (this was missing!)
            window.getResourcesForSection = getResourcesForSection;

            return {
                specificationData: result.specificationData,
                resourcesLoaded: result.resourcesLoaded,
                paperModeGroups: result.paperModeGroups,
                specModeGroups: result.specModeGroups
            };
        }
}

// OPTIMIZED resource getter with pre-computed indexes
// Note: Duplicate checking is removed - done in converter tools for performance
async function createOptimizedResourceGetter(resourceData) {
    const startTime = performance.now();

    // Import shared resource schema
    const { getResourceCreator, createRevisionSection } = await import('./utils/resource-schema.js');

    // Pre-build ALL indexes at once for maximum speed
    const indexes = {
        videos: new Map(),
        notes: new Map(),
        simulations: new Map(),
        questions: new Map(),
        sections: new Map()
    };

    // Batch process all resource types using shared schema
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

            // Use shared resource schema (no duplicate checking - done in converter)
            const optimizedItem = resourceCreator(item);
            indexes[key].get(sectionId).push(optimizedItem);
        });
    });

    // Process revision sections using shared schema
    if (resourceData.revisionsections) {
        resourceData.revisionsections.forEach(section => {
            const sectionId = section.section_id?.toString().trim();
            if (!sectionId) return;

            indexes.sections.set(sectionId, createRevisionSection(section));
        });
    }

    // Return ultra-fast lookup function using Maps
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
