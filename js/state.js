export let gameState = {};

export function getDefaultGameState() {
    return {
        coins: 0,
        rebirths: 0,
        rebirthPoints: 0,
        isRebirthing: false, // FIX: Flag to track if we are in the post-rebirth upgrade phase.
        
        purchaseMultiplierIndex: 0,
        upgrades: {},
        nyanTreeUpgrades: {},
        ownedSkins: ['default'],
        currentSkin: 'default',
        unlockedPlanets: ['earth'],
        currentPlanet: 'earth',
        unlockedAchievements: [],
        activeBoosts: {},
        settings: { volume: 0.5, sfx: true, music: true, devMode: false },
    };
}

// FIX: Added 'ALL' as a purchase multiplier option.
export const MULTIPLIERS = [1, 10, 50, 100, 'ALL'];
export const BASE_REBIRTH_COST = 1e7; // 10 Million

export function T(newState) {
    Object.assign(gameState, newState);
}