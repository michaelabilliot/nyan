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
        
        hasSeenRebirthGlow: false,

        purchaseMultiplierIndex: 0,
        upgrades: {},
        nyanTreeUpgrades: {},
        ownedSkins: ['default'],
        currentSkin: 'default',
        unlockedAchievements: [],
        activeBoosts: {},
        
        lastSaveTime: Date.now(),

        stats: {
            timePlayed: 0,
            totalCoinsEarned: 0,
            handmadeCoins: 0,
            rebirths: 0,
            goldenPoptartsClicked: 0,
        },

        settings: { 
            musicVolume: 0.15, 
            sfxVolume: 0.05, 
            sfx: true, 
            music: true, 
            devMode: false, 
            theme: 'light',
            globalMute: false,
            notation: 'standard',
            uiTheme: 'default',
        },
    };
}

export const MULTIPLIERS = [1, 10, 50, 100, 'ALL'];
export const BASE_REBIRTH_COST = 1e7;
export const REBIRTH_POINT_COST_INCREASE = 1.010;
export const UPGRADE_BOOST_MULTIPLIER = 1.25;

export function T(newState) {
    Object.assign(gameState, newState);
}