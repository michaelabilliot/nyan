import { gameState, T } from './state.js';
import { calculateTotalCPS, getGlobalMultiplier, getPurchaseMultiplier } from './core.js';
import { UPGRADES_DATA, SKINS_DATA, ACHIEVEMENTS_DATA } from './data.js';
import { buyUpgrade } from './upgrades.js';
import { calculateCostForAmount, calculateMaxAffordable, formatNumber } from './utils.js';
import { playSfx } from './audio.js';
import { updateSkinAndMode } from './main.js';

// Cache DOM elements
const coinCountEl = document.getElementById('coin-count');
const cpsCountEl = document.getElementById('cps-count');
const rebirthBtn = document.getElementById('rebirth-btn');
const upgradesListEl = document.getElementById('upgrades-list');
const achievementToast = document.getElementById('achievement-toast');
const nyanTreeTab = document.getElementById('nyan-tree-tab');
const settingsTab = document.getElementById('settings-tab');
const statsTab = document.getElementById('stats-tab');
const easterEggsTab = document.getElementById('easter-eggs-tab'); // ADDED
const achievementsContent = document.getElementById('achievements-content');
const shopBuyBtn = document.getElementById('shop-buy-btn');
const skinCarouselTrack = document.getElementById('skin-carousel-track');
const skinDetailsPanel = document.getElementById('skin-details-panel');
const statsContent = document.getElementById('stats-content');

let currentSkinIndex = 0;
let saveGameCallback = () => {}; // Placeholder for the saveGame function

export function setSaveGameCallback(callback) {
    saveGameCallback = callback;
}

function getVisibleShopSkins() {
    return SKINS_DATA.filter(s => !s.secret);
}

// MODIFIED: Renamed function and added logic for easter egg tab
export function updateTabVisibility() {
    settingsTab.style.display = 'flex';
    statsTab.style.display = 'flex';
    nyanTreeTab.style.display = gameState.rebirths > 0 ? 'flex' : 'none';

    // Check if any secret skins have been unlocked
    const hasFoundSecrets = SKINS_DATA.some(s => s.secret && gameState.ownedSkins.includes(s.id));
    easterEggsTab.style.display = hasFoundSecrets ? 'flex' : 'none';
}

export function updateDisplay() {
    coinCountEl.innerHTML = formatNumber(gameState.coins);
    cpsCountEl.innerHTML = formatNumber(calculateTotalCPS(gameState), true);

    if (gameState.isWordMode) {
        document.querySelector("#rebirth-info-main").innerHTML = gameState.wordModeText.rebirthInfo;
        document.querySelector("#cps-boost-display").textContent = gameState.wordModeText.boosts;
        document.querySelector("#npc-boost-display").textContent = gameState.wordModeText.boosts;
        rebirthBtn.innerHTML = gameState.wordModeText.rebirthButton;
    } else {
        document.querySelector("#rebirth-info-main").innerHTML = `Rebirths: <span id="rebirth-count">${gameState.rebirths}</span> | Rebirth Points: <span id="rebirth-points-display">${gameState.rebirthPoints}</span>`;
        const boostPercentage = (getGlobalMultiplier(gameState) - 1) * 100;
        document.querySelector("#cps-boost-display").textContent = `${boostPercentage.toFixed(2)}%`;
        document.querySelector("#npc-boost-display").textContent = `${boostPercentage.toFixed(2)}%`;
        rebirthBtn.innerHTML = `Rebirth`;
    }
    updateTabVisibility(); // MODIFIED: Call the renamed function
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
        ownedEl.textContent = gameState.isWordMode ? gameState.wordModeText.owned : owned;

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
        costEl.innerHTML = gameState.isWordMode ? gameState.wordModeText.cost : `Cost: ${formatNumber(totalCost)}`;

        const powerEl = itemEl.querySelector('.upgrade-power');
        if (powerEl) {
            if (gameState.isWordMode) {
                powerEl.innerHTML = gameState.wordModeText.power;
            } else {
                const totalPower = upgrade.power * amountToBuy;
                const powerType = upgrade.type === 'click' ? 'NPC' : 'CPS';
                powerEl.innerHTML = `+${formatNumber(totalPower)} ${powerType}`;
            }
        }
        
        const contributionEl = itemEl.querySelector('.upgrade-contribution');
        if (contributionEl && !gameState.isWordMode) {
            const totalContribution = upgrade.power * owned;
            const powerType = upgrade.type === 'click' ? 'NPC' : 'CPS';
            contributionEl.innerHTML = `Total: +${formatNumber(totalContribution)} ${powerType}`;
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
        if (gameState.rebirths < (upgrade.rebirthUnlock || 0)) {
            return;
        }

        const owned = gameState.upgrades[upgrade.id]?.owned || 0;
        const itemEl = document.createElement('div');
        itemEl.className = 'upgrade-item';
        itemEl.dataset.id = upgrade.id;

        itemEl.innerHTML = `
            <div class="upgrade-header">
                <span class="upgrade-name">${gameState.isWordMode ? gameState.wordModeText.upgradeNames : upgrade.name}</span>
                <span class="upgrade-owned">${owned}</span>
            </div>
            <p class="upgrade-desc">${gameState.isWordMode ? gameState.wordModeText.descriptions : upgrade.description}</p>
            <div class="upgrade-info">
                <span class="upgrade-cost">Cost: ...</span>
                <span class="upgrade-power">${gameState.isWordMode ? gameState.wordModeText.power : (upgrade.type === 'click' ? `+${formatNumber(upgrade.power)} NPC` : `+${formatNumber(upgrade.power)} CPS`)}</span>
            </div>
            <div class="upgrade-contribution"></div>
        `;
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
    const visibleSkins = getVisibleShopSkins();
    const selectedSkin = visibleSkins[currentSkinIndex];
    if (!selectedSkin) return;

    const isUnlocked = gameState.rebirths >= selectedSkin.rebirthUnlock;
    const isEquipped = gameState.currentSkin === selectedSkin.id;
    const displayName = !isUnlocked && selectedSkin.secretName ? selectedSkin.secretName : selectedSkin.name;

    skinDetailsPanel.innerHTML = `
        <h4>${gameState.isWordMode ? gameState.wordModeText.skinName : displayName}</h4>
        <p>${gameState.isWordMode ? gameState.wordModeText.descriptions : (isUnlocked ? selectedSkin.description : '???')}</p>
        ${isUnlocked && selectedSkin.bonus && !gameState.isWordMode ? `<p><b>Passive Bonus:</b> +${((selectedSkin.bonus.value - 1) * 100).toFixed(1)}% Global Multiplier</p>` : ''}
        ${!isUnlocked && !gameState.isWordMode ? `<p>Requires ${selectedSkin.rebirthUnlock} Rebirths to unlock.</p>` : ''}
        ${!gameState.isWordMode ? `<p style="font-size: 0.8em; opacity: 0.7;">(Bonuses from all unlocked skins are always active)</p>` : ''}
    `;

    if (isEquipped) {
        shopBuyBtn.innerHTML = gameState.isWordMode ? gameState.wordModeText.shopButton : 'Equipped';
        shopBuyBtn.disabled = true;
    } else if (isUnlocked) {
        shopBuyBtn.innerHTML = gameState.isWordMode ? gameState.wordModeText.shopButton : (selectedSkin.action === 'fight' ? 'Fight?' : 'Equip');
        shopBuyBtn.disabled = false;
    } else {
        shopBuyBtn.innerHTML = gameState.isWordMode ? gameState.wordModeText.shopButton : (selectedSkin.secretName ? '???' : `Locked`);
        shopBuyBtn.disabled = true;
    }
}

export function navigateCarousel(direction) {
    const visibleSkins = getVisibleShopSkins();
    currentSkinIndex = (currentSkinIndex + direction + visibleSkins.length) % visibleSkins.length;
    updateCarouselDisplay();
}

export function handleShopAction() {
    const visibleSkins = getVisibleShopSkins();
    const selectedSkin = visibleSkins[currentSkinIndex];
    if (!selectedSkin) return;

    const isUnlocked = gameState.rebirths >= selectedSkin.rebirthUnlock;

    if (isUnlocked && gameState.currentSkin !== selectedSkin.id) {
        if (selectedSkin.action === 'fight') {
            alert("The fight is not yet ready.");
        } else {
            playSfx('skinBuy');
            updateSkinAndMode(selectedSkin.id);
            saveGameCallback(true); // MODIFIED: Manually save when equipping a skin.
        }
    }
    
    updateShopDetailsAndButton();
}

export function renderShop() {
    const visibleSkins = getVisibleShopSkins();
    skinCarouselTrack.innerHTML = '';
    visibleSkins.forEach((skin, index) => {
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

    // --- ADDED: Touch swipe functionality for the shop carousel ---
    let touchStartX = 0;
    let touchEndX = 0;
    const carouselViewport = document.getElementById('skin-carousel-viewport');

    const handleSwipe = () => {
        const threshold = 50; // Minimum swipe distance in pixels
        if (touchEndX < touchStartX - threshold) {
            navigateCarousel(1); // Swiped left
        }
        if (touchEndX > touchStartX + threshold) {
            navigateCarousel(-1); // Swiped right
        }
    };

    carouselViewport.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carouselViewport.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    // --- END: Touch swipe functionality ---
    
    currentSkinIndex = visibleSkins.findIndex(s => s.id === gameState.currentSkin);
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
        categoryTitle.textContent = gameState.isWordMode ? gameState.wordModeText.category : categoryName;
        categoryDiv.appendChild(categoryTitle);

        const gridLayout = document.createElement('div');
        gridLayout.className = 'achievements-grid-layout';

        Object.keys(category).forEach(id => {
            const achievement = category[id];
            if (achievement.hidden) return; 

            const card = document.createElement('div');
            card.className = 'achievement-card';
            card.dataset.id = id;
            
            const isUnlocked = gameState.unlockedAchievements.includes(id);

            if (isUnlocked) {
                card.classList.add('unlocked');
            } else {
                card.classList.add('locked');
            }

            if (achievement.isClickable && isUnlocked) {
                card.classList.add('clickable');
            }

            let titleText, descText;
            if (gameState.isWordMode) {
                titleText = gameState.wordModeText.achievementName;
                descText = gameState.wordModeText.descriptions;
            } else {
                titleText = isUnlocked ? achievement.name : '??????';
                descText = isUnlocked ? achievement.description : 'Keep playing to unlock!';
            }

            let progressHTML = '';
            if (!isUnlocked && achievement.progress && typeof achievement.progress === 'function') {
                const progressValue = Math.min(achievement.progress(gameState), 1);
                progressHTML = `
                    <div class="achievement-progress-bar">
                        <div class="achievement-progress-bar-inner" style="width: ${progressValue * 100}%"></div>
                    </div>
                `;
            }

            card.innerHTML = `
                <img src="assets/icons/trophy.png" alt="Trophy" class="achievement-card-icon">
                <div class="achievement-card-text">
                    <h4>${titleText}</h4>
                    <p>${descText}</p>
                    ${progressHTML}
                </div>
            `;
            gridLayout.appendChild(card);
        });

        categoryDiv.appendChild(gridLayout);
        achievementsContent.appendChild(categoryDiv);
    });
}

export function renderEasterEggs() {
    const contentEl = document.getElementById('easter-eggs-content');
    contentEl.innerHTML = '';

    const unlockedSecretSkins = SKINS_DATA.filter(s => s.secret && gameState.ownedSkins.includes(s.id));

    if (unlockedSecretSkins.length === 0) {
        contentEl.innerHTML = '<p style="text-align: center; opacity: 0.8;">No secrets found yet. Keep exploring!</p>';
        return;
    }

    unlockedSecretSkins.forEach(skin => {
        const card = document.createElement('div');
        card.className = 'achievement-card unlocked';
        card.dataset.skinId = skin.id;

        const isEquipped = gameState.currentSkin === skin.id;
        const actionText = isEquipped ? 'Equipped' : 'Equip';

        card.innerHTML = `
            <img src="${skin.image}" alt="${skin.name}" class="achievement-card-icon">
            <div class="achievement-card-text">
                <h4>${skin.name}</h4>
                <p>${skin.description}</p>
            </div>
            <button class="btn easter-egg-equip-btn" ${isEquipped ? 'disabled' : ''}>${actionText}</button>
        `;
        contentEl.appendChild(card);
    });
}

export function renderStats() {
    const { stats } = gameState;
    const time = new Date(stats.timePlayed * 1000).toISOString().substr(11, 8);

    statsContent.innerHTML = `
        <div class="stat-item">
            <div class="stat-label">Time Played</div>
            <div class="stat-value">${time}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Total Clicks</div>
            <div class="stat-value">${formatNumber(gameState.totalClicks)}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Total Coins Earned (All Time)</div>
            <div class="stat-value">${formatNumber(stats.totalCoinsEarned)}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Coins from Clicks</div>
            <div class="stat-value">${formatNumber(stats.handmadeCoins)}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Total Rebirths</div>
            <div class="stat-value">${formatNumber(stats.rebirths)}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Golden Poptarts Clicked</div>
            <div class="stat-value">${formatNumber(stats.goldenPoptartsClicked)}</div>
        </div>
    `;
}


export function showAchievement(title, desc) {
    document.getElementById('achievement-title').textContent = title;
    document.getElementById('achievement-desc').textContent = desc;
    achievementToast.classList.add('show');
    setTimeout(() => { achievementToast.classList.remove('show'); }, 4000);
}
