/**
 * Main 3D scene manager using Three.js
 */

import * as THREE from 'three';
import { Camera } from './Camera.js';
import { SandRenderer } from './SandRenderer.js';

/**
 * Manages the entire 3D scene including rendering, lighting, and objects
 */
export class Scene {
    /**
     * Create a new 3D scene
     * @param {HTMLCanvasElement} canvas - Canvas element for rendering
     */
    constructor(canvas) {
        this.canvas = canvas;
        
        // Initialize Three.js components
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true,
            alpha: false
        });
        
        // Set up renderer
        this.setupRenderer();
        
        // Initialize camera
        const aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera = new Camera(aspect);
        
        // Initialize lighting
        this.setupLighting();
        
        // Initialize scene objects
        this.setupEnvironment();
        
        // Initialize sand renderer
        this.sandRenderer = new SandRenderer(this.scene);
        
        // Handle resize (after camera is initialized)
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Set up the WebGL renderer
     */
    setupRenderer() {
        this.renderer.setClearColor(0x87CEEB, 1); // Sky blue background
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    /**
     * Set up scene lighting
     */
    setupLighting() {
        // Ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);

        // Main directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(2.5, 3.75, 1.25);
        directionalLight.castShadow = true;
        
        // Configure shadow camera
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 12.5;
        directionalLight.shadow.camera.left = -5;
        directionalLight.shadow.camera.right = 5;
        directionalLight.shadow.camera.top = 5;
        directionalLight.shadow.camera.bottom = -5;
        
        this.scene.add(directionalLight);
        this.directionalLight = directionalLight;

        // Secondary fill light
        const fillLight = new THREE.DirectionalLight(0x8888bb, 0.2);
        fillLight.position.set(-1.25, 2.5, -1.25);
        this.scene.add(fillLight);
    }

    /**
     * Set up the environment (ground, ceiling, etc.)
     */
    setupEnvironment() {
        // Ground plane
        this.createGround();
        
        // Ceiling plane (for visual reference)
        this.createCeiling();
        
        // Scene bounds visualization
        this.createBounds();
    }

    /**
     * Create the ground plane
     */
    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(5, 5);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513,  // Brown color
            transparent: true,
            opacity: 0.8
        });
        
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2; // Rotate to horizontal
        this.ground.position.y = 0;
        this.ground.receiveShadow = true;
        
        this.scene.add(this.ground);
    }

    /**
     * Create the ceiling plane
     */
    createCeiling() {
        const ceilingGeometry = new THREE.PlaneGeometry(5, 5);
        const ceilingMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x444444,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        
        this.ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        this.ceiling.rotation.x = -Math.PI / 2;
        this.ceiling.position.y = 2;
        
        this.scene.add(this.ceiling);
    }

    /**
     * Create scene bounds visualization
     */
    createBounds() {
        const boundsGeometry = new THREE.EdgesGeometry(
            new THREE.BoxGeometry(5, 2, 5)
        );
        const boundsMaterial = new THREE.LineBasicMaterial({ 
            color: 0x666666,
            transparent: true,
            opacity: 0.3
        });
        
        this.bounds = new THREE.LineSegments(boundsGeometry, boundsMaterial);
        this.bounds.position.y = 1;
        
        this.scene.add(this.bounds);
    }

    /**
     * Update the scene with simulation data
     * @param {Simulation} simulation - The simulation instance
     */
    update(simulation) {
        // Update sand renderer with current simulation state
        this.sandRenderer.update(simulation);
        
        // Update source visualizations
        this.updateSources(simulation.getSources());
    }

    /**
     * Update source visualizations
     * @param {Array} sources - Array of sand sources
     */
    updateSources(sources) {
        // Remove old source markers
        if (this.sourceMarkers) {
            this.sourceMarkers.forEach(marker => {
                this.scene.remove(marker);
            });
        }
        
        // Create new source markers
        this.sourceMarkers = [];
        
        sources.forEach(source => {
            const worldPos = source.getWorldPosition();
            
            // Create a small sphere to represent the source
            const markerGeometry = new THREE.SphereGeometry(0.05, 6, 6);
            const markerMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff4444,
                transparent: true,
                opacity: 0.9
            });
            
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.set(worldPos.x, worldPos.z, worldPos.y);
            
            this.scene.add(marker);
            this.sourceMarkers.push(marker);
        });
    }

    /**
     * Render the scene
     */
    render() {
        this.renderer.render(this.scene, this.camera.getCamera());
    }

    /**
     * Handle window resize
     */
    handleResize() {
        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        this.renderer.setSize(width, height, false);
        this.camera.updateAspect(width / height);
    }

    /**
     * Reset the scene
     */
    reset() {
        this.sandRenderer.reset();
        
        // Remove source markers
        if (this.sourceMarkers) {
            this.sourceMarkers.forEach(marker => {
                this.scene.remove(marker);
            });
            this.sourceMarkers = [];
        }
    }

    /**
     * Dispose of resources
     */
    dispose() {
        // Dispose of renderer
        this.renderer.dispose();
        
        // Dispose of geometries and materials
        this.scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        
        // Dispose of sand renderer
        this.sandRenderer.dispose();
    }

    /**
     * Get the camera controller
     * @returns {Camera} Camera controller
     */
    getCamera() {
        return this.camera;
    }

    /**
     * Get the Three.js scene
     * @returns {THREE.Scene} Three.js scene
     */
    getThreeScene() {
        return this.scene;
    }

    /**
     * Get the Three.js renderer
     * @returns {THREE.WebGLRenderer} Three.js renderer
     */
    getRenderer() {
        return this.renderer;
    }

    /**
     * Set scene background color
     * @param {number} color - Hex color value
     */
    setBackgroundColor(color) {
        this.renderer.setClearColor(color);
    }

    /**
     * Toggle wireframe mode for debugging
     * @param {boolean} enabled - Whether to enable wireframe mode
     */
    setWireframe(enabled) {
        this.scene.traverse((object) => {
            if (object.material && object.material.wireframe !== undefined) {
                object.material.wireframe = enabled;
            }
        });
    }
}