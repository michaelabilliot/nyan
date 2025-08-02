import { gameState, T } from './state.js';
import { UPGRADES_DATA } from './data.js';
import { getPurchaseMultiplier } from './core.js';
import { calculateCostForAmount, calculateMaxAffordable } from './utils.js';
import { playSfx } from './audio.js';
import { updateUpgradeStyles } from './ui.js'; // ADDED for immediate update

export function buyUpgrade(upgradeId) {
    const upgrade = UPGRADES_DATA.find(u => u.id === upgradeId);
    if (!upgrade) return;

    if (gameState.rebirths < (upgrade.rebirthUnlock || 0)) {
        return;
    }

    const owned = gameState.upgrades[upgradeId]?.owned || 0;
    const multiplier = getPurchaseMultiplier();
    
    let amountToBuy = 0;
    if (multiplier === 'ALL') {
        amountToBuy = calculateMaxAffordable(upgrade, owned, gameState.coins);
    } else {
        amountToBuy = multiplier;
    }

    if (amountToBuy <= 0) return;

    const totalCost = calculateCostForAmount(upgrade, owned, amountToBuy);

    // BUG FIX: Explicitly check if the player can afford the upgrade before buying.
    if (gameState.coins >= totalCost) {
        playSfx('upgradeBuy');
        const newCoins = gameState.coins - totalCost;
        T({ 
            ...gameState, 
            coins: newCoins,
            upgrades: {
                ...gameState.upgrades,
                [upgradeId]: { owned: owned + amountToBuy }
            }
        });

        updateUpgradeStyles();
    }
}
