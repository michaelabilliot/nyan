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
        
        // ADDED: Last save time for offline progress
        lastSaveTime: Date.now(),

        // ADDED: Statistics tracking
        stats: {
            timePlayed: 0, // in seconds
            totalCoinsEarned: 0,
            handmadeCoins: 0, // coins from clicks
            rebirths: 0, // total rebirths ever
            goldenPoptartsClicked: 0,
        },

        settings: { 
            musicVolume: 0.5, 
            sfxVolume: 0.8, 
            sfx: true, 
            music: true, 
            devMode: false, 
            theme: 'light',
            // ADDED: New settings
            globalMute: false,
            notation: 'standard', // 'standard', 'scientific', 'engineering'
            uiTheme: 'default', // 'default', 'vaporwave', 'matrix'
        },
    };
}

export const MULTIPLIERS = [1, 10, 50, 100, 'ALL'];
export const BASE_REBIRTH_COST = 1e7;

// ADDED: New constant for rebirth point cost scaling
export const REBIRTH_POINT_COST_INCREASE = 1.010;


export function T(newState) {
    Object.assign(gameState, newState);
}