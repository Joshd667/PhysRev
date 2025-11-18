// js/utils/modals.js
// Custom modal dialog methods to replace browser alerts/confirms/prompts

export const modalMethods = {
    /**
     * Show a custom alert modal
     * @param {string} message - The message to display
     * @param {string} title - Optional title (defaults to "Alert")
     * @returns {Promise<void>}
     */
    showAlert(message, title = 'Alert') {
        return new Promise((resolve) => {
            this.modalType = 'alert';
            this.modalTitle = title;
            this.modalMessage = message;
            this.modalInputValue = '';
            this.modalCallback = () => {
                this.showCustomModal = false;
                resolve();
            };
            this.showCustomModal = true;

            // Refresh icons after modal is shown
            this.$nextTick(() => {
                if (window.lucide) lucide.createIcons();
            });
        });
    },

    /**
     * Show a custom confirm modal
     * @param {string} message - The message to display
     * @param {string} title - Optional title (defaults to "Confirm")
     * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
     */
    showConfirm(message, title = 'Confirm') {
        return new Promise((resolve) => {
            this.modalType = 'confirm';
            this.modalTitle = title;
            this.modalMessage = message;
            this.modalInputValue = '';
            this.modalCallback = (result) => {
                this.showCustomModal = false;
                resolve(result);
            };
            this.showCustomModal = true;

            // Refresh icons after modal is shown
            this.$nextTick(() => {
                if (window.lucide) lucide.createIcons();
            });
        });
    },

    /**
     * Show a custom prompt modal
     * @param {string} message - The message to display
     * @param {string} defaultValue - Default input value
     * @param {string} title - Optional title (defaults to "Input")
     * @returns {Promise<string|null>} - Resolves to input value if confirmed, null if cancelled
     */
    showPrompt(message, defaultValue = '', title = 'Input') {
        return new Promise((resolve) => {
            this.modalType = 'prompt';
            this.modalTitle = title;
            this.modalMessage = message;
            this.modalInputValue = defaultValue;
            this.modalCallback = (result) => {
                this.showCustomModal = false;
                resolve(result);
            };
            this.showCustomModal = true;

            // Refresh icons after modal is shown
            this.$nextTick(() => {
                if (window.lucide) lucide.createIcons();
            });
        });
    },

    /**
     * Handle modal confirmation
     */
    confirmModal() {
        if (this.modalCallback) {
            if (this.modalType === 'prompt') {
                this.modalCallback(this.modalInputValue || null);
            } else if (this.modalType === 'confirm') {
                this.modalCallback(true);
            } else {
                this.modalCallback();
            }
        }
    },

    /**
     * Handle modal cancellation
     */
    cancelModal() {
        if (this.modalCallback) {
            if (this.modalType === 'prompt') {
                this.modalCallback(null);
            } else if (this.modalType === 'confirm') {
                this.modalCallback(false);
            }
        }
        this.showCustomModal = false;
    }
};
