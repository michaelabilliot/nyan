import { gameState, T } from './state.js';
import { calculateTotalCPS, getGlobalMultiplier, getPurchaseMultiplier } from './core.js';
import { UPGRADES_DATA, SKINS_DATA, ACHIEVEMENTS_DATA } from './data.js';
import { buyUpgrade } from './upgrades.js';
import { calculateCostForAmount, calculateMaxAffordable } from './utils.js';
import { playSfx } from './audio.js';

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
const skinCarouselTrack = document.getElementById('skin-carousel-track');
const skinDetailsPanel = document.getElementById('skin-details-panel');


let currentSkinIndex = 0;

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

function updateCarouselDisplay() {
    const items = document.querySelectorAll('.skin-carousel-item');
    if (items.length === 0) return;

    const itemWidth = items[0].offsetWidth;
    const margin = parseInt(window.getComputedStyle(items[0]).marginRight) * 2;
    const totalItemWidth = itemWidth + margin;
    const offset = -(currentSkinIndex * totalItemWidth) - (totalItemWidth / 2);
    skinCarouselTrack.style.transform = `translateX(${offset}px)`;
    
    items.forEach((item, index) => {
        item.classList.toggle('active', index === currentSkinIndex);
    });
    
    updateShopDetailsAndButton();
}

function updateShopDetailsAndButton() {
    const selectedSkin = SKINS_DATA[currentSkinIndex];
    if (!selectedSkin) return;

    const isUnlocked = gameState.rebirths >= selectedSkin.rebirthUnlock;
    const isEquipped = gameState.currentSkin === selectedSkin.id;
    const displayName = !isUnlocked && selectedSkin.secretName ? selectedSkin.secretName : selectedSkin.name;

    skinDetailsPanel.innerHTML = `
        <h4>${displayName}</h4>
        <p>${isUnlocked ? selectedSkin.description : '???'}</p>
        ${isUnlocked && selectedSkin.bonus ? `<p><b>Passive Bonus:</b> +${((selectedSkin.bonus.value - 1) * 100).toFixed(1)}% Global Multiplier</p>` : ''}
        ${!isUnlocked ? `<p>Requires ${selectedSkin.rebirthUnlock} Rebirths to unlock.</p>` : ''}
        <p style="font-size: 0.8em; opacity: 0.7;">(Bonuses from all unlocked skins are always active)</p>
    `;

    if (isEquipped) {
        shopBuyBtn.innerHTML = 'Equipped';
        shopBuyBtn.disabled = true;
    } else if (isUnlocked) {
        shopBuyBtn.innerHTML = selectedSkin.action === 'fight' ? 'Fight?' : 'Equip';
        shopBuyBtn.disabled = false;
    } else {
        shopBuyBtn.innerHTML = selectedSkin.secretName ? '???' : `Locked`;
        shopBuyBtn.disabled = true;
    }
}

export function navigateCarousel(direction) {
    currentSkinIndex = (currentSkinIndex + direction + SKINS_DATA.length) % SKINS_DATA.length;
    updateCarouselDisplay();
}

export function handleShopAction() {
    const selectedSkin = SKINS_DATA[currentSkinIndex];
    if (!selectedSkin) return;

    const isUnlocked = gameState.rebirths >= selectedSkin.rebirthUnlock;

    if (isUnlocked && gameState.currentSkin !== selectedSkin.id) {
        if (selectedSkin.action === 'fight') {
            // Placeholder for future fight mechanic
            alert("The fight is not yet ready.");
        } else {
            playSfx('skinBuy');
            T({ currentSkin: selectedSkin.id });
        }
    }
    
    updateShopDetailsAndButton();
}

export function renderShop() {
    skinCarouselTrack.innerHTML = '';
    SKINS_DATA.forEach((skin, index) => {
        const item = document.createElement('div');
        item.className = 'skin-carousel-item';
        item.dataset.index = index;
        
        const isUnlocked = gameState.rebirths >= skin.rebirthUnlock;
        
        let innerHTML = `<img src="${skin.image}" alt="${skin.name}" class="skin-image">`;
        if (!isUnlocked) {
            item.classList.add('locked');
            innerHTML += `<img src="assets/icons/lock.png" alt="Locked" class="lock-icon-overlay">`;
        }
        item.innerHTML = innerHTML;

        item.addEventListener('click', () => {
            currentSkinIndex = index;
            updateCarouselDisplay();
        });

        skinCarouselTrack.appendChild(item);
    });
    
    currentSkinIndex = SKINS_DATA.findIndex(s => s.id === gameState.currentSkin);
    if (currentSkinIndex === -1) currentSkinIndex = 0;

    setTimeout(updateCarouselDisplay, 0);
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