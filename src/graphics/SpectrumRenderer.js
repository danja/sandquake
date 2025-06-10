/**
 * Spectrum renderer for waterfall display visualization
 * Displays frequency vs time with color-coded amplitude
 */

/**
 * Spectrum renderer class for waterfall-style frequency visualization
 */
export class SpectrumRenderer {
    /**
     * Create a new spectrum renderer
     * @param {HTMLCanvasElement} canvas - Canvas element for rendering
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Rendering parameters
        this.width = 0;
        this.height = 0;
        this.frequencyBins = 256; // Number of frequency bins to display
        this.historyLength = 200; // Number of time slices to keep
        
        // Waterfall data storage
        this.waterfallData = []; // Array of spectrum slices
        this.maxWaterfallSize = 500; // Maximum number of slices
        
        // Color mapping
        this.colorMap = this.createColorMap();
        this.amplitudeRange = { min: 0, max: 1 };
        this.autoScale = true;
        this.scaleUpdateRate = 0.1;
        
        // Display settings
        this.showFrequencyLabels = true;
        this.showTimeLabels = true;
        this.showColorBar = true;
        this.interpolation = true; // Smooth color interpolation
        
        // Frequency range
        this.minFrequency = 0;
        this.maxFrequency = 30; // Nyquist frequency for 60Hz sample rate
        this.logScale = false; // Linear vs logarithmic frequency scale
        this.amplitudeLogScale = true; // Use logarithmic amplitude scaling
        
        // Visual styling
        this.backgroundColor = 'rgba(0, 0, 20, 1)'; // Dark blue background
        this.textColor = 'rgba(200, 200, 255, 0.8)';
        this.gridColor = 'rgba(100, 100, 150, 0.3)';
        
        // Performance
        this.lastRenderTime = 0;
        this.targetFPS = 30;
        this.frameInterval = 1000 / this.targetFPS;
        
        // Image data for efficient rendering
        this.imageData = null;
        this.imageBuffer = null;
        
        // Initialize
        this.updateDimensions();
        this.setupResizeHandler();
        
        console.log('SpectrumRenderer: Initialized');
    }

    /**
     * Create color map for amplitude visualization
     * @returns {Array} Array of RGB color values
     */
    createColorMap() {
        const colors = [];
        const steps = 256;
        
        for (let i = 0; i < steps; i++) {
            const normalized = i / (steps - 1);
            
            // Create a "hot" colormap (black -> red -> yellow -> white)
            let r, g, b;
            
            if (normalized < 0.25) {
                // Black to blue
                r = 0;
                g = 0;
                b = Math.floor(normalized * 4 * 255);
            } else if (normalized < 0.5) {
                // Blue to cyan
                r = 0;
                g = Math.floor((normalized - 0.25) * 4 * 255);
                b = 255;
            } else if (normalized < 0.75) {
                // Cyan to yellow
                r = Math.floor((normalized - 0.5) * 4 * 255);
                g = 255;
                b = Math.floor((0.75 - normalized) * 4 * 255);
            } else {
                // Yellow to white
                r = 255;
                g = 255;
                b = Math.floor((normalized - 0.75) * 4 * 255);
            }
            
            colors.push([r, g, b]);
        }
        
        return colors;
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
        
        // Update display dimensions
        const displayWidth = rect.width;
        const displayHeight = rect.height;
        
        // Reserve space for labels
        this.plotWidth = displayWidth - (this.showColorBar ? 60 : 20);
        this.plotHeight = displayHeight - 40;
        this.plotX = 10;
        this.plotY = 20;
        
        // Create image data for pixel manipulation
        this.imageData = this.ctx.createImageData(this.plotWidth, this.plotHeight);
        this.imageBuffer = new ArrayBuffer(this.imageData.data.length);
        this.imageArray = new Uint8ClampedArray(this.imageBuffer);
        this.imageView = new Uint32Array(this.imageBuffer);
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
     * Update with new FFT data
     * @param {Object} fftResult - FFT result object
     */
    update(fftResult) {
        const currentTime = performance.now();
        if (currentTime - this.lastRenderTime < this.frameInterval) {
            return; // Skip frame to maintain target FPS
        }
        
        if (!fftResult || !fftResult.magnitude) return;
        
        // Add new spectrum slice to waterfall data
        this.addSpectrumSlice(fftResult);
        
        // Update auto-scaling
        if (this.autoScale) {
            this.updateAutoScale(fftResult.magnitude);
        }
        
        // Render the display
        this.render();
        
        this.lastRenderTime = currentTime;
    }

    /**
     * Add new spectrum slice to waterfall data
     * @param {Object} fftResult - FFT result object
     */
    addSpectrumSlice(fftResult) {
        const spectrum = fftResult.smoothed || fftResult.magnitude;
        const frequencies = fftResult.frequencies;
        
        // Resample spectrum to match display frequency bins
        const resampledSpectrum = this.resampleSpectrum(spectrum, frequencies);
        
        // Add to waterfall data
        this.waterfallData.push({
            spectrum: resampledSpectrum,
            timestamp: performance.now()
        });
        
        // Limit waterfall history
        if (this.waterfallData.length > this.maxWaterfallSize) {
            this.waterfallData.shift();
        }
    }

    /**
     * Resample spectrum to match display frequency range and bins
     * @param {Float32Array} spectrum - Input spectrum
     * @param {Float32Array} frequencies - Frequency values
     * @returns {Float32Array} Resampled spectrum
     */
    resampleSpectrum(spectrum, frequencies) {
        const resampled = new Float32Array(this.frequencyBins);
        
        for (let i = 0; i < this.frequencyBins; i++) {
            const targetFreq = this.getFrequencyForBin(i);
            
            // Find closest frequency bin in input spectrum
            let closestIndex = 0;
            let minDistance = Infinity;
            
            for (let j = 0; j < frequencies.length; j++) {
                const distance = Math.abs(frequencies[j] - targetFreq);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestIndex = j;
                }
            }
            
            resampled[i] = spectrum[closestIndex] || 0;
        }
        
        return resampled;
    }

    /**
     * Get frequency value for display bin
     * @param {number} bin - Bin index
     * @returns {number} Frequency in Hz
     */
    getFrequencyForBin(bin) {
        const normalizedBin = bin / (this.frequencyBins - 1);
        
        if (this.logScale) {
            // Logarithmic scale
            const logMin = Math.log10(Math.max(this.minFrequency, 0.1));
            const logMax = Math.log10(this.maxFrequency);
            const logFreq = logMin + normalizedBin * (logMax - logMin);
            return Math.pow(10, logFreq);
        } else {
            // Linear scale
            return this.minFrequency + normalizedBin * (this.maxFrequency - this.minFrequency);
        }
    }

    /**
     * Update auto-scaling based on spectrum data
     * @param {Float32Array} spectrum - Current spectrum
     */
    updateAutoScale(spectrum) {
        if (!spectrum || spectrum.length === 0) return;
        
        // Find min/max in current spectrum
        let min = Infinity;
        let max = -Infinity;
        
        for (let i = 0; i < spectrum.length; i++) {
            if (spectrum[i] < min) min = spectrum[i];
            if (spectrum[i] > max) max = spectrum[i];
        }
        
        if (this.amplitudeLogScale) {
            // For log scale, ensure minimum value is above zero
            const minThreshold = 1e-6; // Very small positive value
            min = Math.max(min, minThreshold);
            max = Math.max(max, minThreshold);
            
            // Smooth scale changes
            const alpha = this.scaleUpdateRate;
            this.amplitudeRange.min = this.amplitudeRange.min * (1 - alpha) + min * alpha;
            this.amplitudeRange.max = this.amplitudeRange.max * (1 - alpha) + max * alpha;
            
            // Ensure minimum range for log scale
            if (this.amplitudeRange.max / this.amplitudeRange.min < 10) {
                this.amplitudeRange.max = this.amplitudeRange.min * 10;
            }
        } else {
            // Linear scaling (original behavior)
            const alpha = this.scaleUpdateRate;
            this.amplitudeRange.min = this.amplitudeRange.min * (1 - alpha) + min * alpha;
            this.amplitudeRange.max = this.amplitudeRange.max * (1 - alpha) + max * alpha;
            
            // Ensure minimum range
            const range = this.amplitudeRange.max - this.amplitudeRange.min;
            if (range < 0.001) {
                const center = (this.amplitudeRange.max + this.amplitudeRange.min) / 2;
                this.amplitudeRange.min = center - 0.0005;
                this.amplitudeRange.max = center + 0.0005;
            }
        }
    }

    /**
     * Render the spectrum display
     */
    render() {
        const canvasWidth = this.canvas.width / (window.devicePixelRatio || 1);
        const canvasHeight = this.canvas.height / (window.devicePixelRatio || 1);
        
        // Clear canvas
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        if (this.waterfallData.length === 0) {
            this.drawEmptyDisplay(canvasWidth, canvasHeight);
            return;
        }
        
        // Render waterfall
        this.renderWaterfall();
        
        // Draw the rendered waterfall to canvas
        this.ctx.putImageData(this.imageData, this.plotX, this.plotY);
        
        // Draw labels and decorations
        if (this.showFrequencyLabels) {
            this.drawFrequencyLabels(canvasWidth, canvasHeight);
        }
        
        if (this.showTimeLabels) {
            this.drawTimeLabels(canvasWidth, canvasHeight);
        }
        
        if (this.showColorBar) {
            this.drawColorBar(canvasWidth, canvasHeight);
        }
        
        // Draw title
        this.drawTitle(canvasWidth, canvasHeight);
    }

    /**
     * Render waterfall data to image buffer
     */
    renderWaterfall() {
        const dataLength = Math.min(this.waterfallData.length, this.plotWidth);
        
        // Clear image array
        this.imageArray.fill(0);
        
        for (let x = 0; x < dataLength; x++) {
            const dataIndex = this.waterfallData.length - dataLength + x;
            const slice = this.waterfallData[dataIndex];
            
            if (!slice) continue;
            
            for (let y = 0; y < this.plotHeight; y++) {
                const freqBin = Math.floor((y / this.plotHeight) * this.frequencyBins);
                const amplitude = slice.spectrum[freqBin] || 0;
                
                // Normalize amplitude to color map range
                let normalizedAmp;
                if (this.amplitudeLogScale) {
                    // Logarithmic amplitude mapping
                    const logMin = Math.log10(Math.max(this.amplitudeRange.min, 1e-6));
                    const logMax = Math.log10(Math.max(this.amplitudeRange.max, 1e-6));
                    const logAmp = Math.log10(Math.max(amplitude, 1e-6));
                    normalizedAmp = (logAmp - logMin) / (logMax - logMin);
                } else {
                    // Linear amplitude mapping (original behavior)
                    normalizedAmp = (amplitude - this.amplitudeRange.min) / 
                                    (this.amplitudeRange.max - this.amplitudeRange.min);
                }
                const clampedAmp = Math.max(0, Math.min(1, normalizedAmp));
                
                // Get color from color map
                const colorIndex = Math.floor(clampedAmp * (this.colorMap.length - 1));
                const color = this.colorMap[colorIndex];
                
                // Set pixel (flip Y coordinate for correct orientation)
                const pixelY = this.plotHeight - 1 - y;
                const pixelIndex = (pixelY * this.plotWidth + x) * 4;
                
                this.imageArray[pixelIndex] = color[0];     // R
                this.imageArray[pixelIndex + 1] = color[1]; // G
                this.imageArray[pixelIndex + 2] = color[2]; // B
                this.imageArray[pixelIndex + 3] = 255;      // A
            }
        }
        
        // Copy to image data
        this.imageData.data.set(this.imageArray);
    }

    /**
     * Draw empty display message
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    drawEmptyDisplay(width, height) {
        this.ctx.fillStyle = this.textColor;
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Waiting for spectrum data...', width / 2, height / 2);
    }

    /**
     * Draw frequency labels
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    drawFrequencyLabels(width, height) {
        this.ctx.fillStyle = this.textColor;
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'right';
        
        const labelCount = 5;
        for (let i = 0; i <= labelCount; i++) {
            const y = this.plotY + (i / labelCount) * this.plotHeight;
            const freq = this.maxFrequency - (i / labelCount) * (this.maxFrequency - this.minFrequency);
            
            this.ctx.fillText(`${freq.toFixed(1)}Hz`, this.plotX - 5, y + 3);
        }
    }

    /**
     * Draw time labels
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    drawTimeLabels(width, height) {
        this.ctx.fillStyle = this.textColor;
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'center';
        
        const labelCount = 4;
        for (let i = 0; i <= labelCount; i++) {
            const x = this.plotX + (i / labelCount) * this.plotWidth;
            const timeLabel = `${(i * 2).toFixed(0)}s`; // Approximate time labels
            
            this.ctx.fillText(timeLabel, x, this.plotY + this.plotHeight + 15);
        }
    }

    /**
     * Draw color bar scale
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    drawColorBar(width, height) {
        const barWidth = 20;
        const barHeight = this.plotHeight;
        const barX = this.plotX + this.plotWidth + 10;
        const barY = this.plotY;
        
        // Draw color gradient
        const gradient = this.ctx.createLinearGradient(0, barY + barHeight, 0, barY);
        
        for (let i = 0; i < this.colorMap.length; i += 10) {
            const color = this.colorMap[i];
            const position = i / (this.colorMap.length - 1);
            gradient.addColorStop(position, `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Draw scale labels
        this.ctx.fillStyle = this.textColor;
        this.ctx.font = '8px monospace';
        this.ctx.textAlign = 'left';
        
        let maxLabel, minLabel;
        if (this.amplitudeLogScale) {
            const logMax = Math.log10(Math.max(this.amplitudeRange.max, 1e-6));
            const logMin = Math.log10(Math.max(this.amplitudeRange.min, 1e-6));
            maxLabel = `10^${logMax.toFixed(1)}`;
            minLabel = `10^${logMin.toFixed(1)}`;
        } else {
            maxLabel = this.amplitudeRange.max.toExponential(1);
            minLabel = this.amplitudeRange.min.toExponential(1);
        }
        
        this.ctx.fillText(maxLabel, barX + barWidth + 2, barY + 8);
        this.ctx.fillText(minLabel, barX + barWidth + 2, barY + barHeight);
    }

    /**
     * Draw title
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    drawTitle(width, height) {
        this.ctx.fillStyle = this.textColor;
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'center';
        const title = this.amplitudeLogScale ? 'FREQUENCY SPECTRUM (LOG)' : 'FREQUENCY SPECTRUM';
        this.ctx.fillText(title, width / 2, 15);
    }

    /**
     * Set frequency range
     * @param {number} min - Minimum frequency
     * @param {number} max - Maximum frequency
     */
    setFrequencyRange(min, max) {
        this.minFrequency = Math.max(0, min);
        this.maxFrequency = Math.max(this.minFrequency + 0.1, max);
    }

    /**
     * Set amplitude range
     * @param {number} min - Minimum amplitude
     * @param {number} max - Maximum amplitude
     */
    setAmplitudeRange(min, max) {
        this.amplitudeRange.min = min;
        this.amplitudeRange.max = max;
        this.autoScale = false;
    }

    /**
     * Enable auto-scaling
     */
    enableAutoScale() {
        this.autoScale = true;
    }

    /**
     * Set display parameters
     * @param {Object} params - Display parameters
     */
    setParameters(params) {
        if (params.frequencyBins !== undefined) {
            this.frequencyBins = Math.max(32, params.frequencyBins);
        }
        
        if (params.historyLength !== undefined) {
            this.historyLength = Math.max(10, params.historyLength);
        }
        
        if (params.logScale !== undefined) this.logScale = params.logScale;
        if (params.interpolation !== undefined) this.interpolation = params.interpolation;
        if (params.showFrequencyLabels !== undefined) this.showFrequencyLabels = params.showFrequencyLabels;
        if (params.showTimeLabels !== undefined) this.showTimeLabels = params.showTimeLabels;
        if (params.showColorBar !== undefined) this.showColorBar = params.showColorBar;
        
        if (params.targetFPS !== undefined) {
            this.targetFPS = Math.max(1, params.targetFPS);
            this.frameInterval = 1000 / this.targetFPS;
        }
    }

    /**
     * Get current parameters
     * @returns {Object} Current parameters
     */
    getParameters() {
        return {
            frequencyBins: this.frequencyBins,
            historyLength: this.historyLength,
            minFrequency: this.minFrequency,
            maxFrequency: this.maxFrequency,
            logScale: this.logScale,
            autoScale: this.autoScale,
            amplitudeRange: { ...this.amplitudeRange },
            targetFPS: this.targetFPS
        };
    }

    /**
     * Reset the display
     */
    reset() {
        this.waterfallData = [];
        this.amplitudeRange = { min: 0, max: 1 };
        this.autoScale = true;
        
        // Clear canvas
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, width, height);
        
        console.log('SpectrumRenderer: Reset');
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
        this.waterfallData = null;
        this.colorMap = null;
        this.imageData = null;
        this.imageBuffer = null;
        this.imageArray = null;
        this.imageView = null;
        
        console.log('SpectrumRenderer: Disposed');
    }
}