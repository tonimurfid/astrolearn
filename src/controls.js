// src/controls.js - Camera controls with focus animation

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';

export class Controls {
    constructor(camera, canvas) {
        this.camera = camera;
        this.controls = new OrbitControls(camera, canvas);
        this.controls.enableDamping = true; // smooth animation effect
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 5; // prevent camera from going too close
        this.controls.maxDistance = 500; // prevent camera from going too far
        this.controls.maxPolarAngle = Math.PI; // allow full vertical rotation
        this.controls.target.set(0, 0, 0); // focus on the center (Sun)
        
        // Touch controls for mobile
        this.controls.enableZoom = true;
        this.controls.zoomSpeed = 1.0;
        this.controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
        };
        
        this.controls.update();
        
        this.isFocusing = false; // track if animation is in progress
    }

    update() {
        this.controls.update();
    }

    /**
     * Smoothly animate camera to focus on a planet
     * @param {THREE.Mesh} planet - The planet to focus on
     * @param {number} durationMs - Animation duration in milliseconds
     */
    focusOnPlanet(planet, durationMs = 2000) {
        if (this.isFocusing) return; // prevent multiple focuses at once
        
        this.isFocusing = true;
        
        // Target position: planet's current position
        const targetFocus = planet.position.clone();
        
        // Camera offset: position camera at a nice viewing distance
        const planetRadius = planet.geometry.parameters.radius;
        const distance = Math.max(planetRadius * 5, 10); // 5x planet radius for good framing
        
        // Calculate camera position: behind and above the planet
        const angle = planet.userData.currentAngle || 0;
        const cameraOffset = new THREE.Vector3(
            -Math.cos(angle) * distance,
            distance * 0.5, // slightly above
            -Math.sin(angle) * distance
        );
        
        const targetCameraPos = targetFocus.clone().add(cameraOffset);
        
        // Starting positions
        const startCameraPos = this.camera.position.clone();
        const startTarget = this.controls.target.clone();
        const startTime = performance.now();

        const animate = (time) => {
            const elapsed = time - startTime;
            const t = Math.min(elapsed / durationMs, 1); // normalize to 0-1
            
            // Ease-in-out cubic function for smooth animation
            const eased = t < 0.5 
                ? 4 * t * t * t 
                : 1 - Math.pow(-2 * t + 2, 3) / 2;
            
            // Interpolate camera position
            this.camera.position.lerpVectors(startCameraPos, targetCameraPos, eased);
            
            // Interpolate controls target
            this.controls.target.lerpVectors(startTarget, targetFocus, eased);
            
            this.controls.update();

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isFocusing = false;
            }
        };

        requestAnimationFrame(animate);
    }
    
    /**
     * Reset camera to default overview position
     * @param {number} durationMs - Animation duration
     */
    resetCamera(durationMs = 2000) {
        if (this.isFocusing) return;
        
        this.isFocusing = true;
        
        const defaultCameraPos = new THREE.Vector3(0, 50, 100);
        const defaultTarget = new THREE.Vector3(0, 0, 0);
        
        const startCameraPos = this.camera.position.clone();
        const startTarget = this.controls.target.clone();
        const startTime = performance.now();

        const animate = (time) => {
            const elapsed = time - startTime;
            const t = Math.min(elapsed / durationMs, 1);
            
            const eased = t < 0.5 
                ? 4 * t * t * t 
                : 1 - Math.pow(-2 * t + 2, 3) / 2;
            
            this.camera.position.lerpVectors(startCameraPos, defaultCameraPos, eased);
            this.controls.target.lerpVectors(startTarget, defaultTarget, eased);
            
            this.controls.update();

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isFocusing = false;
            }
        };

        requestAnimationFrame(animate);
    }
    
    /**
     * Enable or disable controls
     */
    setEnabled(enabled) {
        this.controls.enabled = enabled;
    }
}