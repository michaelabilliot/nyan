import {
    gameState, T, getDefaultGameState, BASE_REBIRTH_COST, MULTIPLIERS
} from './state.js';
import {
    calculateClickPower, calculateTotalCPS, getRebirthCost
} from './core.js';
import {
    updateDisplay, renderUpgrades, showAchievement, formatNumber, renderShop, updateUpgradeStyles, renderAchievements, navigateCarousel, handleShopAction
} from './ui.js';
import { renderNyanTree, setupNyanTreePanning } from './nyanTree.js';
import { ACHIEVEMENTS_DATA, SKINS_DATA, UPGRADES_DATA, NYAN_TREE_UPGRADES } from './data.js';
import { initAudio, playSfx, switchMusic, updateMusicVolume, setMusicEnabled, pauseAllAudio, resumeAllAudio } from './audio.js';

let animationFrameId = null;

function showModal(modal) {
    modal.style.display = 'flex';
}

function hideModal(modal) {
    modal.style.display = 'none';
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const nyanCatImage = document.getElementById('nyan-cat-image');
    const gameContainer = document.getElementById('game-container');
    const nyanTreeScreen = document.getElementById('nyan-tree-screen');
    const returnToGameBtn = document.getElementById('return-to-game-btn');
    const nyanTreeTab = document.getElementById('nyan-tree-tab');
    const rebirthBtn = document.getElementById('rebirth-btn');
    const nyanCatContainer = document.getElementById('nyan-cat-container');
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
    const achievementsTab = document.getElementById('achievements-tab');
    const achievementsModal = document.getElementById('achievements-modal');
    const transitionOverlay = document.getElementById('transition-overlay');

    // Settings elements
    const musicVolumeSlider = document.getElementById('music-volume-slider');
    const sfxVolumeSlider = document.getElementById('sfx-volume-slider');
    const sfxToggle = document.getElementById('sfx-toggle');
    const musicToggle = document.getElementById('music-toggle');
    const devModeToggle = document.getElementById('dev-mode-toggle');
    const devModeCheats = document.getElementById('dev-mode-cheats');
    const darkModeToggle = document.getElementById('dark-mode-toggle');

    // Shop elements
    const shopBuyBtn = document.getElementById('shop-buy-btn');
    const skinNavLeft = document.getElementById('skin-nav-left');
    const skinNavRight = document.getElementById('skin-nav-right');

    const addCoinsCheat = document.getElementById('add-coins-cheat');
    const add1bCoinsCheat = document.getElementById('add-1b-coins-cheat');
    const add1tCoinsCheat = document.getElementById('add-1t-coins-cheat');
    const add1qCoinsCheat = document.getElementById('add-1q-coins-cheat');
    const addRebirthPointsCheat = document.getElementById('add-rebirth-points-cheat');
    const get249UpgradesCheat = document.getElementById('get-249-upgrades-cheat');
    const unlockAllAchievementsCheat = document.getElementById('unlock-all-achievements-cheat');
    const maxNyanTreeCheat = document.getElementById('max-nyan-tree-cheat');
    const addRebirthsCheat = document.getElementById('add-rebirths-cheat');


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
        playSfx('click');
        const clickPower = calculateClickPower(gameState);
        T({ 
            totalClicks: gameState.totalClicks + 1,
            coins: gameState.coins + clickPower
        });

        const numberEl = document.createElement('div');
        numberEl.className = 'floating-number';
        numberEl.innerHTML = `+${formatNumber(clickPower, true)}`;
        document.body.appendChild(numberEl);
        numberEl.style.left = `${event.clientX - numberEl.offsetWidth / 2}px`;
        numberEl.style.top = `${event.clientY - numberEl.offsetHeight / 2}px`;
        setTimeout(() => numberEl.remove(), 1200);

        checkAchievements();
    }

    function tick() {
        T({ ...gameState, coins: gameState.coins + calculateTotalCPS(gameState) / 10 });
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
                `Rebirthing will grant you ${pointsGained} Rebirth Point(s). Your current run will reset. Proceed?`,
                (confirmed) => {
                    if (confirmed) {
                        runRebirthAnimation(pointsGained);
                    }
                }
            );
        } else {
            T({ ...gameState, triedRebirthEarly: true });
            showCustomModal('Cannot Rebirth', `You need at least ${formatNumber(cost)} coins to rebirth!`, null, false);
        }
    }

    // MODIFIED: Corrected animation sequence and music timing
    function runRebirthAnimation(pointsGained) {
        const statsDisplay = document.getElementById('stats-display');
        const rightPanel = document.getElementById('right-panel');
        const nyanCat = document.getElementById('nyan-cat-container');
        const slideOutContainer = document.getElementById('slide-out-container');

        stopAnimation(); 
        switchMusic(null, 800); // Fade out main music quickly

        setTimeout(() => statsDisplay.classList.add('fade-out'), 0);
        setTimeout(() => rightPanel.classList.add('fade-out'), 200);
        setTimeout(() => nyanCat.classList.add('fade-out'), 400);
        setTimeout(() => slideOutContainer.classList.add('fade-out'), 100);
        setTimeout(() => rainbowContainer.classList.add('fade-out'), 400);
        
        setTimeout(() => transitionOverlay.classList.add('active'), 800);

        setTimeout(() => {
            T({ 
                ...gameState, 
                rebirthPoints: gameState.rebirthPoints + pointsGained,
                isRebirthing: true,
            });
            showNyanTreeScreen();

            statsDisplay.classList.remove('fade-out');
            rightPanel.classList.remove('fade-out');
            nyanCat.classList.remove('fade-out');
            slideOutContainer.classList.remove('fade-out');
            rainbowContainer.classList.remove('fade-out');
        }, 1800); 
    }

    function showNyanTreeScreen() {
        renderNyanTree();
        gameContainer.style.display = 'none';
        nyanTreeScreen.style.display = 'flex'; 

        switchMusic('nyanTree', 2443);
        
        setTimeout(() => {
            const treeHeader = document.getElementById('nyan-tree-header');
            const treeWrapper = document.getElementById('nyan-tree-wrapper');
            const treeFooter = document.getElementById('nyan-tree-footer');
            
            setTimeout(() => treeWrapper.classList.add('fade-in'), 0);
            setTimeout(() => treeFooter.classList.add('fade-in'), 800);
            setTimeout(() => treeHeader.classList.add('fade-in'), 1500);

            nyanTreeScreen.classList.add('show');
            transitionOverlay.classList.remove('active');
        }, 50);
    }

    function hideNyanTreeScreen() {
        gameContainer.style.display = 'flex';
        nyanTreeScreen.classList.remove('show');
        setTimeout(() => {
            if (!nyanTreeScreen.classList.contains('show')) {
                 nyanTreeScreen.style.display = 'none';
                 document.getElementById('nyan-tree-header').classList.remove('fade-in');
                 document.getElementById('nyan-tree-wrapper').classList.remove('fade-in');
                 document.getElementById('nyan-tree-footer').classList.remove('fade-in');
            }
        }, 500);
    }

    function finalizeRebirth() {
        startAnimation();
        switchMusic('main');
        const freshState = getDefaultGameState();
        const newRebirthCount = gameState.rebirths + 1;

        const newlyUnlockedSkins = SKINS_DATA
            .filter(skin => newRebirthCount >= skin.rebirthUnlock && !gameState.ownedSkins.includes(skin.id))
            .map(skin => skin.id);

        const preservedState = {
            rebirths: newRebirthCount,
            rebirthPoints: gameState.rebirthPoints,
            isRebirthing: false,
            nyanTreeUpgrades: gameState.nyanTreeUpgrades,
            settings: gameState.settings,
            ownedSkins: [...gameState.ownedSkins, ...newlyUnlockedSkins],
            currentSkin: gameState.currentSkin,
            unlockedAchievements: gameState.unlockedAchievements,
            totalClicks: gameState.totalClicks,
        };

        T({ ...freshState, ...preservedState });
        
        checkAchievements();
        
        T({ ...gameState, coins: 0 });
        
        renderUpgrades();
        updateDisplay();
        hideNyanTreeScreen();
    }

    returnToGameBtn.addEventListener('click', () => {
        if (gameState.isRebirthing) {
            finalizeRebirth();
        } else {
            startAnimation();
            switchMusic('main');
            hideNyanTreeScreen();
        }
    });
    
    function cycleMultiplier() {
        const newIndex = (gameState.purchaseMultiplierIndex + 1) % MULTIPLIERS.length;
        T({ ...gameState, purchaseMultiplierIndex: newIndex });
        multiplierBtn.textContent = `${MULTIPLIERS[newIndex]}x`;
        updateUpgradeStyles();
    }

    function checkAchievements() {
        Object.keys(ACHIEVEMENTS_DATA).forEach(category => {
            Object.keys(ACHIEVEMENTS_DATA[category]).forEach(id => {
                if (!gameState.unlockedAchievements.includes(id)) {
                    if (typeof ACHIEVEMENTS_DATA[category][id].condition === 'function') {
                        if (ACHIEVEMENTS_DATA[category][id].condition(gameState)) {
                            T({
                                ...gameState,
                                unlockedAchievements: [...gameState.unlockedAchievements, id],
                                coins: gameState.coins + (ACHIEVEMENTS_DATA[category][id].reward || 0),
                            });
                            showAchievement(ACHIEVEMENTS_DATA[category][id].name, ACHIEVEMENTS_DATA[category][id].description);
                        }
                    }
                }
            });
        });
    }

    function saveGame() {
        localStorage.setItem('nyanClickerSaveV5', JSON.stringify(gameState));
    }

    // MODIFIED: Robust loading to prevent errors with old saves
    function loadGame() {
        const savedStateJSON = localStorage.getItem('nyanClickerSaveV5');
        const defaultState = getDefaultGameState();
        
        if (savedStateJSON) {
            const loadedState = JSON.parse(savedStateJSON);
            // Deep merge settings to prevent losing new properties
            const finalSettings = { ...defaultState.settings, ...loadedState.settings };
            const finalState = { ...defaultState, ...loadedState, settings: finalSettings };
            T(finalState);
        } else {
            T(defaultState);
        }
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
        
        if (nyanCatImage.src.includes(currentSkinData.image.split('/').pop()) === false) {
             nyanCatImage.src = currentSkinData.image;
        }

        const particle = document.createElement('div');
        particle.className = 'rainbow-particle';

        if (currentSkinData.trailAnimation === 'scroll') {
            particle.classList.add('rainbow-particle-scrolling');
        }

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

        animationFrameId = requestAnimationFrame(animate);
    }
    
    function startAnimation() {
        if (!animationFrameId) { animate(); }
    }

    function stopAnimation() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    function startMusicOnFirstInteraction() {
        switchMusic('main');
        document.removeEventListener('mousedown', startMusicOnFirstInteraction);
        document.removeEventListener('keydown', startMusicOnFirstInteraction);
    }

    function handleWindowFocus() { resumeAllAudio(); }
    function handleWindowBlur() { pauseAllAudio(); }

    function init() {
        loadGame();
        initAudio(); 
        
        document.addEventListener('mousedown', startMusicOnFirstInteraction);
        document.addEventListener('keydown', startMusicOnFirstInteraction);
        window.addEventListener('focus', handleWindowFocus);
        window.addEventListener('blur', handleWindowBlur);

        nyanCatImage.addEventListener('click', handleCatClick);
        rebirthBtn.addEventListener('click', handleRebirth);
        multiplierBtn.addEventListener('click', cycleMultiplier);
        resetGameBtn.addEventListener('click', resetGame);
        shopBtn.addEventListener('click', () => { renderShop(); showModal(shopModal); });
        nyanTreeTab.addEventListener('click', () => {
            stopAnimation();
            T({ ...gameState, isRebirthing: false });
            showNyanTreeScreen();
        });
        settingsTab.addEventListener('click', () => { showModal(settingsModal); });
        achievementsTab.addEventListener('click', () => { renderAchievements(); showModal(achievementsModal); });
        
        document.querySelectorAll('.close-modal-x').forEach(btn => btn.addEventListener('click', (e) => {
            hideModal(e.target.closest('.modal-overlay'));
        }));
        
        confirmModalYes.addEventListener('click', () => { if (confirmCallback) confirmCallback(true); hideModal(confirmModal); });
        confirmModalNo.addEventListener('click', () => { if (confirmCallback) confirmCallback(false); hideModal(confirmModal); });
        confirmModalOk.addEventListener('click', () => hideModal(confirmModal));

        musicVolumeSlider.addEventListener('input', (e) => {
            T({ settings: { ...gameState.settings, musicVolume: parseFloat(e.target.value) / 100 } });
            updateMusicVolume();
        });
        sfxVolumeSlider.addEventListener('input', (e) => T({ settings: { ...gameState.settings, sfxVolume: parseFloat(e.target.value) / 100 } }));
        sfxToggle.addEventListener('change', (e) => T({ settings: { ...gameState.settings, sfx: e.target.checked } }));
        musicToggle.addEventListener('change', (e) => {
            T({ settings: { ...gameState.settings, music: e.target.checked } });
            setMusicEnabled(e.target.checked);
        });
        darkModeToggle.addEventListener('change', (e) => {
            const newTheme = e.target.checked ? 'dark' : 'light';
            T({ settings: { ...gameState.settings, theme: newTheme } });
            applyTheme(newTheme);
        });
        devModeToggle.addEventListener('change', (e) => {
            T({ settings: { ...gameState.settings, devMode: e.target.checked } });
            devModeCheats.style.display = e.target.checked ? 'grid' : 'none';
        });

        addCoinsCheat.addEventListener('click', () => { T({ coins: gameState.coins + 1e6 }); });
        add1bCoinsCheat.addEventListener('click', () => { T({ coins: gameState.coins + 1e9 }); });
        add1tCoinsCheat.addEventListener('click', () => { T({ coins: gameState.coins + 1e12 }); });
        add1qCoinsCheat.addEventListener('click', () => { T({ coins: gameState.coins + 1e15 }); });
        addRebirthPointsCheat.addEventListener('click', () => { T({ rebirthPoints: gameState.rebirthPoints + 10 }); });
        addRebirthsCheat.addEventListener('click', () => { T({ rebirths: gameState.rebirths + 5 }); });
        
        get249UpgradesCheat.addEventListener('click', () => {
            const newUpgrades = { ...gameState.upgrades };
            UPGRADES_DATA.forEach(upgrade => {
                newUpgrades[upgrade.id] = { owned: 249 };
            });
            T({ upgrades: newUpgrades });
            renderUpgrades();
        });

        unlockAllAchievementsCheat.addEventListener('click', () => {
            const allAchievementIds = [];
            Object.values(ACHIEVEMENTS_DATA).forEach(category => {
                Object.keys(category).forEach(id => allAchievementIds.push(id));
            });
            T({ unlockedAchievements: allAchievementIds });
        });

        maxNyanTreeCheat.addEventListener('click', () => {
            const maxedTree = {};
            NYAN_TREE_UPGRADES.forEach(upgrade => {
                maxedTree[upgrade.id] = upgrade.maxLevel;
            });
            T({ nyanTreeUpgrades: maxedTree });
        });
        
        skinNavLeft.addEventListener('click', () => navigateCarousel(-1));
        skinNavRight.addEventListener('click', () => navigateCarousel(1));
        shopBuyBtn.addEventListener('click', handleShopAction);
        
        setupNyanTreePanning();
        renderUpgrades();
        updateDisplay();
        
        applyTheme(gameState.settings.theme);
        darkModeToggle.checked = gameState.settings.theme === 'dark';
        musicVolumeSlider.value = gameState.settings.musicVolume * 100;
        sfxVolumeSlider.value = gameState.settings.sfxVolume * 100;
        sfxToggle.checked = gameState.settings.sfx;
        musicToggle.checked = gameState.settings.music;
        devModeToggle.checked = gameState.settings.devMode;
        devModeCheats.style.display = gameState.settings.devMode ? 'grid' : 'none';
        
        multiplierBtn.textContent = `${MULTIPLIERS[gameState.purchaseMultiplierIndex]}x`;

        setInterval(tick, 100);
        setInterval(saveGame, 5000);
        startAnimation();

        console.log("Nyan Cat Clicker Initialized and Patched!");
    }

    init();
});