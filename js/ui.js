import { gameState, T } from './state.js';
import { calculateTotalCPS, getRebirthMultiplier, getPurchaseMultiplier } from './core.js';
import { UPGRADES_DATA, PLANET_DATA, SKINS_DATA } from './data.js';
import { buyUpgrade } from './upgrades.js';
import { changePlanet } from './main.js';

const coinCountEl = document.getElementById('coin-count');
const cpsCountEl = document.getElementById('cps-count');
const rebirthCountEl = document.getElementById('rebirth-count');
const rebirthMultiplierEl = document.getElementById('rebirth-multiplier-display');
const rebirthPointsEl = document.getElementById('rebirth-points-display');
const rebirthBtn = document.getElementById('rebirth-btn');
const rebirthProgressBar = document.getElementById('rebirth-progress-bar');
const upgradesListEl = document.getElementById('upgrades-list');
const planetSelector = document.getElementById('planet-selector');
const skinsGrid = document.getElementById('skins-grid');

export function formatNumber(num) {
    if (num < 1000) return num.toFixed(0);
    if (num < 1e6) return (num / 1e3).toFixed(2) + 'K';
    if (num < 1e9) return (num / 1e6).toFixed(2) + 'M';
    if (num < 1e12) return (num / 1e9).toFixed(2) + 'B';
    if (num < 1e15) return (num / 1e12).toFixed(2) + 'T';
    if (num < 1e18) return (num / 1e15).toFixed(2) + 'Q';
    if (num < 1e21) return (num / 1e18).toFixed(2) + 'Qt';
    return num.toExponential(2);
}

export function updateDisplay() {
    coinCountEl.textContent = formatNumber(gameState.coins);
    cpsCountEl.textContent = formatNumber(calculateTotalCPS());
    rebirthCountEl.textContent = gameState.rebirths;
    rebirthMultiplierEl.textContent = `${(getRebirthMultiplier()).toFixed(2)}`;
    rebirthPointsEl.textContent = gameState.rebirthPoints;
    rebirthBtn.innerHTML = `Rebirth <span style="font-size: 0.7em; display: block;">+10% Boost</span>`;
    rebirthProgressBar.style.width = `${Math.min((gameState.coins / 1e7) * 100, 100)}%`;
}

export function renderUpgrades() {
    upgradesListEl.innerHTML = '';
    const upgradesForPlanet = UPGRADES_DATA.filter(u => u.planet === gameState.currentPlanet);

    upgradesForPlanet.forEach(upgrade => {
        const multiplier = getPurchaseMultiplier();
        let totalCost = 0;
        const owned = gameState.upgrades[upgrade.id]?.owned || 0;
        for (let i = 0; i < multiplier; i++) { totalCost += Math.ceil(upgrade.baseCost * Math.pow(upgrade.costIncrease, owned + i)); }

        const itemEl = document.createElement('div');
        itemEl.className = `upgrade-item ${gameState.coins >= totalCost ? '' : 'disabled'}`;
        itemEl.dataset.id = upgrade.id;

        let powerText = upgrade.type === 'click' ? `+${formatNumber(upgrade.power)} CPC` : `+${formatNumber(upgrade.power)} CPS`;

        itemEl.innerHTML = `<div class="upgrade-header"><span class="upgrade-name">${upgrade.name}</span><span class="upgrade-owned">${owned}</span></div><p class="upgrade-desc">${upgrade.description}</p><div class="upgrade-info"><span class="upgrade-cost">Cost: ${formatNumber(totalCost)}</span><span class="upgrade-power">${powerText}</span></div>`;
        itemEl.addEventListener('click', () => buyUpgrade(upgrade.id));
        upgradesListEl.appendChild(itemEl);
    });
}

export function renderPlanets() {
    planetSelector.innerHTML = '';
    Object.keys(PLANET_DATA).forEach(planetId => {
        const planet = PLANET_DATA[planetId];
        const btn = document.createElement('button');
        btn.className = 'btn planet-btn';
        btn.dataset.planet = planetId;
        btn.textContent = planet.name;

        if (gameState.unlockedPlanets.includes(planetId)) {
            btn.disabled = false;
            if (gameState.currentPlanet === planetId) btn.classList.add('active');
            btn.addEventListener('click', () => changePlanet(planetId, renderPlanets, renderUpgrades));
        } else {
            btn.disabled = true;
            btn.textContent = `${planet.name} (Unlock: ${formatNumber(planet.unlockCost)})`;
            if (gameState.coins >= planet.unlockCost) {
                btn.disabled = false;
                btn.addEventListener('click', () => {
                    if (gameState.coins >= planet.unlockCost) {
                        T({ 
                            ...gameState, 
                            coins: gameState.coins - planet.unlockCost,
                            unlockedPlanets: [...gameState.unlockedPlanets, planetId]
                        });
                        changePlanet(planetId, renderPlanets, renderUpgrades);
                    }
                });
            }
        }

        planetSelector.appendChild(btn);
    });
}

export function renderShop() {
    skinsGrid.innerHTML = '';
    SKINS_DATA.forEach(skin => {
        const card = document.createElement('div');
        card.className = 'skin-card';
        if (gameState.ownedSkins.includes(skin.id)) card.classList.add('owned');
        if (gameState.currentSkin === skin.id) card.classList.add('equipped');

        card.innerHTML = `
            <img src="${skin.image}" alt="${skin.name}">
            <div>
                <h4>${skin.name}</h4>
                <p>${skin.cost > 0 ? `Cost: ${formatNumber(skin.cost)}` : 'Default Skin'}</p>
                ${skin.bonus ? `<p>Bonus: +${(skin.bonus.value - 1) * 100}% ${skin.bonus.type.toUpperCase()}</p>` : ''}
            </div>
        `;

        card.addEventListener('click', () => {
            if (gameState.ownedSkins.includes(skin.id)) {
                T({ ...gameState, currentSkin: skin.id });
                renderShop();
            } else if (gameState.coins >= skin.cost) {
                T({
                    ...gameState,
                    coins: gameState.coins - skin.cost,
                    ownedSkins: [...gameState.ownedSkins, skin.id],
                    currentSkin: skin.id
                });
                renderShop();
            }
        });

        skinsGrid.appendChild(card);
    });
}

export function showAchievement(title, desc) {
    document.getElementById('achievement-title').textContent = title;
    document.getElementById('achievement-desc').textContent = desc;
    achievementToast.classList.add('show');
    setTimeout(() => { achievementToast.classList.remove('show'); }, 4000);
}
