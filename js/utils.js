// js/utils.js

/**
 * Calculates the total cost to buy a certain number of upgrades, accounting for scaling costs.
 * Uses the formula for the sum of a geometric series.
 * @param {object} upgrade - The upgrade data object.
 * @param {number} owned - The number of this upgrade currently owned.
 * @param {number} amountToBuy - The number of upgrades to purchase.
 * @returns {number} The total cost.
 */
export function calculateCostForAmount(upgrade, owned, amountToBuy) {
    if (amountToBuy <= 0) return 0;
    const r = upgrade.costIncrease;
    // The first term in our series is the cost of the (owned + 1)th item.
    const firstTermCost = upgrade.baseCost * Math.pow(r, owned);

    // If cost doesn't increase, it's a simple multiplication.
    if (r === 1) {
        return firstTermCost * amountToBuy;
    }

    // Standard formula for the sum of a geometric series: a * (r^n - 1) / (r - 1)
    return firstTermCost * (Math.pow(r, amountToBuy) - 1) / (r - 1);
}

/**
 * Calculates the maximum number of upgrades that can be afforded with the given amount of coins.
 * @param {object} upgrade - The upgrade data object.
 * @param {number} owned - The number of this upgrade currently owned.
 * @param {number} currentCoins - The player's current coin total.
 * @returns {number} The maximum affordable amount.
 */
export function calculateMaxAffordable(upgrade, owned, currentCoins) {
    const r = upgrade.costIncrease;
    const costOfNext = upgrade.baseCost * Math.pow(r, owned);

    // If we can't even afford one, return 0.
    if (currentCoins < costOfNext) {
        return 0;
    }
    
    // If cost doesn't increase, it's a simple division.
    if (r === 1) {
        return Math.floor(currentCoins / costOfNext);
    }

    // This formula is derived from the geometric series sum formula to solve for n (amountToBuy).
    // n = log_r ( (Sum * (r-1) / a) + 1 )
    const affordableAmount = Math.floor(
        Math.log( (currentCoins * (r - 1)) / costOfNext + 1 ) / Math.log(r)
    );
    
    return affordableAmount;
}