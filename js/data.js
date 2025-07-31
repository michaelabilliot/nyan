export const PLANET_DATA = {
    earth: { name: 'Earth', unlockCost: 0 },
    mars: { name: 'Mars', unlockCost: 1e9 },
    nyan: { name: 'Nyan Planet', unlockCost: 1e12 }
};

export const UPGRADES_DATA = [
    // Earth
    { id: 'sprinkles', name: 'Sprinkles', description: 'Sweetens your clicks.', type: 'click', baseCost: 50, power: 1, costIncrease: 1.07, planet: 'earth' },
    { id: 'lovebots', name: 'Lovebots', description: 'Generates Nyan affection automatically.', type: 'cps', baseCost: 125, power: 1, costIncrease: 1.08, planet: 'earth' },
    { id: 'rainbow_mice', name: 'Rainbow Mice', description: 'These colorful critters boost your CPS.', type: 'click', baseCost: 500, power: 5, costIncrease: 1.07, planet: 'earth' },
    { id: 'auto_petter', name: 'Auto-Petter', description: 'Keeps Nyan happy, increasing click power.', type: 'cps', baseCost: 1100, power: 6, costIncrease: 1.08, planet: 'earth' },
    { id: 'catnip_farm', name: 'Catnip Farm', description: 'A steady supply of high-quality catnip.', type: 'click', baseCost: 12000, power: 100, costIncrease: 1.07, planet: 'earth' },
    { id: 'keyboard_cat', name: 'Keyboard Cat', description: 'Plays you off to higher CPS.', type: 'cps', baseCost: 50000, power: 200, costIncrease: 1.08, planet: 'earth' },
    { id: 'laser_pointer', name: 'Laser Pointer', description: 'Focuses Nyan\'s energy for powerful clicks.', type: 'click', baseCost: 100000, power: 80, costIncrease: 1.07, planet: 'earth' },
    { id: 'yarn_ball', name: 'Yarn Ball', description: 'A classic toy for a classic cat.', type: 'cps', baseCost: 315000, power: 5000, costIncrease: 1.08, planet: 'earth' },
	{ id: 'quantum_mouse', name: 'Quantum Mouse', description: 'A mouse that exists in multiple places at once, boosting your clicks.', type: 'click', baseCost: 2.2e7, power: 9000, costIncrease: 1.07, planet: 'earth' },
    { id: 'rainbow_factory', name: 'Rainbow Factory', description: 'Mass produces rainbows, a key ingredient in Nyan Coins.', type: 'cps', baseCost: 8.1e7, power: 100000, costIncrease: 1.08, planet: 'earth' },
    { id: 'meme_archive', name: 'Meme Archive', description: 'Unlocks ancient memes, giving you powerful clicks.', type: 'click', baseCost: 3e8, power: 25000, costIncrease: 1.07, planet: 'earth' },
    { id: 'poptart_catapult', name: 'Poptart Catapult', description: 'Launches Poptarts into the cosmos, generating coins.', type: 'cps', baseCost: 9e8, power: 200000, costIncrease: 1.08, planet: 'earth' },
    { id: 'nyan_choir', name: 'Nyan Choir', description: 'A choir of Nyan Cats singing the song of their people, boosting CPS.', type: 'click', baseCost: 1.8e9, power: 100000, costIncrease: 1.07, planet: 'earth' },
    { id: 'internet_core', name: 'Internet Core', description: 'Harness the power of the internet itself for massive click power.', type: 'cps', baseCost: 3e9, power: 15000000, costIncrease: 1.08, planet: 'earth' },
    { id: 'singularity', name: 'The Singularity', description: 'Become one with the Nyanverse. The ultimate CPS upgrade.', type: 'click', baseCost: 2e12, power: 200000, costIncrease: 1.07, planet: 'earth' },
	
    // Mars
    { id: 'space_rover', name: 'Space Rover', description: 'Collects space dust for coins.', type: 'cps', baseCost: 1e9, power: 1e6, costIncrease: 1.15, planet: 'mars' },
    { id: 'alien_catnip', name: 'Alien Catnip', description: 'Makes clicks otherworldly powerful.', type: 'click', baseCost: 5e9, power: 5e5, costIncrease: 1.12, planet: 'mars' },
    { id: 'mars_rover', name: 'Mars Rover', description: 'A more advanced rover for Mars exploration.', type: 'cps', baseCost: 1e10, power: 1e7, costIncrease: 1.16, planet: 'mars' },
    { id: 'red_planet_mice', name: 'Red Planet Mice', description: 'Martian mice that are surprisingly good at clicking.', type: 'click', baseCost: 5e10, power: 5e6, costIncrease: 1.13, planet: 'mars' },
    { id: 'space_elevator', name: 'Space Elevator', description: 'Connects Earth and Mars for faster resource transfer.', type: 'cps', baseCost: 1e11, power: 1e8, costIncrease: 1.17, planet: 'mars' },
    { id: 'zero_g_yarn', name: 'Zero-G Yarn', description: 'Yarn that floats, providing endless entertainment.', type: 'cps', baseCost: 5e11, power: 5e8, costIncrease: 1.18, planet: 'mars' },
    { id: 'starship', name: 'Starship', description: 'A vessel for interstellar travel and commerce.', type: 'cps', baseCost: 1e12, power: 1e9, costIncrease: 1.19, planet: 'mars' },
    { id: 'wormhole_generator', name: 'Wormhole Generator', description: 'Bend space-time to your will.', type: 'click', baseCost: 5e12, power: 5e9, costIncrease: 1.14, planet: 'mars' },
    // Nyan Planet
    { id: 'meme_factory', name: 'Meme Factory', description: 'Mass produces viral Nyan content.', type: 'cps', baseCost: 1e12, power: 1e9, costIncrease: 1.18, planet: 'nyan' },
    { id: 'internet_altar', name: 'Internet Altar', description: 'Harnesses the power of worship for clicks.', type: 'click', baseCost: 8e12, power: 1e8, costIncrease: 1.15, planet: 'nyan' },
    { id: 'nyan_university', name: 'Nyan University', description: 'Where all the cool cats learn to code.', type: 'cps', baseCost: 1e13, power: 1e10, costIncrease: 1.19, planet: 'nyan' },
    { id: 'black_hole_mouse', name: 'Black Hole Mouse', description: 'A mouse so dense, it has its own gravity.', type: 'click', baseCost: 5e13, power: 5e9, costIncrease: 1.16, planet: 'nyan' },
    { id: 'rainbow_foundry', name: 'Rainbow Foundry', description: 'Forges rainbows into pure CPS.', type: 'cps', baseCost: 1e14, power: 1e11, costIncrease: 1.20, planet: 'nyan' },
    { id: 'interdimensional_yarn', name: 'Interdimensional Yarn', description: 'Yarn that exists in multiple dimensions at once.', type: 'cps', baseCost: 5e14, power: 5e11, costIncrease: 1.21, planet: 'nyan' },
    { id: 'singularity_cat', name: 'Singularity Cat', description: 'A cat that is also a black hole.', type: 'cps', baseCost: 1e15, power: 1e12, costIncrease: 1.22, planet: 'nyan' },
    { id: 'god_cat', name: 'God Cat', description: 'The ultimate being.', type: 'click', baseCost: 5e15, power: 5e12, costIncrease: 1.17, planet: 'nyan' },
];

export const SKINS_DATA = [ 
    { id: 'default', name: 'Classic Nyan', cost: 0, image: 'assets/nyan-cat.png', trail: 'assets/rainbow-slice.png', trailHeight: 200 }, 
    // FIX: Changed bonus type from 'cpc' to 'npc'
    { id: 'golden', name: 'Golden Nyan', cost: 1e8, image: 'assets/nyan-cat.png', bonus: {type: 'npc', value: 1.05}, trail: 'assets/rainbow-slice.png', trailHeight: 140 },
    { id: 'pan', name: 'Pan Nyan', cost: 250000, image: 'assets/nyan-cat.png', trail: 'assets/pan-rainbow-slice.png', trailHeight: 180 }
];

export const ACHIEVEMENTS_DATA = {
    'first_click': { name: 'The Journey Begins', description: 'Make your first click.', condition: () => true, reward: 10 },
    'coins_1k': { name: 'Coin Collector', description: 'Earn 1,000 Nyan Coins.', condition: (gameState) => gameState.coins >= 1000, reward: 100 },
    'upgrade_100': { name: 'Upgrade Enthusiast', description: 'Buy 100 total upgrades.', condition: (gameState) => Object.values(gameState.upgrades).reduce((sum, u) => sum + u.owned, 0) >= 100, reward: 10000 },
    'first_rebirth': { name: 'Again!', description: 'Perform your first rebirth.', condition: (gameState) => gameState.rebirths >= 1, reward: 100000 },
};

export const NYAN_TREE_UPGRADES = [
    { "id": "starter", "name": "Nyan Genesis", "description": "The beginning of your cosmic journey. Unlocks the first upgrade paths.", "cost": 0, "maxLevel": 1, "dependencies": [], "x": 797, "y": 377, "icon": "assets/tree.png", "isStarter": true },
    { "id": "click_path_start", "name": "Sharpened Claws", "description": "Increases base click power by 5%.", "cost": 1, "maxLevel": 1, "dependencies": [ "starter" ], "x": 746, "y": 288, "icon": "assets/tree.png" },
    { "id": "click_path_2", "name": "Cosmic Clicks", "description": "Click power is now boosted by 0.1% of your total CPS per level.", "cost": 2, "maxLevel": 5, "dependencies": [ "click_path_start" ], "x": 747, "y": 166, "icon": "assets/tree.png" },
    { "id": "click_path_3", "name": "Galactic Pointer", "description": "Unlocks a powerful new clicking upgrade in the main shop.", "cost": 3, "maxLevel": 1, "dependencies": [ "click_path_2" ], "x": 660, "y": 82, "icon": "assets/tree.png" },
    { "id": "click_path_4a", "name": "Critical Clicks", "description": "Clicks have a small chance to produce 100x more coins.", "cost": 5, "maxLevel": 1, "dependencies": [ "click_path_3" ], "x": 502, "y": 80, "icon": "assets/tree.png" },
    { "id": "click_path_4b", "name": "Click Frenzy", "description": "Clicking 15 times in 2 seconds grants a temporary massive boost.", "cost": 5, "maxLevel": 1, "dependencies": [ "click_path_3" ], "x": 708, "y": -20, "icon": "assets/tree.png" },
    { "id": "cps_path_start", "name": "Eternal Engine", "description": "Increases base CPS by 5%.", "cost": 1, "maxLevel": 1, "dependencies": [ "starter" ], "x": 960, "y": 407, "icon": "assets/tree.png" },
    { "id": "cps_path_2", "name": "Rainbow Drive", "description": "CPS is further boosted by 2% per rebirth, per level.", "cost": 2, "maxLevel": 5, "dependencies": [ "cps_path_start" ], "x": 1065, "y": 314, "icon": "assets/tree.png" },
    { "id": "cps_path_3", "name": "Poptart Singularity", "description": "Unlocks a powerful new CPS building in the main shop.", "cost": 3, "maxLevel": 1, "dependencies": [ "cps_path_2" ], "x": 1222, "y": 309, "icon": "assets/tree.png" },
    { "id": "cps_path_4", "name": "Idleverse", "description": "Generate 10% of your CPS while the game is closed.", "cost": 10, "maxLevel": 1, "dependencies": ["cps_path_3", "unique_path_4b"], "x": 1355, "y": 403, "icon": "assets/tree.png" },
    { "id": "unique_path_start", "name": "Efficient Engineering", "description": "All building costs are permanently reduced by 2% per level.", "cost": 1, "maxLevel": 5, "dependencies": [ "starter" ], "x": 633, "y": 467, "icon": "assets/tree.png" },
    { "id": "unique_path_2a", "name": "Golden Touch", "description": "Makes the Golden Nyan skin a prestige unlock instead of a coin purchase.", "cost": 3, "maxLevel": 1, "dependencies": [ "unique_path_start" ], "x": 673, "y": 551, "icon": "assets/tree.png" },
    { "id": "unique_path_2b", "name": "Planet Unlocker", "description": "Reduces the coin cost to unlock new planets by 25%.", "cost": 5, "maxLevel": 1, "dependencies": [ "unique_path_start" ], "x": 574, "y": 580, "icon": "assets/tree.png" },
    { "id": "unique_path_2c", "name": "Rebirth Boost", "description": "The base multiplier from Rebirthing is increased from +10% to +12%.", "cost": 2, "maxLevel": 1, "dependencies": [ "unique_path_start" ], "x": 514, "y": 507, "icon": "assets/tree.png" },
    { "id": "unique_path_2d", "name": "Point Doubler", "description": "You have a 5% chance to gain double the Rebirth Points when you rebirth.", "cost": 4, "maxLevel": 1, "dependencies": [ "unique_path_start" ], "x": 545, "y": 428, "icon": "assets/tree.png" },
    { "id": "unique_path_3a", "name": "Gilded Clicks", "description": "Golden Nyan skin also provides a +5% CPS bonus.", "cost": 5, "maxLevel": 1, "dependencies": [ "unique_path_2a" ], "x": 755, "y": 659, "icon": "assets/tree.png" },
    { "id": "unique_path_3b", "name": "Free Real Estate", "description": "The first 10 of every building are 10% cheaper.", "cost": 5, "maxLevel": 1, "dependencies": [ "unique_path_2b" ], "x": 527, "y": 730, "icon": "assets/tree.png" },
    { "id": "unique_path_3c", "name": "Cheaper Rebirths", "description": "Reduces the coin requirement for Rebirthing by 10%.", "cost": 5, "maxLevel": 1, "dependencies": [ "unique_path_2c" ], "x": 309, "y": 518, "icon": "assets/tree.png" },
    { "id": "unique_path_3d", "name": "Point Insurance", "description": "Start every run with 1 Rebirth Point.", "cost": 10, "maxLevel": 1, "dependencies": [ "unique_path_2d" ], "x": 434, "y": 338, "icon": "assets/tree.png" },
    // FIX: Changed 'CPC' to 'NPC' in the description.
    { "id": "unique_path_4b", "name": "Cosmic Achievements", "description": "Each achievement unlocked provides a +1% bonus to both CPS and NPC.", "cost": 8, "maxLevel": 1, "dependencies": [ "cps_path_start" ], "x": 1078, "y": 461, "icon": "assets/tree.png" }
];