/**
 * Speed control for adjusting simulation speed
 */

/**
 * Controls the global speed of the simulation
 */
export class SpeedControl {
    /**
     * Create a new speed control
     * @param {string} sliderId - ID of the speed slider element
     * @param {string} displayId - ID of the speed display element
     * @param {Object} options - Configuration options
     */
    constructor(sliderId, displayId, options = {}) {
        const {
            minSpeed = 0,
            maxSpeed = 5,
            defaultSpeed = 1,
            step = 0.1
        } = options;

        this.minSpeed = minSpeed;
        this.maxSpeed = maxSpeed;
        this.currentSpeed = defaultSpeed;
        this.step = step;

        // Get DOM elements
        this.slider = document.getElementById(sliderId);
        this.display = document.getElementById(displayId);

        if (!this.slider) {
            console.error(`Speed slider element with ID '${sliderId}' not found`);
            return;
        }

        if (!this.display) {
            console.error(`Speed display element with ID '${displayId}' not found`);
            return;
        }

        // Callback for speed changes
        this.onSpeedChange = null;

        this.setupSlider();
        this.setupEventListeners();
        this.updateDisplay();
    }

    /**
     * Set up the slider with initial values
     */
    setupSlider() {
        this.slider.min = this.minSpeed;
        this.slider.max = this.maxSpeed;
        this.slider.step = this.step;
        this.slider.value = this.currentSpeed;
    }

    /**
     * Set up event listeners for the slider
     */
    setupEventListeners() {
        // Handle slider input
        this.slider.addEventListener('input', () => {
            this.setSpeed(parseFloat(this.slider.value));
        });

        // Handle keyboard shortcuts for speed control
        document.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown(event) {
        // Only handle if no input element is focused
        if (document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA') {
            return;
        }

        switch (event.code) {
            case 'Minus':
            case 'NumpadSubtract':
                event.preventDefault();
                this.decreaseSpeed();
                break;
            case 'Equal':
            case 'NumpadAdd':
                event.preventDefault();
                this.increaseSpeed();
                break;
            case 'Digit0':
            case 'Numpad0':
                event.preventDefault();
                this.setSpeed(0);
                break;
            case 'Digit1':
            case 'Numpad1':
                event.preventDefault();
                this.setSpeed(1);
                break;
            case 'Space':
                event.preventDefault();
                this.togglePause();
                break;
        }
    }

    /**
     * Set the simulation speed
     * @param {number} speed - New speed value
     */
    setSpeed(speed) {
        this.currentSpeed = Math.max(this.minSpeed, Math.min(this.maxSpeed, speed));
        this.slider.value = this.currentSpeed;
        this.updateDisplay();
        
        if (this.onSpeedChange) {
            this.onSpeedChange(this.currentSpeed);
        }
    }

    /**
     * Get the current speed
     * @returns {number} Current speed value
     */
    getSpeed() {
        return this.currentSpeed;
    }

    /**
     * Increase speed by one step
     */
    increaseSpeed() {
        this.setSpeed(this.currentSpeed + this.step);
    }

    /**
     * Decrease speed by one step
     */
    decreaseSpeed() {
        this.setSpeed(this.currentSpeed - this.step);
    }

    /**
     * Toggle between current speed and zero (pause/unpause)
     */
    togglePause() {
        if (this.currentSpeed > 0) {
            this.lastNonZeroSpeed = this.currentSpeed;
            this.setSpeed(0);
        } else {
            this.setSpeed(this.lastNonZeroSpeed || 1);
        }
    }

    /**
     * Reset speed to default value
     */
    reset() {
        this.setSpeed(1); // Default speed
    }

    /**
     * Update the display element with current speed
     */
    updateDisplay() {
        if (this.display) {
            this.display.textContent = `${this.currentSpeed.toFixed(1)}x`;
        }
    }

    /**
     * Set the callback function for speed changes
     * @param {Function} callback - Function to call when speed changes
     */
    setCallback(callback) {
        this.onSpeedChange = callback;
    }

    /**
     * Enable or disable the speed control
     * @param {boolean} enabled - Whether to enable the control
     */
    setEnabled(enabled) {
        this.slider.disabled = !enabled;
        this.enabled = enabled;
    }

    /**
     * Check if the control is enabled
     * @returns {boolean} True if enabled
     */
    isEnabled() {
        return this.enabled !== false;
    }

    /**
     * Set speed limits
     * @param {number} min - Minimum speed
     * @param {number} max - Maximum speed
     */
    setLimits(min, max) {
        this.minSpeed = Math.max(0, min);
        this.maxSpeed = Math.max(this.minSpeed, max);
        
        this.setupSlider();
        
        // Clamp current speed to new limits
        if (this.currentSpeed < this.minSpeed || this.currentSpeed > this.maxSpeed) {
            this.setSpeed(Math.max(this.minSpeed, Math.min(this.maxSpeed, this.currentSpeed)));
        }
    }

    /**
     * Get speed limits
     * @returns {Object} Min and max speed {min, max}
     */
    getLimits() {
        return {
            min: this.minSpeed,
            max: this.maxSpeed
        };
    }

    /**
     * Set the step size for speed adjustments
     * @param {number} step - Step size
     */
    setStep(step) {
        this.step = Math.max(0.01, step);
        this.slider.step = this.step;
    }

    /**
     * Get the current step size
     * @returns {number} Step size
     */
    getStep() {
        return this.step;
    }

    /**
     * Get control state information
     * @returns {Object} Control state
     */
    getState() {
        return {
            currentSpeed: this.currentSpeed,
            limits: this.getLimits(),
            step: this.step,
            enabled: this.isEnabled(),
            lastNonZeroSpeed: this.lastNonZeroSpeed
        };
    }

    /**
     * Add visual feedback for speed changes
     * @param {string} className - CSS class to add temporarily
     * @param {number} duration - Duration in milliseconds
     */
    addVisualFeedback(className = 'speed-changed', duration = 200) {
        if (this.slider) {
            this.slider.classList.add(className);
            setTimeout(() => {
                this.slider.classList.remove(className);
            }, duration);
        }
    }

    /**
     * Dispose of the speed control
     */
    dispose() {
        // Remove event listeners
        if (this.slider) {
            this.slider.removeEventListener('input', this.handleSliderInput);
        }
        
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // Clear references
        this.onSpeedChange = null;
        this.slider = null;
        this.display = null;
    }
}