import { gameState, MULTIPLIERS, BASE_REBIRTH_COST, REBIRTH_POINT_COST_INCREASE } from './state.js';
import { UPGRADES_DATA, SKINS_DATA } from './data.js';
import { calculateMaxAffordable } from './utils.js'; // ADDED

export function getRebirthCost() {
    // This is now the cost for the *first* point.
    return BASE_REBIRTH_COST * Math.pow(1.5, gameState.rebirths);
}

// ADDED: New function for calculating rebirth points based on user's request
export function calculateRebirthPointsGained(coins, baseCost) {
    if (coins < baseCost) return 0;
    
    // We can model this as buying an "upgrade" where:
    // - baseCost is the cost of the first point
    // - costIncrease is the multiplier for each subsequent point
    // - currentCoins is the total coins we have
    // The "upgrade" object is just a mock for the function.
    const pointAffordability = {
        baseCost: baseCost,
        costIncrease: REBIRTH_POINT_COST_INCREASE
    };

    return calculateMaxAffordable(pointAffordability, 0, coins);
}

export function getGlobalMultiplier(gs) {
    let totalMultiplier = 1;
    const rebirthBonusPerLevel = gs.nyanTreeUpgrades['unique_path_2c'] ? 0.12 : 0.10;
    totalMultiplier += gs.rebirths * rebirthBonusPerLevel;
    const rainbowDriveLevel = gs.nyanTreeUpgrades['cps_path_2'] || 0;
    if (rainbowDriveLevel > 0) {
        totalMultiplier += (rainbowDriveLevel * 0.02 * gs.rebirths);
    }
    if (gs.nyanTreeUpgrades['unique_path_4b']) {
        totalMultiplier += (gs.unlockedAchievements.length * 0.01);
    }
    
    SKINS_DATA.forEach(skin => {
        if (gs.ownedSkins.includes(skin.id) && skin.bonus) {
            totalMultiplier += (skin.bonus.value - 1);
        }
    });

    return totalMultiplier;
}

export function calculateTotalCPS(gs) {
    let baseCPS = 0;
    UPGRADES_DATA.forEach(upgrade => {
        // MODIFIED: Check if upgrade is unlocked by rebirth level
        if (upgrade.type === 'cps' && (gs.rebirths >= (upgrade.rebirthUnlock || 0)) && gs.upgrades[upgrade.id]) {
            baseCPS += upgrade.power * gs.upgrades[upgrade.id].owned;
        }
    });

    if (gs.nyanTreeUpgrades['cps_path_start']) {
        baseCPS *= 1.05;
    }

    // Use boost value from gameState
    let boostMultiplier = gs.activeBoosts.goldenPoptart || 1;
    return baseCPS * getGlobalMultiplier(gs) * boostMultiplier;
}

export function calculateClickPower(gs) {
    let clickPower = 1;
    
    UPGRADES_DATA.forEach(upgrade => {
        // MODIFIED: Check if upgrade is unlocked by rebirth level
        if (upgrade.type === 'click' && (gs.rebirths >= (upgrade.rebirthUnlock || 0)) && gs.upgrades[upgrade.id]) {
            clickPower += upgrade.power * gs.upgrades[upgrade.id].owned;
        }
    });

    if (gs.nyanTreeUpgrades['click_path_start']) {
        clickPower *= 1.05;
    }
    
    const cosmicClicksLevel = gs.nyanTreeUpgrades['click_path_2'] || 0;
    if (cosmicClicksLevel > 0) {
        const cpsBonus = calculateTotalCPS(gs) * (cosmicClicksLevel * 0.001);
        clickPower += cpsBonus;
    }

    return clickPower * getGlobalMultiplier(gs);
}

export function getRebirthMultiplier() {
    const rebirthBonusPerLevel = gameState.nyanTreeUpgrades['unique_path_2c'] ? 0.12 : 0.10;
    return 1 + (gameState.rebirths * rebirthBonusPerLevel);
}

export function getPurchaseMultiplier() {
    return MULTIPLIERS[gameState.purchaseMultiplierIndex];
}

export function getBuildingCostDiscount() {
    const discountLevel = gameState.nyanTreeUpgrades['unique_path_start'] || 0;
    if (discountLevel > 0) {
        return 1 - (discountLevel * 0.02);
    }
    return 1;
}