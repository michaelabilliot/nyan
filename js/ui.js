import { gameState, T } from './state.js';
import { calculateTotalCPS, getGlobalMultiplier, getPurchaseMultiplier, getBuildingCostDiscount } from './core.js';
import { UPGRADES_DATA, SKINS_DATA } from './data.js';
import { ACHIEVEMENTS_DATA } from './achievements.js';
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
const easterEggsTab = document.getElementById('easter-eggs-tab');
const achievementsContent = document.getElementById('achievements-content');
const shopBuyBtn = document.getElementById('shop-buy-btn');
const skinCarouselTrack = document.getElementById('skin-carousel-track');
const skinDetailsPanel = document.getElementById('skin-details-panel');
const statsContent = document.getElementById('stats-content');
const gameContainer = document.getElementById('game-container');
const boostContainer = document.getElementById('boost-container');
const confirmModal = document.getElementById('confirm-modal');
const confirmModalTitle = document.getElementById('confirm-modal-title');
const confirmModalMessage = document.getElementById('confirm-modal-message');
const confirmModalYes = document.getElementById('confirm-modal-yes');
const confirmModalNo = document.getElementById('confirm-modal-no');
const confirmModalOk = document.getElementById('confirm-modal-ok');
const boostTooltip = document.getElementById('upgrade-boost-tooltip');

let currentSkinIndex = 0;
let saveGameCallback = () => {};

// --- MOVED FROM main.js ---
export function applyTheme(theme, uiTheme) {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    
    document.body.classList.remove('theme-vaporwave', 'theme-matrix');
    if (uiTheme && uiTheme !== 'default') {
        document.body.classList.add(`theme-${uiTheme}`);
    }
}

export function spawnGoldenPoptart() {
    playSfx('boost');
    const poptart = document.createElement('div');
    poptart.className = 'golden-poptart';
    poptart.style.top = `${Math.random() * 80 + 10}%`;

    poptart.addEventListener('click', () => {
        playSfx('boostClick');
        T({
            stats: { ...gameState.stats, goldenPoptartsClicked: gameState.stats.goldenPoptartsClicked + 1 }
        });

        T({ activeBoosts: { ...gameState.activeBoosts, goldenPoptart: 2 } });
        setTimeout(() => {
            T({ activeBoosts: { ...gameState.activeBoosts, goldenPoptart: 1 } });
        }, 30000);

        poptart.remove();
    }, { once: true });

    boostContainer.appendChild(poptart);
    setTimeout(() => poptart.remove(), 10000); 
}

export function showCustomModal(title, message, callback, isConfirmation = true) {
    confirmModalTitle.textContent = title;
    confirmModalMessage.innerHTML = message;
    
    confirmModalYes.onclick = () => { if (callback) callback(true); hideModal(confirmModal); };
    confirmModalNo.onclick = () => { if (callback) callback(false); hideModal(confirmModal); };
    confirmModalOk.onclick = () => hideModal(confirmModal);


    if (isConfirmation) {
        confirmModalYes.style.display = 'inline-block';
        confirmModalNo.style.display = 'inline-block';
        confirmModalOk.style.display = 'none';
    } else {
        confirmModalYes.style.display = 'none';
        confirmModalNo.style.display = 'none';
        confirmModalOk.style.display = 'inline-block';
    }
    showModal(confirmModal);
}

export function createFloatingNumber(text, event) {
    if (gameState.isWordMode) return;

    const numberEl = document.createElement('div');
    numberEl.className = 'floating-number';
    numberEl.innerHTML = text;
    gameContainer.appendChild(numberEl);
    const containerRect = gameContainer.getBoundingClientRect();
    numberEl.style.left = `${event.clientX - containerRect.left - numberEl.offsetWidth / 2}px`;
    numberEl.style.top = `${event.clientY - containerRect.top - numberEl.offsetHeight / 2}px`;
    setTimeout(() => numberEl.remove(), 1200);
}

export function setupSettingsModal() {
    const settingsNav = document.getElementById('settings-nav');
    const settingsPanels = document.querySelectorAll('.settings-panel');
    const panelHeaders = document.querySelectorAll('.settings-panel .panel-header');

    settingsNav.addEventListener('click', (e) => {
        if (e.target.classList.contains('nav-btn')) {
            const panelId = e.target.dataset.forPanel;
            
            const currentActiveNav = settingsNav.querySelector('.active');
            if (currentActiveNav) currentActiveNav.classList.remove('active');
            e.target.classList.add('active');
            
            const currentActivePanel = document.querySelector('.settings-panel.active');
            if (currentActivePanel) currentActivePanel.classList.remove('active');
            document.getElementById(`settings-panel-${panelId}`).classList.add('active');
        }
    });

    panelHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const panel = header.parentElement;
            
            if (panel.classList.contains('active')) {
                panel.classList.remove('active');
            } else {
                settingsPanels.forEach(p => p.classList.remove('active'));
                panel.classList.add('active');
            }
        });
    });
}

// --- Tooltip Management Functions ---
export function showBoostTooltip(pipElement) {
    const upgradeItem = pipElement.closest('.upgrade-item');
    if (!upgradeItem) return;

    const upgradeId = upgradeItem.dataset.id;
    const boostIndex = parseInt(pipElement.dataset.boostIndex, 10);
    const upgrade = UPGRADES_DATA.find(u => u.id === upgradeId);
    if (!upgrade) return;

    if (pipElement.classList.contains('locked')) {
        const requiredAmount = (boostIndex + 1) * 25;
        boostTooltip.innerHTML = `Requires ${requiredAmount} of this upgrade`;
    } else {
        const cost = upgrade.baseCost * 100 * Math.pow(25, boostIndex);
        boostTooltip.innerHTML = `Cost: ${formatNumber(cost)}`;
    }

    const pipRect = pipElement.getBoundingClientRect();
    boostTooltip.style.display = 'block';

    const tooltipRect = boostTooltip.getBoundingClientRect();
    boostTooltip.style.top = `${pipRect.top - tooltipRect.height - 5}px`;
    boostTooltip.style.left = `${pipRect.left + (pipRect.width / 2) - (tooltipRect.width / 2)}px`;
}

export function hideBoostTooltip() {
    boostTooltip.style.display = 'none';
}

// --- Original ui.js functions below ---
export function setSaveGameCallback(callback) {
    saveGameCallback = callback;
}

export function showModal(modal) {
    if (modal) modal.style.display = 'flex';
}

export function hideModal(modal) {
    if (modal) modal.style.display = 'none';
}

function getVisibleShopSkins() {
    return SKINS_DATA.filter(s => !s.secret);
}

export function updateTabVisibility() {
    settingsTab.style.display = 'flex';
    statsTab.style.display = 'flex';
    nyanTreeTab.style.display = gameState.rebirths > 0 ? 'flex' : 'none';

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
    updateTabVisibility();
}

export function updateUpgradeStyles() {
    const multiplier = getPurchaseMultiplier();
    const upgradeItems = upgradesListEl.children;

    for (const itemEl of upgradeItems) {
        const upgradeId = itemEl.dataset.id;
        const upgrade = UPGRADES_DATA.find(u => u.id === upgradeId);
        if (!upgrade) continue;
        
        // BUG FIX: Create a temporary discounted version of the upgrade for all UI calculations.
        const discount = getBuildingCostDiscount();
        const discountedUpgrade = { ...upgrade, baseCost: upgrade.baseCost * discount };

        const upgradeState = gameState.upgrades[upgradeId] || { owned: 0, boosts: 0 };
        
        const ownedEl = itemEl.querySelector('.upgrade-owned');
        ownedEl.textContent = gameState.isWordMode ? gameState.wordModeText.owned : upgradeState.owned;

        let totalCost;
        let amountToBuy;

        if (multiplier === 'ALL') {
            amountToBuy = calculateMaxAffordable(discountedUpgrade, upgradeState.owned, gameState.coins);
            totalCost = calculateCostForAmount(discountedUpgrade, upgradeState.owned, amountToBuy);
        } else {
            amountToBuy = multiplier;
            totalCost = calculateCostForAmount(discountedUpgrade, upgradeState.owned, amountToBuy);
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
            const purchasedBoosts = upgradeState.boosts || 0;
            const boostMultiplier = Math.pow(1.25, purchasedBoosts);
            const totalContribution = upgrade.power * upgradeState.owned * boostMultiplier;
            const powerType = upgrade.type === 'click' ? 'NPC' : 'CPS';
            contributionEl.innerHTML = `Total: +${formatNumber(totalContribution)} ${powerType}`;
        }

        if (gameState.coins >= totalCost && amountToBuy > 0) {
            itemEl.classList.remove('disabled');
        } else {
            itemEl.classList.add('disabled');
        }
        
        const purchasedBoosts = upgradeState.boosts || 0;
        const availableBoosts = Math.floor(upgradeState.owned / 25);
        const boostPips = itemEl.querySelectorAll('.boost-pip');

        boostPips.forEach(pip => {
            const i = parseInt(pip.dataset.boostIndex, 10);
            let pipClass = 'locked';
            if (i < purchasedBoosts) {
                pipClass = 'purchased';
            } else if (i < availableBoosts) {
                pipClass = 'available';
                const cost = upgrade.baseCost * 100 * Math.pow(25, i);
                if (gameState.coins >= cost) {
                    pipClass += ' affordable';
                }
            }
            pip.className = `boost-pip ${pipClass}`;
        });
    }
}


export function renderUpgrades() {
    upgradesListEl.innerHTML = '';
    UPGRADES_DATA.forEach(upgrade => {
        if (gameState.rebirths < (upgrade.rebirthUnlock || 0)) {
            return;
        }
        if (upgrade.nyanTreeUnlock && !gameState.nyanTreeUpgrades[upgrade.nyanTreeUnlock]) {
            return;
        }

        const upgradeState = gameState.upgrades[upgrade.id] || { owned: 0, boosts: 0 };
        const itemEl = document.createElement('div');
        itemEl.className = 'upgrade-item';
        itemEl.dataset.id = upgrade.id;

        let boostPipsHTML = '';
        const availableBoosts = Math.floor(upgradeState.owned / 25);
        const purchasedBoosts = upgradeState.boosts || 0;

        for (let i = 0; i < 4; i++) {
            let pipClass = 'locked';
            if (i < purchasedBoosts) {
                pipClass = 'purchased';
            } else if (i < availableBoosts) {
                pipClass = 'available';
                const cost = upgrade.baseCost * 100 * Math.pow(25, i);
                if (gameState.coins >= cost) {
                    pipClass += ' affordable';
                }
            }
            boostPipsHTML += `<div class="boost-pip ${pipClass}" data-boost-index="${i}"></div>`;
        }

        itemEl.innerHTML = `
            <div class="upgrade-header">
                <div class="upgrade-name-container">
                    <span class="upgrade-name">${gameState.isWordMode ? gameState.wordModeText.upgradeNames : upgrade.name}</span>
                    <div class="upgrade-boosts">${boostPipsHTML}</div>
                </div>
                <span class="upgrade-owned">${upgradeState.owned}</span>
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
            saveGameCallback(true);
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

    let touchStartX = 0;
    let touchEndX = 0;
    const carouselViewport = document.getElementById('skin-carousel-viewport');

    const handleSwipe = () => {
        const threshold = 50;
        if (touchEndX < touchStartX - threshold) {
            navigateCarousel(1);
        }
        if (touchEndX > touchStartX + threshold) {
            navigateCarousel(-1);
        }
    };

    carouselViewport.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carouselViewport.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
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