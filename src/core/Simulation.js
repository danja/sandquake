/**
 * Main simulation controller that coordinates the sandpile model and sources
 */

import { SandPile } from './SandPile.js';
import { SandSource } from './SandSource.js';

/**
 * Main simulation class that manages the entire sandpile system
 */
export class Simulation {
    /**
     * Create a new simulation
     * @param {Object} options - Configuration options
     * @param {number} options.gridSize - Size of the simulation grid
     * @param {number} options.criticalMass - Critical mass for avalanches
     * @param {number} options.initialSources - Number of initial sand sources
     * @param {number} options.targetFPS - Target frames per second
     */
    constructor(options = {}) {
        const {
            gridSize = 64,
            criticalMass = 4,
            initialSources = 3,
            targetFPS = 60
        } = options;

        // Core components
        this.sandPile = new SandPile(gridSize, criticalMass);
        this.sources = [];
        
        // Timing
        this.targetFPS = targetFPS;
        this.targetFrameTime = 1000 / targetFPS; // milliseconds
        this.lastUpdateTime = performance.now();
        this.accumulator = 0;
        
        // Speed control
        this.globalSpeed = 1.0;
        this.paused = false;
        
        // Simulation parameters
        this.gridSize = gridSize;
        
        // Statistics
        this.frameCount = 0;
        this.simulationTime = 0;
        
        // Initialize with some sources
        for (let i = 0; i < initialSources; i++) {
            this.addRandomSource();
        }
    }

    /**
     * Update the simulation by one step
     */
    update() {
        if (this.paused) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
        this.lastUpdateTime = currentTime;
        
        this.simulationTime += deltaTime;
        this.frameCount++;

        // Update sand sources and add sand to the pile
        this.updateSources(deltaTime);
        
        // Process avalanches (limit iterations per frame for performance)
        this.processAvalanches();
    }

    /**
     * Update all sand sources and add sand to the pile
     * @param {number} deltaTime - Time elapsed since last update
     */
    updateSources(deltaTime) {
        for (const source of this.sources) {
            const sandToAdd = source.update(deltaTime, this.globalSpeed);
            
            if (sandToAdd > 0) {
                const pos = source.getGridPosition();
                this.sandPile.addSand(pos.x, pos.y, sandToAdd);
            }
        }
    }

    /**
     * Process avalanches with frame-rate limiting
     */
    processAvalanches() {
        // Limit avalanche processing to maintain frame rate
        const maxIterationsPerFrame = 5;
        let iterations = 0;
        
        while (!this.sandPile.isStable() && iterations < maxIterationsPerFrame) {
            this.sandPile.processAvalanches();
            iterations++;
        }
    }

    /**
     * Add a new random sand source
     * @returns {SandSource} The created source
     */
    addRandomSource() {
        const source = SandSource.createRandom(this.gridSize);
        this.sources.push(source);
        return source;
    }

    /**
     * Remove a sand source
     * @param {number} index - Index of source to remove (default: last source)
     * @returns {SandSource|null} Removed source or null if none to remove
     */
    removeSource(index = -1) {
        if (this.sources.length === 0) return null;
        
        if (index === -1) {
            return this.sources.pop();
        } else if (index >= 0 && index < this.sources.length) {
            return this.sources.splice(index, 1)[0];
        }
        
        return null;
    }

    /**
     * Get the number of active sources
     * @returns {number} Number of sources
     */
    getSourceCount() {
        return this.sources.length;
    }

    /**
     * Get all sources
     * @returns {Array<SandSource>} Array of sources
     */
    getSources() {
        return [...this.sources];
    }

    /**
     * Set the global speed multiplier
     * @param {number} speed - Speed multiplier (0.0 to 5.0)
     */
    setGlobalSpeed(speed) {
        this.globalSpeed = Math.max(0, Math.min(5, speed));
    }

    /**
     * Get the global speed multiplier
     * @returns {number} Current speed multiplier
     */
    getGlobalSpeed() {
        return this.globalSpeed;
    }

    /**
     * Pause or resume the simulation
     * @param {boolean} paused - Whether to pause the simulation
     */
    setPaused(paused) {
        this.paused = paused;
        if (!paused) {
            this.lastUpdateTime = performance.now();
        }
    }

    /**
     * Check if the simulation is paused
     * @returns {boolean} True if paused
     */
    isPaused() {
        return this.paused;
    }

    /**
     * Get the sandpile grid for rendering
     * @returns {Array} 2D grid array
     */
    getGrid() {
        return this.sandPile.getGridCopy();
    }

    /**
     * Get the sandpile object
     * @returns {SandPile} The sandpile instance
     */
    getSandPile() {
        return this.sandPile;
    }

    /**
     * Get simulation statistics
     * @returns {Object} Statistics object
     */
    getStatistics() {
        const sandPileStats = this.sandPile.getStatistics();
        
        return {
            ...sandPileStats,
            sources: this.sources.length,
            globalSpeed: this.globalSpeed,
            paused: this.paused,
            frameCount: this.frameCount,
            simulationTime: this.simulationTime.toFixed(2),
            averageFPS: this.frameCount > 0 ? (this.frameCount / this.simulationTime).toFixed(1) : 0
        };
    }

    /**
     * Reset the entire simulation
     */
    reset() {
        this.sandPile.reset();
        this.sources.length = 0;
        this.frameCount = 0;
        this.simulationTime = 0;
        this.lastUpdateTime = performance.now();
        
        // Add initial sources back
        for (let i = 0; i < 3; i++) {
            this.addRandomSource();
        }
    }

    /**
     * Stabilize the sandpile completely
     * @returns {number} Number of iterations taken
     */
    stabilize() {
        return this.sandPile.stabilize();
    }

    /**
     * Export simulation state to JSON
     * @returns {Object} Serializable state
     */
    exportState() {
        return {
            gridSize: this.gridSize,
            grid: this.sandPile.getGridCopy(),
            sources: this.sources.map(source => source.toJSON()),
            globalSpeed: this.globalSpeed,
            statistics: this.getStatistics()
        };
    }

    /**
     * Import simulation state from JSON
     * @param {Object} state - Serialized state
     */
    importState(state) {
        this.reset();
        
        // Restore grid
        if (state.grid) {
            for (let x = 0; x < this.gridSize; x++) {
                for (let y = 0; y < this.gridSize; y++) {
                    if (state.grid[x] && state.grid[x][y] !== undefined) {
                        this.sandPile.addSand(x, y, state.grid[x][y]);
                    }
                }
            }
        }
        
        // Restore sources
        if (state.sources) {
            this.sources = state.sources.map(sourceData => 
                SandSource.fromJSON(sourceData, this.gridSize)
            );
        }
        
        // Restore settings
        if (state.globalSpeed !== undefined) {
            this.globalSpeed = state.globalSpeed;
        }
    }
}