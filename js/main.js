import {
    gameState, T, getDefaultGameState, BASE_REBIRTH_COST, MULTIPLIERS
} from './state.js';
import {
    calculateClickPower, calculateTotalCPS, getRebirthCost, calculateRebirthPointsGained
} from './core.js';
import {
    updateDisplay, renderUpgrades, showAchievement, renderShop, updateUpgradeStyles, 
    renderAchievements, navigateCarousel, handleShopAction, renderEasterEggs, renderStats, 
    updateTabVisibility, setSaveGameCallback, hideModal, showModal, showCustomModal, 
    createFloatingNumber, setupSettingsModal, applyTheme, spawnGoldenPoptart,
    showBoostTooltip, hideBoostTooltip
} from './ui.js';
import { renderNyanTree, setupNyanTree } from './nyanTree.js';
import { SKINS_DATA, UPGRADES_DATA, NYAN_TREE_UPGRADES } from './data.js';
import { checkAchievements, ACHIEVEMENTS_DATA } from './achievements.js';
import { initEasterEggListeners } from './easterEggs.js';
import { initAudio, playSfx, switchMusic, updateMusicVolume, setMusicEnabled, pauseAllAudio, resumeAllAudio, setUserInteracted, setGlobalMute } from './audio.js';
import { formatNumber, deepMerge } from './utils.js';
import { buyUpgrade, buyUpgradeBoost } from './upgrades.js';

// --- Module-level variables ---
let animationFrameId = null;
let wordGlitchInterval = null;
let lastTickTime = performance.now();

// --- Canvas Particle System Variables ---
let trailCanvas, trailCtx;
let particles = [];
const trailImageCache = {};

// --- DOM Element Caching ---
let nyanCatImage, nyanCatContainer, rainbowContainer, transitionOverlay, 
    achievementsContent, achievementsModal, easterEggsModal, statsModal,
    upgradesListEl, gameContainer, mainArea, statsDisplay;

const WORD_TEXTS = ["WORD.", "SHIFT.", "WHATTTT", "OKAY"];
const getWordText = () => WORD_TEXTS[Math.floor(Math.random() * WORD_TEXTS.length)];


function loadTrailImage(src) {
    if (trailImageCache[src]) {
        return trailImageCache[src];
    }
    const image = new Image();
    image.src = src;
    trailImageCache[src] = image;
    return image;
}


function animate() {
    if (gameState.isWordMode) {
        if (wordGlitchInterval === null) {
            wordGlitchInterval = setInterval(() => {
                if (nyanCatImage) {
                    nyanCatImage.style.animation = 'word-cat-glitch 0.2s ease-in-out';
                    setTimeout(() => { if (nyanCatImage) nyanCatImage.style.animation = ''; }, 200);
                }
            }, 3000);
        }
    }

    if (trailCtx) {
        trailCtx.clearRect(0, 0, trailCanvas.clientWidth, trailCanvas.clientHeight);

        const currentSkinData = SKINS_DATA.find(s => s.id === gameState.currentSkin) || SKINS_DATA.find(s => s.id === 'default');

        if (!gameState.isWordMode && currentSkinData.trail && currentSkinData.trail !== '') {
            const trailImage = loadTrailImage(currentSkinData.trail);

            if (trailImage.complete && trailImage.naturalHeight !== 0 && nyanCatImage.offsetWidth > 0) {
                const catRect = nyanCatContainer.getBoundingClientRect();
                const mainAreaRect = mainArea.getBoundingClientRect();
                
                const BASE_CAT_WIDTH = 450;
                const scale = nyanCatImage.offsetWidth / BASE_CAT_WIDTH;

                const trailHeight = (currentSkinData.trailHeight || trailImage.naturalHeight) * scale;
                const trailWidth = (trailImage.naturalWidth * (trailHeight / trailImage.naturalHeight));

                let startX, startY;
                if (currentSkinData.trailOrigin) {
                    startX = (catRect.left - mainAreaRect.left) + (currentSkinData.trailOrigin.x * scale);
                    startY = (catRect.top - mainAreaRect.top) + (currentSkinData.trailOrigin.y * scale);
                } else {
                    startX = (catRect.left - mainAreaRect.left) + (catRect.width / 2);
                    startY = (catRect.top - mainAreaRect.top) + (catRect.height / 2);
                }
                
                const trailSpeed = 10; 
                const numToSpawn = Math.ceil(trailSpeed / (trailWidth > 0 ? trailWidth : trailSpeed));

                for (let i = 0; i < numToSpawn; i++) {
                    particles.push({
                        x: startX - (i * trailWidth),
                        y: startY,
                        vx: -trailSpeed,
                        image: trailImage,
                        width: trailWidth,
                        height: trailHeight,
                    });
                }
            }
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            
            if (p.x < -p.width) {
                particles.splice(i, 1);
                continue;
            }
            
            trailCtx.drawImage(p.image, p.x, p.y - p.height / 2, p.width, p.height);
        }
    }
    
    updateDisplay();
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
    if (wordGlitchInterval) {
        clearInterval(wordGlitchInterval);
        wordGlitchInterval = null;
    }
    particles = [];
    if (trailCtx) {
        trailCtx.clearRect(0, 0, trailCanvas.clientWidth, trailCanvas.clientHeight);
    }
}

function toggleWordMode(enable) {
    if (enable) {
        document.body.classList.add('word-mode');
        applyTheme('dark', 'default'); 
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) darkModeToggle.checked = true;
        
        gameState.wordModeText = { numbers: getWordText(), rebirthInfo: `${getWordText()} ${getWordText()}`, boosts: getWordText(), rebirthButton: getWordText(), owned: getWordText(), cost: getWordText(), power: getWordText(), upgradeNames: getWordText(), descriptions: getWordText(), skinName: getWordText(), shopButton: getWordText(), category: getWordText(), achievementName: getWordText(), buy: getWordText(), shopTitle: `${getWordText()} & ${getWordText()}` };
        if (nyanCatImage) nyanCatImage.src = 'assets/cats/word-cat.png';
    } else {
        document.body.classList.remove('word-mode');
        applyTheme(gameState.settings.theme, gameState.settings.uiTheme); 
        gameState.wordModeText = {}; 
        const currentSkinData = SKINS_DATA.find(s => s.id === gameState.currentSkin);
        if (currentSkinData && nyanCatImage) nyanCatImage.src = currentSkinData.image;
    }
    
    renderUpgrades();
    renderAchievements();
    updateDisplay();
}

export function updateSkinAndMode(skinId) {
    const isWordSkin = skinId === 'word';
    T({ currentSkin: skinId, isWordMode: isWordSkin });
    
    stopAnimation();
    toggleWordMode(isWordSkin);
    startAnimation();
    updateTabVisibility(); 
}

function scheduleNextPoptart() {
    // IMPLEMENTED: Poptart Hunter perk makes poptarts more frequent
    const baseMin = 5 * 60 * 1000; 
    const baseMax = 15 * 60 * 1000;
    const multiplier = gameState.nyanTreeUpgrades['unique_path_3a'] ? 0.75 : 1.0; // 25% faster
    
    const nextInterval = (Math.random() * (baseMax - baseMin) + baseMin) * multiplier;
    
    setTimeout(() => {
        spawnGoldenPoptart();
        scheduleNextPoptart();
    }, nextInterval);
}

function resizeCanvas() {
    setTimeout(() => {
        if (!trailCanvas) return;
        const dpr = window.devicePixelRatio || 1;
        const rect = trailCanvas.getBoundingClientRect();
        trailCanvas.width = rect.width * dpr;
        trailCanvas.height = rect.height * dpr;
        if (trailCtx) {
            trailCtx.scale(dpr, dpr);
            trailCtx.imageSmoothingEnabled = false;
            trailCtx.mozImageSmoothingEnabled = false;
            trailCtx.webkitImageSmoothingEnabled = false;
            trailCtx.msImageSmoothingEnabled = false;
        }
    }, 0);
}

function saveGame(isManual = false) {
    T({ lastSaveTime: Date.now() });

    if (isManual) {
        localStorage.setItem('nyanClickerSaveV6', JSON.stringify(gameState));
        if (document.getElementById('achievement-toast')) {
            showAchievement("Game Saved!", "Your progress has been safely stored.");
        }
    } else {
        const autoSaveState = { ...gameState };
        delete autoSaveState.currentSkin;
        localStorage.setItem('nyanClickerSaveV6', JSON.stringify(autoSaveState));
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // --- Assign DOM elements ---
    nyanCatImage = document.getElementById('nyan-cat-image');
    nyanCatContainer = document.getElementById('nyan-cat-container');
    rainbowContainer = document.getElementById('rainbow-container');
    transitionOverlay = document.getElementById('transition-overlay');
    achievementsContent = document.getElementById('achievements-content');
    achievementsModal = document.getElementById('achievements-modal');
    easterEggsModal = document.getElementById('easter-eggs-modal');
    statsModal = document.getElementById('stats-modal');
    upgradesListEl = document.getElementById('upgrades-list');
    gameContainer = document.getElementById('game-container');
    mainArea = document.getElementById('main-area');
    statsDisplay = document.getElementById('stats-display');
    
    trailCanvas = document.getElementById('trail-canvas');
    trailCtx = trailCanvas.getContext('2d');
    
    const nyanTreeScreen = document.getElementById('nyan-tree-screen');
    const returnToGameBtn = document.getElementById('return-to-game-btn');
    const nyanTreeTab = document.getElementById('nyan-tree-tab');
    const rebirthBtn = document.getElementById('rebirth-btn');
    const multiplierBtn = document.getElementById('multiplier-btn');
    const shopBtn = document.getElementById('shop-btn');
    const resetGameBtn = document.getElementById('reset-game-btn');
    const shopModal = document.getElementById('shop-modal');
    const settingsModal = document.getElementById('settings-modal');
    const settingsTab = document.getElementById('settings-tab');
    const achievementsTab = document.getElementById('achievements-tab');
    const easterEggsTab = document.getElementById('easter-eggs-tab');
    const statsTab = document.getElementById('stats-tab');

    const musicVolumeSlider = document.getElementById('music-volume-slider');
    const sfxVolumeSlider = document.getElementById('sfx-volume-slider');
    const sfxToggle = document.getElementById('sfx-toggle');
    const musicToggle = document.getElementById('music-toggle');
    const globalMuteToggle = document.getElementById('global-mute-toggle');
    const devModeToggle = document.getElementById('dev-mode-toggle');
    const devModeCheats = document.getElementById('dev-mode-cheats');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const themeSelector = document.getElementById('theme-selector');
    const notationSelector = document.getElementById('notation-selector');
    const manualSaveBtn = document.getElementById('manual-save-btn');
    const exportSaveBtn = document.getElementById('export-save-btn');
    const importSaveBtn = document.getElementById('import-save-btn');

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
    
    function handleCatClick(event) {
        if (event.target.id === 'panel-grabber') return;

        playSfx('click');
        const clickPower = calculateClickPower(gameState);
        let newCoins = gameState.coins + clickPower;
        
        if (gameState.nyanTreeUpgrades['unique_path_2b'] && Math.random() < 0.005) {
            const cps = calculateTotalCPS(gameState);
            const minutes = gameState.nyanTreeUpgrades['unique_path_3b'] ? 5 : 1;
            const bonusCoins = cps * 60 * minutes;
            newCoins += bonusCoins;
            createFloatingNumber(`+${formatNumber(bonusCoins)}!`, event);
        }

        T({ 
            totalClicks: gameState.totalClicks + 1,
            coins: newCoins,
            stats: {
                ...gameState.stats,
                handmadeCoins: gameState.stats.handmadeCoins + clickPower,
                totalCoinsEarned: gameState.stats.totalCoinsEarned + clickPower,
            }
        });

        createFloatingNumber(`+${formatNumber(clickPower, true)}`, event);
        checkAchievements('click');
    }

    function tick(deltaTime) {
        const cps = calculateTotalCPS(gameState);
        const coinsGained = cps * (deltaTime / 1000);
        
        T({
            coins: gameState.coins + coinsGained,
            stats: {
                ...gameState.stats,
                timePlayed: gameState.stats.timePlayed + (deltaTime / 1000),
                totalCoinsEarned: gameState.stats.totalCoinsEarned + coinsGained,
            }
        });

        if (gameState.rebirths === 0 && !gameState.hasSeenRebirthGlow) {
            const cost = getRebirthCost();
            const pointsGained = calculateRebirthPointsGained(gameState.coins, cost);
            if (pointsGained > 0) {
                document.getElementById('rebirth-btn').classList.add('rebirth-available-glow');
                T({ hasSeenRebirthGlow: true });
            }
        }

        if (Math.random() < 0.2) {
            updateUpgradeStyles();
        }
        
        if (Math.random() < 0.1) {
             checkAchievements('cps');
             checkAchievements('coins');
        }
    }
    
    function handleRebirth() {
        const cost = getRebirthCost();
        const pointsGained = calculateRebirthPointsGained(gameState.coins, cost);

        if (pointsGained > 0) {
            showCustomModal(
                'Confirm Rebirth',
                `Rebirthing will grant you <strong>${pointsGained}</strong> Rebirth Point(s). Your current run will reset. Proceed?`,
                (confirmed) => {
                    if (confirmed) {
                        runRebirthAnimation(pointsGained);
                    }
                }
            );
        } else {
            T({ triedRebirthEarly: true });
            checkAchievements('misc');
            showCustomModal('Cannot Rebirth', `You need at least ${formatNumber(cost)} coins to gain your first Rebirth Point!`, null, false);
        }
    }

    function runRebirthAnimation(pointsGained) {
        const statsDisplay = document.getElementById('stats-display');
        const rightPanel = document.getElementById('right-panel');
        const nyanCat = document.getElementById('nyan-cat-container');
        const slideOutContainer = document.getElementById('slide-out-container');

        stopAnimation(); 
        switchMusic(null, 800);

        statsDisplay.classList.add('fade-out');
        rightPanel.classList.add('fade-out');
        nyanCat.classList.add('fade-out');
        slideOutContainer.classList.add('fade-out');
        rainbowContainer.classList.add('fade-out');
        
        transitionOverlay.classList.add('active');

        transitionOverlay.addEventListener('transitionend', () => {
            T({ 
                ...gameState, 
                rebirthPoints: gameState.rebirthPoints + pointsGained,
                stats: { ...gameState.stats, rebirths: gameState.stats.rebirths + 1 },
                isRebirthing: true,
            });
            showNyanTreeScreen();

            statsDisplay.classList.remove('fade-out');
            rightPanel.classList.remove('fade-out');
            nyanCat.classList.remove('fade-out');
            slideOutContainer.classList.remove('fade-out');
            rainbowContainer.classList.remove('fade-out');
        }, { once: true });
    }

    function showNyanTreeScreen() {
        renderNyanTree();
        gameContainer.style.display = 'none';
        nyanTreeScreen.style.display = 'flex'; 

        switchMusic('nyanTree', 1500);
        
        setTimeout(() => {
            const treeHeader = document.getElementById('nyan-tree-header');
            const treeWrapper = document.getElementById('nyan-tree-wrapper');
            const treeFooter = document.getElementById('nyan-tree-footer');
            
            treeWrapper.classList.add('fade-in');
            treeFooter.classList.add('fade-in');
            treeHeader.classList.add('fade-in');

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
        document.getElementById('rebirth-btn').classList.remove('rebirth-available-glow');

        const freshState = getDefaultGameState();
        const newRebirthCount = gameState.rebirths + 1;

        const newlyUnlockedSkins = SKINS_DATA
            .filter(skin => newRebirthCount >= skin.rebirthUnlock && !gameState.ownedSkins.includes(skin.id))
            .map(skin => skin.id);

        let startingRebirthPoints = gameState.rebirthPoints;
        if (gameState.nyanTreeUpgrades['unique_path_3d']) {
            startingRebirthPoints += 1;
        }

        const preservedState = {
            rebirths: newRebirthCount,
            rebirthPoints: startingRebirthPoints,
            isRebirthing: false,
            nyanTreeUpgrades: gameState.nyanTreeUpgrades,
            settings: gameState.settings,
            ownedSkins: [...gameState.ownedSkins, ...newlyUnlockedSkins],
            currentSkin: gameState.currentSkin,
            unlockedAchievements: gameState.unlockedAchievements,
            totalClicks: gameState.totalClicks,
            stats: gameState.stats,
            hasSeenRebirthGlow: true,
        };

        T({ ...freshState, ...preservedState });
        
        checkAchievements('rebirth');
        
        T({ coins: 0 });
        
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
        T({ purchaseMultiplierIndex: newIndex });
        multiplierBtn.textContent = `${MULTIPLIERS[newIndex] === 'ALL' ? 'ALL' : MULTIPLIERS[newIndex] + 'x'}`;
        updateUpgradeStyles();
    }

    function loadGame() {
        const savedStateJSON = localStorage.getItem('nyanClickerSaveV6');
        const defaultState = getDefaultGameState();
        
        if (savedStateJSON) {
            const loadedState = JSON.parse(savedStateJSON);
            const finalState = deepMerge(defaultState, loadedState);
            T(finalState);
            
            const timeOffline = Date.now() - (gameState.lastSaveTime || Date.now());
            const offlineSeconds = Math.min(timeOffline / 1000, 8 * 3600); 

            if (gameState.nyanTreeUpgrades['cps_path_4'] && offlineSeconds > 10) {
                 const offlineCPS = calculateTotalCPS(gameState);
                 const offlineEarnings = offlineCPS * offlineSeconds * 0.1;
                 T({
                     coins: gameState.coins + offlineEarnings,
                     stats: { ...gameState.stats, totalCoinsEarned: gameState.stats.totalCoinsEarned + offlineEarnings }
                 });
                 showCustomModal('Welcome Back!', `While you were away, your Idleverse generated ${formatNumber(offlineEarnings)} Nyan Coins!`, null, false);
            }
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
                    stopAnimation();
                    localStorage.removeItem('nyanClickerSaveV6');
                    T(getDefaultGameState()); 
                    location.reload();
                }
            }
        );
    }
    
    function startMusicOnFirstInteraction() {
        setUserInteracted();
        switchMusic('main');
        document.removeEventListener('mousedown', startMusicOnFirstInteraction);
        document.removeEventListener('keydown', startMusicOnFirstInteraction);
        document.removeEventListener('touchstart', startMusicOnFirstInteraction);
    }

    function handleWindowFocus() { resumeAllAudio(); startAnimation(); }
    function handleWindowBlur() { pauseAllAudio(); stopAnimation(); }

    function gameLoop() {
        const now = performance.now();
        const deltaTime = now - lastTickTime;
        lastTickTime = now;

        tick(deltaTime);

        setTimeout(gameLoop, 100);
    }

    // FIXED: Robust draggable panel logic for mobile
    function initDraggablePanel() {
        const grabber = document.getElementById('panel-grabber');
        const rightPanel = document.getElementById('right-panel');
        if (!grabber || !rightPanel) return;

        let isDragging = false;
        let startY, startHeight;

        const onDragStart = (e) => {
            isDragging = true;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            startY = clientY;
            startHeight = rightPanel.offsetHeight;
            // Disable transitions for smooth dragging
            rightPanel.style.transition = 'none';
            nyanCatContainer.style.transition = 'none';
            statsDisplay.style.transition = 'none';
            document.body.style.cursor = 'ns-resize';
            document.body.style.userSelect = 'none';
        };

        const onDragMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const deltaY = clientY - startY;
            let newHeight = startHeight - deltaY;

            const minHeight = 150;
            const maxHeight = window.innerHeight - 200;
            newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
            
            rightPanel.style.height = `${newHeight}px`;

            // Move Nyan Cat up as the panel is pulled down for a centered look
            const dragPercent = (newHeight - minHeight) / (maxHeight - minHeight);
            const yOffset = (1 - dragPercent) * -40; // Move up to -40px
            nyanCatContainer.style.transform = `translateY(${yOffset}px)`;
            statsDisplay.style.transform = `translate(-50%, ${yOffset}px)`;
        };

        const onDragEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            // Re-enable transitions
            rightPanel.style.transition = '';
            nyanCatContainer.style.transition = '';
            statsDisplay.style.transition = '';
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        // Add both touch and mouse events for compatibility
        grabber.addEventListener('touchstart', onDragStart, { passive: false });
        document.addEventListener('touchmove', onDragMove, { passive: false });
        document.addEventListener('touchend', onDragEnd);

        grabber.addEventListener('mousedown', onDragStart);
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
    }
    
    function init() {
        setSaveGameCallback(saveGame);
        loadGame();
        initAudio(); 
        
        document.addEventListener('mousedown', startMusicOnFirstInteraction);
        document.addEventListener('keydown', startMusicOnFirstInteraction);
        document.addEventListener('touchstart', startMusicOnFirstInteraction);
        window.addEventListener('focus', handleWindowFocus);
        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // FIXED: Unconditionally add click listener to main-area for better UX
        mainArea.addEventListener('click', handleCatClick);
        
        // Initialize draggable panel only on mobile view
        if (window.innerWidth <= 900) {
            initDraggablePanel();
        }

        rebirthBtn.addEventListener('click', handleRebirth);
        multiplierBtn.addEventListener('click', cycleMultiplier);
        resetGameBtn.addEventListener('click', resetGame);
        shopBtn.addEventListener('click', () => { renderShop(); showModal(shopModal); });
        nyanTreeTab.addEventListener('click', () => {
            stopAnimation();
            T({ isRebirthing: false });
            showNyanTreeScreen();
        });
        settingsTab.addEventListener('click', () => { showModal(settingsModal); });
        achievementsTab.addEventListener('click', () => { renderAchievements(); showModal(achievementsModal); });
        easterEggsTab.addEventListener('click', () => { renderEasterEggs(); showModal(easterEggsModal); });
        statsTab.addEventListener('click', () => { renderStats(); showModal(statsModal); });
        
        upgradesListEl.addEventListener('click', (e) => {
            const upgradeItem = e.target.closest('.upgrade-item');
            if (!upgradeItem) return;

            const boostPip = e.target.closest('.boost-pip.available');
            
            if (boostPip) {
                const upgradeId = upgradeItem.dataset.id;
                const boostIndex = parseInt(boostPip.dataset.boostIndex, 10);
                const success = buyUpgradeBoost(upgradeId, boostIndex);
                if (success) {
                    playSfx('upgradeBuy');
                    renderUpgrades();
                }
            } else {
                const success = buyUpgrade(upgradeItem.dataset.id);
                if (success) {
                    playSfx('upgradeBuy');
                    renderUpgrades(); 
                    checkAchievements('upgrades');
                    checkAchievements('misc');
                }
            }
        });

        upgradesListEl.addEventListener('mouseover', (e) => {
            if (e.target.matches('.boost-pip.available, .boost-pip.locked')) {
                showBoostTooltip(e.target);
            }
        });
        upgradesListEl.addEventListener('mouseout', (e) => {
            if (e.target.matches('.boost-pip.available, .boost-pip.locked')) {
                hideBoostTooltip();
            }
        });

        initEasterEggListeners(achievementsContent, easterEggsModal, transitionOverlay, achievementsModal, saveGame);
        
        document.querySelectorAll('.close-modal-x').forEach(btn => btn.addEventListener('click', (e) => {
            hideModal(e.target.closest('.modal-overlay'));
        }));
        
        musicVolumeSlider.addEventListener('input', (e) => { T({ settings: { ...gameState.settings, musicVolume: parseFloat(e.target.value) / 100 } }); updateMusicVolume(); });
        sfxVolumeSlider.addEventListener('input', (e) => { T({ settings: { ...gameState.settings, sfxVolume: parseFloat(e.target.value) / 100 } }); });
        sfxToggle.addEventListener('change', (e) => { T({ settings: { ...gameState.settings, sfx: e.target.checked } }); });
        musicToggle.addEventListener('change', (e) => { T({ settings: { ...gameState.settings, music: e.target.checked } }); setMusicEnabled(e.target.checked); });
        globalMuteToggle.addEventListener('change', (e) => { T({ settings: { ...gameState.settings, globalMute: e.target.checked } }); setGlobalMute(e.target.checked); });
        darkModeToggle.addEventListener('change', (e) => { const newTheme = e.target.checked ? 'dark' : 'light'; T({ settings: { ...gameState.settings, theme: newTheme } }); if (!gameState.isWordMode) applyTheme(newTheme, gameState.settings.uiTheme); });
        themeSelector.addEventListener('change', (e) => { const newUiTheme = e.target.value; T({ settings: { ...gameState.settings, uiTheme: newUiTheme } }); applyTheme(gameState.settings.theme, newUiTheme); });
        notationSelector.addEventListener('change', (e) => { T({ settings: { ...gameState.settings, notation: e.target.value } }); });
        devModeToggle.addEventListener('change', (e) => { T({ settings: { ...gameState.settings, devMode: e.target.checked } }); devModeCheats.style.display = e.target.checked ? 'grid' : 'none'; });

        manualSaveBtn.addEventListener('click', () => saveGame(true));
        exportSaveBtn.addEventListener('click', () => {
            const saveData = JSON.stringify(gameState, null, 2);
            const blob = new Blob([saveData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'nyan-clicker-save.json';
            a.click();
            URL.revokeObjectURL(url);
            showAchievement('Save Exported!', 'Check your downloads for the save file.');
        });
        importSaveBtn.addEventListener('click', () => { 
            const saveData = prompt('Paste your save data here:'); 
            if (saveData) { 
                try { 
                    T(JSON.parse(saveData)); 
                    saveGame(true);
                    location.reload(); 
                } catch (e) { 
                    alert('Invalid save data!'); 
                } 
            } 
        });
        
        addCoinsCheat.addEventListener('click', () => { T({ coins: gameState.coins + 1e6 }); });
        add1bCoinsCheat.addEventListener('click', () => { T({ coins: gameState.coins + 1e9 }); });
        add1tCoinsCheat.addEventListener('click', () => { T({ coins: gameState.coins + 1e12 }); });
        add1qCoinsCheat.addEventListener('click', () => { T({ coins: gameState.coins + 1e15 }); });
        addRebirthPointsCheat.addEventListener('click', () => { T({ rebirthPoints: gameState.rebirthPoints + 10 }); renderNyanTree(); });
        addRebirthsCheat.addEventListener('click', () => { T({ rebirths: gameState.rebirths + 5 }); renderUpgrades(); });
        get249UpgradesCheat.addEventListener('click', () => { const newUpgrades = { ...gameState.upgrades }; UPGRADES_DATA.forEach(upgrade => { newUpgrades[upgrade.id] = { owned: 249, boosts: 0 }; }); T({ upgrades: newUpgrades }); renderUpgrades(); });
        unlockAllAchievementsCheat.addEventListener('click', () => { const allAchievementIds = []; Object.values(ACHIEVEMENTS_DATA).forEach(category => Object.keys(category).forEach(id => allAchievementIds.push(id))); T({ unlockedAchievements: allAchievementIds }); renderAchievements(); });
        maxNyanTreeCheat.addEventListener('click', () => { const maxedTree = {}; NYAN_TREE_UPGRADES.forEach(upgrade => maxedTree[upgrade.id] = upgrade.maxLevel); T({ nyanTreeUpgrades: maxedTree }); renderNyanTree(); });
        
        skinNavLeft.addEventListener('click', () => navigateCarousel(-1));
        skinNavRight.addEventListener('click', () => navigateCarousel(1));
        shopBuyBtn.addEventListener('click', handleShopAction);
        
        setupNyanTree();
        setupSettingsModal();
        
        applyTheme(gameState.settings.theme, gameState.settings.uiTheme);
        updateSkinAndMode(gameState.currentSkin);

        musicVolumeSlider.value = gameState.settings.musicVolume * 100;
        sfxVolumeSlider.value = gameState.settings.sfxVolume * 100;
        sfxToggle.checked = gameState.settings.sfx;
        musicToggle.checked = gameState.settings.music;
        globalMuteToggle.checked = gameState.settings.globalMute;
        darkModeToggle.checked = gameState.settings.theme === 'dark';
        themeSelector.value = gameState.settings.uiTheme;
        notationSelector.value = gameState.settings.notation;
        devModeToggle.checked = gameState.settings.devMode;
        devModeCheats.style.display = gameState.settings.devMode ? 'grid' : 'none';
        
        multiplierBtn.textContent = `${MULTIPLIERS[gameState.purchaseMultiplierIndex] === 'ALL' ? 'ALL' : MULTIPLIERS[gameState.purchaseMultiplierIndex] + 'x'}`;
        
        gameLoop();
        startAnimation();
        scheduleNextPoptart();
        setInterval(() => saveGame(false), 30000);
        checkAchievements(); 
        renderUpgrades(); 

        console.log("Nyan Cat Clicker Initialized.");
    }

    init();
});