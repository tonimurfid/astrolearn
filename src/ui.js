// src/ui.js - DOM-based UI without external dependencies

export class UI {
    constructor(planetSystem, controls) {
        this.planetSystem = planetSystem;
        this.controls = controls;
        this.isPaused = false;
        this.currentPlanet = null;
        
        this.createUI();
        this.setupKeyboardControls();
    }

    createUI() {
        // Info Panel
        this.infoPanel = document.getElementById('info-panel');
        if (!this.infoPanel) {
            this.infoPanel = document.createElement('div');
            this.infoPanel.id = 'info-panel';
            document.body.appendChild(this.infoPanel);
        }
        this.infoPanel.style.display = 'none';

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
                    this.showPlanetInfo(planet);
                    this.controls.focusOnPlanet(planet, 2000);
                }
            }
            
            // Escape: Close info panel
            if (e.code === 'Escape') {
                this.hideInfo();
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
        this.hideInfo();
    }

    showPlanetInfo(planet) {
        const userData = planet.userData;
        this.currentPlanet = planet;
        
        // Pause animation when viewing planet info
        this.planetSystem.setPaused(true);
        const btn = document.getElementById('play-pause-btn');
        if (btn) btn.textContent = '▶ Play';
        
        this.infoPanel.innerHTML = `
            <div class="info-header">
                <h2>${userData.name}</h2>
                <button id="close-info" style="float: right; background: transparent; border: none; font-size: 1.5em; cursor: pointer;">&times;</button>
            </div>
            <div class="info-content">
                ${userData.isStar ? 
                    `<p><strong>Type:</strong> Star</p>` : 
                    userData.isSatellite ?
                    `<p><strong>Orbits:</strong> ${userData.parent ? userData.parent.charAt(0).toUpperCase() + userData.parent.slice(1) : 'Earth'}</p>
                     <p><strong>Orbital Period:</strong> ${userData.orbitalPeriod.toFixed(1)} days</p>` :
                    `<p><strong>Distance from Sun:</strong> ${(userData.orbitalRadius / 30).toFixed(2)} AU</p>
                     <p><strong>Orbital Period:</strong> ${userData.orbitalPeriod.toFixed(1)} days (${(userData.orbitalPeriod / 365.25).toFixed(2)} years)</p>`
                }
                <p><strong>Diameter:</strong> ${userData.diameter_km.toLocaleString()} km</p>
                <p><strong>Rotation Period:</strong> ${userData.rotationPeriod.toFixed(1)} hours (${(userData.rotationPeriod / 24).toFixed(2)} days)</p>
                <p class="description">${userData.description}</p>
            </div>
        `;
        
        this.infoPanel.style.display = 'block';
        
        document.getElementById('close-info').addEventListener('click', () => this.hideInfo());
    }

    hideInfo() {
        this.infoPanel.style.display = 'none';
        this.currentPlanet = null;
        
        // Resume animation when closing info
        this.planetSystem.setPaused(false);
        const btn = document.getElementById('play-pause-btn');
        if (btn) btn.textContent = '⏸ Pause';
    }

    showLabel(planet, show) {
        this.planetSystem.showLabel(planet, show);
    }
}