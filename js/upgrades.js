import { gameState, T } from './state.js';
import { UPGRADES_DATA } from './data.js';
import { getPurchaseMultiplier } from './core.js';

export function buyUpgrade(id) {
    const upgrade = UPGRADES_DATA.find(u => u.id === id);
    if (!upgrade) return;

    const multiplier = getPurchaseMultiplier();
    
    // FIX: Added logic to handle the new 'ALL' multiplier.
    if (multiplier === 'ALL') {
        const affordableAmount = Math.floor(gameState.coins / upgrade.baseCost);
        if (affordableAmount > 0) {
            const totalCost = affordableAmount * upgrade.baseCost;
            T({ ...gameState, coins: gameState.coins - totalCost });
            if (!gameState.upgrades[id]) {
                gameState.upgrades[id] = { owned: 0 };
            }
            gameState.upgrades[id].owned += affordableAmount;
        }
    } else {
        const totalCost = upgrade.baseCost * multiplier;
        if (gameState.coins >= totalCost) {
            T({ ...gameState, coins: gameState.coins - totalCost });
            if (!gameState.upgrades[id]) {
                gameState.upgrades[id] = { owned: 0 };
            }
            gameState.upgrades[id].owned += multiplier;
        }
    }

    // This part is the same for both scenarios, so it's kept outside the if/else.
    const upgradeEl = document.querySelector(`.upgrade-item[data-id="${id}"]`);
    if (upgradeEl) {
        const ownedEl = upgradeEl.querySelector('.upgrade-owned');
        if (ownedEl) {
            ownedEl.textContent = gameState.upgrades[id]?.owned || 0;
        }
    }
}