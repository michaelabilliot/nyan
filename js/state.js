export let gameState = {};

export function getDefaultGameState() {
    return {
        coins: 0,
        totalClicks: 0, 
        rebirths: 0,
        rebirthPoints: 0,
        isRebirthing: false, 
        triedRebirthEarly: false, 
        isWordMode: false, 
        
        purchaseMultiplierIndex: 0,
        upgrades: {},
        nyanTreeUpgrades: {},
        ownedSkins: ['default'],
        currentSkin: 'default',
        unlockedAchievements: [],
        activeBoosts: {},
        settings: { 
            musicVolume: 0.5, 
            sfxVolume: 0.8, 
            sfx: true, 
            music: true, 
            devMode: false, 
            theme: 'light' 
        },
    };
}

export const MULTIPLIERS = [1, 10, 50, 100, 'ALL'];
export const BASE_REBIRTH_COST = 1e7;

export function T(newState) {
    Object.assign(gameState, newState);
}