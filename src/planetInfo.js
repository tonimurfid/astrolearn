// src/planetInfo.js - Planet information panel management

export class PlanetInfo {
    constructor(planetSystem) {
        this.planetSystem = planetSystem;
        this.infoPanel = null;
        this.currentPlanet = null;
        this.currentPage = 0;
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
        this.currentPlanet = planet;
        this.currentPage = 0;
        
        if (this.onPauseCallback) {
            this.onPauseCallback();
        }
        
        this.renderPage();
        this.infoPanel.style.display = 'block';
    }

    renderPage() {
        const userData = this.currentPlanet.userData;
        const pages = ['Overview', 'Fun Facts', 'Technical'];
        
        let content = '';
        
        if (this.currentPage === 0) {
            content = this.renderOverview(userData);
        } else if (this.currentPage === 1) {
            content = this.renderFunFacts(userData);
        } else if (this.currentPage === 2) {
            content = this.renderTechnical(userData);
        }
        
        this.infoPanel.innerHTML = `
            <div class="info-header">
                <h2>${userData.name}</h2>
                <button id="close-info" style="float: right; background: transparent; border: none; font-size: 1.5em; cursor: pointer;">&times;</button>
            </div>
            <div class="info-tabs">
                ${pages.map((page, index) => `
                    <button class="tab-btn ${index === this.currentPage ? 'active' : ''}" data-page="${index}">
                        ${page}
                    </button>
                `).join('')}
            </div>
            <div class="info-content">
                ${content}
            </div>
        `;
        
        document.getElementById('close-info').addEventListener('click', () => this.hide());
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentPage = parseInt(e.target.dataset.page);
                this.renderPage();
            });
        });
    }

    renderOverview(userData) {
        return `
            <h3>Overview</h3>
            <p class="description">${userData.description}</p>
            ${userData.isStar ? 
                `<p><strong>Type:</strong> Star</p>` : 
                userData.isSatellite ?
                `<p><strong>Type:</strong> Natural Satellite</p>
                 <p><strong>Parent Body:</strong> ${userData.parent ? userData.parent.charAt(0).toUpperCase() + userData.parent.slice(1) : 'Earth'}</p>` :
                `<p><strong>Type:</strong> Planet</p>
                 <p><strong>Classification:</strong> ${userData.classification || 'Unknown'}</p>`
            }
        `;
    }

    renderFunFacts(userData) {
        const facts = userData.fun_facts || ['No fun facts available yet!'];
        return `
            <h3>Fun Facts</h3>
            <ul class="fun-facts">
                ${facts.map(fact => `<li>${fact}</li>`).join('')}
            </ul>
        `;
    }

    renderTechnical(userData) {
        return `
            <h3>Technical Information</h3>
            ${userData.isStar ? 
                `<p><strong>Type:</strong> Star</p>` : 
                userData.isSatellite ?
                `<p><strong>Orbits:</strong> ${userData.parent ? userData.parent.charAt(0).toUpperCase() + userData.parent.slice(1) : 'Earth'}</p>
                 <p><strong>Orbital Period:</strong> ${userData.orbitalPeriod.toFixed(1)} days</p>` :
                `<p><strong>Distance from Sun:</strong> ${(userData.orbitalRadius / 50).toFixed(2)} AU</p>
                 <p><strong>Orbital Period:</strong> ${userData.orbitalPeriod.toFixed(1)} days (${(userData.orbitalPeriod / 365.25).toFixed(2)} years)</p>`
            }
            <p><strong>Diameter:</strong> ${userData.diameter_km.toLocaleString()} km</p>
            <p><strong>Rotation Period:</strong> ${userData.rotationPeriod.toFixed(1)} hours (${(userData.rotationPeriod / 24).toFixed(2)} days)</p>
        `;
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
