/**
 * Randomness control slider for sandbox simulation
 * Controls the amount of randomness in avalanche mechanics
 */

/**
 * Randomness control class for managing the randomness slider
 */
export class RandomnessControl {
    /**
     * Create a new randomness control
     * @param {string} sliderId - ID of the range input slider element
     * @param {string} valueId - ID of the value display element
     */
    constructor(sliderId, valueId) {
        this.slider = document.getElementById(sliderId);
        this.valueDisplay = document.getElementById(valueId);
        
        // Current randomness value (0.0 to 1.0)
        this.randomness = 0.0;
        
        // Callback for when randomness changes
        this.onRandomnessChange = null;
        
        // Initialize if elements exist
        if (this.slider && this.valueDisplay) {
            this.initialize();
        } else {
            console.error('RandomnessControl: Required elements not found');
        }
    }

    /**
     * Initialize the control elements and event listeners
     */
    initialize() {
        // Set initial values
        this.slider.value = this.randomness;
        this.updateDisplay();
        
        // Add event listener for slider changes
        this.slider.addEventListener('input', (event) => {
            this.handleSliderChange(event);
        });
        
        // Add event listener for real-time updates while dragging
        this.slider.addEventListener('change', (event) => {
            this.handleSliderChange(event);
        });
        
        console.log('RandomnessControl: Initialized');
    }

    /**
     * Handle slider value changes
     * @param {Event} event - Input event from slider
     */
    handleSliderChange(event) {
        const newValue = parseFloat(event.target.value);
        this.setRandomness(newValue);
    }

    /**
     * Set the randomness value
     * @param {number} value - Randomness value (0.0 to 1.0)
     */
    setRandomness(value) {
        // Clamp value between 0 and 1
        this.randomness = Math.max(0.0, Math.min(1.0, value));
        
        // Update UI elements
        if (this.slider) {
            this.slider.value = this.randomness;
        }
        
        this.updateDisplay();
        
        // Notify listeners
        if (this.onRandomnessChange) {
            this.onRandomnessChange(this.randomness);
        }
        
        console.log(`RandomnessControl: Randomness set to ${(this.randomness * 100).toFixed(1)}%`);
    }

    /**
     * Get the current randomness value
     * @returns {number} Current randomness (0.0 to 1.0)
     */
    getRandomness() {
        return this.randomness;
    }

    /**
     * Update the value display
     */
    updateDisplay() {
        if (this.valueDisplay) {
            const percentage = (this.randomness * 100).toFixed(1);
            this.valueDisplay.textContent = `${percentage}%`;
        }
    }

    /**
     * Set the callback for randomness changes
     * @param {Function} callback - Callback function (randomness) => void
     */
    setOnRandomnessChange(callback) {
        this.onRandomnessChange = callback;
    }

    /**
     * Enable or disable the control
     * @param {boolean} enabled - Whether the control should be enabled
     */
    setEnabled(enabled) {
        if (this.slider) {
            this.slider.disabled = !enabled;
        }
        
        // Add visual feedback
        const container = this.slider?.parentElement;
        if (container) {
            if (enabled) {
                container.classList.remove('disabled');
            } else {
                container.classList.add('disabled');
            }
        }
    }

    /**
     * Check if the control is enabled
     * @returns {boolean} True if the control is enabled
     */
    isEnabled() {
        return this.slider ? !this.slider.disabled : false;
    }

    /**
     * Reset randomness to default (0.0)
     */
    reset() {
        this.setRandomness(0.0);
    }

    /**
     * Set randomness to maximum (1.0)
     */
    maximize() {
        this.setRandomness(1.0);
    }

    /**
     * Get control information for debugging
     * @returns {Object} Control state information
     */
    getInfo() {
        return {
            randomness: this.randomness,
            percentage: (this.randomness * 100).toFixed(1) + '%',
            enabled: this.isEnabled(),
            hasSlider: !!this.slider,
            hasValueDisplay: !!this.valueDisplay
        };
    }

    /**
     * Apply randomness configuration from settings object
     * @param {Object} settings - Settings object
     * @param {number} settings.randomness - Randomness value
     * @param {boolean} settings.enabled - Whether control is enabled
     */
    applySettings(settings) {
        if (settings.randomness !== undefined) {
            this.setRandomness(settings.randomness);
        }
        
        if (settings.enabled !== undefined) {
            this.setEnabled(settings.enabled);
        }
    }

    /**
     * Get current settings as object
     * @returns {Object} Current settings
     */
    getSettings() {
        return {
            randomness: this.randomness,
            enabled: this.isEnabled()
        };
    }

    /**
     * Add keyboard shortcuts for randomness control
     */
    addKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Only handle shortcuts when not typing in inputs
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch (event.code) {
                case 'KeyR':
                    if (event.ctrlKey || event.metaKey) {
                        // Ctrl/Cmd + R: Reset randomness
                        event.preventDefault();
                        this.reset();
                    }
                    break;
                    
                case 'Equal':
                case 'NumpadAdd':
                    if (event.ctrlKey || event.metaKey) {
                        // Ctrl/Cmd + Plus: Increase randomness
                        event.preventDefault();
                        this.setRandomness(Math.min(1.0, this.randomness + 0.1));
                    }
                    break;
                    
                case 'Minus':
                case 'NumpadSubtract':
                    if (event.ctrlKey || event.metaKey) {
                        // Ctrl/Cmd + Minus: Decrease randomness
                        event.preventDefault();
                        this.setRandomness(Math.max(0.0, this.randomness - 0.1));
                    }
                    break;
            }
        });
        
        console.log('RandomnessControl: Keyboard shortcuts enabled');
    }

    /**
     * Dispose of the control and remove event listeners
     */
    dispose() {
        if (this.slider) {
            this.slider.removeEventListener('input', this.handleSliderChange);
            this.slider.removeEventListener('change', this.handleSliderChange);
        }
        
        // Clear callbacks
        this.onRandomnessChange = null;
        
        console.log('RandomnessControl: Disposed');
    }
}