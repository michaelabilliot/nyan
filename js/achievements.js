import { gameState, T } from './state.js';
import { calculateTotalCPS } from './core.js';
import { showAchievement } from './ui.js';
import { SKINS_DATA, NYAN_TREE_UPGRADES } from './data.js';

const checkAllInCategory = (gs, category) => {
    if (!ACHIEVEMENTS_DATA[category]) return false;
    return Object.keys(ACHIEVEMENTS_DATA[category]).every(id => gs.unlockedAchievements.includes(id));
}

// BUG FIX: Added the 'export' keyword here.
export const ACHIEVEMENTS_DATA = {
    Clicking: {
        'click_1': { name: 'The Journey Begins', description: 'Make your first click.', condition: (gs) => gs.totalClicks >= 1, progress: (gs) => gs.totalClicks / 1 },
        'click_100': { name: 'Getting Warmed Up', description: 'Click 100 times.', condition: (gs) => gs.totalClicks >= 100, progress: (gs) => gs.totalClicks / 100 },
        'click_1k': { name: 'Clicker Trainee', description: 'Click 1,000 times.', condition: (gs) => gs.totalClicks >= 1000, progress: (gs) => gs.totalClicks / 1000 },
        'click_10k': { name: 'Carpal Tunnel Incoming', description: 'Click 10,000 times.', condition: (gs) => gs.totalClicks >= 10000, progress: (gs) => gs.totalClicks / 10000 },
        'click_100k': { name: 'Master Clicker', description: 'Click 100,000 times.', condition: (gs) => gs.totalClicks >= 100000, progress: (gs) => gs.totalClicks / 100000 },
        'click_1m': { name: 'Mouse Destroyer', description: 'Click 1,000,000 times.', condition: (gs) => gs.totalClicks >= 1000000, progress: (gs) => gs.totalClicks / 1000000 },
        'click_10m': { name: 'Finger of the Gods', description: 'Click 10,000,000 times.', condition: (gs) => gs.totalClicks >= 10000000, progress: (gs) => gs.totalClicks / 10000000 },
    },
    Production: {
        'cps_1k': { name: 'Automatic Start', description: 'Reach 1,000 Nyan Coins per second.', condition: (gs) => calculateTotalCPS(gs) >= 1000, progress: (gs) => calculateTotalCPS(gs) / 1000 },
        'cps_100k': { name: 'Rainbow Engine', description: 'Reach 100,000 Nyan Coins per second.', condition: (gs) => calculateTotalCPS(gs) >= 100000, progress: (gs) => calculateTotalCPS(gs) / 100000 },
        'cps_1m': { name: 'Industrial Revolution', description: 'Reach 1 Million Nyan Coins per second.', condition: (gs) => calculateTotalCPS(gs) >= 1e6, progress: (gs) => calculateTotalCPS(gs) / 1e6 },
        'cps_100m': { name: 'Planetary Production', description: 'Reach 100 Million Nyan Coins per second.', condition: (gs) => calculateTotalCPS(gs) >= 1e8, progress: (gs) => calculateTotalCPS(gs) / 1e8 },
        'cps_1b': { name: 'Galactic Factory', description: 'Reach 1 Billion Nyan Coins per second.', condition: (gs) => calculateTotalCPS(gs) >= 1e9, progress: (gs) => calculateTotalCPS(gs) / 1e9 },
        'cps_1t': { name: 'Universal Output', description: 'Reach 1 Trillion Nyan Coins per second.', condition: (gs) => calculateTotalCPS(gs) >= 1e12, progress: (gs) => calculateTotalCPS(gs) / 1e12 },
    },
    Acquisition: {
        'coins_1k': { name: 'Coin Collector', description: 'Possess 1,000 Nyan Coins.', condition: (gs) => gs.coins >= 1000, progress: (gs) => gs.coins / 1000 },
        'coins_1m': { name: 'Nyan Millionaire', description: 'Possess 1 Million Nyan Coins.', condition: (gs) => gs.coins >= 1e6, progress: (gs) => gs.coins / 1e6 },
        'coins_1b': { name: 'Nyan Billionaire', description: 'Possess 1 Billion Nyan Coins.', condition: (gs) => gs.coins >= 1e9, progress: (gs) => gs.coins / 1e9 },
        'coins_1t': { name: 'Nyan Trillionaire', description: 'Possess 1 Trillion Nyan Coins.', condition: (gs) => gs.coins >= 1e12, progress: (gs) => gs.coins / 1e12 },
        'coins_1q': { name: 'Cosmic Tycoon', description: 'Possess 1 Quadrillion Nyan Coins.', condition: (gs) => gs.coins >= 1e15, progress: (gs) => gs.coins / 1e15 },
        'coins_1qt': { name: 'Nyan God', description: 'Possess 1 Quintillion Nyan Coins.', condition: (gs) => gs.coins >= 1e18, progress: (gs) => gs.coins / 1e18 },
    },
    Construction: {
        'upgrade_total_1': { name: 'First Step', description: 'Buy your first upgrade.', condition: (gs) => Object.keys(gs.upgrades).length > 0 },
        'upgrade_total_100': { name: 'Upgrade Enthusiast', description: 'Buy 100 total upgrades.', condition: (gs) => Object.values(gs.upgrades).reduce((sum, u) => sum + u.owned, 0) >= 100, progress: (gs) => Object.values(gs.upgrades).reduce((sum, u) => sum + u.owned, 0) / 100 },
        'upgrade_total_500': { name: 'Hoarder', description: 'Buy 500 total upgrades.', condition: (gs) => Object.values(gs.upgrades).reduce((sum, u) => sum + u.owned, 0) >= 500, progress: (gs) => Object.values(gs.upgrades).reduce((sum, u) => sum + u.owned, 0) / 500 },
        'upgrade_total_1k': { name: 'Architect', description: 'Buy 1,000 total upgrades.', condition: (gs) => Object.values(gs.upgrades).reduce((sum, u) => sum + u.owned, 0) >= 1000, progress: (gs) => Object.values(gs.upgrades).reduce((sum, u) => sum + u.owned, 0) / 1000 },
        'upgrade_total_2.5k': { name: 'Empire Builder', description: 'Buy 2,500 total upgrades.', condition: (gs) => Object.values(gs.upgrades).reduce((sum, u) => sum + u.owned, 0) >= 2500, progress: (gs) => Object.values(gs.upgrades).reduce((sum, u) => sum + u.owned, 0) / 2500 },
        'sprinkles_250': { name: 'Sweet Tooth', description: 'Own 250 Sprinkles.', condition: (gs) => gs.upgrades['sprinkles']?.owned >= 250, progress: (gs) => (gs.upgrades['sprinkles']?.owned || 0) / 250 },
        'lovebots_250': { name: 'Full of Love', description: 'Own 250 Lovebots.', condition: (gs) => gs.upgrades['lovebots']?.owned >= 250, progress: (gs) => (gs.upgrades['lovebots']?.owned || 0) / 250 },
        'rainbow_mice_250': { name: 'Pied Piper', description: 'Own 250 Rainbow Mice.', condition: (gs) => gs.upgrades['rainbow_mice']?.owned >= 250, progress: (gs) => (gs.upgrades['rainbow_mice']?.owned || 0) / 250 },
        'auto_petter_250': { name: 'Hands Off', description: 'Own 250 Auto-Petters.', condition: (gs) => gs.upgrades['auto_petter']?.owned >= 250, progress: (gs) => (gs.upgrades['auto_petter']?.owned || 0) / 250 },
        'catnip_farm_250': { name: 'Green Thumb', description: 'Own 250 Catnip Farms.', condition: (gs) => gs.upgrades['catnip_farm']?.owned >= 250, progress: (gs) => (gs.upgrades['catnip_farm']?.owned || 0) / 250 },
        'keyboard_cat_250': { name: 'Play Him Off', description: 'Own 250 Keyboard Cats.', condition: (gs) => gs.upgrades['keyboard_cat']?.owned >= 250, progress: (gs) => (gs.upgrades['keyboard_cat']?.owned || 0) / 250 },
        'laser_pointer_250': { name: 'Red Dot Obsession', description: 'Own 250 Laser Pointers.', condition: (gs) => gs.upgrades['laser_pointer']?.owned >= 250, progress: (gs) => (gs.upgrades['laser_pointer']?.owned || 0) / 250 },
        'yarn_ball_250': { name: 'All Tangled Up', description: 'Own 250 Yarn Balls.', condition: (gs) => gs.upgrades['yarn_ball']?.owned >= 250, progress: (gs) => (gs.upgrades['yarn_ball']?.owned || 0) / 250 },
        'quantum_mouse_250': { name: 'Schrödinger\'s Pet', description: 'Own 250 Quantum Mice.', condition: (gs) => gs.upgrades['quantum_mouse']?.owned >= 250, progress: (gs) => (gs.upgrades['quantum_mouse']?.owned || 0) / 250 },
        'rainbow_factory_250': { name: 'Double Rainbow', description: 'Own 250 Rainbow Factories.', condition: (gs) => gs.upgrades['rainbow_factory']?.owned >= 250, progress: (gs) => (gs.upgrades['rainbow_factory']?.owned || 0) / 250 },
        'meme_archive_250': { name: 'Ancient Knowledge', description: 'Own 250 Meme Archives.', condition: (gs) => gs.upgrades['meme_archive']?.owned >= 250, progress: (gs) => (gs.upgrades['meme_archive']?.owned || 0) / 250 },
        'poptart_catapult_250': { name: 'Breakfast Artillery', description: 'Own 250 Poptart Catapults.', condition: (gs) => gs.upgrades['poptart_catapult']?.owned >= 250, progress: (gs) => (gs.upgrades['poptart_catapult']?.owned || 0) / 250 },
        'nyan_choir_250': { name: 'Harmonic Convergence', description: 'Own 250 Nyan Choirs.', condition: (gs) => gs.upgrades['nyan_choir']?.owned >= 250, progress: (gs) => (gs.upgrades['nyan_choir']?.owned || 0) / 250 },
        'internet_core_250': { name: 'Series of Tubes', description: 'Own 250 Internet Cores.', condition: (gs) => gs.upgrades['internet_core']?.owned >= 250, progress: (gs) => (gs.upgrades['internet_core']?.owned || 0) / 250 },
        'singularity_250': { name: 'Event Horizon', description: 'Own 250 Singularities.', condition: (gs) => gs.upgrades['singularity']?.owned >= 250, progress: (gs) => (gs.upgrades['singularity']?.owned || 0) / 250 },
    },
    Prestige: {
        'rebirth_1': { name: 'Again!', description: 'Perform your first rebirth.', condition: (gs) => gs.rebirths >= 1, reward: 100000 },
        'rebirth_5': { name: 'Time Loop', description: 'Rebirth 5 times.', condition: (gs) => gs.rebirths >= 5, progress: (gs) => gs.rebirths / 5 },
        'rebirth_10': { name: 'Loop Master', description: 'Rebirth 10 times.', condition: (gs) => gs.rebirths >= 10, progress: (gs) => gs.rebirths / 10 },
        'rebirth_25': { name: 'Déjà Vu', description: 'Rebirth 25 times.', condition: (gs) => gs.rebirths >= 25, progress: (gs) => gs.rebirths / 25 },
        'rebirth_50': { name: 'Timeless Cat', description: 'Rebirth 50 times.', condition: (gs) => gs.rebirths >= 50, progress: (gs) => gs.rebirths / 50 },
        'rebirth_100': { name: 'Ouroboros', description: 'Rebirth 100 times.', condition: (gs) => gs.rebirths >= 100, progress: (gs) => gs.rebirths / 100 },
        'rp_10': { name: 'Tree Planter', description: 'Earn a total of 10 Rebirth Points.', condition: (gs) => (gs.rebirthPoints + Object.values(NYAN_TREE_UPGRADES).reduce((sum, u) => sum + (u.cost * (gs.nyanTreeUpgrades[u.id] || 0)), 0)) >= 10 },
        'rp_50': { name: 'Sapling', description: 'Earn a total of 50 Rebirth Points.', condition: (gs) => (gs.rebirthPoints + Object.values(NYAN_TREE_UPGRADES).reduce((sum, u) => sum + (u.cost * (gs.nyanTreeUpgrades[u.id] || 0)), 0)) >= 50 },
        'rp_100': { name: 'Cosmic Gardener', description: 'Earn a total of 100 Rebirth Points.', condition: (gs) => (gs.rebirthPoints + Object.values(NYAN_TREE_UPGRADES).reduce((sum, u) => sum + (u.cost * (gs.nyanTreeUpgrades[u.id] || 0)), 0)) >= 100 },
    },
    'Nyan Tree': {
        'tree_unlock_click': { name: 'Sharpened Claws', description: 'Unlock the clicking path in the Nyan Tree.', condition: (gs) => gs.nyanTreeUpgrades['click_path_start'] > 0 },
        'tree_unlock_cps': { name: 'Eternal Engine', description: 'Unlock the CPS path in the Nyan Tree.', condition: (gs) => gs.nyanTreeUpgrades['cps_path_start'] > 0 },
        'tree_unlock_unique': { name: 'Efficient Engineering', description: 'Unlock the utility path in the Nyan Tree.', condition: (gs) => gs.nyanTreeUpgrades['unique_path_start'] > 0 },
        'tree_end_click': { name: 'Peak Performance', description: 'Reach the end of a clicking branch.', condition: (gs) => gs.nyanTreeUpgrades['click_path_4a'] > 0 || gs.nyanTreeUpgrades['click_path_4b'] > 0 },
        'tree_end_cps': { name: 'Perpetual Motion', description: 'Reach the end of the CPS branch.', condition: (gs) => gs.nyanTreeUpgrades['cps_path_4'] > 0 },
        'tree_nodes_10': { name: 'Branching Out', description: 'Purchase 10 total node levels in the Nyan Tree.', condition: (gs) => Object.values(gs.nyanTreeUpgrades).reduce((a, b) => a + b, 0) >= 10, progress: (gs) => Object.values(gs.nyanTreeUpgrades).reduce((a, b) => a + b, 0) / 10 },
        'tree_nodes_25': { name: 'Full Canopy', description: 'Purchase 25 total node levels in the Nyan Tree.', condition: (gs) => Object.values(gs.nyanTreeUpgrades).reduce((a, b) => a + b, 0) >= 25, progress: (gs) => Object.values(gs.nyanTreeUpgrades).reduce((a, b) => a + b, 0) / 25 },
    },
    Collection: {
        'skins_all': { name: 'Fashionista', description: 'Own every skin.', condition: (gs) => SKINS_DATA.every(skin => skin.rebirthUnlock === 0 || gs.ownedSkins.includes(skin.id)) },
    },
    Mastery: {
        'achieve_10': { name: 'Getting Started', description: 'Unlock 10 achievements.', condition: (gs) => gs.unlockedAchievements.length >= 10, progress: (gs) => gs.unlockedAchievements.length / 10 },
        'achieve_25': { name: 'Dedicated', description: 'Unlock 25 achievements.', condition: (gs) => gs.unlockedAchievements.length >= 25, progress: (gs) => gs.unlockedAchievements.length / 25 },
        'achieve_50': { name: 'Completionist', description: 'Unlock 50 achievements.', condition: (gs) => gs.unlockedAchievements.length >= 50, progress: (gs) => gs.unlockedAchievements.length / 50 },
        'achieve_all_clicking': { name: 'Clicking God', description: 'Unlock all Clicking achievements.', condition: (gs) => checkAllInCategory(gs, 'Clicking') },
        'achieve_all_production': { name: 'Automation King', description: 'Unlock all Production achievements.', condition: (gs) => checkAllInCategory(gs, 'Production') },
        'achieve_all_construction': { name: 'Master Builder', description: 'Unlock all Construction achievements.', condition: (gs) => checkAllInCategory(gs, 'Construction') },
    },
    Miscellaneous: {
        'misc_dark_mode': { name: 'Hello Darkness', description: 'Check out the dark side.', condition: (gs) => gs.settings.theme === 'dark' },
        'misc_too_soon': { name: 'A Bit Ambitious', description: 'Try to rebirth before you can afford it.', condition: (gs) => gs.triedRebirthEarly },
        'misc_save_often': { name: 'Just In Case', description: 'The game has been saved.', condition: () => true, hidden: true },
        // BUG FIX: Rewrote condition to be more explicit and ensure it fires correctly.
        // This unlocks if the player owns 'Sprinkles' and 'Rainbow Mice' without owning 'Lovebots'.
        'misc_words_apart': { 
            name: 'Words Apart', 
            description: 'Sometimes you need to keep your worlds apart.', 
            isClickable: true, 
            condition: (gs) => {
                const hasSprinkles = gs.upgrades['sprinkles'] && gs.upgrades['sprinkles'].owned > 0;
                const hasLovebots = gs.upgrades['lovebots'] && gs.upgrades['lovebots'].owned > 0;
                const hasRainbowMice = gs.upgrades['rainbow_mice'] && gs.upgrades['rainbow_mice'].owned > 0;
                return hasSprinkles && !hasLovebots && hasRainbowMice;
            } 
        },
    }
};

const achievementGroups = {
    click: ['Clicking'],
    cps: ['Production'],
    coins: ['Acquisition'],
    upgrades: ['Construction'],
    rebirth: ['Prestige'],
    nyanTree: ['Nyan Tree'],
    collection: ['Collection'],
    mastery: ['Mastery'],
    misc: ['Miscellaneous']
};

export function checkAchievements(groupKey = null) {
    const checkAll = (category) => {
        if (!ACHIEVEMENTS_DATA[category]) return; // Safety check
        Object.keys(ACHIEVEMENTS_DATA[category]).forEach(id => {
            if (!gameState.unlockedAchievements.includes(id)) {
                const achievement = ACHIEVEMENTS_DATA[category][id];
                if (achievement.hidden) return;
                
                if (typeof achievement.condition === 'function' && achievement.condition(gameState)) {
                    T({
                        unlockedAchievements: [...gameState.unlockedAchievements, id],
                        coins: gameState.coins + (achievement.reward || 0),
                    });
                    showAchievement(achievement.name, achievement.description);
                    // Recursively check mastery achievements if a new achievement was unlocked
                    checkAchievements('mastery');
                }
            }
        });
    };

    if (groupKey) {
        if (achievementGroups[groupKey]) {
            achievementGroups[groupKey].forEach(checkAll);
        }
    } else {
        Object.keys(ACHIEVEMENTS_DATA).forEach(checkAll);
    }
}