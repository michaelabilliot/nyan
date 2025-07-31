import {
    gameState, T, defaultGameState, REBIRTH_COST,
} from './state.js';
import {
    calculateClickPower, calculateTotalCPS,
} from './core.js';
import {
    updateDisplay, renderUpgrades, renderPlanets, showAchievement, formatNumber, renderShop,
} from './ui.js';
import { ACHIEVEMENTS_DATA, SKINS_DATA, PLANET_DATA } from './data.js';
import { buyUpgrade } from './upgrades.js';

export function changePlanet(planetId, renderPlanets, renderUpgrades) {
    T({ ...gameState, currentPlanet: planetId });
    document.body.style.backgroundImage = `url('${PLANET_DATA[planetId].background}')`;
    renderPlanets();
    renderUpgrades();
}

function showModal(modal) {
    modal.style.display = 'flex';
}

function hideModal(modal) {
    modal.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const nyanCatContainer = document.getElementById('nyan-cat-container');
    const nyanCatImage = document.getElementById('nyan-cat-image');
    const multiplierBtn = document.getElementById('multiplier-btn');
    const rebirthBtn = document.getElementById('rebirth-btn');
    const shopBtn = document.getElementById('shop-btn');
    const shopModal = document.getElementById('shop-modal');
    const rainbowContainer = document.getElementById('rainbow-container');
    const resetGameBtn = document.getElementById('reset-game-btn');
    const achievementToast = document.getElementById('achievement-toast');

    function handleCatClick(event) {
        // playSound('assets/click.mp3');
        T({ ...gameState, coins: gameState.coins + calculateClickPower() });

        const numberEl = document.createElement('div');
        numberEl.className = 'floating-number';
        numberEl.textContent = `+${formatNumber(calculateClickPower())}`;
        numberEl.style.left = `${event.clientX}px`;
        numberEl.style.top = `${event.clientY}px`;
        document.body.appendChild(numberEl);
        setTimeout(() => numberEl.remove(), 1200);

        checkAchievements();
        updateDisplay();
    }

    function tick() {
        T({ ...gameState, coins: gameState.coins + calculateTotalCPS() / 10 });
        updateDisplay();
        checkAchievements();
    }

    function cycleMultiplier() {
        const newIndex = (gameState.purchaseMultiplierIndex + 1) % 4;
        T({ ...gameState, purchaseMultiplierIndex: newIndex });
        multiplierBtn.textContent = `${[1, 10, 50, 100][newIndex]}x`;
        renderUpgrades();
    }

    function handleRebirth() {
        if (gameState.coins >= REBIRTH_COST) {
            if (confirm(`Are you sure you want to rebirth? You will lose coins and upgrades for permanent bonuses!`)) {
                const pointsGained = Math.floor(Math.log10(gameState.coins / REBIRTH_COST)) + 1;
                T({
                    ...defaultGameState,
                    rebirths: gameState.rebirths + 1,
                    rebirthPoints: gameState.rebirthPoints + pointsGained,
                    unlockedPlanets: gameState.unlockedPlanets,
                    ownedSkins: gameState.ownedSkins,
                    currentSkin: gameState.currentSkin,
                    rebirthUpgrades: gameState.rebirthUpgrades,
                });
                updateDisplay();
                renderUpgrades();
                checkAchievements();
                playSound('assets/rebirth.mp3');
            }
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
                        coins: gameState.coins + ACHIEVEMENTS_DATA[id].reward,
                    });
                    showAchievement(ACHIEVEMENTS_DATA[id].name, ACHIEVEMENTS_DATA[id].description);
                    playSound('assets/achievement.mp3');
                }
            }
        });
    }

    function playSound(src) {
        new Audio(src).play().catch(e => console.log("Audio play failed. User interaction needed."));
    }

    function saveGame() {
        localStorage.setItem('nyanClickerSaveV5', JSON.stringify(gameState));
    }

    function loadGame() {
        const savedState = localStorage.getItem('nyanClickerSaveV5');
        T(savedState ? { ...defaultGameState, ...JSON.parse(savedState) } : { ...defaultGameState });
    }

    function resetGame() {
        if (confirm("Are you sure? This will wipe all your progress!")) {
            localStorage.removeItem('nyanClickerSaveV5');
            location.reload();
            renderPlanets();
            renderUpgrades();
        }
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

        particle.style.left = `${catRect.left - containerRect.left + (catRect.width / 2) - 100}px`;
        particle.style.top = `${catRect.top - containerRect.top + (catRect.height / 2) - (currentSkinData.trailHeight / 2)}px`;

        rainbowContainer.appendChild(particle);
        particle.animate([{ transform: 'translateX(0)' }, { transform: `translateX(-${window.innerWidth * 0.7}px)` }], { duration: 3000, easing: 'linear' });
        setTimeout(() => particle.remove(), 3000);

        requestAnimationFrame(animate);
    }

    function showModal(modal) {
        modal.style.display = 'flex';
    }

    function hideModal(modal) {
        modal.style.display = 'none';
    }

    function init() {
        loadGame();
        nyanCatImage.addEventListener('click', handleCatClick);
        rebirthBtn.addEventListener('click', handleRebirth);
        multiplierBtn.addEventListener('click', cycleMultiplier);
        resetGameBtn.addEventListener('click', resetGame);
        shopBtn.addEventListener('click', () => { 
            renderShop();
            showModal(shopModal); 
        });
        document.querySelectorAll('.close-modal-btn').forEach(btn => btn.addEventListener('click', (e) => hideModal(e.target.closest('.modal-overlay'))));

        const currentSkin = SKINS_DATA.find(s => s.id === gameState.currentSkin) || SKINS_DATA[0];
        nyanCatImage.src = currentSkin.image;
        changePlanet(gameState.currentPlanet, renderPlanets, renderUpgrades);
        multiplierBtn.textContent = `${[1, 10, 50, 100][gameState.purchaseMultiplierIndex]}x`;
        setInterval(tick, 100);
        setInterval(saveGame, 5000);
        requestAnimationFrame(animate);
        console.log("Nyan Cat Clicker Initialized!");
    }

    init();
});
