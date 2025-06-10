/**
 * Mathematical utilities for the sandpile simulation
 */

/**
 * Generate a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random float between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random float
 */
export function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Convert grid coordinates to world coordinates
 * @param {number} gridX - Grid X coordinate
 * @param {number} gridY - Grid Y coordinate
 * @param {number} gridSize - Size of the grid
 * @param {number} worldSize - Size of the world
 * @returns {Object} World coordinates {x, y}
 */
export function gridToWorld(gridX, gridY, gridSize, worldSize = 10) {
    const scale = worldSize / gridSize;
    return {
        x: (gridX - gridSize / 2) * scale,
        y: (gridY - gridSize / 2) * scale
    };
}

/**
 * Convert world coordinates to grid coordinates
 * @param {number} worldX - World X coordinate
 * @param {number} worldY - World Y coordinate
 * @param {number} gridSize - Size of the grid
 * @param {number} worldSize - Size of the world
 * @returns {Object} Grid coordinates {x, y}
 */
export function worldToGrid(worldX, worldY, gridSize, worldSize = 10) {
    const scale = gridSize / worldSize;
    return {
        x: Math.floor((worldX + worldSize / 2) * scale),
        y: Math.floor((worldY + worldSize / 2) * scale)
    };
}

/**
 * Check if grid coordinates are valid
 * @param {number} x - Grid X coordinate
 * @param {number} y - Grid Y coordinate
 * @param {number} gridSize - Size of the grid
 * @returns {boolean} True if coordinates are valid
 */
export function isValidGridPosition(x, y, gridSize) {
    return x >= 0 && x < gridSize && y >= 0 && y < gridSize;
}

/**
 * Get the four neighboring positions of a grid cell
 * @param {number} x - Grid X coordinate
 * @param {number} y - Grid Y coordinate
 * @returns {Array} Array of neighbor positions [{x, y}, ...]
 */
export function getNeighbors(x, y) {
    return [
        { x: x - 1, y: y },     // Left
        { x: x + 1, y: y },     // Right
        { x: x, y: y - 1 },     // Up
        { x: x, y: y + 1 }      // Down
    ];
}