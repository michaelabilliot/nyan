import {
    gameState, T, defaultGameState, REBIRTH_COST, MULTIPLIERS
} from './state.js';
import {
    calculateClickPower, calculateTotalCPS,
} from './core.js';
import {
    updateDisplay, renderUpgrades, showAchievement, formatNumber, renderShop, updateUpgradeStyles
} from './ui.js';
import { renderNyanTree } from './nyanTree.js';
import { ACHIEVEMENTS_DATA, SKINS_DATA, PLANET_DATA } from './data.js';

export function changePlanet(planetId) {
    if (!PLANET_DATA[planetId]) return;
    T({ ...gameState, currentPlanet: planetId });
    document.body.style.backgroundImage = `url('${PLANET_DATA[planetId].background}')`;
    renderUpgrades();
}

function showModal(modal) {
    modal.style.display = 'flex';
}

function hideModal(modal) {
    modal.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Get all DOM elements ---
    const nyanCatContainer = document.getElementById('nyan-cat-container');
    const nyanCatImage = document.getElementById('nyan-cat-image');
    const multiplierBtn = document.getElementById('multiplier-btn');
    const rebirthBtn = document.getElementById('rebirth-btn');
    const shopBtn = document.getElementById('shop-btn');
    const rainbowContainer = document.getElementById('rainbow-container');
    const resetGameBtn = document.getElementById('reset-game-btn');
    
    // Modals
    const shopModal = document.getElementById('shop-modal');
	const settingsModal = document.getElementById('settings-modal');
    const nyanTreeModal = document.getElementById('nyan-tree-modal');
    const confirmModal = document.getElementById('confirm-modal');
    
    // Confirm Modal Elements
    const confirmModalTitle = document.getElementById('confirm-modal-title');
    const confirmModalMessage = document.getElementById('confirm-modal-message');
    const confirmModalYes = document.getElementById('confirm-modal-yes');
    const confirmModalNo = document.getElementById('confirm-modal-no');

    // Slide-out Tabs
    const nyanTreeTab = document.getElementById('nyan-tree-tab');
    const settingsTab = document.getElementById('settings-tab');

    // Settings Elements
    const volumeSlider = document.getElementById('volume-slider');
    const sfxToggle = document.getElementById('sfx-toggle');
    const musicToggle = document.getElementById('music-toggle');
    const devModeToggle = document.getElementById('dev-mode-toggle');
    const devModeCheats = document.getElementById('dev-mode-cheats');
    const addCoinsCheat = document.getElementById('add-coins-cheat');
    const addTechPointsCheat = document.getElementById('add-tech-points-cheat'); 

    // --- 2. State & Helper Functions ---
    let confirmCallback = null;

    function showConfirmModal(title, message, callback) {
        confirmModalTitle.textContent = title;
        confirmModalMessage.textContent = message;
        confirmCallback = callback;
        showModal(confirmModal);
    }

    function handleCatClick(event) {
        playSound('assets/click.mp3');
        const clickPower = calculateClickPower();
        T({ ...gameState, coins: gameState.coins + clickPower });

        const numberEl = document.createElement('div');
        numberEl.className = 'floating-number';
        numberEl.textContent = `+${formatNumber(clickPower)}`;
        numberEl.style.left = `${event.clientX}px`;
        numberEl.style.top = `${event.clientY}px`;
        document.body.appendChild(numberEl);
        setTimeout(() => numberEl.remove(), 1200);

        updateDisplay();
        updateUpgradeStyles(); // Efficiently update styles instead of full re-render
        checkAchievements();
    }

    function tick() {
        T({ ...gameState, coins: gameState.coins + calculateTotalCPS() / 10 });
        updateDisplay();
        updateUpgradeStyles(); // Efficiently update styles instead of full re-render
        checkAchievements();
    }

    function cycleMultiplier() {
        const newIndex = (gameState.purchaseMultiplierIndex + 1) % MULTIPLIERS.length;
        T({ ...gameState, purchaseMultiplierIndex: newIndex });
        multiplierBtn.textContent = `${MULTIPLIERS[newIndex]}x`;
        renderUpgrades(); // Full re-render needed here
    }

    function handleRebirth() {
        if (gameState.coins >= REBIRTH_COST) {
            showConfirmModal(
                'Confirm Rebirth',
                `Are you sure? You will lose coins and upgrades for permanent bonuses!`,
                (confirmed) => {
                    if (confirmed) {
                        const pointsGained = Math.max(1, Math.floor(Math.log10(gameState.coins / REBIRTH_COST) * 2));
                        const currentSettings = gameState.settings;
                        const permanentUpgrades = gameState.nyanTreeUpgrades;

                        T({
                            ...defaultGameState,
                            rebirths: gameState.rebirths + 1,
                            rebirthPoints: gameState.rebirthPoints + pointsGained,
                            unlockedPlanets: gameState.unlockedPlanets,
                            ownedSkins: gameState.ownedSkins,
                            currentSkin: gameState.currentSkin,
                            rebirthUpgrades: gameState.rebirthUpgrades,
                            nyanTreeUpgrades: permanentUpgrades,
                            settings: currentSettings,
                        });
                        renderUpgrades();
                        updateDisplay();
                        checkAchievements();
                        playSound('assets/rebirth.mp3');
                    }
                }
            );
        } else {
            alert(`You need at least ${formatNumber(REBIRTH_COST)} coins to rebirth!`);
        }
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
                    playSound('assets/achievement.mp3');
                }
            }
        });
    }

    function playSound(src) {
        if (!gameState.settings.sfx) return;
        const audio = new Audio(src);
        audio.volume = gameState.settings.volume;
        audio.play().catch(e => console.log("Audio play failed. User interaction needed."));
    }

    function saveGame() {
        localStorage.setItem('nyanClickerSaveV5', JSON.stringify(gameState));
    }

    function loadGame() {
        const savedState = localStorage.getItem('nyanClickerSaveV5');
        const loadedState = savedState ? JSON.parse(savedState) : {};
        T({ ...defaultGameState, ...loadedState });
    }

    function resetGame() {
        showConfirmModal(
            'Reset Game',
            "Are you sure? This will wipe all your progress!",
            (confirmed) => {
                if (confirmed) {
                    localStorage.removeItem('nyanClickerSaveV5');
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

    // --- 3. Attach Event Listeners ---
    nyanCatImage.addEventListener('click', handleCatClick);
    rebirthBtn.addEventListener('click', handleRebirth);
    multiplierBtn.addEventListener('click', cycleMultiplier);
    resetGameBtn.addEventListener('click', resetGame);
    
    shopBtn.addEventListener('click', () => { 
        renderShop();
        showModal(shopModal); 
    });
    
    nyanTreeTab.addEventListener('click', () => {
        renderNyanTree();
        showModal(nyanTreeModal);
    });

    settingsTab.addEventListener('click', () => {
        showModal(settingsModal);
    });

    document.querySelectorAll('.close-modal-btn').forEach(btn => 
        btn.addEventListener('click', (e) => hideModal(e.target.closest('.modal-overlay')))
    );

    confirmModalYes.addEventListener('click', () => {
        if (confirmCallback) confirmCallback(true);
        hideModal(confirmModal);
    });

    confirmModalNo.addEventListener('click', () => {
        if (confirmCallback) confirmCallback(false);
        hideModal(confirmModal);
    });

    volumeSlider.addEventListener('input', (e) => {
        T({ ...gameState, settings: { ...gameState.settings, volume: parseFloat(e.target.value) / 100 } });
    });

    sfxToggle.addEventListener('change', (e) => {
        T({ ...gameState, settings: { ...gameState.settings, sfx: e.target.checked } });
    });

    musicToggle.addEventListener('change', (e) => {
        T({ ...gameState, settings: { ...gameState.settings, music: e.target.checked } });
    });

    devModeToggle.addEventListener('change', (e) => {
        T({ ...gameState, settings: { ...gameState.settings, devMode: e.target.checked } });
        devModeCheats.style.display = e.target.checked ? 'block' : 'none';
    });

    addCoinsCheat.addEventListener('click', () => {
        T({ ...gameState, coins: gameState.coins + 1e6 });
        updateDisplay();
    });

    addTechPointsCheat.addEventListener('click', () => {
        T({ ...gameState, rebirthPoints: gameState.rebirthPoints + 10 });
        updateDisplay();
    });

    // --- 4. Game Initialization ---
    function init() {
        loadGame();
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

        console.log("Nyan Cat Clicker Initialized!");
    }

    // --- 5. Start the game ---
    init();
});