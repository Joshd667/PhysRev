// js/features/revision/view.js - Revision view navigation

export const revisionViewMethods = {
    goBackFromRevision() {
        this.showingRevision = false;
        this.showingSpecificSection = true;
        this.currentRevisionSection = '';
        this.currentRevisionSectionTitle = '';
        this.currentRevisionTopics = [];
        this.currentRevisionResources = null;
        this.$nextTick(() => lucide.createIcons());
    }
};
