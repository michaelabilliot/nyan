import { gameState, T } from './state.js';
import { formatNumber, updateDisplay } from './ui.js';

export const NYAN_TREE_UPGRADES = [
    // Main Branch (Core Boosts)
    { id: 'cosmic_clicks', name: 'Cosmic Clicks', description: 'Permanently increases base click power by 2% per level.', cost: 1, maxLevel: 10, dependencies: [] },
    { id: 'eternal_engine', name: 'Eternal Engine', description: 'Permanently increases base CPS by 1% per level.', cost: 1, maxLevel: 10, dependencies: [] },
    { id: 'efficient_engineering', name: 'Efficient Engineering', description: 'All upgrades are 1% cheaper per level.', cost: 5, maxLevel: 5, dependencies: [] },

    // Exploration Branch (Unlocks Planets)
    { id: 'unlock_mars_exploration', name: 'Unlock Mars Exploration', description: 'Unlocks Mars and its associated upgrades in the main shop.', cost: 2, maxLevel: 1, dependencies: [] },
    { id: 'unlock_nyan_planet_voyage', name: 'Unlock Nyan Planet Voyage', description: 'Unlocks the Nyan Planet.', cost: 10, maxLevel: 1, dependencies: ['unlock_mars_exploration'] },

    // Special Branch (Unique Abilities)
    { id: 'golden_touch', name: 'Golden Touch', description: 'Makes the Golden Nyan skin a prestige unlock instead of a coin purchase.', cost: 3, maxLevel: 1, dependencies: [] },
    { id: 'rebirth_multiplier_boost', name: 'Rebirth Multiplier Boost', description: 'Increase the bonus from the main Rebirth button from +10% to +12%.', cost: 5, maxLevel: 1, dependencies: [] },
];

export function renderNyanTree() {
    const nyanTreeGrid = document.getElementById('nyan-tree-grid');
    nyanTreeGrid.innerHTML = '';
    NYAN_TREE_UPGRADES.forEach(upgrade => {
        const card = document.createElement('div');
        card.className = 'upgrade-item'; // Reusing upgrade-item style for now
        card.dataset.id = upgrade.id;

        const ownedLevel = gameState.nyanTreeUpgrades[upgrade.id] || 0;
        const isMaxLevel = upgrade.maxLevel && ownedLevel >= upgrade.maxLevel;
        const isAffordable = gameState.rebirthPoints >= upgrade.cost;
        const dependenciesMet = upgrade.dependencies.every(depId => (gameState.nyanTreeUpgrades[depId] || 0) > 0);
        const isLocked = !dependenciesMet;

        if (isLocked) {
            card.classList.add('disabled');
        } else if (!isAffordable) {
            card.classList.add('disabled');
        } else if (isMaxLevel) {
            card.classList.add('purchased');
        }

        let levelText = '';
        if (upgrade.maxLevel) {
            levelText = `Level: ${ownedLevel}/${upgrade.maxLevel}`;
        } else {
            levelText = ownedLevel > 0 ? 'Purchased' : '';
        }

        card.innerHTML = `
            <div class="upgrade-header">
                <span class="upgrade-name">${upgrade.name}</span>
                <span class="upgrade-owned">${levelText}</span>
            </div>
            <p class="upgrade-desc">${upgrade.description}</p>
            <div class="upgrade-info">
                <span class="upgrade-cost">Cost: ${upgrade.cost} Rebirth Points</span>
            </div>
        `;

        if (!isLocked && isAffordable && !isMaxLevel) {
            card.addEventListener('click', () => {
                if (gameState.rebirthPoints >= upgrade.cost) {
                    T({
                        ...gameState,
                        rebirthPoints: gameState.rebirthPoints - upgrade.cost,
                        nyanTreeUpgrades: {
                            ...gameState.nyanTreeUpgrades,
                            [upgrade.id]: (gameState.nyanTreeUpgrades[upgrade.id] || 0) + 1
                        }
                    });
                    renderNyanTree();
                    updateDisplay();
                }
            });
        }
        nyanTreeGrid.appendChild(card);
    });
}
