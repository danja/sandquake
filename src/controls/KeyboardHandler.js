/**
 * Keyboard input handler for camera controls
 */

/**
 * Handles keyboard input for camera panning and tilting
 */
export class KeyboardHandler {
    /**
     * Create a new keyboard handler
     */
    constructor() {
        this.keys = new Set();
        this.callbacks = {
            pan: null,
            tilt: null
        };
        
        // Animation frame for smooth movement
        this.animationId = null;
        this.lastTime = 0;
        
        this.setupEventListeners();
        this.startUpdateLoop();
    }

    /**
     * Set up keyboard event listeners
     */
    setupEventListeners() {
        // Bind event handlers to maintain correct 'this' context
        this.boundKeyDown = (event) => {
            this.handleKeyDown(event);
        };
        
        this.boundKeyUp = (event) => {
            this.handleKeyUp(event);
        };
        
        this.boundPreventDefault = (event) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) {
                event.preventDefault();
            }
        };

        document.addEventListener('keydown', this.boundKeyDown);
        document.addEventListener('keyup', this.boundKeyUp);
        document.addEventListener('keydown', this.boundPreventDefault);
    }

    /**
     * Handle key down events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown(event) {
        this.keys.add(event.code);
    }

    /**
     * Handle key up events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyUp(event) {
        this.keys.delete(event.code);
    }

    /**
     * Start the update loop for continuous input processing
     */
    startUpdateLoop() {
        const update = (currentTime) => {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            this.processInput(deltaTime / 1000); // Convert to seconds
            
            this.animationId = requestAnimationFrame(update);
        };
        
        this.animationId = requestAnimationFrame(update);
    }

    /**
     * Process currently pressed keys
     * @param {number} deltaTime - Time elapsed since last update (seconds)
     */
    processInput(deltaTime) {
        // Pan controls (left/right arrows)
        if (this.keys.has('ArrowLeft')) {
            this.triggerPan(-1, deltaTime);
        }
        if (this.keys.has('ArrowRight')) {
            this.triggerPan(1, deltaTime);
        }

        // Tilt controls (up/down arrows)
        if (this.keys.has('ArrowUp')) {
            this.triggerTilt(1, deltaTime);
        }
        if (this.keys.has('ArrowDown')) {
            this.triggerTilt(-1, deltaTime);
        }
    }

    /**
     * Trigger pan callback
     * @param {number} direction - Pan direction (-1 for left, 1 for right)
     * @param {number} deltaTime - Time elapsed since last update
     */
    triggerPan(direction, deltaTime) {
        if (this.callbacks.pan) {
            this.callbacks.pan(direction, deltaTime);
        }
    }

    /**
     * Trigger tilt callback
     * @param {number} direction - Tilt direction (-1 for down, 1 for up)
     * @param {number} deltaTime - Time elapsed since last update
     */
    triggerTilt(direction, deltaTime) {
        if (this.callbacks.tilt) {
            this.callbacks.tilt(direction, deltaTime);
        }
    }

    /**
     * Set the pan callback function
     * @param {Function} callback - Function to call when panning (direction, deltaTime)
     */
    set onPan(callback) {
        this.callbacks.pan = callback;
    }

    /**
     * Set the tilt callback function
     * @param {Function} callback - Function to call when tilting (direction, deltaTime)
     */
    set onTilt(callback) {
        this.callbacks.tilt = callback;
    }

    /**
     * Check if a specific key is currently pressed
     * @param {string} keyCode - Key code to check
     * @returns {boolean} True if key is pressed
     */
    isKeyPressed(keyCode) {
        return this.keys.has(keyCode);
    }

    /**
     * Get all currently pressed keys
     * @returns {Array} Array of pressed key codes
     */
    getPressedKeys() {
        return Array.from(this.keys);
    }

    /**
     * Add a custom key handler
     * @param {string} keyCode - Key code to handle
     * @param {Function} callback - Function to call when key is pressed
     */
    addKeyHandler(keyCode, callback) {
        if (!this.customHandlers) {
            this.customHandlers = new Map();
        }
        this.customHandlers.set(keyCode, callback);
    }

    /**
     * Remove a custom key handler
     * @param {string} keyCode - Key code to remove handler for
     */
    removeKeyHandler(keyCode) {
        if (this.customHandlers) {
            this.customHandlers.delete(keyCode);
        }
    }

    /**
     * Process custom key handlers
     * @param {number} deltaTime - Time elapsed since last update
     */
    processCustomHandlers(deltaTime) {
        if (!this.customHandlers) return;
        
        for (const [keyCode, callback] of this.customHandlers) {
            if (this.keys.has(keyCode)) {
                callback(deltaTime);
            }
        }
    }

    /**
     * Enable or disable the keyboard handler
     * @param {boolean} enabled - Whether to enable the handler
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Check if the handler is enabled
     * @returns {boolean} True if enabled
     */
    isEnabled() {
        return this.enabled !== false; // Default to true
    }

    /**
     * Dispose of the keyboard handler
     */
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Remove event listeners using the bound functions
        if (this.boundKeyDown) {
            document.removeEventListener('keydown', this.boundKeyDown);
        }
        if (this.boundKeyUp) {
            document.removeEventListener('keyup', this.boundKeyUp);
        }
        if (this.boundPreventDefault) {
            document.removeEventListener('keydown', this.boundPreventDefault);
        }
        
        this.keys.clear();
        this.callbacks = {};
        if (this.customHandlers) {
            this.customHandlers.clear();
        }
        
        // Clean up bound function references
        this.boundKeyDown = null;
        this.boundKeyUp = null;
        this.boundPreventDefault = null;
    }

    /**
     * Reset all pressed keys (useful when window loses focus)
     */
    reset() {
        this.keys.clear();
    }

    /**
     * Get input state information
     * @returns {Object} Input state information
     */
    getState() {
        return {
            pressedKeys: this.getPressedKeys(),
            enabled: this.isEnabled(),
            hasCallbacks: {
                pan: !!this.callbacks.pan,
                tilt: !!this.callbacks.tilt
            }
        };
    }
}