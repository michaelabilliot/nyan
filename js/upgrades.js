import { gameState, T } from './state.js';
import { UPGRADES_DATA } from './data.js';
import { getPurchaseMultiplier } from './core.js';
import { renderUpgrades } from './ui.js';

export function buyUpgrade(id) {
    const upgrade = UPGRADES_DATA.find(u => u.id === id);
    if (!upgrade) return;

    const multiplier = getPurchaseMultiplier();
    let totalCost = 0;
    const owned = gameState.upgrades[upgrade.id]?.owned || 0;

    for (let i = 0; i < multiplier; i++) {
        totalCost += Math.ceil(upgrade.baseCost * Math.pow(upgrade.costIncrease, owned + i));
    }

    if (gameState.coins >= totalCost) {
        T({ ...gameState, coins: gameState.coins - totalCost });
        if (!gameState.upgrades[id]) {
            gameState.upgrades[id] = { owned: 0 };
        }
        gameState.upgrades[id].owned += multiplier;
        renderUpgrades();
    }
}
