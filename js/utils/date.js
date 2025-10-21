// js/utils/date.js
// Date utility functions

export const dateUtils = {
    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString();
    },

    formatTime(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleTimeString();
    },

    formatDateTime(date) {
        if (!date) return '';
        const d = new Date(date);
        return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
    },

    getDayOfWeek(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { weekday: 'long' });
    },

    getWeekKey(date) {
        const d = new Date(date);
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        return startOfWeek.toLocaleDateString();
    },

    isToday(date) {
        const d = new Date(date);
        const today = new Date();
        return d.toDateString() === today.toDateString();
    },

    daysDifference(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
};
