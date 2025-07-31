import { gameState, MULTIPLIERS } from './state.js';
import { UPGRADES_DATA } from './data.js';

export function getPurchaseMultiplier() {
    return MULTIPLIERS[gameState.purchaseMultiplierIndex];
}

export function calculateTotalCPS() {
    let totalCPS = 0;
    UPGRADES_DATA.forEach(upgrade => {
        if (gameState.upgrades[upgrade.id]) {
            totalCPS += upgrade.power * gameState.upgrades[upgrade.id].owned;
        }
    });
    let boostMultiplier = gameState.activeBoosts.rainbowBoost ? 2 : 1;
    return totalCPS * getRebirthMultiplier() * boostMultiplier;
}

export function calculateClickPower() {
    let clickPower = 1;
    let cpcBonus = 1 + (gameState.rebirthUpgrades.permanent_cpc || 0) * 0.1;
    UPGRADES_DATA.forEach(upgrade => {
        if (upgrade.type === 'click' && gameState.upgrades[upgrade.id]) {
            clickPower += upgrade.power * gameState.upgrades[upgrade.id].owned;
        }
    });
    return clickPower * cpcBonus * getRebirthMultiplier();
}

export function getRebirthMultiplier() {
    return 1 + (gameState.rebirthUpgrades.permanent_cps || 0) * 0.05 + gameState.rebirths * 0.1;
}
