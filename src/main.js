/**
 * Sandquake - 3D Sandpile Simulation
 * Main application entry point
 */

import { Simulation } from './core/Simulation.js';
import { Scene } from './graphics/Scene.js';
import { HeatmapRenderer } from './graphics/HeatmapRenderer.js';
import { SpeedControl } from './controls/SpeedControl.js';
import { SourcesControl } from './controls/SourcesControl.js';
import { KeyboardHandler } from './controls/KeyboardHandler.js';
import { MouseHandler } from './controls/MouseHandler.js';
import { TouchHandler } from './controls/TouchHandler.js';
import { RandomnessControl } from './controls/RandomnessControl.js';
import { SeismographData } from './core/SeismographData.js';
import { SeismographRenderer } from './graphics/SeismographRenderer.js';
import { SpectrumRenderer } from './graphics/SpectrumRenderer.js';
import { FFTProcessor } from './audio/FFTProcessor.js';

/**
 * Main application class that coordinates all systems
 */
class SandquakeApp {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.heatmapCanvas = document.getElementById('heatmap-canvas');
        this.seismographCanvas = document.getElementById('seismograph-canvas');
        this.spectrumCanvas = document.getElementById('spectrum-canvas');
        this.isRunning = false;
        this.isPaused = false;
        
        this.initializeSystems();
        this.setupEventListeners();
        this.start();
    }

    /**
     * Initialize all application systems
     */
    initializeSystems() {
        // Initialize core simulation
        this.simulation = new Simulation({
            gridSize: 64,
            criticalMass: 4,
            initialSources: 3
        });

        // Initialize 3D graphics
        this.scene = new Scene(this.canvas);
        
        // Initialize renderers
        this.heatmapRenderer = new HeatmapRenderer(this.heatmapCanvas);
        this.seismographRenderer = new SeismographRenderer(this.seismographCanvas);
        this.spectrumRenderer = new SpectrumRenderer(this.spectrumCanvas);
        
        // Force initial render of displays to prevent refresh issue
        setTimeout(() => {
            this.seismographRenderer.handleResize();
            this.seismographRenderer.render();
            this.spectrumRenderer.handleResize();
            this.spectrumRenderer.render();
        }, 100);
        
        // Initialize seismograph and FFT systems
        this.seismographData = new SeismographData(64, 1024, 60);
        this.fftProcessor = new FFTProcessor(512, 60);
        
        // Initialize controls
        this.speedControl = new SpeedControl('speed-slider', 'speed-value');
        this.sourcesControl = new SourcesControl('add-source', 'remove-source', 'sources-count');
        this.randomnessControl = new RandomnessControl('randomness-slider', 'randomness-value');
        this.keyboardHandler = new KeyboardHandler();
        this.mouseHandler = new MouseHandler(this.canvas);
        this.touchHandler = new TouchHandler(this.canvas);

        // Connect speed control
        this.speedControl.onSpeedChange = (speed) => {
            this.simulation.setGlobalSpeed(speed);
            document.getElementById('speed-display').textContent = speed.toFixed(1);
        };

        // Connect sources control
        this.sourcesControl.onAddSource = () => {
            this.simulation.addRandomSource();
            this.updateSourcesDisplay();
        };

        this.sourcesControl.onRemoveSource = () => {
            this.simulation.removeSource();
            this.updateSourcesDisplay();
        };

        // Connect randomness control
        this.randomnessControl.setOnRandomnessChange((randomness) => {
            this.simulation.getSandPile().setRandomnessFactor(randomness);
            document.getElementById('randomness-display').textContent = (randomness * 100).toFixed(1);
        });

        // Connect keyboard controls
        this.keyboardHandler.onPan = (direction, deltaTime) => {
            this.scene.getCamera().pan(direction, deltaTime);
        };

        this.keyboardHandler.onTilt = (direction, deltaTime) => {
            this.scene.getCamera().tilt(direction, deltaTime);
        };

        // Connect mouse controls
        this.mouseHandler.setPanCallback((direction) => {
            this.scene.getCamera().pan(direction, 1/60);
        });

        this.mouseHandler.setTiltCallback((direction) => {
            this.scene.getCamera().tilt(direction, 1/60);
        });

        this.mouseHandler.setZoomCallback((delta) => {
            this.scene.getCamera().zoom(delta);
        });

        // Connect touch controls
        this.touchHandler.setPanCallback((direction) => {
            this.scene.getCamera().pan(direction, 1/60);
        });

        this.touchHandler.setTiltCallback((direction) => {
            this.scene.getCamera().tilt(direction, 1/60);
        });

        this.touchHandler.setZoomCallback((delta) => {
            this.scene.getCamera().zoom(delta);
        });

        // Synchronize initial states
        this.sourcesControl.setSourceCount(this.simulation.getSourceCount());
        this.randomnessControl.setRandomness(0.0);
    }

    /**
     * Set up UI event listeners
     */
    setupEventListeners() {
        const resetButton = document.getElementById('reset-simulation');
        const pauseButton = document.getElementById('pause-play');

        resetButton.addEventListener('click', () => {
            this.reset();
        });

        pauseButton.addEventListener('click', () => {
            this.togglePause();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.scene.handleResize();
            this.heatmapRenderer.handleResize();
            this.seismographRenderer.handleResize();
            this.spectrumRenderer.handleResize();
        });
    }

    /**
     * Start the application
     */
    start() {
        this.isRunning = true;
        this.updateSourcesDisplay();
        this.animate();
    }

    /**
     * Main animation loop
     */
    animate() {
        if (!this.isRunning) return;

        requestAnimationFrame(() => this.animate());

        if (!this.isPaused) {
            // Update simulation
            this.simulation.update();
            
            // Update graphics
            this.scene.update(this.simulation);
            
            // Update heatmap
            this.heatmapRenderer.update(this.simulation.getSandPile());
            
            // Update seismograph data
            this.seismographData.update(this.simulation.getGrid());
            
            // Update seismograph display
            this.seismographRenderer.update(this.seismographData);
            
            // Process FFT and update spectrum display
            this.updateSpectrum();
        }

        // Render scene
        this.scene.render();
    }

    /**
     * Update spectrum analysis
     */
    updateSpectrum() {
        // Get signal data for FFT
        const signalData = this.seismographData.getSignalData(512);
        
        if (signalData.length >= 512) {
            // Process FFT
            const fftResult = this.fftProcessor.process(signalData);
            
            // Update spectrum renderer
            this.spectrumRenderer.update(fftResult);
        }
    }

    /**
     * Reset the simulation
     */
    reset() {
        this.simulation.reset();
        this.scene.reset();
        this.heatmapRenderer.reset();
        this.seismographData.reset();
        this.seismographRenderer.reset();
        this.spectrumRenderer.reset();
        this.fftProcessor.resetSmoothing();
        this.updateSourcesDisplay();
    }

    /**
     * Toggle pause state
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        const button = document.getElementById('pause-play');
        button.textContent = this.isPaused ? 'Play' : 'Pause';
    }

    /**
     * Update sources display in UI
     */
    updateSourcesDisplay() {
        const count = this.simulation.getSourceCount();
        // Update info display
        document.getElementById('source-count').textContent = count;
        // Update SourcesControl which will handle the controls area display
        this.sourcesControl.setSourceCount(count);
    }

    /**
     * Stop the application
     */
    stop() {
        this.isRunning = false;
        this.scene.dispose();
        this.heatmapRenderer.dispose();
        this.seismographRenderer.dispose();
        this.spectrumRenderer.dispose();
        this.seismographData.dispose();
        this.fftProcessor.dispose();
        this.mouseHandler.dispose();
        this.touchHandler.dispose();
        this.randomnessControl.dispose();
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sandquakeApp = new SandquakeApp();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.sandquakeApp) {
        window.sandquakeApp.stop();
    }
});