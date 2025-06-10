/**
 * Abelian Sandpile Model implementation
 */

import { getNeighbors, isValidGridPosition } from '../utils/MathUtils.js';

/**
 * Represents the sandpile grid with Abelian sandpile dynamics
 */
export class SandPile {
    /**
     * Create a new sandpile
     * @param {number} size - Grid size (size x size)
     * @param {number} criticalMass - Critical mass threshold for avalanches (default 4)
     */
    constructor(size = 64, criticalMass = 4) {
        this.size = size;
        this.criticalMass = criticalMass;
        
        // Initialize the grid with zeros
        this.grid = new Array(size);
        for (let i = 0; i < size; i++) {
            this.grid[i] = new Array(size).fill(0);
        }

        // Track unstable cells for efficient avalanche processing
        this.unstableCells = new Set();
        
        // Statistics
        this.totalSand = 0;
        this.totalAvalanches = 0;
        this.avalancheSize = 0;
    }

    /**
     * Add sand to a specific grid position
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @param {number} amount - Amount of sand to add (default 1)
     */
    addSand(x, y, amount = 1) {
        if (!isValidGridPosition(x, y, this.size)) return;

        this.grid[x][y] += amount;
        this.totalSand += amount;

        // Mark cell as unstable if it exceeds critical mass
        if (this.grid[x][y] >= this.criticalMass) {
            this.unstableCells.add(`${x},${y}`);
        }
    }

    /**
     * Get the sand amount at a specific position
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @returns {number} Amount of sand at position
     */
    getSand(x, y) {
        if (!isValidGridPosition(x, y, this.size)) return 0;
        return this.grid[x][y];
    }

    /**
     * Process one step of avalanche dynamics
     * @returns {boolean} True if any avalanches occurred
     */
    processAvalanches() {
        if (this.unstableCells.size === 0) return false;

        let avalancheOccurred = false;
        const newUnstableCells = new Set();
        this.avalancheSize = 0;

        // Process all unstable cells
        for (const cellKey of this.unstableCells) {
            const [x, y] = cellKey.split(',').map(Number);
            
            if (this.grid[x][y] >= this.criticalMass) {
                this.topple(x, y, newUnstableCells);
                avalancheOccurred = true;
                this.avalancheSize++;
            }
        }

        // Update unstable cells set
        this.unstableCells = newUnstableCells;

        if (avalancheOccurred) {
            this.totalAvalanches++;
        }

        return avalancheOccurred;
    }

    /**
     * Topple a single cell, distributing sand to neighbors
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @param {Set} newUnstableCells - Set to track newly unstable cells
     */
    topple(x, y, newUnstableCells) {
        const sandToDistribute = this.grid[x][y];
        const sandPerNeighbor = Math.floor(sandToDistribute / 4);
        const remainder = sandToDistribute % 4;

        // Remove sand from current cell
        this.grid[x][y] = remainder;

        // Distribute sand to neighbors
        const neighbors = getNeighbors(x, y);
        for (const neighbor of neighbors) {
            if (isValidGridPosition(neighbor.x, neighbor.y, this.size)) {
                this.grid[neighbor.x][neighbor.y] += sandPerNeighbor;
                
                // Check if neighbor becomes unstable
                if (this.grid[neighbor.x][neighbor.y] >= this.criticalMass) {
                    newUnstableCells.add(`${neighbor.x},${neighbor.y}`);
                }
            } else {
                // Sand falls off the edge
                this.totalSand -= sandPerNeighbor;
            }
        }

        // Check if current cell is still unstable
        if (this.grid[x][y] >= this.criticalMass) {
            newUnstableCells.add(`${x},${y}`);
        }
    }

    /**
     * Process avalanches until the system is stable
     * @param {number} maxIterations - Maximum iterations to prevent infinite loops
     * @returns {number} Number of iterations taken
     */
    stabilize(maxIterations = 1000) {
        let iterations = 0;
        
        while (this.unstableCells.size > 0 && iterations < maxIterations) {
            this.processAvalanches();
            iterations++;
        }

        return iterations;
    }

    /**
     * Check if the sandpile is stable (no unstable cells)
     * @returns {boolean} True if the sandpile is stable
     */
    isStable() {
        return this.unstableCells.size === 0;
    }

    /**
     * Get the maximum height in the sandpile
     * @returns {number} Maximum sand height
     */
    getMaxHeight() {
        let maxHeight = 0;
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                maxHeight = Math.max(maxHeight, this.grid[x][y]);
            }
        }
        return maxHeight;
    }

    /**
     * Get statistics about the sandpile
     * @returns {Object} Statistics object
     */
    getStatistics() {
        return {
            totalSand: this.totalSand,
            totalAvalanches: this.totalAvalanches,
            unstableCells: this.unstableCells.size,
            maxHeight: this.getMaxHeight(),
            lastAvalancheSize: this.avalancheSize,
            isStable: this.isStable()
        };
    }

    /**
     * Reset the sandpile to empty state
     */
    reset() {
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                this.grid[x][y] = 0;
            }
        }
        
        this.unstableCells.clear();
        this.totalSand = 0;
        this.totalAvalanches = 0;
        this.avalancheSize = 0;
    }

    /**
     * Get a copy of the grid for rendering
     * @returns {Array} 2D array copy of the grid
     */
    getGridCopy() {
        return this.grid.map(row => [...row]);
    }

    /**
     * Get the grid size
     * @returns {number} Grid size
     */
    getSize() {
        return this.size;
    }

    /**
     * Get the critical mass threshold
     * @returns {number} Critical mass
     */
    getCriticalMass() {
        return this.criticalMass;
    }
}