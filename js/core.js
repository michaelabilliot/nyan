import { gameState, MULTIPLIERS, BASE_REBIRTH_COST } from './state.js';
import { UPGRADES_DATA } from './data.js';

// FIX: New function for scaling rebirth cost.
export function getRebirthCost() {
    // Cost increases by 50% for each rebirth you've done.
    return BASE_REBIRTH_COST * Math.pow(1.5, gameState.rebirths);
}

export function getGlobalMultiplier() {
    let totalMultiplier = 1;
    const rebirthBonusPerLevel = gameState.nyanTreeUpgrades['unique_path_2c'] ? 0.12 : 0.10;
    totalMultiplier += gameState.rebirths * rebirthBonusPerLevel;
    const rainbowDriveLevel = gameState.nyanTreeUpgrades['cps_path_2'] || 0;
    if (rainbowDriveLevel > 0) {
        totalMultiplier += (rainbowDriveLevel * 0.02 * gameState.rebirths);
    }
    if (gameState.nyanTreeUpgrades['unique_path_4b']) {
        totalMultiplier += (gameState.unlockedAchievements.length * 0.01);
    }
    return totalMultiplier;
}

export function calculateTotalCPS() {
    let baseCPS = 0;
    UPGRADES_DATA.forEach(upgrade => {
        if (upgrade.type === 'cps' && gameState.upgrades[upgrade.id]) {
            baseCPS += upgrade.power * gameState.upgrades[upgrade.id].owned;
        }
    });

    if (gameState.nyanTreeUpgrades['cps_path_start']) { // Corrected from click_path_start
        baseCPS *= 1.05;
    }

    let boostMultiplier = gameState.activeBoosts.rainbowBoost ? 2 : 1;
    return baseCPS * getGlobalMultiplier() * boostMultiplier;
}

export function calculateClickPower() {
    let clickPower = 1;
    
    UPGRADES_DATA.forEach(upgrade => {
        if (upgrade.type === 'click' && gameState.upgrades[upgrade.id]) {
            clickPower += upgrade.power * gameState.upgrades[upgrade.id].owned;
        }
    });

    if (gameState.nyanTreeUpgrades['click_path_start']) {
        clickPower *= 1.05;
    }
    
    const cosmicClicksLevel = gameState.nyanTreeUpgrades['click_path_2'] || 0;
    if (cosmicClicksLevel > 0) {
        const cpsBonus = calculateTotalCPS() * (cosmicClicksLevel * 0.001);
        clickPower += cpsBonus;
    }

    return clickPower * getGlobalMultiplier();
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