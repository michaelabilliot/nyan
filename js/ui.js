import { gameState, T } from './state.js';
import { calculateTotalCPS, getGlobalMultiplier, getPurchaseMultiplier } from './core.js';
import { UPGRADES_DATA, SKINS_DATA, ACHIEVEMENTS_DATA } from './data.js';
import { buyUpgrade } from './upgrades.js';

const coinCountEl = document.getElementById('coin-count');
const cpsCountEl = document.getElementById('cps-count');
const rebirthCountEl = document.getElementById('rebirth-count');
const rebirthPointsEl = document.getElementById('rebirth-points-display');
const cpsBoostEl = document.getElementById('cps-boost-display');
const npcBoostEl = document.getElementById('npc-boost-display');
const rebirthBtn = document.getElementById('rebirth-btn');
const upgradesListEl = document.getElementById('upgrades-list');
const skinsGrid = document.getElementById('skins-grid');
const achievementToast = document.getElementById('achievement-toast');
const nyanTreeTab = document.getElementById('nyan-tree-tab');
const settingsTab = document.getElementById('settings-tab');
const achievementsGrid = document.getElementById('achievements-grid');

export function updatePrestigeUI() {
    settingsTab.style.display = 'flex';
    nyanTreeTab.style.display = gameState.rebirths > 0 ? 'flex' : 'none';
}

export function formatNumber(num, isFloat = false) {
    if (num < 1000000) {
        return isFloat ? num.toFixed(2) : Math.floor(num).toLocaleString('en-US');
    }

    const suffixes = ["", "M", "B", "T", "Q", "Qt", "S", "Sp", "O", "N"];
    const tier = Math.floor(Math.log10(Math.abs(num)) / 3);
    
    if (tier < suffixes.length) {
        const suffix = suffixes[tier - 1];
        const scale = Math.pow(10, tier * 3);
        const scaled = num / scale;

        const formatted = scaled.toFixed(2);
        const parts = formatted.split('.');
        return `${parts[0]}.<span class="decimal-part">${parts[1]}</span>${suffix ? `<span class="suffix-part">${suffix}</span>` : ''}`;
    }
    
    return num.toExponential(2);
}


export function updateDisplay() {
    coinCountEl.innerHTML = formatNumber(gameState.coins);
    cpsCountEl.innerHTML = formatNumber(calculateTotalCPS());

    rebirthCountEl.textContent = gameState.rebirths;
    rebirthPointsEl.textContent = gameState.rebirthPoints;

    const boostPercentage = (getGlobalMultiplier() - 1) * 100;
    cpsBoostEl.textContent = `${boostPercentage.toFixed(2)}%`;
    npcBoostEl.textContent = `${boostPercentage.toFixed(2)}%`;

    rebirthBtn.innerHTML = `Rebirth`;
    updatePrestigeUI();
}

// MODIFIED: This function now correctly calculates and displays the cost AND power for bulk purchases.
export function updateUpgradeStyles() {
    const multiplier = getPurchaseMultiplier();
    const upgradeItems = upgradesListEl.children;

    for (const itemEl of upgradeItems) {
        const upgradeId = itemEl.dataset.id;
        const upgrade = UPGRADES_DATA.find(u => u.id === upgradeId);
        if (!upgrade) continue;
        
        let totalCost;
        let canAfford;
        let amountToBuy;

        if (multiplier === 'ALL') {
            amountToBuy = Math.floor(gameState.coins / upgrade.baseCost);
            totalCost = amountToBuy * upgrade.baseCost;
            canAfford = amountToBuy > 0;
        } else {
            amountToBuy = multiplier;
            totalCost = upgrade.baseCost * amountToBuy;
            canAfford = gameState.coins >= totalCost;
        }

        const costEl = itemEl.querySelector('.upgrade-cost');
        if (costEl) {
            costEl.innerHTML = `Cost: ${formatNumber(totalCost)}`;
        }

        const powerEl = itemEl.querySelector('.upgrade-power');
        if(powerEl){
            const totalPower = upgrade.power * amountToBuy;
            const powerType = upgrade.type === 'click' ? 'NPC' : 'CPS';
            powerEl.innerHTML = `+${formatNumber(totalPower)} ${powerType}`;
        }

        if (canAfford) {
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
                <span class="upgrade-power">${upgrade.type === 'click' ? `+${formatNumber(upgrade.power)} NPC` : `+${formatNumber(upgrade.power)} CPS`}</span>
            </div>
        `;
        itemEl.addEventListener('click', () => buyUpgrade(upgrade.id));
        upgradesListEl.appendChild(itemEl);
    });
    updateUpgradeStyles();
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

// ADDED: Renders the achievement modal content.
export function renderAchievements() {
    achievementsGrid.innerHTML = '';
    Object.keys(ACHIEVEMENTS_DATA).forEach(id => {
        const achievement = ACHIEVEMENTS_DATA[id];
        const card = document.createElement('div');
        card.className = 'achievement-card';
        
        const isUnlocked = gameState.unlockedAchievements.includes(id);

        if (isUnlocked) {
            card.classList.add('unlocked');
        } else {
            card.classList.add('locked');
        }

        card.innerHTML = `
            <div class="achievement-card-icon">🏆</div>
            <div class="achievement-card-text">
                <h4>${isUnlocked ? achievement.name : '??????'}</h4>
                <p>${isUnlocked ? achievement.description : 'Keep playing to unlock!'}</p>
            </div>
        `;
        achievementsGrid.appendChild(card);
    });
}

export function showAchievement(title, desc) {
    document.getElementById('achievement-title').textContent = title;
    document.getElementById('achievement-desc').textContent = desc;
    achievementToast.classList.add('show');
    setTimeout(() => { achievementToast.classList.remove('show'); }, 4000);
}