/**
 * Seismograph data generator for sand simulation
 * Tracks the rate of change of sand columns weighted by distance from bottom-left corner
 */

/**
 * Seismograph data processor for real-time signal generation
 */
export class SeismographData {
    /**
     * Create a new seismograph data processor
     * @param {number} gridSize - Size of the simulation grid
     * @param {number} bufferSize - Size of the circular buffer for data history
     * @param {number} sampleRate - Sample rate in Hz (samples per second)
     */
    constructor(gridSize = 64, bufferSize = 1024, sampleRate = 60) {
        this.gridSize = gridSize;
        this.bufferSize = bufferSize;
        this.sampleRate = sampleRate;
        
        // Circular buffer for seismograph signal
        this.signalBuffer = new Float32Array(bufferSize);
        this.bufferIndex = 0;
        this.bufferFull = false;
        
        // Previous grid state for change detection
        this.previousGrid = null;
        
        // Distance weighting matrix (precomputed for efficiency)
        this.distanceWeights = this.computeDistanceWeights();
        
        // Signal processing parameters for real-time events
        this.maxSignalValue = 10; // Lower max for better sensitivity to events
        this.signalDecay = 0.8; // Faster decay to show quick events
        this.baselineNoise = 0.02; // Minimal baseline noise
        this.eventSensitivity = 5; // Amplification factor for events
        
        // Current signal properties
        this.currentSignal = 0;
        this.peakSignal = 0;
        this.averageSignal = 0;
        
        // Timing
        this.lastUpdateTime = performance.now();
        this.samplesGenerated = 0;
        
        console.log('SeismographData: Initialized with buffer size', bufferSize);
    }

    /**
     * Compute distance-based weights for all grid positions
     * Distance is measured from bottom-left corner (0, gridSize-1)
     * @returns {Array} 2D array of distance weights
     */
    computeDistanceWeights() {
        const weights = new Array(this.gridSize);
        const maxDistance = Math.sqrt(this.gridSize * this.gridSize + this.gridSize * this.gridSize);
        
        for (let x = 0; x < this.gridSize; x++) {
            weights[x] = new Array(this.gridSize);
            
            for (let y = 0; y < this.gridSize; y++) {
                // Calculate distance from bottom-left corner (0, gridSize-1)
                const dx = x - 0;
                const dy = (this.gridSize - 1) - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Weight inversely proportional to distance (closer = higher weight)
                const normalizedDistance = distance / maxDistance;
                const weight = 1.0 / (1.0 + normalizedDistance * 3); // Adjust scaling factor as needed
                
                weights[x][y] = weight;
            }
        }
        
        return weights;
    }

    /**
     * Update seismograph with new grid state
     * @param {Array} currentGrid - Current 2D grid state
     */
    update(currentGrid) {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
        this.lastUpdateTime = currentTime;
        
        // Calculate signal based on grid changes
        const signal = this.calculateSignal(currentGrid);
        
        // Add to buffer
        this.addSample(signal);
        
        // Update statistics
        this.updateStatistics(signal);
        
        // Store current grid as previous for next update
        this.previousGrid = currentGrid.map(row => [...row]);
        
        this.samplesGenerated++;
    }

    /**
     * Calculate seismograph signal from grid changes
     * @param {Array} currentGrid - Current grid state
     * @returns {number} Calculated signal value
     */
    calculateSignal(currentGrid) {
        if (!this.previousGrid) {
            // First update, no change to measure
            this.previousGrid = currentGrid.map(row => [...row]);
            return this.generateBaselineNoise();
        }
        
        let totalChangeSignal = 0;
        let totalWeight = 0;
        
        // Calculate weighted rate of change across all grid cells
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const currentValue = currentGrid[x][y];
                const previousValue = this.previousGrid[x][y];
                const change = Math.abs(currentValue - previousValue);
                
                if (change > 0) {
                    const weight = this.distanceWeights[x][y];
                    totalChangeSignal += change * weight;
                    totalWeight += weight;
                }
            }
        }
        
        // Normalize and amplify signal for event detection
        let signal = totalWeight > 0 ? (totalChangeSignal / totalWeight) * this.eventSensitivity : 0;
        
        // Apply scaling and limits
        signal = Math.min(signal, this.maxSignalValue);
        
        // Add minimal baseline noise for realism
        signal += this.generateBaselineNoise();
        
        // Apply faster decay for immediate response to events
        this.currentSignal = this.currentSignal * this.signalDecay + signal * (1 - this.signalDecay);
        
        return this.currentSignal;
    }

    /**
     * Generate small baseline noise
     * @returns {number} Random noise value
     */
    generateBaselineNoise() {
        return (Math.random() - 0.5) * this.baselineNoise;
    }

    /**
     * Add a sample to the circular buffer
     * @param {number} sample - Sample value to add
     */
    addSample(sample) {
        this.signalBuffer[this.bufferIndex] = sample;
        this.bufferIndex = (this.bufferIndex + 1) % this.bufferSize;
        
        if (this.bufferIndex === 0) {
            this.bufferFull = true;
        }
    }

    /**
     * Update signal statistics
     * @param {number} signal - Current signal value
     */
    updateStatistics(signal) {
        // Update peak signal
        this.peakSignal = Math.max(this.peakSignal, signal);
        
        // Update running average (exponential moving average)
        const alpha = 0.01; // Smoothing factor for average
        this.averageSignal = this.averageSignal * (1 - alpha) + signal * alpha;
    }

    /**
     * Get the current signal value
     * @returns {number} Current signal strength
     */
    getCurrentSignal() {
        return this.currentSignal;
    }

    /**
     * Get signal buffer data for visualization
     * @param {number} length - Number of samples to return (default: full buffer)
     * @returns {Float32Array} Signal data array
     */
    getSignalData(length = null) {
        const dataLength = length || this.getAvailableDataLength();
        const result = new Float32Array(dataLength);
        
        if (!this.bufferFull && this.bufferIndex < dataLength) {
            // Buffer not full yet, return available data
            for (let i = 0; i < this.bufferIndex; i++) {
                result[i] = this.signalBuffer[i];
            }
        } else {
            // Buffer is full or we need specific length, return most recent data
            for (let i = 0; i < dataLength; i++) {
                const bufferPos = (this.bufferIndex - dataLength + i + this.bufferSize) % this.bufferSize;
                result[i] = this.signalBuffer[bufferPos];
            }
        }
        
        return result;
    }

    /**
     * Get the amount of available data in buffer
     * @returns {number} Number of available samples
     */
    getAvailableDataLength() {
        return this.bufferFull ? this.bufferSize : this.bufferIndex;
    }

    /**
     * Get signal statistics
     * @returns {Object} Statistics object
     */
    getStatistics() {
        return {
            currentSignal: this.currentSignal,
            peakSignal: this.peakSignal,
            averageSignal: this.averageSignal,
            bufferLength: this.getAvailableDataLength(),
            sampleRate: this.sampleRate,
            samplesGenerated: this.samplesGenerated,
            bufferFull: this.bufferFull
        };
    }

    /**
     * Reset seismograph data
     */
    reset() {
        // Clear buffer
        this.signalBuffer.fill(0);
        this.bufferIndex = 0;
        this.bufferFull = false;
        
        // Reset state
        this.previousGrid = null;
        this.currentSignal = 0;
        this.peakSignal = 0;
        this.averageSignal = 0;
        this.samplesGenerated = 0;
        this.lastUpdateTime = performance.now();
        
        console.log('SeismographData: Reset');
    }

    /**
     * Set signal processing parameters
     * @param {Object} params - Parameters object
     * @param {number} params.maxSignalValue - Maximum signal value for normalization
     * @param {number} params.signalDecay - Signal decay factor for smoothing
     * @param {number} params.baselineNoise - Baseline noise level
     */
    setParameters({ maxSignalValue, signalDecay, baselineNoise }) {
        if (maxSignalValue !== undefined) {
            this.maxSignalValue = Math.max(1, maxSignalValue);
        }
        
        if (signalDecay !== undefined) {
            this.signalDecay = Math.max(0, Math.min(1, signalDecay));
        }
        
        if (baselineNoise !== undefined) {
            this.baselineNoise = Math.max(0, baselineNoise);
        }
    }

    /**
     * Get current parameters
     * @returns {Object} Current parameters
     */
    getParameters() {
        return {
            maxSignalValue: this.maxSignalValue,
            signalDecay: this.signalDecay,
            baselineNoise: this.baselineNoise,
            gridSize: this.gridSize,
            bufferSize: this.bufferSize,
            sampleRate: this.sampleRate
        };
    }

    /**
     * Get distance weights matrix for debugging
     * @returns {Array} 2D array of distance weights
     */
    getDistanceWeights() {
        return this.distanceWeights.map(row => [...row]);
    }

    /**
     * Generate test signal for debugging
     * @param {number} frequency - Test frequency in Hz
     * @param {number} amplitude - Test amplitude
     * @param {number} duration - Duration in seconds
     */
    generateTestSignal(frequency = 1, amplitude = 10, duration = 5) {
        const samples = Math.floor(duration * this.sampleRate);
        
        for (let i = 0; i < samples; i++) {
            const time = i / this.sampleRate;
            const signal = amplitude * Math.sin(2 * Math.PI * frequency * time);
            this.addSample(signal);
        }
        
        console.log(`SeismographData: Generated test signal (${frequency}Hz, ${amplitude} amplitude, ${duration}s)`);
    }

    /**
     * Dispose of seismograph data
     */
    dispose() {
        this.signalBuffer = null;
        this.previousGrid = null;
        this.distanceWeights = null;
        
        console.log('SeismographData: Disposed');
    }
}