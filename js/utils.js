import { gameState } from './state.js';

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

// ADDED/MOVED: Enhanced formatNumber function
const SUFFIXES = ["", "M", "B", "T", "Q", "Qt", "S", "Sp", "O", "N", "Dc", "UDc", "DDc"];
export function formatNumber(num, isFloat = false) {
    if (gameState.isWordMode) return gameState.wordModeText.numbers;
    if (num === Infinity) return '∞';
    if (num < 1000000 && !isFloat) return Math.floor(num).toLocaleString('en-US');
    if (num < 1000000 && isFloat) return num.toFixed(2);

    const notation = gameState.settings.notation || 'standard';

    if (notation === 'scientific' || notation === 'engineering') {
        const exponent = Math.floor(Math.log10(num));
        let base;
        let exp;
        if (notation === 'engineering') {
            exp = exponent - (exponent % 3);
            base = num / Math.pow(10, exp);
        } else {
            exp = exponent;
            base = num / Math.pow(10, exp);
        }
        return `${base.toFixed(2)}e+${exp}`;
    }

    // Standard notation
    const tier = Math.floor(Math.log10(Math.abs(num)) / 3);
    if (tier < SUFFIXES.length) {
        const suffix = SUFFIXES[tier - 1];
        const scale = Math.pow(10, tier * 3);
        const scaled = num / scale;
        const formatted = scaled.toFixed(2);
        const parts = formatted.split('.');
        return `${parts[0]}.<span class="decimal-part">${parts[1]}</span>${suffix ? `<span class="suffix-part">${suffix}</span>` : ''}`;
    }
    
    return num.toExponential(2);
}

// ADDED: Utility for smooth counter animation
let animationFrame;
export function animateCounter(el, start, end, duration) {
    if (animationFrame) cancelAnimationFrame(animationFrame);

    const range = end - start;
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const currentVal = start + range * progress;
        el.innerHTML = formatNumber(currentVal);

        if (progress < 1) {
            animationFrame = requestAnimationFrame(step);
        } else {
            el.innerHTML = formatNumber(end);
        }
    }
    animationFrame = requestAnimationFrame(step);
}

// ADDED: Deep merge utility for loading saves
export function deepMerge(target, source) {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}