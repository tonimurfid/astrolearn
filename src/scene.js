// src/scene.js - Three.js scene initialization

import * as THREE from 'three';

export class SceneManager {
    constructor() {
        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        this.camera.position.set(0, 50, 100);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Performance optimization
        document.body.appendChild(this.renderer.domElement);
        
        // Setup lighting
        this.setupLights();
        
        // Setup background
        this.setupBackground();
    }

    setupLights() {
        // Ambient light for general scene illumination
        const ambientLight = new THREE.AmbientLight(0x333333, 0.5);
        this.scene.add(ambientLight);

        // Point light at Sun position (main light source)
        const sunLight = new THREE.PointLight(0xffffff, 2, 1000);
        sunLight.position.set(0, 0, 0);
        this.scene.add(sunLight);
        
        // Hemisphere light for subtle sky/ground lighting
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
        this.scene.add(hemiLight);
    }

    setupBackground() {
        // Create starfield using particles
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.7,
            transparent: true,
            opacity: 0.8
        });
        
        const starsVertices = [];
        // Generate random stars in a sphere around the scene
        for (let i = 0; i < 10000; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = (Math.random() - 0.5) * 2000;
            starsVertices.push(x, y, z);
        }
        
        starsGeometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(starsVertices, 3)
        );
        
        const starField = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(starField);
        
        // Dark space background
        this.scene.background = new THREE.Color(0x000000);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}