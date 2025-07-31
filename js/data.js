export const PLANET_DATA = {
    earth: { name: 'Earth', unlockCost: 0, background: 'assets/space-bg.jpg' },
    mars: { name: 'Mars', unlockCost: 1e9, background: 'assets/mars-bg.jpg' },
    nyan: { name: 'Nyan Planet', unlockCost: 1e12, background: 'assets/nyan-planet-bg.jpg' }
};

export const UPGRADES_DATA = [
    // Earth
    { id: 'sprinkles', name: 'Sprinkles', description: 'Sweetens your clicks.', type: 'click', baseCost: 50, power: 1, costIncrease: 1.00, planet: 'earth' },
    { id: 'lovebots', name: 'Lovebots', description: 'Generates Nyan affection automatically.', type: 'cps', baseCost: 125, power: 1, costIncrease: 1.00, planet: 'earth' },
    { id: 'rainbow_mice', name: 'Rainbow Mice', description: 'These colorful critters boost your CPS.', type: 'click', baseCost: 500, power: 5, costIncrease: 1.00, planet: 'earth' },
    { id: 'auto_petter', name: 'Auto-Petter', description: 'Keeps Nyan happy, increasing click power.', type: 'cps', baseCost: 1100, power: 6, costIncrease: 1.00, planet: 'earth' },
    { id: 'catnip_farm', name: 'Catnip Farm', description: 'A steady supply of high-quality catnip.', type: 'click', baseCost: 12000, power: 100, costIncrease: 1.00, planet: 'earth' },
    { id: 'keyboard_cat', name: 'Keyboard Cat', description: 'Plays you off to higher CPS.', type: 'cps', baseCost: 5000, power: 200, costIncrease: 1.00, planet: 'earth' },
    { id: 'laser_pointer', name: 'Laser Pointer', description: 'Focuses Nyan\'s energy for powerful clicks.', type: 'click', baseCost: 1000, power: 80, costIncrease: 1.00, planet: 'earth' },
    { id: 'yarn_ball', name: 'Yarn Ball', description: 'A classic toy for a classic cat.', type: 'cps', baseCost: 315000, power: 5000, costIncrease: 1.00, planet: 'earth' },
	{ id: 'quantum_mouse', name: 'Quantum Mouse', description: 'A mouse that exists in multiple places at once, boosting your clicks.', type: 'click', baseCost: 2.2e7, power: 9000, costIncrease: 1.00, planet: 'earth' },
    { id: 'rainbow_factory', name: 'Rainbow Factory', description: 'Mass produces rainbows, a key ingredient in Nyan Coins.', type: 'cps', baseCost: 8.1e7, power: 100000, costIncrease: 1.00, planet: 'earth' },
    { id: 'meme_archive', name: 'Meme Archive', description: 'Unlocks ancient memes, giving you powerful clicks.', type: 'click', baseCost: 3e8, power: 25000, costIncrease: 1.00, planet: 'earth' },
    { id: 'poptart_catapult', name: 'Poptart Catapult', description: 'Launches Poptarts into the cosmos, generating coins.', type: 'cps', baseCost: 9e8, power: 200000, costIncrease: 1.00, planet: 'earth' },
    { id: 'nyan_choir', name: 'Nyan Choir', description: 'A choir of Nyan Cats singing the song of their people, boosting CPS.', type: 'click', baseCost: 1.8e9, power: 100000, costIncrease: 1.00, planet: 'earth' },
    { id: 'internet_core', name: 'Internet Core', description: 'Harness the power of the internet itself for massive click power.', type: 'cps', baseCost: 3e9, power: 15000000, costIncrease: 1.00, planet: 'earth' },
    { id: 'singularity', name: 'The Singularity', description: 'Become one with the Nyanverse. The ultimate CPS upgrade.', type: 'click', baseCost: 2e12, power: 200000, costIncrease: 1.00, planet: 'earth' },
	
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

export const REBIRTH_UPGRADES_DATA = [
    { id: 'permanent_cpc', name: 'Cosmic Clicks', description: 'Permanently increase click power by 10%.', cost: 1, maxLevel: 10 },
    { id: 'permanent_cps', name: 'Eternal Engine', description: 'Permanently increase CPS by 5%.', cost: 1, maxLevel: 20 },
    { id: 'cheaper_upgrades', name: 'Efficient Engineering', description: 'All upgrades are 1% cheaper.', cost: 5, maxLevel: 10 },
];

export const SKINS_DATA = [ 
    { id: 'default', name: 'Classic Nyan', cost: 0, image: 'assets/nyan-cat.png', trail: 'assets/rainbow-slice.png', trailHeight: 200 }, 
    { id: 'golden', name: 'Golden Nyan', cost: 1e8, image: 'assets/nyan-cat.png', bonus: {type: 'cpc', value: 1.05}, trail: 'assets/rainbow-slice.png', trailHeight: 140 },
    { id: 'pan', name: 'Pan Nyan', cost: 250000, image: 'assets/nyan-cat.png', trail: 'assets/pan-rainbow-slice.png', trailHeight: 180 }
];

export const ACHIEVEMENTS_DATA = {
    'first_click': { name: 'The Journey Begins', description: 'Make your first click.', condition: () => true, reward: 10 },
    'coins_1k': { name: 'Coin Collector', description: 'Earn 1,000 Nyan Coins.', condition: (gameState) => gameState.coins >= 1000, reward: 100 },
    'upgrade_100': { name: 'Upgrade Enthusiast', description: 'Buy 100 total upgrades.', condition: (gameState) => Object.values(gameState.upgrades).reduce((sum, u) => sum + u.owned, 0) >= 100, reward: 10000 },
    'first_rebirth': { name: 'Again!', description: 'Perform your first rebirth.', condition: (gameState) => gameState.rebirths >= 1, reward: 100000 },
};