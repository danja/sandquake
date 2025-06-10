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
        
        // Randomness factor for avalanche jitter (0.0 = deterministic, 1.0 = maximum randomness)
        this.randomnessFactor = 0.0;
        
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

        // Get base neighbors
        const neighbors = getNeighbors(x, y);
        
        // Apply randomness if enabled
        if (this.randomnessFactor > 0) {
            this.distributeWithRandomness(x, y, sandPerNeighbor, neighbors, newUnstableCells);
        } else {
            // Original deterministic distribution
            this.distributeToNeighbors(sandPerNeighbor, neighbors, newUnstableCells);
        }

        // Check if current cell is still unstable
        if (this.grid[x][y] >= this.criticalMass) {
            newUnstableCells.add(`${x},${y}`);
        }
    }

    /**
     * Distribute sand to neighbors with randomness
     * @param {number} sourceX - Source cell X coordinate
     * @param {number} sourceY - Source cell Y coordinate
     * @param {number} sandPerNeighbor - Base sand amount per neighbor
     * @param {Array} baseNeighbors - Array of base neighbor positions
     * @param {Set} newUnstableCells - Set to track newly unstable cells
     */
    distributeWithRandomness(sourceX, sourceY, sandPerNeighbor, baseNeighbors, newUnstableCells) {
        // Create distribution map for all potential targets
        const distributionMap = new Map();
        
        // Add base neighbors to distribution
        for (const neighbor of baseNeighbors) {
            const key = `${neighbor.x},${neighbor.y}`;
            distributionMap.set(key, {
                x: neighbor.x,
                y: neighbor.y,
                amount: sandPerNeighbor
            });
        }
        
        // Apply randomness by redistributing some sand to adjacent cells
        const randomnessIntensity = this.randomnessFactor;
        const jitterRadius = Math.ceil(randomnessIntensity * 2); // Randomness affects up to 2 cells away
        
        for (const neighbor of baseNeighbors) {
            if (!isValidGridPosition(neighbor.x, neighbor.y, this.size)) {
                // Original neighbor is off-grid, sand is lost
                this.totalSand -= sandPerNeighbor;
                continue;
            }
            
            // Determine how much sand to jitter
            const jitterAmount = Math.floor(sandPerNeighbor * randomnessIntensity * Math.random());
            const stableAmount = sandPerNeighbor - jitterAmount;
            
            // Add stable amount to original neighbor
            this.addSandToCell(neighbor.x, neighbor.y, stableAmount, newUnstableCells);
            
            // Distribute jittered sand to nearby cells
            if (jitterAmount > 0) {
                this.distributeJitteredSand(neighbor.x, neighbor.y, jitterAmount, jitterRadius, newUnstableCells);
            }
        }
    }

    /**
     * Distribute sand to base neighbors (deterministic)
     * @param {number} sandPerNeighbor - Sand amount per neighbor
     * @param {Array} neighbors - Array of neighbor positions
     * @param {Set} newUnstableCells - Set to track newly unstable cells
     */
    distributeToNeighbors(sandPerNeighbor, neighbors, newUnstableCells) {
        for (const neighbor of neighbors) {
            if (isValidGridPosition(neighbor.x, neighbor.y, this.size)) {
                this.addSandToCell(neighbor.x, neighbor.y, sandPerNeighbor, newUnstableCells);
            } else {
                // Sand falls off the edge
                this.totalSand -= sandPerNeighbor;
            }
        }
    }

    /**
     * Distribute jittered sand to random nearby cells
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} totalJitter - Total amount of sand to distribute
     * @param {number} radius - Maximum radius for jitter
     * @param {Set} newUnstableCells - Set to track newly unstable cells
     */
    distributeJitteredSand(centerX, centerY, totalJitter, radius, newUnstableCells) {
        const candidates = [];
        
        // Find all valid positions within jitter radius
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (dx === 0 && dy === 0) continue; // Skip center
                
                const targetX = centerX + dx;
                const targetY = centerY + dy;
                
                if (isValidGridPosition(targetX, targetY, this.size)) {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= radius) {
                        // Weight closer cells more heavily
                        const weight = 1.0 / (1.0 + distance);
                        candidates.push({ x: targetX, y: targetY, weight });
                    }
                }
            }
        }
        
        if (candidates.length === 0) {
            // No valid candidates, sand is lost
            this.totalSand -= totalJitter;
            return;
        }
        
        // Distribute jittered sand based on weights
        const totalWeight = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
        let remainingJitter = totalJitter;
        
        for (let i = 0; i < candidates.length && remainingJitter > 0; i++) {
            const candidate = candidates[i];
            const proportion = candidate.weight / totalWeight;
            const amount = Math.min(remainingJitter, Math.floor(totalJitter * proportion));
            
            if (amount > 0) {
                this.addSandToCell(candidate.x, candidate.y, amount, newUnstableCells);
                remainingJitter -= amount;
            }
        }
        
        // Distribute any remainder randomly
        if (remainingJitter > 0 && candidates.length > 0) {
            const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];
            this.addSandToCell(randomCandidate.x, randomCandidate.y, remainingJitter, newUnstableCells);
        }
    }

    /**
     * Add sand to a specific cell and track instability
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @param {number} amount - Amount of sand to add
     * @param {Set} newUnstableCells - Set to track newly unstable cells
     */
    addSandToCell(x, y, amount, newUnstableCells) {
        this.grid[x][y] += amount;
        
        // Check if cell becomes unstable
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

    /**
     * Set the randomness factor for avalanche distribution
     * @param {number} factor - Randomness factor (0.0 = deterministic, 1.0 = maximum randomness)
     */
    setRandomnessFactor(factor) {
        this.randomnessFactor = Math.max(0.0, Math.min(1.0, factor));
    }

    /**
     * Get the current randomness factor
     * @returns {number} Current randomness factor
     */
    getRandomnessFactor() {
        return this.randomnessFactor;
    }
}