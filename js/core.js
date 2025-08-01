import { gameState, MULTIPLIERS, BASE_REBIRTH_COST } from './state.js';
import { UPGRADES_DATA } from './data.js';

export function getRebirthCost() {
    return BASE_REBIRTH_COST * Math.pow(1.5, gameState.rebirths);
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
    return totalMultiplier;
}

export function calculateTotalCPS(gs) {
    let baseCPS = 0;
    UPGRADES_DATA.forEach(upgrade => {
        if (upgrade.type === 'cps' && gs.upgrades[upgrade.id]) {
            baseCPS += upgrade.power * gs.upgrades[upgrade.id].owned;
        }
    });

    if (gs.nyanTreeUpgrades['cps_path_start']) {
        baseCPS *= 1.05;
    }

    let boostMultiplier = gs.activeBoosts.rainbowBoost ? 2 : 1;
    return baseCPS * getGlobalMultiplier(gs) * boostMultiplier;
}

// MODIFIED: Pass the 'gs' parameter to calculateTotalCPS
export function calculateClickPower(gs) {
    let clickPower = 1;
    
    UPGRADES_DATA.forEach(upgrade => {
        if (upgrade.type === 'click' && gs.upgrades[upgrade.id]) {
            clickPower += upgrade.power * gs.upgrades[upgrade.id].owned;
        }
    });

    if (gs.nyanTreeUpgrades['click_path_start']) {
        clickPower *= 1.05;
    }
    
    const cosmicClicksLevel = gs.nyanTreeUpgrades['click_path_2'] || 0;
    if (cosmicClicksLevel > 0) {
        const cpsBonus = calculateTotalCPS(gs) * (cosmicClicksLevel * 0.001); // Corrected this line
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