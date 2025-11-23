// src/ui.js - DOM-based UI without external dependencies

import { PlanetInfo } from './planetInfo.js';

export class UI {
    constructor(planetSystem, controls) {
        this.planetSystem = planetSystem;
        this.controls = controls;
        this.isPaused = false;
        this.planetInfo = new PlanetInfo(planetSystem);
        
        this.setupPlanetInfoCallbacks();
        this.createUI();
        this.setupKeyboardControls();
    }

    setupPlanetInfoCallbacks() {
        this.planetInfo.onPause(() => {
            this.planetSystem.setPaused(true);
            const btn = document.getElementById('play-pause-btn');
            if (btn) btn.textContent = '▶ Play';
        });

        this.planetInfo.onResume(() => {
            this.planetSystem.setPaused(false);
            const btn = document.getElementById('play-pause-btn');
            if (btn) btn.textContent = '⏸ Pause';
        });
    }

    createUI() {
        // Controls Panel
        const controlsPanel = document.createElement('div');
        controlsPanel.id = 'controls';
        controlsPanel.innerHTML = `
            <button id="play-pause-btn">⏸ Pause</button>
            <button id="reset-btn">🔄 Reset View</button>
            <div style="margin-top: 10px;">
                <label for="speed-slider">Time Speed: <span id="speed-value">1</span>x</label>
                <input type="range" id="speed-slider" min="0" max="100" value="10" step="1">
            </div>
            <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                <strong>Controls:</strong><br>
                🖱 Drag: Rotate | Scroll: Zoom<br>
                🎯 Click planet: Focus<br>
                ⌨ Space: Play/Pause<br>
                ⌨ 1-9: Quick Focus
            </div>
        `;
        document.body.appendChild(controlsPanel);

        // Event Listeners
        document.getElementById('play-pause-btn').addEventListener('click', () => this.togglePlayPause());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetView());
        
        const speedSlider = document.getElementById('speed-slider');
        const speedValue = document.getElementById('speed-value');
        speedSlider.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value) / 10;
            speedValue.textContent = speed.toFixed(1);
            this.planetSystem.setTimeSpeed(speed);
        });
    }

    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            // Space: Play/Pause
            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePlayPause();
            }
            
            // Numbers 1-9: Quick focus on planets
            const planetMap = {
                'Digit1': 'mercury',
                'Digit2': 'venus',
                'Digit3': 'earth',
                'Digit4': 'mars',
                'Digit5': 'jupiter',
                'Digit6': 'saturn',
                'Digit7': 'uranus',
                'Digit8': 'neptune',
                'Digit9': 'moon'
            };
            
            if (planetMap[e.code]) {
                const planet = this.planetSystem.getPlanetById(planetMap[e.code]);
                if (planet) {
                    this.planetInfo.show(planet);
                    this.controls.focusOnPlanet(planet, 2000);
                }
            }
            
            // Escape: Close info panel
            if (e.code === 'Escape') {
                this.planetInfo.hide();
            }
        });
    }

    togglePlayPause() {
        this.isPaused = this.planetSystem.togglePause();
        const btn = document.getElementById('play-pause-btn');
        btn.textContent = this.isPaused ? '▶ Play' : '⏸ Pause';
    }

    resetView() {
        this.controls.resetCamera(2000);
        this.planetInfo.hide();
    }

    showPlanetInfo(planet) {
        this.planetInfo.show(planet);
    }

    hideInfo() {
        this.planetInfo.hide();
    }

    showLabel(planet, show) {
        this.planetSystem.showLabel(planet, show);
    }
}