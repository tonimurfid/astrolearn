// src/planetInfo.js - Planet information panel management

export class PlanetInfo {
    constructor(planetSystem) {
        this.planetSystem = planetSystem;
        this.infoPanel = null;
        this.currentPlanet = null;
        this.onPauseCallback = null;
        this.onResumeCallback = null;
        
        this.createInfoPanel();
    }

    createInfoPanel() {
        this.infoPanel = document.getElementById('info-panel');
        if (!this.infoPanel) {
            this.infoPanel = document.createElement('div');
            this.infoPanel.id = 'info-panel';
            document.body.appendChild(this.infoPanel);
        }
        this.infoPanel.style.display = 'none';
    }

    show(planet) {
        const userData = planet.userData;
        this.currentPlanet = planet;
        
        if (this.onPauseCallback) {
            this.onPauseCallback();
        }
        
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
        
        document.getElementById('close-info').addEventListener('click', () => this.hide());
    }

    hide() {
        this.infoPanel.style.display = 'none';
        this.currentPlanet = null;
        
        if (this.onResumeCallback) {
            this.onResumeCallback();
        }
    }

    isVisible() {
        return this.infoPanel.style.display === 'block';
    }

    onPause(callback) {
        this.onPauseCallback = callback;
    }

    onResume(callback) {
        this.onResumeCallback = callback;
    }
}
