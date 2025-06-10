/**
 * Touch input handler for mobile camera controls
 * Provides touch-based pan, tilt, and pinch-to-zoom controls
 */

/**
 * Touch handler for mobile camera controls
 */
export class TouchHandler {
    /**
     * Create a new touch handler
     * @param {HTMLElement} element - Element to attach touch events to
     */
    constructor(element = document) {
        this.element = element;
        this.enabled = true; // Touch is always enabled on touch devices
        
        // Touch state tracking
        this.touches = new Map();
        this.lastTouchPositions = new Map();
        
        // Gesture state
        this.isPanning = false;
        this.isPinching = false;
        this.lastPinchDistance = 0;
        this.panStartTime = 0;
        
        // Sensitivity settings
        this.panSensitivity = 0.01; // Radians per pixel
        this.tiltSensitivity = 0.007; // Radians per pixel
        this.zoomSensitivity = 0.01; // Zoom factor per pixel distance change
        
        // Minimum movement thresholds to prevent jitter
        this.minPanDistance = 2; // pixels
        this.minPinchDistance = 10; // pixels
        
        // Callbacks for camera actions
        this.onPan = null;
        this.onTilt = null;
        this.onZoom = null;
        
        // Initialize event listeners
        this.setupEventListeners();
        
        console.log('TouchHandler: Initialized');
    }

    /**
     * Set up all touch event listeners
     */
    setupEventListeners() {
        if (this.element && this.element.addEventListener) {
            // Touch events
            this.element.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
            this.element.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
            this.element.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
            this.element.addEventListener('touchcancel', (e) => this.handleTouchCancel(e), { passive: false });
            
            // Prevent default context menu on long press
            this.element.addEventListener('contextmenu', (e) => e.preventDefault());
        }
    }

    /**
     * Handle touch start events
     * @param {TouchEvent} event - Touch event
     */
    handleTouchStart(event) {
        if (!this.enabled) return;
        
        event.preventDefault();
        
        // Update touch tracking
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            this.touches.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY,
                startTime: performance.now()
            });
        }
        
        // Determine gesture type based on number of touches
        const touchCount = this.touches.size;
        
        if (touchCount === 1) {
            // Single touch - prepare for panning
            this.startPanning();
        } else if (touchCount === 2) {
            // Two touches - start pinch-to-zoom
            this.startPinching();
        }
        
        // Store initial positions for all touches
        this.updateLastTouchPositions();
    }

    /**
     * Handle touch move events
     * @param {TouchEvent} event - Touch event
     */
    handleTouchMove(event) {
        if (!this.enabled) return;
        
        event.preventDefault();
        
        // Update current touch positions
        const currentTouches = new Map();
        for (let i = 0; i < event.touches.length; i++) {
            const touch = event.touches[i];
            currentTouches.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY
            });
        }
        
        const touchCount = currentTouches.size;
        
        if (touchCount === 1 && this.isPanning) {
            this.handlePanning(currentTouches);
        } else if (touchCount === 2 && this.isPinching) {
            this.handlePinching(currentTouches);
        }
        
        // Update last positions
        this.lastTouchPositions = new Map(currentTouches);
    }

    /**
     * Handle touch end events
     * @param {TouchEvent} event - Touch event
     */
    handleTouchEnd(event) {
        if (!this.enabled) return;
        
        // Remove ended touches from tracking
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            this.touches.delete(touch.identifier);
            this.lastTouchPositions.delete(touch.identifier);
        }
        
        const remainingTouches = this.touches.size;
        
        if (remainingTouches === 0) {
            // No more touches - end all gestures
            this.endAllGestures();
        } else if (remainingTouches === 1 && this.isPinching) {
            // Went from pinch to single touch
            this.endPinching();
            this.startPanning();
        }
    }

    /**
     * Handle touch cancel events
     * @param {TouchEvent} event - Touch event
     */
    handleTouchCancel(event) {
        // Treat cancel as touch end
        this.handleTouchEnd(event);
    }

    /**
     * Start panning gesture
     */
    startPanning() {
        this.isPanning = true;
        this.panStartTime = performance.now();
        console.log('TouchHandler: Started panning');
    }

    /**
     * Handle panning gesture
     * @param {Map} currentTouches - Current touch positions
     */
    handlePanning(currentTouches) {
        if (this.lastTouchPositions.size === 0) return;
        
        // Get the single touch
        const touchId = currentTouches.keys().next().value;
        const current = currentTouches.get(touchId);
        const last = this.lastTouchPositions.get(touchId);
        
        if (!current || !last) return;
        
        // Calculate movement delta
        const deltaX = current.x - last.x;
        const deltaY = current.y - last.y;
        
        // Check if movement is significant enough
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance < this.minPanDistance) return;
        
        // Apply camera movements
        if (this.onPan) {
            this.onPan(-deltaX * this.panSensitivity);
        }
        
        if (this.onTilt) {
            this.onTilt(deltaY * this.tiltSensitivity);
        }
    }

    /**
     * End panning gesture
     */
    endPanning() {
        this.isPanning = false;
        console.log('TouchHandler: Ended panning');
    }

    /**
     * Start pinching gesture
     */
    startPinching() {
        this.isPinching = true;
        this.lastPinchDistance = this.calculatePinchDistance();
        console.log('TouchHandler: Started pinching');
    }

    /**
     * Handle pinching gesture
     * @param {Map} currentTouches - Current touch positions
     */
    handlePinching(currentTouches) {
        if (currentTouches.size !== 2) return;
        
        const currentDistance = this.calculatePinchDistanceFromTouches(currentTouches);
        
        if (this.lastPinchDistance > 0) {
            const deltaDistance = currentDistance - this.lastPinchDistance;
            
            // Check if distance change is significant enough
            if (Math.abs(deltaDistance) < this.minPinchDistance) return;
            
            // Apply zoom
            if (this.onZoom) {
                const zoomDelta = deltaDistance * this.zoomSensitivity;
                this.onZoom(-zoomDelta); // Negative for intuitive pinch-to-zoom
            }
        }
        
        this.lastPinchDistance = currentDistance;
    }

    /**
     * End pinching gesture
     */
    endPinching() {
        this.isPinching = false;
        this.lastPinchDistance = 0;
        console.log('TouchHandler: Ended pinching');
    }

    /**
     * End all active gestures
     */
    endAllGestures() {
        this.endPanning();
        this.endPinching();
    }

    /**
     * Calculate distance between two touches for pinch detection
     * @returns {number} Distance between touches
     */
    calculatePinchDistance() {
        if (this.lastTouchPositions.size !== 2) return 0;
        
        const positions = Array.from(this.lastTouchPositions.values());
        const dx = positions[1].x - positions[0].x;
        const dy = positions[1].y - positions[0].y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calculate distance between two touches from given touch map
     * @param {Map} touches - Touch positions map
     * @returns {number} Distance between touches
     */
    calculatePinchDistanceFromTouches(touches) {
        if (touches.size !== 2) return 0;
        
        const positions = Array.from(touches.values());
        const dx = positions[1].x - positions[0].x;
        const dy = positions[1].y - positions[0].y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Update last touch positions from current touches
     */
    updateLastTouchPositions() {
        this.lastTouchPositions.clear();
        this.touches.forEach((touch, id) => {
            this.lastTouchPositions.set(id, {
                x: touch.x,
                y: touch.y
            });
        });
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
     * Check if touch control is enabled
     * @returns {boolean} True if touch control is enabled
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Set touch control enabled state
     * @param {boolean} enabled - Whether to enable touch control
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (!enabled) {
            this.endAllGestures();
        }
        
        console.log(`TouchHandler: Touch control ${enabled ? 'enabled' : 'disabled'}`);
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
     * Get current gesture state
     * @returns {Object} Gesture state
     */
    getState() {
        return {
            enabled: this.enabled,
            panning: this.isPanning,
            pinching: this.isPinching,
            touchCount: this.touches.size
        };
    }

    /**
     * Dispose of the touch handler and remove event listeners
     */
    dispose() {
        if (this.element && this.element.removeEventListener) {
            this.element.removeEventListener('touchstart', this.handleTouchStart);
            this.element.removeEventListener('touchmove', this.handleTouchMove);
            this.element.removeEventListener('touchend', this.handleTouchEnd);
            this.element.removeEventListener('touchcancel', this.handleTouchCancel);
            this.element.removeEventListener('contextmenu', this.handleContextMenu);
        }
        
        // Clear all touch tracking
        this.touches.clear();
        this.lastTouchPositions.clear();
        this.endAllGestures();
        
        console.log('TouchHandler: Disposed');
    }
}