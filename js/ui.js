import { gameState, T } from './state.js';
import { calculateTotalCPS, getRebirthMultiplier, getPurchaseMultiplier } from './core.js';
import { UPGRADES_DATA, SKINS_DATA } from './data.js';
import { buyUpgrade } from './upgrades.js';

const coinCountEl = document.getElementById('coin-count');
const cpsCountEl = document.getElementById('cps-count');
const rebirthCountEl = document.getElementById('rebirth-count');
const rebirthMultiplierEl = document.getElementById('rebirth-multiplier-display');
const rebirthPointsEl = document.getElementById('rebirth-points-display');
const rebirthBtn = document.getElementById('rebirth-btn');
const upgradesListEl = document.getElementById('upgrades-list');
const skinsGrid = document.getElementById('skins-grid');
const achievementToast = document.getElementById('achievement-toast');
const slideOutContainer = document.getElementById('slide-out-container');
const rebirthInfoContainer = document.getElementById('rebirth-info-container');

export function updatePrestigeUI() {
    rebirthInfoContainer.style.display = 'block'; // Always show the info bar
    // FIX: Changed logic to always show the slide-out tabs, regardless of rebirths.
    slideOutContainer.style.display = 'flex'; 
}

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
    rebirthMultiplierEl.textContent = `${(getRebirthMultiplier()).toFixed(2)}x`;
    rebirthPointsEl.textContent = gameState.rebirthPoints;
    rebirthBtn.innerHTML = `Rebirth`;
    updatePrestigeUI();
}

export function updateUpgradeStyles() {
    const multiplier = getPurchaseMultiplier();
    const upgradeItems = upgradesListEl.children;

    for (const itemEl of upgradeItems) {
        const upgradeId = itemEl.dataset.id;
        const upgrade = UPGRADES_DATA.find(u => u.id === upgradeId);
        if (!upgrade) continue;

        const owned = gameState.upgrades[upgrade.id]?.owned || 0;
        let totalCost = 0;
        for (let i = 0; i < multiplier; i++) {
            totalCost += Math.ceil(upgrade.baseCost * Math.pow(upgrade.costIncrease, owned + i));
        }

        const costEl = itemEl.querySelector('.upgrade-cost');
        if (costEl) {
            costEl.textContent = `Cost: ${formatNumber(totalCost)}`;
        }

        if (gameState.coins >= totalCost) {
            itemEl.classList.remove('disabled');
        } else {
            itemEl.classList.add('disabled');
        }
    }
}

export function renderUpgrades() {
    upgradesListEl.innerHTML = '';
    const upgradesForPlanet = UPGRADES_DATA.filter(u => u.planet === gameState.currentPlanet);

    upgradesForPlanet.forEach(upgrade => {
        const owned = gameState.upgrades[upgrade.id]?.owned || 0;
        const itemEl = document.createElement('div');
        itemEl.className = 'upgrade-item';
        itemEl.dataset.id = upgrade.id;

        itemEl.innerHTML = `
            <div class="upgrade-header">
                <span class="upgrade-name">${upgrade.name}</span>
                <span class="upgrade-owned">${owned}</span>
            </div>
            <p class="upgrade-desc">${upgrade.description}</p>
            <div class="upgrade-info">
                <span class="upgrade-cost">Cost: ...</span>
                <span class="upgrade-power">${upgrade.type === 'click' ? `+${formatNumber(upgrade.power)} CPC` : `+${formatNumber(upgrade.power)} CPS`}</span>
            </div>
        `;
        itemEl.addEventListener('click', () => buyUpgrade(upgrade.id));
        upgradesListEl.appendChild(itemEl);
    });
    updateUpgradeStyles(); // Initial style update
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