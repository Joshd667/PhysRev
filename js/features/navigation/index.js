// js/modules/navigation.js

export const navigationMethods = {
    toggleViewMode() {
        // If already in spec mode, just reset state (like clicking Paper 1/2/3)
        if (this.viewMode === 'spec') {
            this.collapseAllDropdowns();
            this.showingMainMenu = true;
            this.showingSpecificSection = false;
            this.showingRevision = false;
            this.lastExpandedGroup = null;
            this.searchVisible = false;
            this.clearNotesFilters();
            return;
        }

        // Toggle from paper to spec
        this.viewMode = 'spec';
        this.collapseAllDropdowns();
        this.showingMainMenu = true;
        this.showingSpecificSection = false;
        this.showingRevision = false;
        this.lastExpandedGroup = null;

        // Close search
        this.searchVisible = false;

        // Clear shared content filters when toggling view mode
        this.clearNotesFilters(); // All three methods now clear the same shared state

        this.selectedPaper = 'All Topics';
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

        // Close search
        this.searchVisible = false;

        // Clear shared content filters when changing paper
        this.clearNotesFilters(); // All three methods now clear the same shared state
    },

    collapseAllDropdowns() {
        this.expandedGroups = {};
    },

    selectSection(sectionKey) {
        this.showingAnalytics = false;
        this.activeSection = sectionKey;

        // Close search
        this.searchVisible = false;

        // Close all groups first (only one group open at a time)
        Object.keys(this.expandedGroups).forEach(key => {
            this.expandedGroups[key] = false;
        });

        // Always find and set the parent group for consistency
        const parentGroup = this.currentGroups.find(item =>
            item.type === "group" && item.sections && item.sections.includes(sectionKey)
        );
        if (parentGroup) {
            this.lastExpandedGroup = parentGroup.title;
            this.expandedGroups[parentGroup.title] = true;
        }

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

            if (window.innerWidth < 768) {
                this.sidebarVisible = false;
            }
        }
    },

    toggleGroup(groupTitle) {
        this.showingAnalytics = false;

        // Close search
        this.searchVisible = false;

        // Check if this group is currently expanded
        const isCurrentlyExpanded = this.expandedGroups[groupTitle];

        // Close all groups first (only one group open at a time)
        Object.keys(this.expandedGroups).forEach(key => {
            this.expandedGroups[key] = false;
        });

        // Delegate to appropriate feature module based on view type
        if (this.viewType === 'notes') {
            this.setNotesFilterGroup(groupTitle);
            // Toggle the dropdown expansion (if was closed, open it; if was open, keep it closed)
            this.expandedGroups[groupTitle] = !isCurrentlyExpanded;
        } else if (this.viewType === 'flashcards') {
            this.setFlashcardsFilterGroup(groupTitle);
            // Toggle the dropdown expansion
            this.expandedGroups[groupTitle] = !isCurrentlyExpanded;
        } else if (this.viewType === 'mindmaps') {
            this.setMindmapsFilterGroup(groupTitle);
            // Toggle the dropdown expansion
            this.expandedGroups[groupTitle] = !isCurrentlyExpanded;
        } else {
            // Default behavior for audit view
            this.lastExpandedGroup = groupTitle;
            this.showingSpecificSection = false;
            this.showingMainMenu = false;
            this.showingRevision = false;
            this.expandedGroups[groupTitle] = !isCurrentlyExpanded;
        }
    },

    selectMainMenuGroup(groupTitle) {
        this.showingAnalytics = false;

        // Close all groups first (only one group open at a time)
        Object.keys(this.expandedGroups).forEach(key => {
            this.expandedGroups[key] = false;
        });

        this.lastExpandedGroup = groupTitle;
        this.expandedGroups[groupTitle] = true;
        this.showingMainMenu = false;
        this.showingSpecificSection = false;
        this.showingRevision = false;

        // Close search
        this.searchVisible = false;

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

        // Close search
        this.searchVisible = false;

        // Force icon refresh
        this.$nextTick(() => lucide.createIcons());
    },

    // Update the goBackToGroupCards method
    goBackToGroupCards() {
        this.showingSpecificSection = false;
        this.showingMainMenu = false;
        this.showingRevision = false;

        // Close search
        this.searchVisible = false;

        // lastExpandedGroup should remain set to show the group title
        // Force icon refresh
        this.$nextTick(() => lucide.createIcons());
    },
};
