export let gameState = {};

export const defaultGameState = {
    coins: 0,
    rebirths: 0,
    rebirthPoints: 0,
    
    purchaseMultiplierIndex: 0,
    upgrades: {},
    // FIX: Added the missing nyanTreeUpgrades property to prevent crashes.
    nyanTreeUpgrades: {},
    ownedSkins: ['default'],
    currentSkin: 'default',
    unlockedPlanets: ['earth'],
    currentPlanet: 'earth',
    unlockedAchievements: [],
    rebirthUpgrades: {},
    activeBoosts: {},
    settings: { volume: 0.5, sfx: true, music: true, devMode: false },
};

export const MULTIPLIERS = [1, 10, 50, 100];
export const REBIRTH_COST = 1e7;

export function T(newState) {
    Object.assign(gameState, newState);
}