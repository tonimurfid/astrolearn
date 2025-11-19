// src/planets.js - Planet creation and animation logic

import * as THREE from 'three';

export class PlanetSystem {
    constructor(scene) {
        this.scene = scene;
        this.planets = [];
        this.orbits = [];
        this.textureLoader = new THREE.TextureLoader();
        this.timeSpeed = 1; // days per second
        this.isPaused = false;
        
        // Fallback colors if textures fail to load
        this.fallbackColors = {
            sun: 0xFDB813,
            mercury: 0x8C7853,
            venus: 0xFFC649,
            earth: 0x4169E1,
            mars: 0xCD5C5C,
            jupiter: 0xC88B3A,
            saturn: 0xFAD5A5,
            uranus: 0x4FD0E7,
            neptune: 0x4166F5,
            moon: 0xC0C0C0
        };
    }

    async loadPlanetsData() {
        try {
            const response = await fetch('/data/planets.json');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to load planets data:', error);
            return [];
        }
    }

    /**
     * Load texture with fallback to solid color
     * @param {string} path - Texture file path
     * @param {string} planetId - Planet identifier for fallback color
     * @returns {Promise<THREE.Texture|null>}
     */
    loadTextureWithFallback(path, planetId) {
        return new Promise((resolve) => {
            this.textureLoader.load(
                path,
                (texture) => {
                    console.log(`✓ Loaded texture: ${path}`);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.warn(`✗ Failed to load ${path}, using fallback color`);
                    resolve(null);
                }
            );
        });
    }

    /**
     * Create a planet mesh with geometry and material
     * Scale compression: Real solar system is HUGE. We compress distances and sizes
     * to make visualization possible. Use relative_scale for size, orbital_radius_au for distance.
     */
    async createPlanet(planetData) {
        const isStar = planetData.type === 'star';
        const isSatellite = planetData.type === 'satellite';
        
        // Dynamic detail level based on relative scale
        const segments = Math.max(16, Math.min(64, Math.floor(planetData.relative_scale * 16)));
        
        const geometry = new THREE.SphereGeometry(planetData.relative_scale, segments, segments);
        
        // Try to load texture, fallback to color
        const texture = await this.loadTextureWithFallback(
            planetData.texture, 
            planetData.id
        );
        
        let material;
        
        if (isStar) {
            // Sun: emissive material
            material = new THREE.MeshBasicMaterial({
                map: texture,
                color: texture ? 0xffffff : this.fallbackColors[planetData.id],
            });
            
            // Add glow effect for the sun
            const glowGeometry = new THREE.SphereGeometry(planetData.relative_scale * 1.2, 32, 32);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0.3,
                side: THREE.BackSide
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            this.scene.add(glow);
        } else {
            // Planets: standard material with lighting
            material = new THREE.MeshStandardMaterial({
                map: texture,
                color: texture ? 0xffffff : this.fallbackColors[planetData.id],
                roughness: 0.7,
                metalness: 0.1,
            });
        }
        
        const planet = new THREE.Mesh(geometry, material);
        
        // Store orbital parameters in userData for animation
        planet.userData = {
            id: planetData.id,
            name: planetData.name,
            orbitalRadius: isSatellite ? (planetData.orbital_radius_earth || 5) : (planetData.orbital_radius_au * 50), // Increased scale from 30 to 50
            orbitalPeriod: planetData.orbital_period_days,
            rotationPeriod: planetData.rotation_period_hours,
            currentAngle: Math.random() * Math.PI * 2, // Random starting position
            description: planetData.description,
            diameter_km: planetData.diameter_km,
            isStar: isStar,
            isSatellite: isSatellite,
            parent: planetData.parent || null
        };
        
        // Position planet at starting angle (satellites positioned relative to parent later)
        if (!isStar && !isSatellite) {
            planet.position.x = planet.userData.orbitalRadius * Math.cos(planet.userData.currentAngle);
            planet.position.z = planet.userData.orbitalRadius * Math.sin(planet.userData.currentAngle);
        }
        
        this.scene.add(planet);
        this.planets.push(planet);
        
        // Add ring for Saturn
        if (planetData.id === 'saturn') {
            await this.createSaturnRing(planet, planetData.relative_scale);
        }
        
        // Create orbit path (skip for Sun and satellites)
        if (!isStar && !isSatellite && planetData.orbital_radius_au > 0) {
            this.createOrbitPath(planet.userData.orbitalRadius);
        }
        
        // Create label sprite
        this.createLabel(planet, planetData.name);
        
        return planet;
    }

    /**
     * Create Saturn's ring system
     * @param {THREE.Mesh} planet - Saturn planet mesh
     * @param {number} planetRadius - Saturn's radius for ring sizing
     */
    async createSaturnRing(planet, planetRadius) {
        const ringTexture = await this.loadTextureWithFallback(
            '/assets/textures/saturn_ring_alpha.png',
            'saturn'
        );
        
        // Ring dimensions (relative to planet radius)
        const innerRadius = planetRadius * 1.2;
        const outerRadius = planetRadius * 2.2;
        
        const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
        
        // Adjust UV coordinates for proper texture mapping
        const pos = ringGeometry.attributes.position;
        const uv = ringGeometry.attributes.uv;
        const v3 = new THREE.Vector3();
        
        for (let i = 0; i < pos.count; i++) {
            v3.fromBufferAttribute(pos, i);
            uv.setXY(i, v3.length() < (innerRadius + outerRadius) / 2 ? 0 : 1, 1);
        }
        
        const ringMaterial = new THREE.MeshStandardMaterial({
            map: ringTexture,
            color: ringTexture ? 0xffffff : 0xFAD5A5,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2; // Rotate to horizontal plane
        ring.rotation.y = 0.3; // Slight tilt for visual effect
        
        planet.add(ring);
        planet.userData.ring = ring;
    }

    createOrbitPath(radius) {
        const points = [];
        const segments = 128;
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(
                radius * Math.cos(angle),
                0,
                radius * Math.sin(angle)
            ));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: 0x444444,
            transparent: true,
            opacity: 0.3
        });
        
        const orbit = new THREE.Line(geometry, material);
        this.scene.add(orbit);
        this.orbits.push(orbit);
    }

    createLabel(planet, text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = 'Bold 24px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            opacity: 0.8
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(4, 1, 1);
        sprite.position.y = planet.userData.isStar ? 15 : planet.geometry.parameters.radius + 1.5;
        
        planet.add(sprite);
        sprite.visible = false; // Hidden by default, show on hover
        planet.userData.label = sprite;
    }

    /**
     * Update planet positions based on orbital mechanics
     * @param {number} deltaTime - Time elapsed since last frame (seconds)
     */
    updatePositions(deltaTime) {
        if (this.isPaused) return;
        
        this.planets.forEach(planet => {
            const userData = planet.userData;
            
            if (userData.isStar) {
                // Sun only rotates
                planet.rotation.y += (2 * Math.PI / (userData.rotationPeriod * 3600)) * deltaTime * this.timeSpeed;
                return;
            }
            
            // Rotate planet on its axis
            planet.rotation.y += (2 * Math.PI / (userData.rotationPeriod * 3600)) * deltaTime * this.timeSpeed;
            
            // Handle satellites (like Moon orbiting Earth)
            if (userData.isSatellite && userData.parent) {
                const parentPlanet = this.getPlanetById(userData.parent);
                if (parentPlanet) {
                    // Update orbital position around parent
                    const angularVelocity = (2 * Math.PI) / (userData.orbitalPeriod * 86400);
                    userData.currentAngle += angularVelocity * deltaTime * this.timeSpeed * 86400;
                    
                    // Position relative to parent planet
                    const offsetX = userData.orbitalRadius * Math.cos(userData.currentAngle);
                    const offsetZ = userData.orbitalRadius * Math.sin(userData.currentAngle);
                    
                    planet.position.x = parentPlanet.position.x + offsetX;
                    planet.position.y = parentPlanet.position.y;
                    planet.position.z = parentPlanet.position.z + offsetZ;
                }
                return;
            }
            
            // Update orbital position for regular planets
            // Angular velocity = 2π / period
            const angularVelocity = (2 * Math.PI) / (userData.orbitalPeriod * 86400); // rad/sec
            userData.currentAngle += angularVelocity * deltaTime * this.timeSpeed * 86400; // Scale time
            
            // Update position on orbit (simplified circular orbit on x-z plane)
            planet.position.x = userData.orbitalRadius * Math.cos(userData.currentAngle);
            planet.position.z = userData.orbitalRadius * Math.sin(userData.currentAngle);
        });
    }

    getPlanetById(id) {
        return this.planets.find(p => p.userData.id === id);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    setPaused(paused) {
        this.isPaused = paused;
    }

    setTimeSpeed(speed) {
        this.timeSpeed = speed;
    }

    showLabel(planet, show) {
        if (planet.userData.label) {
            planet.userData.label.visible = show;
        }
    }
}