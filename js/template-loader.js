/**
 * Template Loader - Client-Side Fetch Implementation
 * Loads HTML templates and components into their container divs
 *
 * ⚡ PERFORMANCE OPTIMIZATION:
 * - Critical templates loaded immediately (needed for UI)
 * - Large modals lazy-loaded on first use (settings, editors, privacy)
 */

// Track which templates have been lazy-loaded
const lazyLoadedTemplates = new Set();

/**
 * Lazy-loads a template on demand
 * @param {string} id - Container element ID
 * @param {string} path - Template file path
 * @returns {Promise<boolean>} - Success status
 */
export async function loadTemplateLazy(id, path) {
    // Return immediately if already loaded
    if (lazyLoadedTemplates.has(id)) {
        return true;
    }

    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const html = await response.text();
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = html;
            lazyLoadedTemplates.add(id);

            // ⚡ Refresh icons after lazy load (debounced)
            if (window.refreshIconsDebounced) {
                window.refreshIconsDebounced();
            }

            console.log(`✅ Lazy-loaded template: ${path}`);
            return true;
        } else {
            console.warn(`⚠️ Container not found: #${id}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Failed to lazy-load ${path}:`, error);
        return false;
    }
}

export async function loadTemplates() {
    // ⚡ OPTIMIZATION: Only load critical templates immediately
    // Large modals (settings, editors, privacy) are lazy-loaded on first use
    const templates = [
        // Critical templates (needed for immediate UI render)
        { id: 'sidebar-container', path: './templates/sidebar.html' },
        { id: 'top-bar-container', path: './templates/top-bar.html' },
        { id: 'main-menu-container', path: './templates/main-menu.html' },
        { id: 'section-cards-container', path: './templates/section-cards.html' },
        { id: 'topic-detail-container', path: './templates/topic-detail.html' },
        { id: 'search-results-container', path: './templates/search-results.html' },
        { id: 'revision-view-container', path: './templates/revision-view.html' },
        { id: 'all-notes-view-container', path: './templates/all-notes-view.html' },
        { id: 'all-flashcards-view-container', path: './templates/all-flashcards-view.html' },
        { id: 'all-mindmaps-view-container', path: './templates/all-mindmaps-view.html' },
        { id: 'analytics-dashboard-container', path: './templates/analytics-dashboard.html' },

        // Smaller modals (low overhead, keep for now)
        { id: 'equation-editor-modal-container', path: './templates/equation-editor-modal.html' },
        { id: 'flashcard-test-modal-container', path: './templates/flashcard-test-modal.html' },
        { id: 'mindmap-node-editor-container', path: './templates/mindmap-node-editor.html' },
        { id: 'tag-selector-modal-container', path: './templates/tag-selector-modal.html' },
        { id: 'custom-modal-container', path: './templates/custom-modal.html' }

        // ⚡ LAZY-LOADED (on first use):
        // - settings-modal-container (57 KB) → loaded when openSettings() called
        // - note-editor-modal-container (40 KB) → loaded when note created
        // - flashcard-editor-modal-container (32 KB) → loaded when flashcard created
        // - mindmap-editor-modal-container (47 KB) → loaded when mindmap created
        // - privacy-notice-modal-container (17 KB) → loaded if user hasn't seen it
    ];

    // Load all templates in parallel for better performance
    const loadPromises = templates.map(async ({ id, path }) => {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const html = await response.text();
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = html;
                return { success: true, path };
            } else {
                console.warn(`⚠️ Container not found: #${id}`);
                return { success: false, path };
            }
        } catch (error) {
            console.error(`❌ Failed to load ${path}:`, error);
            return { success: false, path };
        }
    });

    const results = await Promise.all(loadPromises);
    const loaded = results.filter(r => r.success).length;
    console.log(`✅ Templates loaded (${loaded}/${templates.length})`);

    // ⚡ Re-initialize Lucide icons after templates are inserted (debounced)
    if (window.refreshIconsDebounced) {
        window.refreshIconsDebounced();
    }
}
