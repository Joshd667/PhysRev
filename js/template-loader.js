/**
 * Template Loader - Client-Side Fetch Implementation
 * Loads HTML templates and components into their container divs
 */

export async function loadTemplates() {
    const templates = [
        // login-screen is inlined in index.html for faster first paint
        { id: 'settings-modal-container', path: './templates/settings-modal.html' },
        { id: 'note-editor-modal-container', path: './templates/note-editor-modal.html' },
        { id: 'equation-editor-modal-container', path: './templates/equation-editor-modal.html' }, // NEW
        { id: 'flashcard-editor-modal-container', path: './templates/flashcard-editor-modal.html' },
        { id: 'flashcard-test-modal-container', path: './templates/flashcard-test-modal.html' },
        { id: 'mindmap-editor-modal-container', path: './templates/mindmap-editor-modal.html' },
        { id: 'mindmap-node-editor-container', path: './templates/mindmap-node-editor.html' },
        { id: 'tag-selector-modal-container', path: './templates/tag-selector-modal.html' },
        { id: 'sidebar-container', path: './templates/sidebar.html' },
        { id: 'top-bar-container', path: './templates/top-bar.html' },
        { id: 'search-results-container', path: './templates/search-results.html' },
        { id: 'analytics-dashboard-container', path: './templates/analytics-dashboard.html' },
        { id: 'revision-view-container', path: './templates/revision-view.html' },
        { id: 'all-notes-view-container', path: './templates/all-notes-view.html' },
        { id: 'all-flashcards-view-container', path: './templates/all-flashcards-view.html' },
        { id: 'all-mindmaps-view-container', path: './templates/all-mindmaps-view.html' },
        { id: 'main-menu-container', path: './templates/main-menu.html' },
        { id: 'section-cards-container', path: './templates/section-cards.html' },
        { id: 'topic-detail-container', path: './templates/topic-detail.html' }
    ];

    console.log('📦 Loading templates...');

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
                console.log(`✅ Loaded: ${path}`);
            } else {
                console.warn(`⚠️ Container not found: #${id}`);
            }
        } catch (error) {
            console.error(`❌ Failed to load ${path}:`, error);
        }
    });

    await Promise.all(loadPromises);

    console.log('✅ All templates loaded successfully');

    // Re-initialize Lucide icons after templates are inserted
    if (window.lucide) {
        window.lucide.createIcons();
        console.log('🎨 Lucide icons initialized');
    }
}
