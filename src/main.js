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

/**
 * Main application class that coordinates all systems
 */
class SandquakeApp {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.heatmapCanvas = document.getElementById('heatmap-canvas');
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
        
        // Initialize heatmap renderer
        this.heatmapRenderer = new HeatmapRenderer(this.heatmapCanvas);
        
        // Initialize controls
        this.speedControl = new SpeedControl('speed-slider', 'speed-value');
        this.sourcesControl = new SourcesControl('add-source', 'remove-source', 'sources-count');
        this.keyboardHandler = new KeyboardHandler();

        // Connect systems
        this.speedControl.onSpeedChange = (speed) => {
            this.simulation.setGlobalSpeed(speed);
            document.getElementById('speed-display').textContent = speed.toFixed(1);
        };

        this.sourcesControl.onAddSource = () => {
            this.simulation.addRandomSource();
            this.updateSourcesDisplay();
        };

        this.sourcesControl.onRemoveSource = () => {
            this.simulation.removeSource();
            this.updateSourcesDisplay();
        };

        // Synchronize sources control with simulation's initial state
        this.sourcesControl.setSourceCount(this.simulation.getSourceCount());

        this.keyboardHandler.onPan = (direction, deltaTime) => {
            this.scene.getCamera().pan(direction, deltaTime);
        };

        this.keyboardHandler.onTilt = (direction, deltaTime) => {
            this.scene.getCamera().tilt(direction, deltaTime);
        };
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
        }

        // Render scene
        this.scene.render();
    }

    /**
     * Reset the simulation
     */
    reset() {
        this.simulation.reset();
        this.scene.reset();
        this.heatmapRenderer.reset();
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