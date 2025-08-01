import {
    gameState, T, getDefaultGameState, BASE_REBIRTH_COST, MULTIPLIERS
} from './state.js';
import {
    calculateClickPower, calculateTotalCPS, getRebirthCost
} from './core.js';
import {
    updateDisplay, renderUpgrades, showAchievement, formatNumber, renderShop, updateUpgradeStyles, renderAchievements
} from './ui.js';
import { renderNyanTree, setupNyanTreePanning } from './nyanTree.js';
import { ACHIEVEMENTS_DATA, SKINS_DATA, PLANET_DATA } from './data.js';

export function changePlanet(planetId) {
    if (!PLANET_DATA[planetId]) return;
    T({ ...gameState, currentPlanet: planetId });
    renderUpgrades();
}

function showModal(modal) {
    modal.style.display = 'flex';
}

function hideModal(modal) {
    modal.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    const nyanTreeScreen = document.getElementById('nyan-tree-screen');
    const returnToGameBtn = document.getElementById('return-to-game-btn');
    const nyanTreeTab = document.getElementById('nyan-tree-tab');
    const rebirthBtn = document.getElementById('rebirth-btn');
    const nyanCatContainer = document.getElementById('nyan-cat-container');
    const nyanCatImage = document.getElementById('nyan-cat-image');
    const multiplierBtn = document.getElementById('multiplier-btn');
    const shopBtn = document.getElementById('shop-btn');
    const rainbowContainer = document.getElementById('rainbow-container');
    const resetGameBtn = document.getElementById('reset-game-btn');
    const shopModal = document.getElementById('shop-modal');
    const settingsModal = document.getElementById('settings-modal');
    const confirmModal = document.getElementById('confirm-modal');
    const confirmModalTitle = document.getElementById('confirm-modal-title');
    const confirmModalMessage = document.getElementById('confirm-modal-message');
    const confirmModalYes = document.getElementById('confirm-modal-yes');
    const confirmModalNo = document.getElementById('confirm-modal-no');
    const confirmModalOk = document.getElementById('confirm-modal-ok');
    const settingsTab = document.getElementById('settings-tab');
    const volumeSlider = document.getElementById('volume-slider');
    const sfxToggle = document.getElementById('sfx-toggle');
    const musicToggle = document.getElementById('music-toggle');
    const devModeToggle = document.getElementById('dev-mode-toggle');
    const devModeCheats = document.getElementById('dev-mode-cheats');
    const addCoinsCheat = document.getElementById('add-coins-cheat');
    const addRebirthPointsCheat = document.getElementById('add-rebirth-points-cheat');
    const achievementsTab = document.getElementById('achievements-tab');
    const achievementsModal = document.getElementById('achievements-modal');

    let confirmCallback = null;

    function showCustomModal(title, message, callback, isConfirmation = true) {
        confirmModalTitle.textContent = title;
        confirmModalMessage.innerHTML = message;
        confirmCallback = callback;

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
    
    function handleCatClick(event) {
        const clickPower = calculateClickPower();
        T({ ...gameState, coins: gameState.coins + clickPower });

        const numberEl = document.createElement('div');
        numberEl.className = 'floating-number';
        // FIX: Use formatNumber to get the styled decimal point.
        numberEl.innerHTML = `+${formatNumber(clickPower, true)}`;
        document.body.appendChild(numberEl);
        numberEl.style.left = `${event.clientX - numberEl.offsetWidth / 2}px`;
        numberEl.style.top = `${event.clientY - numberEl.offsetHeight / 2}px`;
        setTimeout(() => numberEl.remove(), 1200);

        checkAchievements();
    }

    function tick() {
        T({ ...gameState, coins: gameState.coins + calculateTotalCPS() / 10 });
        updateDisplay();
        updateUpgradeStyles();
        checkAchievements();
    }
    
    function handleRebirth() {
        const cost = getRebirthCost();
        if (gameState.coins >= cost) {
            const pointsGained = Math.max(1, Math.floor(Math.log10(gameState.coins / cost) * 3));
            showCustomModal(
                'Confirm Rebirth',
                `Rebirthing will grant you ${pointsGained} Rebirth Point(s) to spend in the Nyan Tree. Your current run will reset AFTER you leave the tree. Proceed?`,
                (confirmed) => {
                    if (confirmed) {
                        // FIX: Set the isRebirthing flag to true before opening the tree.
                        T({ 
                            ...gameState, 
                            rebirthPoints: gameState.rebirthPoints + pointsGained,
                            isRebirthing: true,
                        });
                        showNyanTreeScreen();
                    }
                }
            );
        } else {
            showCustomModal('Cannot Rebirth', `You need at least ${formatNumber(cost)} coins to rebirth!`, null, false);
        }
    }

    function showNyanTreeScreen() {
        renderNyanTree();
        gameContainer.style.opacity = '0';
        nyanTreeScreen.style.display = 'flex'; 
        requestAnimationFrame(() => { 
            nyanTreeScreen.classList.add('show');
        });
    }

    function hideNyanTreeScreen() {
        gameContainer.style.opacity = '1';
        nyanTreeScreen.classList.remove('show');
        setTimeout(() => {
            if (!nyanTreeScreen.classList.contains('show')) {
                 nyanTreeScreen.style.display = 'none';
            }
        }, 500);
    }

    // MODIFIED: Logic updated to fix post-rebirth coin bug.
    function finalizeRebirth() {
        const freshState = getDefaultGameState();
        const preservedState = {
            rebirths: gameState.rebirths + 1,
            rebirthPoints: 0,
            isRebirthing: false,
            nyanTreeUpgrades: gameState.nyanTreeUpgrades,
            settings: gameState.settings,
            ownedSkins: gameState.ownedSkins,
            currentSkin: gameState.currentSkin,
            unlockedPlanets: gameState.unlockedPlanets,
            unlockedAchievements: gameState.unlockedAchievements,
        };

        // Combine them
        T({ ...freshState, ...preservedState });
        
        // This will unlock 'first_rebirth' and add its coin reward.
        checkAchievements();
        
        // NOW, override the coins back to the default (0), keeping the new achievement.
        T({ ...gameState, coins: freshState.coins });
        
        renderUpgrades();
        updateDisplay();
        hideNyanTreeScreen();
    }

    returnToGameBtn.addEventListener('click', finalizeRebirth);
    
    function cycleMultiplier() {
        const newIndex = (gameState.purchaseMultiplierIndex + 1) % MULTIPLIERS.length;
        T({ ...gameState, purchaseMultiplierIndex: newIndex });
        multiplierBtn.textContent = `${MULTIPLIERS[newIndex]}x`;
        updateUpgradeStyles();
    }

    function checkAchievements() {
        Object.keys(ACHIEVEMENTS_DATA).forEach(id => {
            if (!gameState.unlockedAchievements.includes(id)) {
                if (ACHIEVEMENTS_DATA[id].condition(gameState)) {
                    T({
                        ...gameState,
                        unlockedAchievements: [...gameState.unlockedAchievements, id],
                        coins: gameState.coins + (ACHIEVEMENTS_DATA[id].reward || 0),
                    });
                    showAchievement(ACHIEVEMENTS_DATA[id].name, ACHIEVEMENTS_DATA[id].description);
                }
            }
        });
    }

    function saveGame() {
        localStorage.setItem('nyanClickerSaveV5', JSON.stringify(gameState));
    }

    function loadGame() {
        const savedState = localStorage.getItem('nyanClickerSaveV5');
        const loadedState = savedState ? JSON.parse(savedState) : {};
        T({ ...getDefaultGameState(), ...loadedState });
    }

    function resetGame() {
        showCustomModal(
            'Reset Game',
            "Are you sure? This will wipe all your progress!",
            (confirmed) => {
                if (confirmed) {
                    localStorage.removeItem('nyanClickerSaveV5');
                    T(getDefaultGameState()); 
                    location.reload();
                }
            }
        );
    }
    
    let time = 0;
    function animate() {
        time += 0.05;
        nyanCatContainer.style.transform = `translateY(${Math.sin(time * 0.5) * 20}px)`;

        const currentSkinData = SKINS_DATA.find(s => s.id === gameState.currentSkin) || SKINS_DATA[0];
        const particle = document.createElement('div');
        particle.className = 'rainbow-particle';
        particle.style.backgroundImage = `url('${currentSkinData.trail}')`;
        particle.style.height = `${currentSkinData.trailHeight}px`;

        const catRect = nyanCatImage.getBoundingClientRect();
        const containerRect = document.getElementById('main-area').getBoundingClientRect();
        
        const startX = catRect.left - containerRect.left + (catRect.width / 2);
        const startY = catRect.top - containerRect.top + (catRect.height / 2) - (currentSkinData.trailHeight / 2);

        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;

        rainbowContainer.appendChild(particle);
        particle.animate([{ transform: 'translateX(0)' }, { transform: `translateX(-${window.innerWidth * 0.7}px)` }], { duration: 3000, easing: 'linear' });
        setTimeout(() => particle.remove(), 3000);

        requestAnimationFrame(animate);
    }
    
    function init() {
        loadGame();
        
        nyanCatImage.addEventListener('click', handleCatClick);
        rebirthBtn.addEventListener('click', handleRebirth);
        multiplierBtn.addEventListener('click', cycleMultiplier);
        resetGameBtn.addEventListener('click', resetGame);
        shopBtn.addEventListener('click', () => { renderShop(); showModal(shopModal); });
        // FIX: When opening the tree from the tab, ensure the 'isRebirthing' flag is false.
        nyanTreeTab.addEventListener('click', () => {
            T({ ...gameState, isRebirthing: false });
            showNyanTreeScreen();
        });
        settingsTab.addEventListener('click', () => { showModal(settingsModal); });
        // ADDED: Listener for the new achievements tab.
        achievementsTab.addEventListener('click', () => {
            renderAchievements();
            showModal(achievementsModal);
        });
        document.querySelectorAll('.close-modal-btn').forEach(btn => btn.addEventListener('click', (e) => hideModal(e.target.closest('.modal-overlay'))));
        
        confirmModalYes.addEventListener('click', () => { if (confirmCallback) confirmCallback(true); hideModal(confirmModal); });
        confirmModalNo.addEventListener('click', () => { if (confirmCallback) confirmCallback(false); hideModal(confirmModal); });
        confirmModalOk.addEventListener('click', () => hideModal(confirmModal));

        volumeSlider.addEventListener('input', (e) => T({ ...gameState, settings: { ...gameState.settings, volume: parseFloat(e.target.value) / 100 } }));
        sfxToggle.addEventListener('change', (e) => T({ ...gameState, settings: { ...gameState.settings, sfx: e.target.checked } }));
        musicToggle.addEventListener('change', (e) => T({ ...gameState, settings: { ...gameState.settings, music: e.target.checked } }));
        devModeToggle.addEventListener('change', (e) => {
            T({ ...gameState, settings: { ...gameState.settings, devMode: e.target.checked } });
            devModeCheats.style.display = e.target.checked ? 'block' : 'none';
        });
        addCoinsCheat.addEventListener('click', () => { T({ ...gameState, coins: gameState.coins + 1e6 }); });
        addRebirthPointsCheat.addEventListener('click', () => { T({ ...gameState, rebirthPoints: gameState.rebirthPoints + 10 }); });
        
        setupNyanTreePanning();

        renderUpgrades();
        updateDisplay();
        const currentSkin = SKINS_DATA.find(s => s.id === gameState.currentSkin) || SKINS_DATA[0];
        nyanCatImage.src = currentSkin.image;
        changePlanet(gameState.currentPlanet);
        multiplierBtn.textContent = `${MULTIPLIERS[gameState.purchaseMultiplierIndex]}x`;
        volumeSlider.value = gameState.settings.volume * 100;
        sfxToggle.checked = gameState.settings.sfx;
        musicToggle.checked = gameState.settings.music;
        devModeToggle.checked = gameState.settings.devMode;
        devModeCheats.style.display = gameState.settings.devMode ? 'block' : 'none';

        setInterval(tick, 100);
        setInterval(saveGame, 5000);
        requestAnimationFrame(animate);

        console.log("Nyan Cat Clicker Initialized and Patched!");
    }

    init();
});