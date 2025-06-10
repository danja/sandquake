/**
 * Sand source that drops sand at a configurable rate
 */

import { randomFloat, gridToWorld } from '../utils/MathUtils.js';

/**
 * Represents a source of sand falling from the ceiling
 */
export class SandSource {
    /**
     * Create a new sand source
     * @param {number} gridX - Grid X position
     * @param {number} gridY - Grid Y position
     * @param {number} sandRate - Rate of sand production (grains per second)
     * @param {number} gridSize - Total grid size for coordinate conversion
     */
    constructor(gridX, gridY, sandRate = 1.0, gridSize = 64) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.sandRate = sandRate;
        this.gridSize = gridSize;
        this.accumulator = 0.0;
        
        // World coordinates for 3D visualization
        const worldPos = gridToWorld(gridX, gridY, gridSize);
        this.worldX = worldPos.x;
        this.worldY = worldPos.y;
        this.worldZ = 5.0; // Height above ground
        
        // Visual properties
        this.id = Math.random().toString(36).substr(2, 9);
        this.active = true;
    }

    /**
     * Create a random sand source within the grid bounds
     * @param {number} gridSize - Size of the grid
     * @param {number} minRate - Minimum sand rate
     * @param {number} maxRate - Maximum sand rate
     * @returns {SandSource} New random sand source
     */
    static createRandom(gridSize, minRate = 0.5, maxRate = 2.0) {
        const margin = Math.floor(gridSize * 0.1); // 10% margin from edges
        const gridX = Math.floor(Math.random() * (gridSize - 2 * margin)) + margin;
        const gridY = Math.floor(Math.random() * (gridSize - 2 * margin)) + margin;
        const sandRate = randomFloat(minRate, maxRate);
        
        return new SandSource(gridX, gridY, sandRate, gridSize);
    }

    /**
     * Update the source and determine if sand should be dropped
     * @param {number} deltaTime - Time elapsed since last update (seconds)
     * @param {number} globalSpeedMultiplier - Global speed multiplier
     * @returns {number} Number of sand grains to add this frame
     */
    update(deltaTime, globalSpeedMultiplier = 1.0) {
        if (!this.active) return 0;

        // Accumulate sand based on rate and global speed
        const effectiveRate = this.sandRate * globalSpeedMultiplier;
        this.accumulator += effectiveRate * deltaTime;

        // Return integer number of grains to drop
        const grainsToAdd = Math.floor(this.accumulator);
        this.accumulator -= grainsToAdd;

        return grainsToAdd;
    }

    /**
     * Set the sand production rate
     * @param {number} rate - New sand rate (grains per second)
     */
    setSandRate(rate) {
        this.sandRate = Math.max(0, rate);
    }

    /**
     * Get the sand production rate
     * @returns {number} Current sand rate
     */
    getSandRate() {
        return this.sandRate;
    }

    /**
     * Activate or deactivate the source
     * @param {boolean} active - Whether the source should be active
     */
    setActive(active) {
        this.active = active;
    }

    /**
     * Check if the source is active
     * @returns {boolean} True if the source is active
     */
    isActive() {
        return this.active;
    }

    /**
     * Get the grid position
     * @returns {Object} Grid position {x, y}
     */
    getGridPosition() {
        return {
            x: this.gridX,
            y: this.gridY
        };
    }

    /**
     * Get the world position for 3D rendering
     * @returns {Object} World position {x, y, z}
     */
    getWorldPosition() {
        return {
            x: this.worldX,
            y: this.worldY,
            z: this.worldZ
        };
    }

    /**
     * Get source information for debugging
     * @returns {Object} Source information
     */
    getInfo() {
        return {
            id: this.id,
            gridPosition: this.getGridPosition(),
            worldPosition: this.getWorldPosition(),
            sandRate: this.sandRate,
            active: this.active,
            accumulator: this.accumulator
        };
    }

    /**
     * Serialize the source to JSON
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            gridX: this.gridX,
            gridY: this.gridY,
            sandRate: this.sandRate,
            active: this.active
        };
    }

    /**
     * Create a source from JSON data
     * @param {Object} data - JSON data
     * @param {number} gridSize - Grid size
     * @returns {SandSource} New sand source
     */
    static fromJSON(data, gridSize) {
        const source = new SandSource(data.gridX, data.gridY, data.sandRate, gridSize);
        source.setActive(data.active);
        return source;
    }
}