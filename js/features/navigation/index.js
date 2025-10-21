// js/modules/navigation.js

export const navigationMethods = {
    toggleViewMode() {
        this.viewMode = this.viewMode === 'paper' ? 'spec' : 'paper';
        this.collapseAllDropdowns();
        this.showingMainMenu = true;
        this.showingSpecificSection = false;
        this.showingRevision = false;
        this.lastExpandedGroup = null;

        // Clear shared content filters when toggling view mode
        this.clearNotesFilters(); // All three methods now clear the same shared state

        if (this.viewMode === 'spec') {
            this.selectedPaper = 'All Topics';
        } else {
            this.selectedPaper = 'Paper 1';
        }
        const firstItem = this.currentGroups[0];
        this.activeSection = firstItem.type === 'single' ? firstItem.key : firstItem.sections[0];
    },

    setSelectedPaper(paper) {
        if (this.viewMode === 'spec') {
            this.viewMode = 'paper';
        }
        this.selectedPaper = paper;
        this.collapseAllDropdowns();
        this.showingMainMenu = true;
        this.showingSpecificSection = false;
        this.showingRevision = false;
        this.lastExpandedGroup = null;

        // Clear shared content filters when changing paper
        this.clearNotesFilters(); // All three methods now clear the same shared state
    },

    collapseAllDropdowns() {
        this.expandedGroups = {};
    },

    selectSection(sectionKey) {
        this.showingAnalytics = false;
        this.activeSection = sectionKey;

        // Delegate to appropriate feature module based on view type
        if (this.viewType === 'notes') {
            this.setNotesFilterSection(sectionKey);
            // Don't hide sidebar on mobile for notes view
        } else if (this.viewType === 'flashcards') {
            this.setFlashcardsFilterSection(sectionKey);
            // Don't hide sidebar on mobile for flashcards view
        } else if (this.viewType === 'mindmaps') {
            this.setMindmapsFilterSection(sectionKey);
            // Don't hide sidebar on mobile for mindmaps view
        } else {
            // Default behavior for audit view
            this.showingSpecificSection = true;
            this.showingMainMenu = false;
            this.showingRevision = false;

            const parentGroup = this.currentGroups.find(item =>
                item.type === "group" && item.sections.includes(sectionKey)
            );
            if (parentGroup) {
                this.lastExpandedGroup = parentGroup.title;
                this.expandedGroups[parentGroup.title] = true;
            }
            if (window.innerWidth < 768) {
                this.sidebarVisible = false;
            }
        }
    },

    toggleGroup(groupTitle) {
        this.showingAnalytics = false;

        // Delegate to appropriate feature module based on view type
        if (this.viewType === 'notes') {
            this.setNotesFilterGroup(groupTitle);
            // Also toggle the dropdown expansion
            this.expandedGroups[groupTitle] = !this.expandedGroups[groupTitle];
        } else if (this.viewType === 'flashcards') {
            this.setFlashcardsFilterGroup(groupTitle);
            // Also toggle the dropdown expansion
            this.expandedGroups[groupTitle] = !this.expandedGroups[groupTitle];
        } else if (this.viewType === 'mindmaps') {
            this.setMindmapsFilterGroup(groupTitle);
            // Also toggle the dropdown expansion
            this.expandedGroups[groupTitle] = !this.expandedGroups[groupTitle];
        } else {
            // Default behavior for audit view
            this.lastExpandedGroup = groupTitle;
            this.showingSpecificSection = false;
            this.showingMainMenu = false;
            this.showingRevision = false;
            this.expandedGroups[groupTitle] = !this.expandedGroups[groupTitle];
        }
    },

    selectMainMenuGroup(groupTitle) {
        this.showingAnalytics = false;
        this.lastExpandedGroup = groupTitle;
        this.expandedGroups[groupTitle] = true;
        this.showingMainMenu = false;
        this.showingSpecificSection = false;
        this.showingRevision = false;
        // Force icon refresh
        this.$nextTick(() => lucide.createIcons());
    },
    
    // Update the goBackToMainMenu method
    goBackToMainMenu() {
        this.showingAnalytics = false;
        this.showingMainMenu = true;
        this.showingSpecificSection = false;
        this.showingRevision = false;
        this.lastExpandedGroup = null;
        // Force icon refresh
        this.$nextTick(() => lucide.createIcons());
    },
    
    // Update the goBackToGroupCards method
    goBackToGroupCards() {
        this.showingSpecificSection = false;
        this.showingMainMenu = false;
        this.showingRevision = false;
        // lastExpandedGroup should remain set to show the group title
        // Force icon refresh
        this.$nextTick(() => lucide.createIcons());
    },
};
