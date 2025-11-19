// src/main.js - Entry point for Solar System visualization

import * as THREE from 'three';
import { SceneManager } from './scene.js';
import { PlanetSystem } from './planets.js';
import { Controls } from './controls.js';
import { UI } from './ui.js';

class SolarSystemApp {
    constructor() {
        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredPlanet = null;
        
        this.init();
    }

    async init() {
        // Initialize scene
        this.sceneManager = new SceneManager();
        
        // Initialize planet system
        this.planetSystem = new PlanetSystem(this.sceneManager.scene);
        await this.planetSystem.loadPlanetsData();
        
        // Load all planets
        const planetsData = await fetch('/data/planets.json').then(r => r.json());
        for (const planetData of planetsData) {
            await this.planetSystem.createPlanet(planetData);
        }
        
        // Initialize controls
        this.controls = new Controls(
            this.sceneManager.camera,
            this.sceneManager.renderer.domElement
        );
        
        // Initialize UI
        this.ui = new UI(this.planetSystem, this.controls);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Hide splash screen after everything is loaded
        this.hideSplashScreen();
        
        // Start animation
        this.animate();
    }

    hideSplashScreen() {
        const splashScreen = document.getElementById('splash-screen');
        if (splashScreen) {
            // Add a small delay for smooth transition
            setTimeout(() => {
                splashScreen.classList.add('hidden');
                // Remove from DOM after animation completes
                setTimeout(() => {
                    splashScreen.remove();
                }, 800);
            }, 500);
        }
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Mouse click for planet selection
        window.addEventListener('click', (e) => this.onMouseClick(e));
        
        // Mouse move for hover effects
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        // Touch events for mobile
        window.addEventListener('touchstart', (e) => this.onTouchStart(e));
        window.addEventListener('touchmove', (e) => this.onTouchMove(e));
    }

    onWindowResize() {
        this.sceneManager.onResize();
    }

    onMouseMove(event) {
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
        
        // Check for intersections with planets
        const intersects = this.raycaster.intersectObjects(this.planetSystem.planets);
        
        // Hide previous hover label
        if (this.hoveredPlanet && !intersects.find(i => i.object === this.hoveredPlanet)) {
            this.planetSystem.showLabel(this.hoveredPlanet, false);
            this.hoveredPlanet = null;
            document.body.style.cursor = 'default';
        }
        
        // Show new hover label
        if (intersects.length > 0) {
            const planet = intersects[0].object;
            if (planet !== this.hoveredPlanet) {
                this.hoveredPlanet = planet;
                this.planetSystem.showLabel(planet, true);
                document.body.style.cursor = 'pointer';
            }
        }
    }

    onMouseClick(event) {
        // Calculate mouse position
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
        
        // Check for intersections
        const intersects = this.raycaster.intersectObjects(this.planetSystem.planets);
        
        if (intersects.length > 0) {
            const planet = intersects[0].object;
            this.ui.showPlanetInfo(planet);
            this.controls.focusOnPlanet(planet, 2000);
        }
    }

    onTouchStart(event) {
        // Prevent default to avoid double-firing on mobile
        if (event.touches.length === 1) {
            event.preventDefault();
            
            const touch = event.touches[0];
            
            // Calculate touch position in normalized device coordinates
            this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
            
            // Update raycaster
            this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
            
            // Check for intersections
            const intersects = this.raycaster.intersectObjects(this.planetSystem.planets);
            
            if (intersects.length > 0) {
                const planet = intersects[0].object;
                this.ui.showPlanetInfo(planet);
                this.controls.focusOnPlanet(planet, 2000);
            }
        }
    }

    onTouchMove(event) {
        // Handle touch move for hover-like effects on mobile
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            
            // Calculate touch position
            this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
            
            // Update raycaster
            this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
            
            // Check for intersections with planets
            const intersects = this.raycaster.intersectObjects(this.planetSystem.planets);
            
            // Hide previous hover label
            if (this.hoveredPlanet && !intersects.find(i => i.object === this.hoveredPlanet)) {
                this.planetSystem.showLabel(this.hoveredPlanet, false);
                this.hoveredPlanet = null;
            }
            
            // Show new hover label
            if (intersects.length > 0) {
                const planet = intersects[0].object;
                if (planet !== this.hoveredPlanet) {
                    this.hoveredPlanet = planet;
                    this.planetSystem.showLabel(planet, true);
                }
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        // Update planet positions
        this.planetSystem.updatePositions(deltaTime);
        
        // Update controls
        this.controls.update();
        
        // Render scene
        this.sceneManager.render();
    }
}

// Start the application
new SolarSystemApp();