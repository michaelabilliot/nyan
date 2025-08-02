import { gameState, T } from './state.js';
import { UPGRADES_DATA } from './data.js';
import { getPurchaseMultiplier, getBuildingCostDiscount } from './core.js';
import { calculateCostForAmount, calculateMaxAffordable } from './utils.js';

export function buyUpgrade(upgradeId) {
    const upgrade = UPGRADES_DATA.find(u => u.id === upgradeId);
    if (!upgrade) return false;

    if (gameState.rebirths < (upgrade.rebirthUnlock || 0)) {
        return false;
    }
    if (upgrade.nyanTreeUnlock && !gameState.nyanTreeUpgrades[upgrade.nyanTreeUnlock]) {
        return false;
    }

    // BUG FIX: Create a temporary discounted version of the upgrade for all calculations.
    const discount = getBuildingCostDiscount();
    const discountedUpgrade = { ...upgrade, baseCost: upgrade.baseCost * discount };

    const upgradeState = gameState.upgrades[upgradeId] || { owned: 0, boosts: 0 };
    const multiplier = getPurchaseMultiplier();
    
    let amountToBuy = 0;
    if (multiplier === 'ALL') {
        // Use the discounted object to find the max affordable amount.
        amountToBuy = calculateMaxAffordable(discountedUpgrade, upgradeState.owned, gameState.coins);
    } else {
        amountToBuy = multiplier;
    }

    if (amountToBuy <= 0) return false;

    // Use the discounted object to calculate the final cost.
    const totalCost = calculateCostForAmount(discountedUpgrade, upgradeState.owned, amountToBuy);

    if (gameState.coins >= totalCost) {
        const newCoins = gameState.coins - totalCost;
        T({ 
            coins: newCoins,
            upgrades: {
                ...gameState.upgrades,
                [upgradeId]: { 
                    ...upgradeState,
                    owned: upgradeState.owned + amountToBuy
                }
            }
        });
        return true;
    }

    return false;
}

export function buyUpgradeBoost(upgradeId, boostIndex) {
    const upgrade = UPGRADES_DATA.find(u => u.id === upgradeId);
    const upgradeState = gameState.upgrades[upgradeId];
    if (!upgrade || !upgradeState) return false;

    const purchasedBoosts = upgradeState.boosts || 0;
    const availableBoosts = Math.floor(upgradeState.owned / 25);

    if (boostIndex !== purchasedBoosts || purchasedBoosts >= availableBoosts) {
        return false;
    }

    const cost = upgrade.baseCost * 100 * Math.pow(25, boostIndex);

    if (gameState.coins >= cost) {
        T({
            coins: gameState.coins - cost,
            upgrades: {
                ...gameState.upgrades,
                [upgradeId]: {
                    ...upgradeState,
                    boosts: purchasedBoosts + 1
                }
            }
        });
        return true;
    }
    return false;
}