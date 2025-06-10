/**
 * Seismograph renderer for oscilloscope-style visualization
 * Displays real-time waveform data in a scrolling format
 */

/**
 * Seismograph renderer class for real-time signal visualization
 */
export class SeismographRenderer {
    /**
     * Create a new seismograph renderer
     * @param {HTMLCanvasElement} canvas - Canvas element for rendering
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Rendering parameters
        this.width = 0;
        this.height = 0;
        this.displayWidth = 512; // Number of samples to display
        this.timeScale = 1.0; // Time scaling factor
        this.amplitudeScale = 1.0; // Amplitude scaling factor
        
        // Visual styling
        this.backgroundColor = 'rgba(0, 20, 0, 0.9)'; // Dark green background
        this.gridColor = 'rgba(0, 100, 0, 0.3)'; // Grid lines
        this.signalColor = 'rgba(0, 255, 0, 0.9)'; // Bright green signal
        this.axisColor = 'rgba(0, 150, 0, 0.6)'; // Axis lines
        this.textColor = 'rgba(0, 200, 0, 0.8)'; // Text color
        
        // Grid settings
        this.showGrid = true;
        this.gridDivisions = 8; // Number of grid divisions
        
        // Signal data
        this.signalData = new Float32Array(this.displayWidth);
        this.signalHistory = []; // For multiple trace display
        this.maxHistoryLength = 3;
        
        // Fixed scaling like real seismographs
        this.autoScale = false; // Disable auto-scaling to prevent flatlining
        this.signalMin = -2.0; // Fixed scale minimum
        this.signalMax = 2.0;  // Fixed scale maximum
        this.scaleUpdateRate = 0.05; // Not used in fixed mode
        this.minScaleRange = 0.2; // Not used in fixed mode
        this.logScale = false; // Use linear scaling for real-time events
        
        // Animation
        this.scrollSpeed = 1; // Pixels per frame scrolling
        this.smoothing = true;
        
        // Performance
        this.lastRenderTime = 0;
        this.targetFPS = 30;
        this.frameInterval = 1000 / this.targetFPS;
        
        // Initialize
        this.updateDimensions();
        this.setupResizeHandler();
        
        console.log('SeismographRenderer: Initialized');
    }

    /**
     * Update canvas dimensions
     */
    updateDimensions() {
        const rect = this.canvas.getBoundingClientRect();
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        this.width = rect.width * devicePixelRatio;
        this.height = rect.height * devicePixelRatio;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Scale context for device pixel ratio
        this.ctx.scale(devicePixelRatio, devicePixelRatio);
        
        // Update display width based on canvas width
        this.displayWidth = Math.floor(rect.width);
        this.signalData = new Float32Array(this.displayWidth);
    }

    /**
     * Setup resize handler
     */
    setupResizeHandler() {
        const resizeObserver = new ResizeObserver(() => {
            this.updateDimensions();
        });
        resizeObserver.observe(this.canvas);
    }

    /**
     * Update with new seismograph data
     * @param {SeismographData} seismographData - Seismograph data source
     */
    update(seismographData) {
        const currentTime = performance.now();
        if (currentTime - this.lastRenderTime < this.frameInterval) {
            return; // Skip frame to maintain target FPS
        }
        
        // Get latest signal data
        const newData = seismographData.getSignalData(this.displayWidth);
        
        // Update signal data
        this.signalData = newData;
        
        // Real seismographs use fixed scales, no auto-scaling
        // This prevents the flatlining issue
        
        // Render the display
        this.render();
        
        this.lastRenderTime = currentTime;
    }

    /**
     * Update auto-scaling based on signal data
     * @param {Float32Array} data - Signal data
     */
    updateAutoScale(data) {
        if (data.length === 0) return;
        
        // Find min/max in current data
        let dataMin = Infinity;
        let dataMax = -Infinity;
        
        for (let i = 0; i < data.length; i++) {
            if (data[i] < dataMin) dataMin = data[i];
            if (data[i] > dataMax) dataMax = data[i];
        }
        
        if (this.logScale) {
            // For seismograph log scale, use linear scaling for better visibility
            // Seismograph signals are typically small and don't need extreme log scaling
            const alpha = this.scaleUpdateRate;
            this.signalMin = this.signalMin * (1 - alpha) + dataMin * alpha;
            this.signalMax = this.signalMax * (1 - alpha) + dataMax * alpha;
            
            // Ensure minimum range to prevent over-compression
            const range = this.signalMax - this.signalMin;
            if (range < this.minScaleRange) {
                const center = (this.signalMax + this.signalMin) / 2;
                this.signalMin = center - this.minScaleRange / 2;
                this.signalMax = center + this.minScaleRange / 2;
            }
            
            // Add some padding
            const padding = Math.max(range * 0.1, this.minScaleRange * 0.05);
            this.signalMin -= padding;
            this.signalMax += padding;
        } else {
            // Linear scaling (original behavior)
            const alpha = this.scaleUpdateRate;
            this.signalMin = this.signalMin * (1 - alpha) + dataMin * alpha;
            this.signalMax = this.signalMax * (1 - alpha) + dataMax * alpha;
            
            // Ensure minimum range to prevent over-compression
            const range = this.signalMax - this.signalMin;
            if (range < this.minScaleRange) {
                const center = (this.signalMax + this.signalMin) / 2;
                this.signalMin = center - this.minScaleRange / 2;
                this.signalMax = center + this.minScaleRange / 2;
            }
            
            // Add some padding
            const padding = Math.max(range * 0.1, this.minScaleRange * 0.05);
            this.signalMin -= padding;
            this.signalMax += padding;
        }
    }

    /**
     * Render the seismograph display
     */
    render() {
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        
        // Clear canvas with background
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, width, height);
        
        // Draw grid if enabled
        if (this.showGrid) {
            this.drawGrid(width, height);
        }
        
        // Draw axes
        this.drawAxes(width, height);
        
        // Draw signal waveform
        this.drawSignal(width, height);
        
        // Draw scale information
        this.drawScaleInfo(width, height);
    }

    /**
     * Draw background grid
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    drawGrid(width, height) {
        this.ctx.strokeStyle = this.gridColor;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 2]);
        
        const xStep = width / this.gridDivisions;
        const yStep = height / this.gridDivisions;
        
        this.ctx.beginPath();
        
        // Vertical grid lines
        for (let i = 1; i < this.gridDivisions; i++) {
            const x = i * xStep;
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
        }
        
        // Horizontal grid lines
        for (let i = 1; i < this.gridDivisions; i++) {
            const y = i * yStep;
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
        }
        
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    /**
     * Draw coordinate axes
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    drawAxes(width, height) {
        const centerY = height / 2;
        
        this.ctx.strokeStyle = this.axisColor;
        this.ctx.lineWidth = 1;
        
        this.ctx.beginPath();
        
        // Horizontal axis (time)
        this.ctx.moveTo(0, centerY);
        this.ctx.lineTo(width, centerY);
        
        // Vertical axis (amplitude) - at left edge
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, height);
        
        this.ctx.stroke();
    }

    /**
     * Draw signal waveform
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    drawSignal(width, height) {
        if (this.signalData.length === 0) return;
        
        const centerY = height / 2;
        
        this.ctx.strokeStyle = this.signalColor;
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        
        let firstPoint = true;
        
        for (let i = 0; i < this.signalData.length; i++) {
            const x = (i / this.signalData.length) * width;
            const signal = this.signalData[i];
            
            // Real-time linear scaling for immediate event response
            const signalRange = this.signalMax - this.signalMin;
            const normalizedSignal = (signal - this.signalMin) / signalRange;
            const y = centerY - (normalizedSignal - 0.5) * height * 0.8; // 0.8 for padding
            
            if (firstPoint) {
                this.ctx.moveTo(x, y);
                firstPoint = false;
            } else {
                if (this.smoothing) {
                    // Use quadratic curves for smoothing
                    const prevX = ((i - 1) / this.signalData.length) * width;
                    const controlX = (prevX + x) / 2;
                    this.ctx.quadraticCurveTo(controlX, y, x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
        }
        
        this.ctx.stroke();
        
        // Draw signal intensity indicators
        this.drawSignalIntensity(width, height);
    }

    /**
     * Convert signal value to enhanced Y coordinate for seismograph
     * Uses a power-law scaling to compress large values while preserving small variations
     * @param {number} signal - Signal value
     * @param {number} centerY - Center Y coordinate
     * @param {number} height - Canvas height
     * @returns {number} Y coordinate
     */
    signalToEnhancedY(signal, centerY, height) {
        const signalRange = this.signalMax - this.signalMin;
        if (signalRange === 0) return centerY;
        
        // Normalize signal to 0-1 range
        const normalizedSignal = (signal - this.signalMin) / signalRange;
        
        // Apply power-law scaling to compress dynamic range
        // Use square root to expand small values and compress large ones
        let scaledSignal;
        if (normalizedSignal >= 0.5) {
            // Above center: compress high values
            const aboveCenter = (normalizedSignal - 0.5) * 2; // 0-1 range above center
            const compressed = Math.pow(aboveCenter, 0.5); // Square root compression
            scaledSignal = 0.5 + compressed * 0.5;
        } else {
            // Below center: compress low values
            const belowCenter = (0.5 - normalizedSignal) * 2; // 0-1 range below center
            const compressed = Math.pow(belowCenter, 0.5); // Square root compression
            scaledSignal = 0.5 - compressed * 0.5;
        }
        
        // Convert to Y coordinate
        return centerY - (scaledSignal - 0.5) * height * 0.8; // 0.8 for padding
    }

    /**
     * Draw signal intensity indicators
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    drawSignalIntensity(width, height) {
        if (this.signalData.length === 0) return;
        
        // Find current signal level
        const currentSignal = this.signalData[this.signalData.length - 1] || 0;
        const normalizedLevel = Math.abs(currentSignal - this.signalMin) / (this.signalMax - this.signalMin);
        
        // Draw level indicator bar on the right
        const barWidth = 10;
        const barHeight = height * 0.8;
        const barX = width - barWidth - 5;
        const barY = height * 0.1;
        
        // Background bar
        this.ctx.fillStyle = 'rgba(0, 50, 0, 0.5)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Level bar
        const levelHeight = barHeight * normalizedLevel;
        const levelY = barY + barHeight - levelHeight;
        
        // Color based on intensity
        let levelColor;
        if (normalizedLevel < 0.3) {
            levelColor = 'rgba(0, 150, 0, 0.8)'; // Green for low
        } else if (normalizedLevel < 0.7) {
            levelColor = 'rgba(150, 150, 0, 0.8)'; // Yellow for medium
        } else {
            levelColor = 'rgba(150, 0, 0, 0.8)'; // Red for high
        }
        
        this.ctx.fillStyle = levelColor;
        this.ctx.fillRect(barX, levelY, barWidth, levelHeight);
        
        // Border
        this.ctx.strokeStyle = this.axisColor;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    /**
     * Draw scale information
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    drawScaleInfo(width, height) {
        this.ctx.fillStyle = this.textColor;
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'left';
        
        // Fixed scale labels for real-time seismograph
        const maxText = this.signalMax.toFixed(1);
        const minText = this.signalMin.toFixed(1);
        const center = (this.signalMax + this.signalMin) / 2;
        const centerText = center.toFixed(1);
        const upperMidText = ((this.signalMax + center) / 2).toFixed(1);
        const lowerMidText = ((this.signalMin + center) / 2).toFixed(1);
        
        this.ctx.fillText(maxText, 5, 15);
        this.ctx.fillText(upperMidText, 5, height * 0.25 + 5);
        this.ctx.fillText(centerText, 5, height / 2 + 5);
        this.ctx.fillText(lowerMidText, 5, height * 0.75 + 5);
        this.ctx.fillText(minText, 5, height - 5);
        
        // Draw title
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SEISMOGRAPH', width / 2, 15);
        
        // Draw time scale info
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`${this.displayWidth} samples`, width - 5, height - 5);
    }

    /**
     * Set visual styling
     * @param {Object} style - Style options
     */
    setStyle(style) {
        if (style.backgroundColor) this.backgroundColor = style.backgroundColor;
        if (style.gridColor) this.gridColor = style.gridColor;
        if (style.signalColor) this.signalColor = style.signalColor;
        if (style.axisColor) this.axisColor = style.axisColor;
        if (style.textColor) this.textColor = style.textColor;
    }

    /**
     * Set display parameters
     * @param {Object} params - Display parameters
     */
    setParameters(params) {
        if (params.displayWidth !== undefined) {
            this.displayWidth = Math.max(64, params.displayWidth);
            this.signalData = new Float32Array(this.displayWidth);
        }
        
        if (params.autoScale !== undefined) this.autoScale = params.autoScale;
        if (params.showGrid !== undefined) this.showGrid = params.showGrid;
        if (params.smoothing !== undefined) this.smoothing = params.smoothing;
        if (params.gridDivisions !== undefined) this.gridDivisions = Math.max(2, params.gridDivisions);
        if (params.targetFPS !== undefined) {
            this.targetFPS = Math.max(1, params.targetFPS);
            this.frameInterval = 1000 / this.targetFPS;
        }
    }

    /**
     * Set manual scale range
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     */
    setScale(min, max) {
        this.signalMin = min;
        this.signalMax = max;
        this.autoScale = false;
    }

    /**
     * Enable auto-scaling
     */
    enableAutoScale() {
        this.autoScale = true;
    }

    /**
     * Get current parameters
     * @returns {Object} Current parameters
     */
    getParameters() {
        return {
            displayWidth: this.displayWidth,
            autoScale: this.autoScale,
            signalMin: this.signalMin,
            signalMax: this.signalMax,
            showGrid: this.showGrid,
            smoothing: this.smoothing,
            gridDivisions: this.gridDivisions,
            targetFPS: this.targetFPS
        };
    }

    /**
     * Reset the display
     */
    reset() {
        this.signalData.fill(0);
        this.signalHistory = [];
        this.signalMin = -2.0;
        this.signalMax = 2.0;
        this.autoScale = false;
        
        // Clear canvas
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, width, height);
        
        console.log('SeismographRenderer: Reset');
    }

    /**
     * Handle resize
     */
    handleResize() {
        this.updateDimensions();
    }

    /**
     * Dispose of the renderer
     */
    dispose() {
        // Clear canvas
        if (this.canvas && this.ctx) {
            const width = this.canvas.width / (window.devicePixelRatio || 1);
            const height = this.canvas.height / (window.devicePixelRatio || 1);
            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(0, 0, width, height);
        }
        
        this.signalData = null;
        this.signalHistory = null;
        
        console.log('SeismographRenderer: Disposed');
    }
}