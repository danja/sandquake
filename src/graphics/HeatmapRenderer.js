/**
 * Heatmap renderer for sand height visualization
 */

/**
 * Renders a 2D heatmap showing sand height distribution
 */
export class HeatmapRenderer {
    /**
     * Create a new heatmap renderer
     * @param {HTMLCanvasElement} canvas - Canvas element for rendering heatmap
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Set canvas resolution
        this.resolution = 64; // Match simulation grid size
        this.canvas.width = this.resolution;
        this.canvas.height = this.resolution;
        
        // Image data for efficient pixel manipulation
        this.imageData = this.ctx.createImageData(this.resolution, this.resolution);
        
        // Color scheme for heatmap (blue to red gradient)
        this.colorMap = this.generateColorMap();
        
        this.setupCanvas();
    }

    /**
     * Set up canvas properties
     */
    setupCanvas() {
        // Disable image smoothing for pixel-perfect rendering
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
    }

    /**
     * Generate color map for heatmap visualization
     * @returns {Array} Array of RGB colors from blue (low) to red (high)
     */
    generateColorMap() {
        const colors = [];
        const steps = 256;
        
        for (let i = 0; i < steps; i++) {
            const ratio = i / (steps - 1);
            
            // Create a blue to red gradient through purple/pink
            let r, g, b;
            
            if (ratio < 0.25) {
                // Blue to cyan
                const t = ratio / 0.25;
                r = 0;
                g = Math.floor(t * 255);
                b = 255;
            } else if (ratio < 0.5) {
                // Cyan to green
                const t = (ratio - 0.25) / 0.25;
                r = 0;
                g = 255;
                b = Math.floor((1 - t) * 255);
            } else if (ratio < 0.75) {
                // Green to yellow
                const t = (ratio - 0.5) / 0.25;
                r = Math.floor(t * 255);
                g = 255;
                b = 0;
            } else {
                // Yellow to red
                const t = (ratio - 0.75) / 0.25;
                r = 255;
                g = Math.floor((1 - t) * 255);
                b = 0;
            }
            
            colors.push([r, g, b]);
        }
        
        return colors;
    }

    /**
     * Update heatmap with current sand pile data
     * @param {SandPile} sandPile - The sand pile instance
     */
    update(sandPile) {
        if (!sandPile) return;
        
        const grid = sandPile.getGridCopy();
        const gridSize = sandPile.getSize();
        const maxHeight = sandPile.getMaxHeight() || 1; // Avoid division by zero
        
        // Clear image data
        this.imageData.data.fill(0);
        
        // Update each pixel based on sand height
        for (let y = 0; y < this.resolution; y++) {
            for (let x = 0; x < this.resolution; x++) {
                // Map heatmap coordinates to grid coordinates
                const gridX = Math.floor((x / this.resolution) * gridSize);
                const gridY = Math.floor((y / this.resolution) * gridSize);
                
                // Get sand height at this position
                const height = grid[gridY] ? (grid[gridY][gridX] || 0) : 0;
                
                // Normalize height to 0-1 range
                const normalizedHeight = Math.min(height / maxHeight, 1);
                
                // Get color from color map
                const colorIndex = Math.floor(normalizedHeight * (this.colorMap.length - 1));
                const [r, g, b] = this.colorMap[colorIndex] || [0, 0, 0];
                
                // Set pixel color in image data
                const pixelIndex = (y * this.resolution + x) * 4;
                this.imageData.data[pixelIndex] = r;     // Red
                this.imageData.data[pixelIndex + 1] = g; // Green
                this.imageData.data[pixelIndex + 2] = b; // Blue
                this.imageData.data[pixelIndex + 3] = 255; // Alpha
            }
        }
        
        // Render the image data to canvas
        this.ctx.putImageData(this.imageData, 0, 0);
    }

    /**
     * Clear the heatmap
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fill with dark blue (representing empty/zero height)
        this.ctx.fillStyle = 'rgb(0, 0, 64)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Reset the heatmap to initial state
     */
    reset() {
        this.clear();
    }

    /**
     * Handle canvas resize
     */
    handleResize() {
        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        // Keep internal resolution the same, but update display size
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
    }

    /**
     * Set the resolution of the heatmap
     * @param {number} resolution - New resolution (width and height)
     */
    setResolution(resolution) {
        this.resolution = resolution;
        this.canvas.width = resolution;
        this.canvas.height = resolution;
        this.imageData = this.ctx.createImageData(resolution, resolution);
        this.setupCanvas();
    }

    /**
     * Get current heatmap statistics
     * @returns {Object} Statistics about the heatmap
     */
    getStats() {
        return {
            resolution: this.resolution,
            canvasSize: {
                width: this.canvas.width,
                height: this.canvas.height
            },
            colorMapSize: this.colorMap.length
        };
    }

    /**
     * Dispose of resources
     */
    dispose() {
        // Clear canvas
        this.clear();
        
        // Clear references
        this.ctx = null;
        this.imageData = null;
        this.colorMap = null;
    }

    /**
     * Set custom color scheme
     * @param {Array} colors - Array of [r, g, b] color values
     */
    setColorMap(colors) {
        this.colorMap = colors;
    }

    /**
     * Get the current color map
     * @returns {Array} Current color map
     */
    getColorMap() {
        return this.colorMap;
    }

    /**
     * Export heatmap as image data URL
     * @returns {string} Data URL of the heatmap image
     */
    exportImage() {
        return this.canvas.toDataURL();
    }
}