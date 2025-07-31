
export let gameState = {};

export const defaultGameState = {
    coins: 0,
    rebirths: 0,
    rebirthPoints: 0,
    purchaseMultiplierIndex: 0,
    upgrades: {},
    ownedSkins: ['default'],
    currentSkin: 'default',
    unlockedPlanets: ['space'],
    currentPlanet: 'earth',
    unlockedAchievements: [],
    rebirthUpgrades: {},
    activeBoosts: {},
};

export const MULTIPLIERS = [1, 10, 50, 100];
export const REBIRTH_COST = 1e7;

export function T(newState) {
    Object.assign(gameState, newState);
}
