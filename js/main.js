import {
    gameState, T, getDefaultGameState, BASE_REBIRTH_COST, MULTIPLIERS
} from './state.js';
import {
    calculateClickPower, calculateTotalCPS, getRebirthCost, calculateRebirthPointsGained
} from './core.js';
import {
    updateDisplay, renderUpgrades, showAchievement, renderShop, updateUpgradeStyles, 
    renderAchievements, navigateCarousel, handleShopAction, renderEasterEggs, renderStats, 
    updateTabVisibility, setSaveGameCallback
} from './ui.js';
import { renderNyanTree, setupNyanTree } from './nyanTree.js';
import { ACHIEVEMENTS_DATA, SKINS_DATA, UPGRADES_DATA, NYAN_TREE_UPGRADES } from './data.js';
import { initAudio, playSfx, switchMusic, updateMusicVolume, setMusicEnabled, pauseAllAudio, resumeAllAudio, setUserInteracted, setGlobalMute } from './audio.js';
import { formatNumber, animateCounter, deepMerge } from './utils.js';
import { buyUpgrade } from './upgrades.js';

// --- Module-level variables ---
let animationFrameId = null;
let wordGlitchInterval = null;
let lastTickTime = performance.now();

// --- NEW: Canvas Particle System Variables ---
let trailCanvas, trailCtx;
let particles = [];
// Cache for loaded trail images to prevent reloading
const trailImageCache = {};

// --- DOM Element Caching ---
let nyanCatImage, nyanCatContainer, rainbowContainer, transitionOverlay, 
    achievementsContent, achievementsModal, easterEggsModal, statsModal,
    upgradesListEl, gameContainer, boostContainer;

const WORD_TEXTS = ["WORD.", "SHIFT.", "WHATTTT", "OKAY"];
const getWordText = () => WORD_TEXTS[Math.floor(Math.random() * WORD_TEXTS.length)];


// NEW: Function to load and cache trail images
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

    // --- REVISED: Canvas Particle System Logic ---
    if (trailCtx) {
        // Clear the canvas for the new frame
        trailCtx.clearRect(0, 0, trailCanvas.clientWidth, trailCanvas.clientHeight);

        const currentSkinData = SKINS_DATA.find(s => s.id === gameState.currentSkin) || SKINS_DATA.find(s => s.id === 'default');

        // 1. SPAWN NEW PARTICLE SEGMENTS
        if (!gameState.isWordMode && currentSkinData.trail && currentSkinData.trail !== '') {
            const trailImage = loadTrailImage(currentSkinData.trail);

            // Only proceed if the image has been loaded by the browser
            if (trailImage.complete && trailImage.naturalHeight !== 0) {
                const catRect = nyanCatContainer.getBoundingClientRect();
                const containerRect = gameContainer.getBoundingClientRect();
                
                // Use trailHeight from data, otherwise default to the image's natural height
                const trailHeight = currentSkinData.trailHeight || trailImage.naturalHeight;
                // Calculate the segment's width to maintain the aspect ratio of the original slice image
                const trailWidth = trailImage.naturalWidth * (trailHeight / trailImage.naturalHeight);

                let startX, startY;
                if (currentSkinData.trailOrigin) {
                    startX = (catRect.left - containerRect.left) + currentSkinData.trailOrigin.x;
                    startY = (catRect.top - containerRect.top) + currentSkinData.trailOrigin.y;
                } else {
                    startX = catRect.left - containerRect.left + (catRect.width / 2);
                    startY = catRect.top - containerRect.top + (catRect.height / 2);
                }
                
                // Define how fast the trail moves to the left
                const trailSpeed = 10; // pixels per frame

                // To prevent gaps, spawn enough segments to fill the space moved in one frame.
                // We use Math.ceil to ensure we always fill the gap, even with fractional results.
                const numToSpawn = Math.ceil(trailSpeed / trailWidth);

                for (let i = 0; i < numToSpawn; i++) {
                    const particle = {
                        // Position new segments one after another to fill the gap
                        x: startX - (i * trailWidth),
                        y: startY,
                        vx: -trailSpeed, // All segments move at the same speed
                        image: trailImage,
                        width: trailWidth,
                        height: trailHeight,
                    };
                    particles.push(particle);
                }
            }
        }

        // 2. UPDATE AND DRAW EXISTING PARTICLES
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            
            // Update position
            p.x += p.vx;
            
            // Remove if it's moved off-screen
            if (p.x < -p.width) {
                particles.splice(i, 1);
                continue;
            }
            
            // Draw the trail image slice, centered vertically on its y-coordinate
            trailCtx.drawImage(p.image, p.x, p.y - p.height / 2, p.width, p.height);
        }
    }
    // --- END: Canvas Particle System Logic ---
    
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
    // ADDED: Clear particles when stopping to prevent a burst on resume
    particles = [];
    if (trailCtx) {
        trailCtx.clearRect(0, 0, trailCanvas.clientWidth, trailCanvas.clientHeight);
    }
}

function applyTheme(theme, uiTheme) {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    
    document.body.classList.remove('theme-vaporwave', 'theme-matrix');
    if (uiTheme && uiTheme !== 'default') {
        document.body.classList.add(`theme-${uiTheme}`);
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

function showModal(modal) {
    if (modal) modal.style.display = 'flex';
}

function hideModal(modal) {
    if (modal) modal.style.display = 'none';
}

function spawnGoldenPoptart() {
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

function scheduleNextPoptart() {
    const minInterval = 5 * 60 * 1000; 
    const maxInterval = 15 * 60 * 1000; 
    const nextInterval = Math.random() * (maxInterval - minInterval) + minInterval;
    
    setTimeout(() => {
        spawnGoldenPoptart();
        scheduleNextPoptart();
    }, nextInterval);
}

// MODIFIED: Added image smoothing properties to keep pixel art sharp.
function resizeCanvas() {
    if (!trailCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = trailCanvas.getBoundingClientRect();
    trailCanvas.width = rect.width * dpr;
    trailCanvas.height = rect.height * dpr;
    if (trailCtx) {
        trailCtx.scale(dpr, dpr);
        // This is the magic! It tells the canvas not to blur pixels when scaling.
        trailCtx.imageSmoothingEnabled = false;
        trailCtx.mozImageSmoothingEnabled = false;
        trailCtx.webkitImageSmoothingEnabled = false;
        trailCtx.msImageSmoothingEnabled = false;
    }
}

// This function needs to be defined in main.js so it can be passed to other modules.
function saveGame(isManual = false) {
    T({ lastSaveTime: Date.now() });

    // MODIFIED: Autosaves should not store the current skin, but manual saves should.
    // This prevents live-server reloads from reverting your skin choice during development.
    if (isManual) {
        localStorage.setItem('nyanClickerSaveV6', JSON.stringify(gameState));
        if (document.getElementById('achievement-toast')) { // Check if UI is ready
            showAchievement("Game Saved!", "Your progress has been safely stored.");
        }
    } else {
        const autoSaveState = { ...gameState };
        delete autoSaveState.currentSkin; // Don't save current skin on auto-save
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
    boostContainer = document.getElementById('boost-container');
    
    // NEW: Assign canvas elements
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
    const confirmModal = document.getElementById('confirm-modal');
    const confirmModalTitle = document.getElementById('confirm-modal-title');
    const confirmModalMessage = document.getElementById('confirm-modal-message');
    const confirmModalYes = document.getElementById('confirm-modal-yes');
    const confirmModalNo = document.getElementById('confirm-modal-no');
    const confirmModalOk = document.getElementById('confirm-modal-ok');
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
        const newCoins = gameState.coins + clickPower;
        const newTotalClicks = gameState.totalClicks + 1;
        
        T({ 
            totalClicks: newTotalClicks,
            coins: newCoins,
            stats: {
                ...gameState.stats,
                handmadeCoins: gameState.stats.handmadeCoins + clickPower,
                totalCoinsEarned: gameState.stats.totalCoinsEarned + clickPower,
            }
        });

        if (!gameState.isWordMode) {
            const numberEl = document.createElement('div');
            numberEl.className = 'floating-number';
            numberEl.innerHTML = `+${formatNumber(clickPower, true)}`;
            gameContainer.appendChild(numberEl);
            const containerRect = gameContainer.getBoundingClientRect();
            numberEl.style.left = `${event.clientX - containerRect.left - numberEl.offsetWidth / 2}px`;
            numberEl.style.top = `${event.clientY - containerRect.top - numberEl.offsetHeight / 2}px`;
            setTimeout(() => numberEl.remove(), 1200);
        }

        // BUG FIX: Immediately update upgrade styles after a click to reflect new coin total.
        updateUpgradeStyles();
        checkAchievements('click');
    }

    function tick(deltaTime) {
        const cps = calculateTotalCPS(gameState);
        const coinsGained = cps * (deltaTime / 1000);
        const newCoins = gameState.coins + coinsGained;
        
        T({
            coins: newCoins,
            stats: {
                ...gameState.stats,
                timePlayed: gameState.stats.timePlayed + (deltaTime / 1000),
                totalCoinsEarned: gameState.stats.totalCoinsEarned + coinsGained,
            }
        });
        
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
            stats: gameState.stats,
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

    const achievementGroups = {
        click: ['Clicking'],
        cps: ['Production'],
        coins: ['Acquisition'],
        upgrades: ['Construction'],
        rebirth: ['Prestige'],
        nyanTree: ['Nyan Tree'],
        collection: ['Collection'],
        mastery: ['Mastery'],
        misc: ['Miscellaneous']
    };

    function checkAchievements(groupKey = null) {
        const checkAll = (category) => {
            Object.keys(ACHIEVEMENTS_DATA[category]).forEach(id => {
                if (!gameState.unlockedAchievements.includes(id)) {
                    const achievement = ACHIEVEMENTS_DATA[category][id];
                    if (typeof achievement.condition === 'function' && achievement.condition(gameState)) {
                        T({
                            unlockedAchievements: [...gameState.unlockedAchievements, id],
                            coins: gameState.coins + (achievement.reward || 0),
                        });
                        showAchievement(achievement.name, achievement.description);
                        checkAchievements('mastery'); 
                    }
                }
            });
        };

        if (groupKey) {
            achievementGroups[groupKey].forEach(checkAll);
        } else { 
            Object.keys(ACHIEVEMENTS_DATA).forEach(checkAll);
        }
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

            const offlineCPS = calculateTotalCPS(gameState);
            const offlineEarnings = offlineCPS * offlineSeconds * 0.1; 

            if (offlineSeconds > 10 && offlineEarnings > 0) {
                T({
                    coins: gameState.coins + offlineEarnings,
                    stats: { ...gameState.stats, totalCoinsEarned: gameState.stats.totalCoinsEarned + offlineEarnings }
                });
                showCustomModal('Welcome Back!', `While you were away, you earned ${formatNumber(offlineEarnings)} Nyan Coins!`, null, false);
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

    function init() {
        setSaveGameCallback(saveGame); // Pass the saveGame function to the UI module
        loadGame();
        initAudio(); 
        
        document.addEventListener('mousedown', startMusicOnFirstInteraction);
        document.addEventListener('keydown', startMusicOnFirstInteraction);
        window.addEventListener('focus', handleWindowFocus);
        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        nyanCatImage.addEventListener('click', handleCatClick);
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
            if (upgradeItem) {
                buyUpgrade(upgradeItem.dataset.id);
                checkAchievements('upgrades');
                updateUpgradeStyles(); 
            }
        });

        achievementsContent.addEventListener('click', (e) => {
            const card = e.target.closest('.achievement-card.clickable');
            if (card && card.dataset.id === 'misc_words_apart' && !gameState.isWordMode) {
                playSfx('flash');
                transitionOverlay.style.backgroundColor = '#FFF';
                transitionOverlay.style.transition = 'opacity 0.2s ease-in';

                transitionOverlay.addEventListener('transitionend', () => {
                    if (!gameState.ownedSkins.includes('word')) {
                        T({ ownedSkins: [...gameState.ownedSkins, 'word'] });
                    }
                    updateSkinAndMode('word');
                    saveGame(true); // Manually save this special skin unlock
                    hideModal(achievementsModal);

                    transitionOverlay.style.transition = 'opacity 1.2s ease-out';
                    transitionOverlay.classList.remove('active');
                    
                    transitionOverlay.addEventListener('transitionend', () => {
                        transitionOverlay.style.backgroundColor = '#000';
                        transitionOverlay.style.transition = 'opacity 1s ease-in-out';
                    }, { once: true });
                }, { once: true });
                transitionOverlay.classList.add('active');
            }
        });

        easterEggsModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('easter-egg-equip-btn')) {
                const card = e.target.closest('.achievement-card');
                if (card) {
                    const skinId = card.dataset.skinId;
                    if (skinId && gameState.currentSkin !== skinId) {
                        playSfx('skinBuy');
                        updateSkinAndMode(skinId);
                        saveGame(true); // Manually save when equipping a secret skin
                        renderEasterEggs();
                    }
                }
            }
        });
        
        document.querySelectorAll('.close-modal-x').forEach(btn => btn.addEventListener('click', (e) => {
            hideModal(e.target.closest('.modal-overlay'));
        }));
        
        confirmModalYes.addEventListener('click', () => { if (confirmCallback) confirmCallback(true); hideModal(confirmModal); });
        confirmModalNo.addEventListener('click', () => { if (confirmCallback) confirmCallback(false); hideModal(confirmModal); });
        confirmModalOk.addEventListener('click', () => hideModal(confirmModal));

        // Settings Listeners
        musicVolumeSlider.addEventListener('input', (e) => { T({ settings: { ...gameState.settings, musicVolume: parseFloat(e.target.value) / 100 } }); updateMusicVolume(); });
        sfxVolumeSlider.addEventListener('input', (e) => { T({ settings: { ...gameState.settings, sfxVolume: parseFloat(e.target.value) / 100 } }); });
        sfxToggle.addEventListener('change', (e) => { T({ settings: { ...gameState.settings, sfx: e.target.checked } }); });
        musicToggle.addEventListener('change', (e) => { T({ settings: { ...gameState.settings, music: e.target.checked } }); setMusicEnabled(e.target.checked); });
        globalMuteToggle.addEventListener('change', (e) => { T({ settings: { ...gameState.settings, globalMute: e.target.checked } }); setGlobalMute(e.target.checked); });
        darkModeToggle.addEventListener('change', (e) => { const newTheme = e.target.checked ? 'dark' : 'light'; T({ settings: { ...gameState.settings, theme: newTheme } }); if (!gameState.isWordMode) applyTheme(newTheme, gameState.settings.uiTheme); });
        themeSelector.addEventListener('change', (e) => { const newUiTheme = e.target.value; T({ settings: { ...gameState.settings, uiTheme: newUiTheme } }); applyTheme(gameState.settings.theme, newUiTheme); });
        notationSelector.addEventListener('change', (e) => { T({ settings: { ...gameState.settings, notation: e.target.value } }); });
        devModeToggle.addEventListener('change', (e) => { T({ settings: { ...gameState.settings, devMode: e.target.checked } }); devModeCheats.style.display = e.target.checked ? 'grid' : 'none'; });

        // Save Management Listeners
        manualSaveBtn.addEventListener('click', () => saveGame(true));
        exportSaveBtn.addEventListener('click', () => {
            const saveData = JSON.stringify(gameState, null, 2); // Pretty-print the JSON
            const blob = new Blob([saveData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'nyan-clicker-save.json';
            a.click();
            URL.revokeObjectURL(url);
            showAchievement('Save Exported!', 'Check your downloads for the save file.');
        });
        // MODIFIED: Import function now handles plain text JSON, not base64.
        importSaveBtn.addEventListener('click', () => { 
            const saveData = prompt('Paste your save data here:'); 
            if (saveData) { 
                try { 
                    T(JSON.parse(saveData)); 
                    saveGame(true); // Manually save the imported data
                    location.reload(); 
                } catch (e) { 
                    alert('Invalid save data!'); 
                } 
            } 
        });
        
        // Dev Cheats
        addCoinsCheat.addEventListener('click', () => { T({ coins: gameState.coins + 1e6 }); });
        add1bCoinsCheat.addEventListener('click', () => { T({ coins: gameState.coins + 1e9 }); });
        add1tCoinsCheat.addEventListener('click', () => { T({ coins: gameState.coins + 1e12 }); });
        add1qCoinsCheat.addEventListener('click', () => { T({ coins: gameState.coins + 1e15 }); });
        addRebirthPointsCheat.addEventListener('click', () => { T({ rebirthPoints: gameState.rebirthPoints + 10 }); renderNyanTree(); });
        addRebirthsCheat.addEventListener('click', () => { T({ rebirths: gameState.rebirths + 5 }); renderUpgrades(); });
        get249UpgradesCheat.addEventListener('click', () => { const newUpgrades = { ...gameState.upgrades }; UPGRADES_DATA.forEach(upgrade => { newUpgrades[upgrade.id] = { owned: 249 }; }); T({ upgrades: newUpgrades }); renderUpgrades(); updateUpgradeStyles(); });
        unlockAllAchievementsCheat.addEventListener('click', () => { const allAchievementIds = []; Object.values(ACHIEVEMENTS_DATA).forEach(category => Object.keys(category).forEach(id => allAchievementIds.push(id))); T({ unlockedAchievements: allAchievementIds }); renderAchievements(); });
        maxNyanTreeCheat.addEventListener('click', () => { const maxedTree = {}; NYAN_TREE_UPGRADES.forEach(upgrade => maxedTree[upgrade.id] = upgrade.maxLevel); T({ nyanTreeUpgrades: maxedTree }); renderNyanTree(); });
        
        skinNavLeft.addEventListener('click', () => navigateCarousel(-1));
        skinNavRight.addEventListener('click', () => navigateCarousel(1));
        shopBuyBtn.addEventListener('click', handleShopAction);
        
        setupNyanTree();
        
        applyTheme(gameState.settings.theme, gameState.settings.uiTheme);
        updateSkinAndMode(gameState.currentSkin);

        // Set initial UI state from loaded game
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
        updateUpgradeStyles();

        console.log("Nyan Cat Clicker Initialized and Upgraded with Canvas Particles!");
    }

    init();
});