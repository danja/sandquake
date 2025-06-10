/**
 * Camera controller for 3D scene navigation
 */

import * as THREE from 'three';

/**
 * Camera controller with circular panning and tilt functionality
 */
export class Camera {
    /**
     * Create a new camera controller
     * @param {number} aspect - Camera aspect ratio
     * @param {Object} options - Camera configuration options
     */
    constructor(aspect, options = {}) {
        const {
            fov = 75,
            near = 0.1,
            far = 1000,
            distance = 5,
            height = 2.5,
            panSpeed = 2.0,
            tiltSpeed = 1.0,
            minTilt = -Math.PI / 3,
            maxTilt = Math.PI / 3
        } = options;

        // Create perspective camera
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        
        // Camera positioning parameters
        this.distance = distance;
        this.height = height;
        this.angle = 0; // Horizontal rotation angle
        this.tiltAngle = 0;  // Vertical tilt angle
        
        // Movement parameters
        this.panSpeed = panSpeed;
        this.tiltSpeed = tiltSpeed;
        this.minTilt = minTilt;
        this.maxTilt = maxTilt;
        
        // Target to look at (center of scene)
        this.target = new THREE.Vector3(0, 0, 0);
        
        // Update initial position
        this.updatePosition();
    }

    /**
     * Update camera position based on current angle and tilt
     */
    updatePosition() {
        // Calculate camera position using spherical coordinates
        const x = this.distance * Math.cos(this.tiltAngle) * Math.sin(this.angle);
        const y = this.distance * Math.cos(this.tiltAngle) * Math.cos(this.angle);
        const z = this.height + this.distance * Math.sin(this.tiltAngle);
        
        this.camera.position.set(x, y, z);
        this.camera.lookAt(this.target);
    }

    /**
     * Pan the camera horizontally
     * @param {number} direction - Pan direction (-1 for left, 1 for right)
     * @param {number} deltaTime - Time elapsed since last update
     */
    pan(direction, deltaTime = 1/60) {
        this.angle += direction * this.panSpeed * deltaTime;
        
        // Keep angle in 0-2π range
        while (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;
        while (this.angle < 0) this.angle += Math.PI * 2;
        
        this.updatePosition();
    }

    /**
     * Tilt the camera vertically
     * @param {number} direction - Tilt direction (-1 for down, 1 for up)
     * @param {number} deltaTime - Time elapsed since last update
     */
    tilt(direction, deltaTime = 1/60) {
        this.tiltAngle += direction * this.tiltSpeed * deltaTime;
        
        // Clamp tilt within limits
        this.tiltAngle = Math.max(this.minTilt, Math.min(this.maxTilt, this.tiltAngle));
        
        this.updatePosition();
    }

    /**
     * Set the camera distance from target
     * @param {number} distance - New distance
     */
    setDistance(distance) {
        this.distance = Math.max(5, Math.min(50, distance));
        this.updatePosition();
    }

    /**
     * Set the camera height offset
     * @param {number} height - New height offset
     */
    setHeight(height) {
        this.height = height;
        this.updatePosition();
    }

    /**
     * Set the look-at target
     * @param {number} x - Target X coordinate
     * @param {number} y - Target Y coordinate  
     * @param {number} z - Target Z coordinate
     */
    setTarget(x, y, z) {
        this.target.set(x, y, z);
        this.updatePosition();
    }

    /**
     * Get the Three.js camera object
     * @returns {THREE.PerspectiveCamera} Camera object
     */
    getCamera() {
        return this.camera;
    }

    /**
     * Update camera aspect ratio
     * @param {number} aspect - New aspect ratio
     */
    updateAspect(aspect) {
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }

    /**
     * Get camera position
     * @returns {THREE.Vector3} Camera position
     */
    getPosition() {
        return this.camera.position.clone();
    }

    /**
     * Get camera rotation angles
     * @returns {Object} Angle and tilt {angle, tilt}
     */
    getRotation() {
        return {
            angle: this.angle,
            tilt: this.tiltAngle
        };
    }

    /**
     * Set camera rotation angles
     * @param {number} angle - Horizontal angle
     * @param {number} tilt - Vertical tilt
     */
    setRotation(angle, tilt) {
        this.angle = angle;
        this.tiltAngle = Math.max(this.minTilt, Math.min(this.maxTilt, tilt));
        this.updatePosition();
    }

    /**
     * Reset camera to default position
     */
    reset() {
        this.angle = 0;
        this.tiltAngle = 0;
        this.distance = 5;
        this.height = 2.5;
        this.target.set(0, 0, 0);
        this.updatePosition();
    }

    /**
     * Animate smooth transition to new position
     * @param {number} targetAngle - Target horizontal angle
     * @param {number} targetTilt - Target vertical tilt
     * @param {number} duration - Animation duration in seconds
     * @returns {Promise} Promise that resolves when animation completes
     */
    animateTo(targetAngle, targetTilt, duration = 1.0) {
        return new Promise((resolve) => {
            const startAngle = this.angle;
            const startTilt = this.tiltAngle;
            const startTime = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = (currentTime - startTime) / 1000;
                const progress = Math.min(elapsed / duration, 1);
                
                // Smooth easing function
                const easeInOut = progress < 0.5 
                    ? 2 * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                
                this.angle = startAngle + (targetAngle - startAngle) * easeInOut;
                this.tiltAngle = startTilt + (targetTilt - startTilt) * easeInOut;
                
                this.updatePosition();
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }
}