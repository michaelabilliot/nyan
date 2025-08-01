import { gameState, T } from './state.js';
import { calculateTotalCPS, getGlobalMultiplier, getPurchaseMultiplier } from './core.js';
import { UPGRADES_DATA, SKINS_DATA, ACHIEVEMENTS_DATA } from './data.js';
import { buyUpgrade } from './upgrades.js';
import { calculateCostForAmount, calculateMaxAffordable } from './utils.js';

const coinCountEl = document.getElementById('coin-count');
const cpsCountEl = document.getElementById('cps-count');
const rebirthCountEl = document.getElementById('rebirth-count');
const rebirthPointsEl = document.getElementById('rebirth-points-display');
const cpsBoostEl = document.getElementById('cps-boost-display');
const npcBoostEl = document.getElementById('npc-boost-display');
const rebirthBtn = document.getElementById('rebirth-btn');
const upgradesListEl = document.getElementById('upgrades-list');
const achievementToast = document.getElementById('achievement-toast');
const nyanTreeTab = document.getElementById('nyan-tree-tab');
const settingsTab = document.getElementById('settings-tab');
const achievementsContent = document.getElementById('achievements-content');
const shopBuyBtn = document.getElementById('shop-buy-btn');
const skinsGridContainer = document.getElementById('skins-grid-container');

let selectedSkinIdInShop = null;

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
    cpsCountEl.innerHTML = formatNumber(calculateTotalCPS(gameState));

    rebirthCountEl.textContent = gameState.rebirths;
    rebirthPointsEl.textContent = gameState.rebirthPoints;

    const boostPercentage = (getGlobalMultiplier(gameState) - 1) * 100;
    cpsBoostEl.textContent = `${boostPercentage.toFixed(2)}%`;
    npcBoostEl.textContent = `${boostPercentage.toFixed(2)}%`;

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
        
        const owned = gameState.upgrades[upgradeId]?.owned || 0;
        
        const ownedEl = itemEl.querySelector('.upgrade-owned');
        if (ownedEl && ownedEl.textContent !== owned.toString()) {
            ownedEl.textContent = owned;
        }

        let totalCost;
        let amountToBuy;

        if (multiplier === 'ALL') {
            amountToBuy = calculateMaxAffordable(upgrade, owned, gameState.coins);
            totalCost = calculateCostForAmount(upgrade, owned, amountToBuy);
        } else {
            amountToBuy = multiplier;
            totalCost = calculateCostForAmount(upgrade, owned, amountToBuy);
        }

        const costEl = itemEl.querySelector('.upgrade-cost');
        if (costEl) {
            costEl.innerHTML = `Cost: ${formatNumber(totalCost)}`;
        }

        const powerEl = itemEl.querySelector('.upgrade-power');
        if (powerEl) {
            const totalPower = upgrade.power * amountToBuy;
            const powerType = upgrade.type === 'click' ? 'NPC' : 'CPS';
            powerEl.innerHTML = `+${formatNumber(totalPower)} ${powerType}`;
        }

        if (gameState.coins >= totalCost && amountToBuy > 0) {
            itemEl.classList.remove('disabled');
        } else {
            itemEl.classList.add('disabled');
        }
    }
}


export function renderUpgrades() {
    upgradesListEl.innerHTML = '';
    UPGRADES_DATA.forEach(upgrade => {
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

//--- NEW SHOP GRID LOGIC ---//
function updateShopButtons() {
    const selectedSkin = SKINS_DATA.find(s => s.id === selectedSkinIdInShop);
    if (!selectedSkin) return;

    const isOwned = gameState.ownedSkins.includes(selectedSkin.id);
    const isEquipped = gameState.currentSkin === selectedSkin.id;

    if (isEquipped) {
        shopBuyBtn.innerHTML = 'Equipped';
        shopBuyBtn.disabled = true;
    } else if (isOwned) {
        shopBuyBtn.innerHTML = 'Equip';
        shopBuyBtn.disabled = false;
    } else {
        shopBuyBtn.innerHTML = `Buy (${formatNumber(selectedSkin.cost)})`;
        shopBuyBtn.disabled = gameState.coins < selectedSkin.cost;
    }
}

export function handleShopAction() {
    const selectedSkin = SKINS_DATA.find(s => s.id === selectedSkinIdInShop);
    if (!selectedSkin) return;

    if (gameState.ownedSkins.includes(selectedSkin.id)) {
        T({ currentSkin: selectedSkin.id });
    } else if (gameState.coins >= selectedSkin.cost) {
        T({
            coins: gameState.coins - selectedSkin.cost,
            ownedSkins: [...gameState.ownedSkins, selectedSkin.id],
            currentSkin: selectedSkin.id
        });
    }
    renderShop(); // Re-render to update equipped status
}

export function renderShop() {
    skinsGridContainer.innerHTML = '';
    selectedSkinIdInShop = gameState.currentSkin;

    SKINS_DATA.forEach(skin => {
        const card = document.createElement('div');
        card.className = 'skin-grid-card';
        card.dataset.id = skin.id;

        if (skin.id === gameState.currentSkin) {
            card.classList.add('equipped');
        }
        if (skin.id === selectedSkinIdInShop) {
            card.classList.add('selected');
        }

        card.innerHTML = `
            <img src="${skin.image}" alt="${skin.name}" class="skin-grid-card-img">
            <h4>${skin.name}</h4>
        `;

        card.addEventListener('click', () => {
            selectedSkinIdInShop = skin.id;
            document.querySelectorAll('.skin-grid-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            updateShopButtons();
        });

        skinsGridContainer.appendChild(card);
    });

    updateShopButtons();
}


export function renderAchievements() {
    achievementsContent.innerHTML = '';
    Object.keys(ACHIEVEMENTS_DATA).forEach(categoryName => {
        const category = ACHIEVEMENTS_DATA[categoryName];
        
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'achievement-category';
        
        const categoryTitle = document.createElement('h3');
        categoryTitle.textContent = categoryName;
        categoryDiv.appendChild(categoryTitle);

        const gridLayout = document.createElement('div');
        gridLayout.className = 'achievements-grid-layout';

        Object.keys(category).forEach(id => {
            const achievement = category[id];
            const card = document.createElement('div');
            card.className = 'achievement-card';
            
            const isUnlocked = gameState.unlockedAchievements.includes(id);

            if (isUnlocked) {
                card.classList.add('unlocked');
            } else {
                card.classList.add('locked');
            }

            card.innerHTML = `
                <img src="assets/icons/trophy.png" alt="Trophy" class="achievement-card-icon">
                <div class="achievement-card-text">
                    <h4>${isUnlocked ? achievement.name : '??????'}</h4>
                    <p>${isUnlocked ? achievement.description : 'Keep playing to unlock!'}</p>
                </div>
            `;
            gridLayout.appendChild(card);
        });

        categoryDiv.appendChild(gridLayout);
        achievementsContent.appendChild(categoryDiv);
    });
}

export function showAchievement(title, desc) {
    document.getElementById('achievement-title').textContent = title;
    document.getElementById('achievement-desc').textContent = desc;
    achievementToast.classList.add('show');
    setTimeout(() => { achievementToast.classList.remove('show'); }, 4000);
}