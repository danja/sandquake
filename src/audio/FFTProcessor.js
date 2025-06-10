/**
 * Fast Fourier Transform processor for frequency analysis
 * Implements real-time FFT for seismograph signal analysis
 */

/**
 * FFT Processor class for frequency domain analysis
 */
export class FFTProcessor {
    /**
     * Create a new FFT processor
     * @param {number} fftSize - Size of FFT (must be power of 2)
     * @param {number} sampleRate - Sample rate in Hz
     */
    constructor(fftSize = 512, sampleRate = 60) {
        // Validate FFT size (must be power of 2)
        if (!this.isPowerOfTwo(fftSize)) {
            throw new Error('FFT size must be a power of 2');
        }
        
        this.fftSize = fftSize;
        this.sampleRate = sampleRate;
        this.halfSize = fftSize / 2;
        
        // Precompute twiddle factors for efficiency
        this.twiddleFactors = this.computeTwiddleFactors();
        
        // Bit-reversal lookup table
        this.bitReversalTable = this.computeBitReversalTable();
        
        // Windowing function
        this.windowFunction = this.computeHammingWindow();
        
        // Output arrays
        this.magnitudeSpectrum = new Float32Array(this.halfSize);
        this.phaseSpectrum = new Float32Array(this.halfSize);
        this.powerSpectrum = new Float32Array(this.halfSize);
        
        // Working arrays for complex numbers
        this.realPart = new Float32Array(fftSize);
        this.imagPart = new Float32Array(fftSize);
        
        // Frequency bins
        this.frequencyBins = this.computeFrequencyBins();
        
        // Smoothing for spectrum display
        this.smoothingFactor = 0.8;
        this.smoothedSpectrum = new Float32Array(this.halfSize);
        
        console.log(`FFTProcessor: Initialized with size ${fftSize}, sample rate ${sampleRate}Hz`);
    }

    /**
     * Check if a number is a power of 2
     * @param {number} n - Number to check
     * @returns {boolean} True if power of 2
     */
    isPowerOfTwo(n) {
        return n > 0 && (n & (n - 1)) === 0;
    }

    /**
     * Compute twiddle factors for FFT
     * @returns {Array} Array of complex twiddle factors
     */
    computeTwiddleFactors() {
        const factors = [];
        
        for (let size = 2; size <= this.fftSize; size *= 2) {
            const angleStep = -2 * Math.PI / size;
            const sizeFactors = [];
            
            for (let i = 0; i < size / 2; i++) {
                const angle = i * angleStep;
                sizeFactors.push({
                    real: Math.cos(angle),
                    imag: Math.sin(angle)
                });
            }
            
            factors[size] = sizeFactors;
        }
        
        return factors;
    }

    /**
     * Compute bit-reversal lookup table
     * @returns {Array} Bit-reversal indices
     */
    computeBitReversalTable() {
        const table = new Array(this.fftSize);
        const bits = Math.log2(this.fftSize);
        
        for (let i = 0; i < this.fftSize; i++) {
            table[i] = this.reverseBits(i, bits);
        }
        
        return table;
    }

    /**
     * Reverse bits of a number
     * @param {number} num - Number to reverse
     * @param {number} bits - Number of bits
     * @returns {number} Bit-reversed number
     */
    reverseBits(num, bits) {
        let result = 0;
        for (let i = 0; i < bits; i++) {
            result = (result << 1) | (num & 1);
            num >>= 1;
        }
        return result;
    }

    /**
     * Compute Hamming window function
     * @returns {Float32Array} Window coefficients
     */
    computeHammingWindow() {
        const window = new Float32Array(this.fftSize);
        
        for (let i = 0; i < this.fftSize; i++) {
            window[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (this.fftSize - 1));
        }
        
        return window;
    }

    /**
     * Compute frequency bins in Hz
     * @returns {Float32Array} Frequency values for each bin
     */
    computeFrequencyBins() {
        const bins = new Float32Array(this.halfSize);
        const frequencyResolution = this.sampleRate / this.fftSize;
        
        for (let i = 0; i < this.halfSize; i++) {
            bins[i] = i * frequencyResolution;
        }
        
        return bins;
    }

    /**
     * Perform FFT on input signal
     * @param {Float32Array} signal - Input signal data
     * @returns {Object} FFT results with magnitude and phase spectra
     */
    process(signal) {
        if (signal.length !== this.fftSize) {
            throw new Error(`Signal length (${signal.length}) must match FFT size (${this.fftSize})`);
        }
        
        // Apply windowing and copy to working arrays
        for (let i = 0; i < this.fftSize; i++) {
            this.realPart[i] = signal[i] * this.windowFunction[i];
            this.imagPart[i] = 0;
        }
        
        // Perform bit-reversal
        this.bitReversal();
        
        // Perform FFT using Cooley-Tukey algorithm
        this.cooleyTukeyFFT();
        
        // Compute magnitude and phase spectra
        this.computeSpectra();
        
        // Apply smoothing
        this.applySmoothing();
        
        return {
            magnitude: this.magnitudeSpectrum,
            phase: this.phaseSpectrum,
            power: this.powerSpectrum,
            frequencies: this.frequencyBins,
            smoothed: this.smoothedSpectrum
        };
    }

    /**
     * Perform bit-reversal reordering
     */
    bitReversal() {
        for (let i = 0; i < this.fftSize; i++) {
            const j = this.bitReversalTable[i];
            if (i < j) {
                // Swap real parts
                const tempReal = this.realPart[i];
                this.realPart[i] = this.realPart[j];
                this.realPart[j] = tempReal;
                
                // Swap imaginary parts
                const tempImag = this.imagPart[i];
                this.imagPart[i] = this.imagPart[j];
                this.imagPart[j] = tempImag;
            }
        }
    }

    /**
     * Perform Cooley-Tukey FFT algorithm
     */
    cooleyTukeyFFT() {
        for (let size = 2; size <= this.fftSize; size *= 2) {
            const halfSize = size / 2;
            const twiddles = this.twiddleFactors[size];
            
            for (let start = 0; start < this.fftSize; start += size) {
                for (let i = 0; i < halfSize; i++) {
                    const even = start + i;
                    const odd = start + i + halfSize;
                    
                    const twiddle = twiddles[i];
                    
                    // Complex multiplication: twiddle * data[odd]
                    const tempReal = twiddle.real * this.realPart[odd] - twiddle.imag * this.imagPart[odd];
                    const tempImag = twiddle.real * this.imagPart[odd] + twiddle.imag * this.realPart[odd];
                    
                    // Butterfly operation
                    const evenReal = this.realPart[even];
                    const evenImag = this.imagPart[even];
                    
                    this.realPart[even] = evenReal + tempReal;
                    this.imagPart[even] = evenImag + tempImag;
                    this.realPart[odd] = evenReal - tempReal;
                    this.imagPart[odd] = evenImag - tempImag;
                }
            }
        }
    }

    /**
     * Compute magnitude, phase, and power spectra
     */
    computeSpectra() {
        for (let i = 0; i < this.halfSize; i++) {
            const real = this.realPart[i];
            const imag = this.imagPart[i];
            
            // Magnitude spectrum
            this.magnitudeSpectrum[i] = Math.sqrt(real * real + imag * imag);
            
            // Phase spectrum
            this.phaseSpectrum[i] = Math.atan2(imag, real);
            
            // Power spectrum (magnitude squared)
            this.powerSpectrum[i] = this.magnitudeSpectrum[i] * this.magnitudeSpectrum[i];
        }
        
        // Normalize by FFT size
        const normalizationFactor = 2.0 / this.fftSize;
        for (let i = 0; i < this.halfSize; i++) {
            this.magnitudeSpectrum[i] *= normalizationFactor;
            this.powerSpectrum[i] *= normalizationFactor * normalizationFactor;
        }
        
        // DC component should not be doubled
        this.magnitudeSpectrum[0] /= 2;
        this.powerSpectrum[0] /= 4;
    }

    /**
     * Apply exponential smoothing to spectrum
     */
    applySmoothing() {
        for (let i = 0; i < this.halfSize; i++) {
            this.smoothedSpectrum[i] = this.smoothingFactor * this.smoothedSpectrum[i] + 
                                     (1 - this.smoothingFactor) * this.magnitudeSpectrum[i];
        }
    }

    /**
     * Get the magnitude spectrum
     * @returns {Float32Array} Magnitude spectrum
     */
    getMagnitudeSpectrum() {
        return this.magnitudeSpectrum;
    }

    /**
     * Get the power spectrum
     * @returns {Float32Array} Power spectrum
     */
    getPowerSpectrum() {
        return this.powerSpectrum;
    }

    /**
     * Get the phase spectrum
     * @returns {Float32Array} Phase spectrum
     */
    getPhaseSpectrum() {
        return this.phaseSpectrum;
    }

    /**
     * Get the smoothed spectrum
     * @returns {Float32Array} Smoothed magnitude spectrum
     */
    getSmoothedSpectrum() {
        return this.smoothedSpectrum;
    }

    /**
     * Get frequency bins
     * @returns {Float32Array} Frequency values in Hz
     */
    getFrequencyBins() {
        return this.frequencyBins;
    }

    /**
     * Find peak frequency
     * @returns {Object} Peak frequency information
     */
    findPeakFrequency() {
        let maxMagnitude = 0;
        let peakIndex = 0;
        
        // Skip DC component (index 0)
        for (let i = 1; i < this.halfSize; i++) {
            if (this.magnitudeSpectrum[i] > maxMagnitude) {
                maxMagnitude = this.magnitudeSpectrum[i];
                peakIndex = i;
            }
        }
        
        return {
            frequency: this.frequencyBins[peakIndex],
            magnitude: maxMagnitude,
            index: peakIndex
        };
    }

    /**
     * Get frequency range
     * @returns {Object} Min and max frequencies
     */
    getFrequencyRange() {
        return {
            min: this.frequencyBins[0],
            max: this.frequencyBins[this.halfSize - 1],
            resolution: this.sampleRate / this.fftSize
        };
    }

    /**
     * Set smoothing factor
     * @param {number} factor - Smoothing factor (0 = no smoothing, 1 = maximum smoothing)
     */
    setSmoothingFactor(factor) {
        this.smoothingFactor = Math.max(0, Math.min(1, factor));
    }

    /**
     * Get current smoothing factor
     * @returns {number} Current smoothing factor
     */
    getSmoothingFactor() {
        return this.smoothingFactor;
    }

    /**
     * Reset smoothed spectrum
     */
    resetSmoothing() {
        this.smoothedSpectrum.fill(0);
    }

    /**
     * Get processor information
     * @returns {Object} Processor information
     */
    getInfo() {
        return {
            fftSize: this.fftSize,
            sampleRate: this.sampleRate,
            frequencyResolution: this.sampleRate / this.fftSize,
            nyquistFrequency: this.sampleRate / 2,
            outputSize: this.halfSize,
            smoothingFactor: this.smoothingFactor
        };
    }

    /**
     * Process signal with overlap-add for continuous processing
     * @param {Float32Array} signal - Input signal (can be any length)
     * @param {number} hopSize - Hop size for overlap (default: fftSize/2)
     * @returns {Array} Array of FFT results for each frame
     */
    processWithOverlap(signal, hopSize = null) {
        hopSize = hopSize || this.fftSize / 2;
        const results = [];
        
        for (let start = 0; start + this.fftSize <= signal.length; start += hopSize) {
            const frame = signal.slice(start, start + this.fftSize);
            results.push(this.process(frame));
        }
        
        return results;
    }

    /**
     * Dispose of the processor
     */
    dispose() {
        this.twiddleFactors = null;
        this.bitReversalTable = null;
        this.windowFunction = null;
        this.magnitudeSpectrum = null;
        this.phaseSpectrum = null;
        this.powerSpectrum = null;
        this.realPart = null;
        this.imagPart = null;
        this.frequencyBins = null;
        this.smoothedSpectrum = null;
        
        console.log('FFTProcessor: Disposed');
    }
}