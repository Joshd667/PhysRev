/**
 * Production-Safe Logger Utility
 *
 * Wraps console methods to allow conditional logging based on debug mode.
 * In production, only errors are logged by default.
 *
 * Usage:
 *   import { logger } from './utils/logger.js';
 *
 *   logger.log('Debug info');        // Only in debug mode
 *   logger.warn('Warning');          // Only in debug mode
 *   logger.error('Error!');          // Always logged
 *   logger.debug('Trace info');      // Only in debug mode
 *
 * Enable debug mode:
 *   localStorage.setItem('DEBUG', 'true');  // In browser console
 *   window.DEBUG = true;                     // Or set window variable
 *
 * Disable debug mode:
 *   localStorage.removeItem('DEBUG');
 *   window.DEBUG = false;
 */

/**
 * Check if debug mode is enabled
 * Checks both window.DEBUG and localStorage for flexibility
 */
function isDebugMode() {
    // Check window.DEBUG first (fastest)
    if (window.DEBUG === true) return true;
    if (window.DEBUG === false) return false;

    // Check localStorage (persists across sessions)
    try {
        const debugFlag = localStorage.getItem('DEBUG');
        return debugFlag === 'true' || debugFlag === '1';
    } catch (e) {
        // localStorage might not be available (private browsing, etc.)
        return false;
    }
}

/**
 * Get environment type
 * Used to determine default logging behavior
 */
function getEnvironment() {
    // Check if running on localhost or file://
    const isLocal = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    window.location.protocol === 'file:';

    return isLocal ? 'development' : 'production';
}

/**
 * Logger object with conditional methods
 */
export const logger = {
    /**
     * Log informational messages (debug mode only)
     */
    log(...args) {
        if (isDebugMode() || getEnvironment() === 'development') {
            console.log(...args);
        }
    },

    /**
     * Log warning messages (debug mode only)
     */
    warn(...args) {
        if (isDebugMode() || getEnvironment() === 'development') {
            console.warn(...args);
        }
    },

    /**
     * Log error messages (ALWAYS logged - critical for debugging production issues)
     */
    error(...args) {
        console.error(...args);
    },

    /**
     * Log detailed debug information (debug mode only)
     */
    debug(...args) {
        if (isDebugMode()) {
            console.debug(...args);
        }
    },

    /**
     * Log informational messages with formatting (debug mode only)
     */
    info(...args) {
        if (isDebugMode() || getEnvironment() === 'development') {
            console.info(...args);
        }
    },

    /**
     * Group related log messages (debug mode only)
     */
    group(label) {
        if (isDebugMode() || getEnvironment() === 'development') {
            console.group(label);
        }
    },

    /**
     * End a log group (debug mode only)
     */
    groupEnd() {
        if (isDebugMode() || getEnvironment() === 'development') {
            console.groupEnd();
        }
    },

    /**
     * Log a table (debug mode only)
     */
    table(data) {
        if (isDebugMode() || getEnvironment() === 'development') {
            console.table(data);
        }
    },

    /**
     * Start a timer (debug mode only)
     */
    time(label) {
        if (isDebugMode() || getEnvironment() === 'development') {
            console.time(label);
        }
    },

    /**
     * End a timer (debug mode only)
     */
    timeEnd(label) {
        if (isDebugMode() || getEnvironment() === 'development') {
            console.timeEnd(label);
        }
    },

    /**
     * Assert a condition (debug mode only)
     */
    assert(condition, ...args) {
        if (isDebugMode() || getEnvironment() === 'development') {
            console.assert(condition, ...args);
        }
    },

    /**
     * Get current debug status
     */
    isDebugEnabled() {
        return isDebugMode();
    },

    /**
     * Enable debug mode
     */
    enableDebug() {
        try {
            localStorage.setItem('DEBUG', 'true');
            window.DEBUG = true;
            console.log('🐛 Debug mode ENABLED - All logs will be shown');
            console.log('   To disable: logger.disableDebug() or localStorage.removeItem("DEBUG")');
        } catch (e) {
            window.DEBUG = true;
            console.log('🐛 Debug mode ENABLED (session only - localStorage unavailable)');
        }
    },

    /**
     * Disable debug mode
     */
    disableDebug() {
        try {
            localStorage.removeItem('DEBUG');
            window.DEBUG = false;
            console.log('🔇 Debug mode DISABLED - Only errors will be shown');
        } catch (e) {
            window.DEBUG = false;
        }
    }
};

// Make logger available globally for easy debugging in browser console
if (typeof window !== 'undefined') {
    window.logger = logger;
}

// Log initialization (only in debug mode)
if (isDebugMode()) {
    console.log(
        '%c🐛 Logger initialized in DEBUG mode',
        'color: #10b981; font-weight: bold;'
    );
    console.log('   Debug mode is ENABLED - All logs visible');
    console.log('   To disable: logger.disableDebug()');
} else if (getEnvironment() === 'development') {
    console.log(
        '%c🔧 Logger initialized in DEVELOPMENT mode',
        'color: #3b82f6; font-weight: bold;'
    );
    console.log('   Most logs visible (development environment detected)');
    console.log('   To enable full debug: logger.enableDebug()');
}

export default logger;
