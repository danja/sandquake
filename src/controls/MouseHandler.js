/**
 * Mouse input handler for camera controls
 * Provides mouse-based pan, tilt, and zoom controls
 */

/**
 * Mouse handler for camera controls with 'e' key toggle
 */
export class MouseHandler {
    /**
     * Create a new mouse handler
     * @param {HTMLElement} element - Element to attach mouse events to
     */
    constructor(element = document) {
        this.element = element;
        this.enabled = false;
        this.isMouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Sensitivity settings
        this.panSensitivity = 0.005; // Radians per pixel
        this.tiltSensitivity = 0.003; // Radians per pixel
        this.zoomSensitivity = 0.1; // Zoom factor per wheel delta
        
        // Mouse button states
        this.leftButtonDown = false;
        this.rightButtonDown = false;
        this.middleButtonDown = false;
        
        // Callbacks for camera actions
        this.onPan = null;
        this.onTilt = null;
        this.onZoom = null;
        this.onModeChange = null;
        
        // Initialize event listeners
        this.setupEventListeners();
        
        console.log('MouseHandler: Initialized (press E to toggle mouse control)');
    }

    /**
     * Set up all mouse and keyboard event listeners
     */
    setupEventListeners() {
        // Keyboard event for toggling mouse control
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Mouse events on the target element
        if (this.element && this.element.addEventListener) {
            this.element.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            this.element.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            this.element.addEventListener('mouseup', (e) => this.handleMouseUp(e));
            this.element.addEventListener('wheel', (e) => this.handleWheel(e));
            this.element.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
            
            // Handle mouse leave to clean up state
            this.element.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
        }
        
        // Global mouse up to handle cases where mouse is released outside element
        document.addEventListener('mouseup', (e) => this.handleGlobalMouseUp(e));
    }

    /**
     * Handle keyboard input for toggling mouse control
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown(event) {
        if (event.code === 'KeyE' && !event.repeat) {
            this.toggleMouseControl();
            event.preventDefault();
        }
    }

    /**
     * Toggle mouse control mode
     */
    toggleMouseControl() {
        this.enabled = !this.enabled;
        
        // Update cursor style
        if (this.element && this.element.style) {
            this.element.style.cursor = this.enabled ? 'none' : 'default';
        }
        
        // Reset mouse state when toggling
        this.isMouseDown = false;
        this.leftButtonDown = false;
        this.rightButtonDown = false;
        this.middleButtonDown = false;
        
        console.log(`MouseHandler: Mouse control ${this.enabled ? 'enabled' : 'disabled'}`);
        
        // Notify listeners of mode change
        if (this.onModeChange) {
            this.onModeChange(this.enabled);
        }
    }

    /**
     * Handle mouse down events
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseDown(event) {
        if (!this.enabled) return;
        
        event.preventDefault();
        this.isMouseDown = true;
        
        // Track which button is pressed
        switch (event.button) {
            case 0: // Left button
                this.leftButtonDown = true;
                break;
            case 1: // Middle button
                this.middleButtonDown = true;
                break;
            case 2: // Right button
                this.rightButtonDown = true;
                break;
        }
        
        // Store initial mouse position
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
        
        // Hide cursor when dragging
        if (this.element && this.element.style) {
            this.element.style.cursor = 'none';
        }
    }

    /**
     * Handle mouse move events
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseMove(event) {
        if (!this.enabled || !this.isMouseDown) return;
        
        event.preventDefault();
        
        // Calculate mouse delta
        const deltaX = event.clientX - this.lastMouseX;
        const deltaY = event.clientY - this.lastMouseY;
        
        // Apply camera movements based on button pressed
        if (this.leftButtonDown) {
            // Left button: Pan and tilt
            if (this.onPan) {
                this.onPan(-deltaX * this.panSensitivity);
            }
            
            if (this.onTilt) {
                this.onTilt(deltaY * this.tiltSensitivity);
            }
        }
        
        // Update last mouse position
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    }

    /**
     * Handle mouse up events
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseUp(event) {
        if (!this.enabled) return;
        
        // Update button states
        switch (event.button) {
            case 0: // Left button
                this.leftButtonDown = false;
                break;
            case 1: // Middle button
                this.middleButtonDown = false;
                break;
            case 2: // Right button
                this.rightButtonDown = false;
                break;
        }
        
        // If no buttons are pressed, mouse is no longer down
        if (!this.leftButtonDown && !this.middleButtonDown && !this.rightButtonDown) {
            this.isMouseDown = false;
            
            // Restore cursor
            if (this.element && this.element.style) {
                this.element.style.cursor = this.enabled ? 'crosshair' : 'default';
            }
        }
    }

    /**
     * Handle global mouse up (for cases where mouse is released outside element)
     * @param {MouseEvent} event - Mouse event
     */
    handleGlobalMouseUp(event) {
        if (this.enabled && this.isMouseDown) {
            this.handleMouseUp(event);
        }
    }

    /**
     * Handle mouse leaving the element
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseLeave(event) {
        // Reset mouse state when leaving element
        this.isMouseDown = false;
        this.leftButtonDown = false;
        this.rightButtonDown = false;
        this.middleButtonDown = false;
    }

    /**
     * Handle mouse wheel events for zooming
     * @param {WheelEvent} event - Wheel event
     */
    handleWheel(event) {
        if (!this.enabled) return;
        
        event.preventDefault();
        
        // Calculate zoom delta
        const delta = -event.deltaY * this.zoomSensitivity;
        
        if (this.onZoom) {
            this.onZoom(delta);
        }
    }

    /**
     * Handle context menu to prevent it when mouse control is enabled
     * @param {Event} event - Context menu event
     */
    handleContextMenu(event) {
        if (this.enabled) {
            event.preventDefault();
        }
    }

    /**
     * Set pan callback
     * @param {Function} callback - Pan callback (direction)
     */
    setPanCallback(callback) {
        this.onPan = callback;
    }

    /**
     * Set tilt callback
     * @param {Function} callback - Tilt callback (direction)
     */
    setTiltCallback(callback) {
        this.onTilt = callback;
    }

    /**
     * Set zoom callback
     * @param {Function} callback - Zoom callback (delta)
     */
    setZoomCallback(callback) {
        this.onZoom = callback;
    }

    /**
     * Set mode change callback
     * @param {Function} callback - Mode change callback (enabled)
     */
    setModeChangeCallback(callback) {
        this.onModeChange = callback;
    }

    /**
     * Check if mouse control is enabled
     * @returns {boolean} True if mouse control is enabled
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Set mouse control enabled state
     * @param {boolean} enabled - Whether to enable mouse control
     */
    setEnabled(enabled) {
        if (this.enabled !== enabled) {
            this.toggleMouseControl();
        }
    }

    /**
     * Set sensitivity values
     * @param {Object} sensitivity - Sensitivity settings
     * @param {number} sensitivity.pan - Pan sensitivity
     * @param {number} sensitivity.tilt - Tilt sensitivity
     * @param {number} sensitivity.zoom - Zoom sensitivity
     */
    setSensitivity({ pan, tilt, zoom }) {
        if (pan !== undefined) this.panSensitivity = pan;
        if (tilt !== undefined) this.tiltSensitivity = tilt;
        if (zoom !== undefined) this.zoomSensitivity = zoom;
    }

    /**
     * Get current sensitivity settings
     * @returns {Object} Sensitivity settings
     */
    getSensitivity() {
        return {
            pan: this.panSensitivity,
            tilt: this.tiltSensitivity,
            zoom: this.zoomSensitivity
        };
    }

    /**
     * Dispose of the mouse handler and remove event listeners
     */
    dispose() {
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('mouseup', this.handleGlobalMouseUp);
        
        if (this.element && this.element.removeEventListener) {
            this.element.removeEventListener('mousedown', this.handleMouseDown);
            this.element.removeEventListener('mousemove', this.handleMouseMove);
            this.element.removeEventListener('mouseup', this.handleMouseUp);
            this.element.removeEventListener('wheel', this.handleWheel);
            this.element.removeEventListener('contextmenu', this.handleContextMenu);
            this.element.removeEventListener('mouseleave', this.handleMouseLeave);
        }
        
        // Reset cursor
        if (this.element && this.element.style) {
            this.element.style.cursor = 'default';
        }
        
        console.log('MouseHandler: Disposed');
    }
}