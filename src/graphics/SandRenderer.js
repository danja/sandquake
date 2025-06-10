/**
 * Sand visualization renderer using height-based geometry
 */

import * as THREE from 'three';
import { gridToWorld } from '../utils/MathUtils.js';

/**
 * Renders sand piles as 3D geometry with height-based coloring
 */
export class SandRenderer {
    /**
     * Create a new sand renderer
     * @param {THREE.Scene} scene - Three.js scene to add objects to
     */
    constructor(scene) {
        this.scene = scene;
        this.gridSize = 64;
        this.worldSize = 5;
        
        // Rendering parameters
        this.heightScale = 0.5; // Scale factor for sand height
        this.maxDisplayHeight = 20; // Maximum height for color mapping
        
        // Create materials for different sand heights
        this.createMaterials();
        
        // Initialize mesh for sand visualization
        this.sandMesh = null;
        this.lastGrid = null;
        
        // Performance optimization
        this.updateCounter = 0;
        this.updateFrequency = 3; // Update every N frames (reduced for smoother performance)
        
        // Frame rate limiting
        this.lastUpdateTime = 0;
        this.minUpdateInterval = 16.67; // ~60 FPS maximum update rate (ms)
    }

    /**
     * Create materials for different sand heights
     */
    createMaterials() {
        // Create a gradient of materials from low to high sand
        this.materials = [];
        const colors = [
            0x8B4513, // Brown (empty/low)
            0xDAA520, // Golden rod (medium-low)
            0xFFD700, // Gold (medium)
            0xFFA500, // Orange (medium-high)
            0xFF4500, // Red orange (high)
            0xFF0000  // Red (very high)
        ];
        
        colors.forEach(color => {
            this.materials.push(new THREE.MeshLambertMaterial({
                color: color,
                transparent: false
            }));
        });
    }

    /**
     * Update sand visualization with current grid state
     * @param {Simulation} simulation - Simulation instance with current state
     */
    update(simulation) {
        // Frame rate limiting
        const currentTime = performance.now();
        if (currentTime - this.lastUpdateTime < this.minUpdateInterval) {
            return;
        }
        
        this.updateCounter++;
        
        // Skip updates for performance (update every N frames)
        if (this.updateCounter % this.updateFrequency !== 0) {
            return;
        }
        
        this.lastUpdateTime = currentTime;
        
        const grid = simulation.getGrid();
        const gridSize = simulation.getSandPile().getSize();
        
        // Update grid size if changed
        if (this.gridSize !== gridSize) {
            this.gridSize = gridSize;
            this.lastGrid = null; // Force full rebuild
        }
        
        // Check if grid has changed significantly
        if (this.shouldUpdateMesh(grid)) {
            this.updateSandMesh(grid);
            this.lastGrid = grid.map(row => [...row]); // Deep copy
        }
    }

    /**
     * Check if the mesh needs updating based on grid changes
     * @param {Array} grid - Current grid state
     * @returns {boolean} True if mesh should be updated
     */
    shouldUpdateMesh(grid) {
        if (!this.lastGrid || !this.sandMesh) return true;
        
        // Optimized check: compare fewer sample points for better performance
        const samplePoints = 9; // Reduced from 16 to 9 for smoother performance
        const step = Math.floor(this.gridSize / Math.sqrt(samplePoints));
        
        for (let i = 0; i < this.gridSize; i += step) {
            for (let j = 0; j < this.gridSize; j += step) {
                if (i < this.gridSize && j < this.gridSize) {
                    if (grid[i][j] !== this.lastGrid[i][j]) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    /**
     * Update the sand mesh geometry based on current grid
     * @param {Array} grid - 2D array representing sand heights
     */
    updateSandMesh(grid) {
        // Remove existing mesh
        if (this.sandMesh) {
            this.scene.remove(this.sandMesh);
            this.disposeMesh(this.sandMesh);
        }
        
        // Create new mesh
        this.sandMesh = this.createSandMesh(grid);
        if (this.sandMesh) {
            this.scene.add(this.sandMesh);
        }
    }

    /**
     * Create a mesh representing the sand heights
     * @param {Array} grid - 2D array of sand heights
     * @returns {THREE.Mesh|THREE.Group} Mesh or group of meshes
     */
    createSandMesh(grid) {
        const group = new THREE.Group();
        
        // Create individual boxes for each grid cell with sand
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const height = grid[x][y];
                
                if (height > 0) {
                    const mesh = this.createSandColumn(x, y, height);
                    if (mesh) {
                        group.add(mesh);
                    }
                }
            }
        }
        
        return group.children.length > 0 ? group : null;
    }

    /**
     * Create a column of sand at a specific grid position
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @param {number} height - Sand height
     * @returns {THREE.Mesh} Sand column mesh
     */
    createSandColumn(gridX, gridY, height) {
        const worldPos = gridToWorld(gridX, gridY, this.gridSize, this.worldSize);
        const scaledHeight = height * this.heightScale;
        
        // Create geometry
        const cellSize = this.worldSize / this.gridSize;
        const geometry = new THREE.BoxGeometry(cellSize * 0.9, scaledHeight, cellSize * 0.9);
        
        // Select material based on height
        const materialIndex = Math.min(
            Math.floor((height / this.maxDisplayHeight) * this.materials.length),
            this.materials.length - 1
        );
        const material = this.materials[materialIndex];
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(worldPos.x, scaledHeight / 2, worldPos.y);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        return mesh;
    }

    /**
     * Create an instanced mesh for better performance (alternative approach)
     * @param {Array} grid - 2D array of sand heights
     * @returns {THREE.InstancedMesh|null} Instanced mesh or null
     */
    createInstancedSandMesh(grid) {
        // Count non-zero cells
        let instanceCount = 0;
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                if (grid[x][y] > 0) instanceCount++;
            }
        }
        
        if (instanceCount === 0) return null;
        
        // Create instanced mesh
        const cellSize = this.worldSize / this.gridSize;
        const geometry = new THREE.BoxGeometry(cellSize * 0.9, 1, cellSize * 0.9);
        const material = new THREE.MeshLambertMaterial({ color: 0xDAA520 });
        
        const instancedMesh = new THREE.InstancedMesh(geometry, material, instanceCount);
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = true;
        
        // Set up instances
        const matrix = new THREE.Matrix4();
        const color = new THREE.Color();
        let instanceIndex = 0;
        
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const height = grid[x][y];
                
                if (height > 0) {
                    const worldPos = gridToWorld(x, y, this.gridSize, this.worldSize);
                    const scaledHeight = height * this.heightScale;
                    
                    // Set transform matrix
                    matrix.makeScale(1, scaledHeight, 1);
                    matrix.setPosition(worldPos.x, scaledHeight / 2, worldPos.y);
                    instancedMesh.setMatrixAt(instanceIndex, matrix);
                    
                    // Set color based on height
                    const colorIntensity = Math.min(height / this.maxDisplayHeight, 1);
                    color.setHSL(0.1 - colorIntensity * 0.1, 0.8, 0.3 + colorIntensity * 0.4);
                    instancedMesh.setColorAt(instanceIndex, color);
                    
                    instanceIndex++;
                }
            }
        }
        
        instancedMesh.instanceMatrix.needsUpdate = true;
        if (instancedMesh.instanceColor) {
            instancedMesh.instanceColor.needsUpdate = true;
        }
        
        return instancedMesh;
    }

    /**
     * Reset the sand renderer
     */
    reset() {
        if (this.sandMesh) {
            this.scene.remove(this.sandMesh);
            this.disposeMesh(this.sandMesh);
            this.sandMesh = null;
        }
        
        this.lastGrid = null;
        this.updateCounter = 0;
    }

    /**
     * Dispose of a mesh and its resources
     * @param {THREE.Object3D} mesh - Mesh to dispose
     */
    disposeMesh(mesh) {
        if (mesh.geometry) {
            mesh.geometry.dispose();
        }
        
        if (mesh.material) {
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => mat.dispose());
            } else {
                mesh.material.dispose();
            }
        }
        
        // Handle groups recursively
        if (mesh.children) {
            mesh.children.forEach(child => this.disposeMesh(child));
        }
    }

    /**
     * Dispose of all renderer resources
     */
    dispose() {
        this.reset();
        
        // Dispose of materials
        this.materials.forEach(material => material.dispose());
        this.materials = [];
    }

    /**
     * Set the height scale factor
     * @param {number} scale - Height scale multiplier
     */
    setHeightScale(scale) {
        this.heightScale = Math.max(0.1, Math.min(2.0, scale));
        this.lastGrid = null; // Force update
    }

    /**
     * Set the update frequency (lower = more frequent updates)
     * @param {number} frequency - Update every N frames
     */
    setUpdateFrequency(frequency) {
        this.updateFrequency = Math.max(1, frequency);
    }

    /**
     * Get rendering statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        let triangles = 0;
        let meshes = 0;
        
        if (this.sandMesh) {
            this.sandMesh.traverse((child) => {
                if (child.geometry) {
                    meshes++;
                    if (child.geometry.index) {
                        triangles += child.geometry.index.count / 3;
                    } else {
                        triangles += child.geometry.attributes.position.count / 3;
                    }
                }
            });
        }
        
        return {
            meshes,
            triangles,
            updateFrequency: this.updateFrequency,
            heightScale: this.heightScale
        };
    }
}