import { gameState, T } from './state.js';
import { UPGRADES_DATA } from './data.js';
import { getPurchaseMultiplier } from './core.js';
import { calculateCostForAmount, calculateMaxAffordable } from './utils.js';

export function buyUpgrade(id) {
    const upgrade = UPGRADES_DATA.find(u => u.id === id);
    if (!upgrade) return;

    const owned = gameState.upgrades[id]?.owned || 0;
    const multiplier = getPurchaseMultiplier();
    
    let amountToBuy = 0;
    if (multiplier === 'ALL') {
        amountToBuy = calculateMaxAffordable(upgrade, owned, gameState.coins);
    } else {
        amountToBuy = multiplier;
    }

    if (amountToBuy <= 0) return;

    const totalCost = calculateCostForAmount(upgrade, owned, amountToBuy);

    if (gameState.coins >= totalCost) {
        T({ 
            ...gameState, 
            coins: gameState.coins - totalCost,
            upgrades: {
                ...gameState.upgrades,
                [id]: { owned: owned + amountToBuy }
            }
        });
    }
}