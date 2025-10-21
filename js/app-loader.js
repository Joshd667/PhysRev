// js/app-loader.js - ULTRA-FAST VERSION with parallel loading

(async function() {
    try {
        console.log('🚀 Starting ULTRA-FAST Physics Audit Tool initialization...');
        const startTime = performance.now();

        // Start ALL async operations in parallel
        const initPromises = [
            // 0. Load HTML templates FIRST
            import('./template-loader.js').then(({ loadTemplates }) => {
                return loadTemplates();
            }),

            // 1. Load Alpine.js in parallel (pinned version for stability)
            import('https://cdn.jsdelivr.net/npm/alpinejs@3.13.3/dist/module.esm.js').then(module => {
                window.Alpine = module.default;
                console.log('✅ Alpine.js loaded');
                return module.default;
            }),

            // 2. Placeholder for group configurations (loaded with data below)
            Promise.resolve(null),

            // 3. Load physics audit tool (refactored)
            import('./core/app.js').then(module => {
                console.log('✅ Physics audit tool module loaded');
                return module.createApp;
            }),

            // 4. Load data (JSON first, CSV fallback) - includes revision mappings
            loadDataWithFallback()
        ];

        // Wait for all parallel operations (graceful degradation on failures)
        const results = await Promise.allSettled(initPromises);

        const loadTime = performance.now() - startTime;

        // Check for failures
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
            console.warn(`⚠️ ${failures.length} resource(s) failed to load:`, failures.map(f => f.reason));
        }

        // Extract successful results
        const [templatesLoaded, Alpine, _unused, createApp, dataResult] = results.map(r =>
            r.status === 'fulfilled' ? r.value : null
        );

        // Verify critical resources loaded
        if (!Alpine || !createApp || !dataResult) {
            throw new Error('Critical resources failed to load');
        }

        console.log(`⚡ All resources loaded in ${loadTime.toFixed(2)}ms`);

        // Note: Alpine.js v3.13.3 doesn't have onComponentException API
        // Error handling is done through try-catch blocks in individual methods

        // Create and start the app (groups now come from dataResult)
        Alpine.data('physicsAuditTool', createApp(
            dataResult.specificationData,
            dataResult.paperModeGroups,
            dataResult.specModeGroups,
            Alpine
        ));

        Alpine.start();

        const totalTime = performance.now() - startTime;
        console.log(`🎉 Application started in ${totalTime.toFixed(2)}ms`);

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
        const loadTime = performance.now() - startTime;

        console.log(`🚀 JSON loaded in ${loadTime.toFixed(2)}ms (${Object.keys(data.specificationData).length} sections)`);

        // Set up instant resource lookup
        window.getResourcesForSection = createOptimizedResourceGetter(data.resourceData);

        // Initialize revision mappings from JSON (if available)
        if (data.revisionMappings) {
            window.revisionMapping = data.revisionMappings.revisionMapping || {};
            window.topicToSectionMapping = data.revisionMappings.topicToSectionMapping || {};
            window.revisionSectionTitles = data.revisionSectionTitles || {};

            const revisionSectionCount = Object.keys(window.revisionMapping).length;
            console.log(`✅ Revision mappings initialized from JSON (${revisionSectionCount} sections)`);
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
            console.log('✅ Groups loaded from JSON (no CSV request needed)');
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
    console.log('🔄 Building resource indexes...');
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

    const indexTime = performance.now() - startTime;
    console.log(`⚡ Resource indexes built in ${indexTime.toFixed(2)}ms`);

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
