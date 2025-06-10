/**
 * Sources control for managing sand sources
 */

/**
 * Controls for adding, removing, and managing sand sources
 */
export class SourcesControl {
    /**
     * Create a new sources control
     * @param {string} addButtonId - ID of the add source button
     * @param {string} removeButtonId - ID of the remove source button
     * @param {string} countDisplayId - ID of the source count display
     * @param {Object} options - Configuration options
     */
    constructor(addButtonId, removeButtonId, countDisplayId, options = {}) {
        const {
            maxSources = 10,
            minSources = 0
        } = options;

        this.maxSources = maxSources;
        this.minSources = minSources;
        this.currentCount = 0;

        // Get DOM elements
        this.addButton = document.getElementById(addButtonId);
        this.removeButton = document.getElementById(removeButtonId);
        this.countDisplay = document.getElementById(countDisplayId);

        if (!this.addButton) {
            console.error(`Add source button with ID '${addButtonId}' not found`);
            return;
        }

        if (!this.removeButton) {
            console.error(`Remove source button with ID '${removeButtonId}' not found`);
            return;
        }

        if (!this.countDisplay) {
            console.error(`Source count display with ID '${countDisplayId}' not found`);
            return;
        }

        // Callbacks
        this.onAddSource = null;
        this.onRemoveSource = null;
        this.onSourcesChange = null;

        this.setupEventListeners();
        this.updateDisplay();
        this.updateButtonStates();
    }

    /**
     * Set up event listeners for the buttons
     */
    setupEventListeners() {
        this.addButton.addEventListener('click', () => {
            this.addSource();
        });

        this.removeButton.addEventListener('click', () => {
            this.removeSource();
        });

        // Handle keyboard shortcuts
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
            case 'KeyA':
                if (event.shiftKey) {
                    event.preventDefault();
                    this.addSource();
                }
                break;
            case 'KeyR':
                if (event.shiftKey) {
                    event.preventDefault();
                    this.removeSource();
                }
                break;
            case 'KeyC':
                if (event.ctrlKey || event.metaKey) {
                    // Don't prevent default - this is copy
                    return;
                }
                if (event.shiftKey) {
                    event.preventDefault();
                    this.clearAllSources();
                }
                break;
        }
    }

    /**
     * Add a new source
     */
    addSource() {
        if (this.currentCount >= this.maxSources) {
            this.showFeedback('Maximum sources reached', 'warning');
            return;
        }

        if (this.onAddSource) {
            this.onAddSource();
        }

        this.setSourceCount(this.currentCount + 1);
        this.showFeedback('Source added', 'success');
    }

    /**
     * Remove a source
     */
    removeSource() {
        if (this.currentCount <= this.minSources) {
            this.showFeedback('Cannot remove more sources', 'warning');
            return;
        }

        if (this.onRemoveSource) {
            this.onRemoveSource();
        }

        this.setSourceCount(this.currentCount - 1);
        this.showFeedback('Source removed', 'info');
    }

    /**
     * Clear all sources
     */
    clearAllSources() {
        const sourcesToRemove = this.currentCount - this.minSources;
        
        for (let i = 0; i < sourcesToRemove; i++) {
            if (this.onRemoveSource) {
                this.onRemoveSource();
            }
        }

        this.setSourceCount(this.minSources);
        this.showFeedback('All sources cleared', 'info');
    }

    /**
     * Set the current source count
     * @param {number} count - New source count
     */
    setSourceCount(count) {
        const oldCount = this.currentCount;
        this.currentCount = Math.max(this.minSources, Math.min(this.maxSources, count));
        
        this.updateDisplay();
        this.updateButtonStates();

        if (this.onSourcesChange && oldCount !== this.currentCount) {
            this.onSourcesChange(this.currentCount, oldCount);
        }
    }

    /**
     * Get the current source count
     * @returns {number} Current source count
     */
    getSourceCount() {
        return this.currentCount;
    }

    /**
     * Update the display with current count
     */
    updateDisplay() {
        if (this.countDisplay) {
            const text = this.currentCount === 1 ? 'source' : 'sources';
            this.countDisplay.textContent = `${this.currentCount} ${text}`;
        }
    }

    /**
     * Update button enabled/disabled states
     */
    updateButtonStates() {
        if (this.addButton) {
            this.addButton.disabled = this.currentCount >= this.maxSources;
        }

        if (this.removeButton) {
            this.removeButton.disabled = this.currentCount <= this.minSources;
        }
    }

    /**
     * Show feedback message to user
     * @param {string} message - Message to show
     * @param {string} type - Message type ('success', 'warning', 'info', 'error')
     */
    showFeedback(message, type = 'info') {
        // Create temporary feedback element
        const feedback = document.createElement('div');
        feedback.className = `sources-feedback sources-feedback-${type}`;
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 4px;
            color: white;
            font-size: 14px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        // Set background color based on type
        const colors = {
            success: '#4CAF50',
            warning: '#FF9800',
            info: '#2196F3',
            error: '#F44336'
        };
        feedback.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(feedback);

        // Animate in
        requestAnimationFrame(() => {
            feedback.style.opacity = '1';
        });

        // Remove after delay
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 300);
        }, 2000);
    }

    /**
     * Set source limits
     * @param {number} min - Minimum number of sources
     * @param {number} max - Maximum number of sources
     */
    setLimits(min, max) {
        this.minSources = Math.max(0, min);
        this.maxSources = Math.max(this.minSources, max);
        
        // Adjust current count if outside new limits
        if (this.currentCount < this.minSources || this.currentCount > this.maxSources) {
            this.setSourceCount(Math.max(this.minSources, Math.min(this.maxSources, this.currentCount)));
        }
        
        this.updateButtonStates();
    }

    /**
     * Get source limits
     * @returns {Object} Min and max limits {min, max}
     */
    getLimits() {
        return {
            min: this.minSources,
            max: this.maxSources
        };
    }

    /**
     * Enable or disable the sources control
     * @param {boolean} enabled - Whether to enable the control
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (this.addButton) {
            this.addButton.disabled = !enabled || this.currentCount >= this.maxSources;
        }
        
        if (this.removeButton) {
            this.removeButton.disabled = !enabled || this.currentCount <= this.minSources;
        }
    }

    /**
     * Check if the control is enabled
     * @returns {boolean} True if enabled
     */
    isEnabled() {
        return this.enabled !== false;
    }

    /**
     * Set the callback for adding sources
     * @param {Function} callback - Function to call when adding a source
     */
    setAddCallback(callback) {
        this.onAddSource = callback;
    }

    /**
     * Set the callback for removing sources
     * @param {Function} callback - Function to call when removing a source
     */
    setRemoveCallback(callback) {
        this.onRemoveSource = callback;
    }

    /**
     * Set the callback for source count changes
     * @param {Function} callback - Function to call when count changes (newCount, oldCount)
     */
    setChangeCallback(callback) {
        this.onSourcesChange = callback;
    }

    /**
     * Get control state information
     * @returns {Object} Control state
     */
    getState() {
        return {
            currentCount: this.currentCount,
            limits: this.getLimits(),
            enabled: this.isEnabled(),
            buttonStates: {
                addDisabled: this.addButton ? this.addButton.disabled : false,
                removeDisabled: this.removeButton ? this.removeButton.disabled : false
            }
        };
    }

    /**
     * Reset to default state
     */
    reset() {
        this.setSourceCount(3); // Default number of sources
    }

    /**
     * Dispose of the sources control
     */
    dispose() {
        // Remove event listeners
        if (this.addButton) {
            this.addButton.removeEventListener('click', this.handleAddClick);
        }
        
        if (this.removeButton) {
            this.removeButton.removeEventListener('click', this.handleRemoveClick);
        }
        
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // Clear callbacks
        this.onAddSource = null;
        this.onRemoveSource = null;
        this.onSourcesChange = null;
        
        // Clear references
        this.addButton = null;
        this.removeButton = null;
        this.countDisplay = null;
    }
}