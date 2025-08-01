import { gameState } from './state.js';

const audioSources = {
    // Music
    main: 'assets/audio/main-music.mp3',
    nyanTree: 'assets/audio/nyantree-ambience.mp3',
    // SFX
    click: 'assets/audio/nyan-click.mp3',
    upgradeBuy: 'assets/audio/upgrade-buy.mp3',
    skinBuy: 'assets/audio/skin-buy.mp3',
    flash: 'assets/audio/flash.mp3', // ADDED: Sound for the secret transition
};

const audioElements = {};
let currentMusicKey = null;

function fadeAudio(audio, targetVolume, duration = 500, onComplete = null) {
    const startVolume = audio.volume;
    if (startVolume === targetVolume && audio.paused === false) return;

    if (audio.fadeInterval) clearInterval(audio.fadeInterval);

    if (duration === 0) {
        audio.volume = targetVolume;
        if (targetVolume === 0) audio.pause();
        if(onComplete) onComplete();
        return;
    }

    const step = (targetVolume - startVolume) / (duration / 50);
    let currentStep = 0;
    const totalSteps = duration / 50;

    audio.fadeInterval = setInterval(() => {
        currentStep++;
        const newVolume = startVolume + step * currentStep;
        if ((step > 0 && newVolume >= targetVolume) || (step < 0 && newVolume <= targetVolume) || currentStep >= totalSteps) {
            audio.volume = targetVolume;
            if (targetVolume === 0) audio.pause();
            clearInterval(audio.fadeInterval);
            audio.fadeInterval = null;
            if(onComplete) onComplete();
        } else {
            audio.volume = newVolume;
        }
    }, 50);
}

export function initAudio() {
    for (const key in audioSources) {
        const audio = new Audio(audioSources[key]);
        audio.preload = 'auto';
        if (key === 'main' || key === 'nyanTree') {
            audio.loop = true;
        }
        audioElements[key] = audio;
    }
}

export function playSfx(key) {
    if (!gameState.settings.sfx || !audioElements[key]) return;
    const sfx = audioElements[key];
    // MODIFIED: Use sfxVolume and check for valid number to prevent errors on old saves
    sfx.volume = typeof gameState.settings.sfxVolume === 'number' ? gameState.settings.sfxVolume : 0.8;
    sfx.currentTime = 0;
    sfx.play().catch(e => {}); // Suppress minor play errors
}

export function switchMusic(newKey, fadeDuration = 500) {
    if (currentMusicKey && audioElements[currentMusicKey]) {
        fadeAudio(audioElements[currentMusicKey], 0, fadeDuration);
    }

    currentMusicKey = newKey;

    if (gameState.settings.music && audioElements[newKey]) {
        const newMusic = audioElements[newKey];
        // MODIFIED: Use musicVolume and check for valid number
        const targetVolume = typeof gameState.settings.musicVolume === 'number' ? gameState.settings.musicVolume : 0.5;
        newMusic.currentTime = 0;
        newMusic.volume = 0;
        newMusic.play().catch(e => {});
        fadeAudio(newMusic, targetVolume, fadeDuration);
    }
}

export function updateMusicVolume() {
    if (currentMusicKey && gameState.settings.music) {
        const targetVolume = typeof gameState.settings.musicVolume === 'number' ? gameState.settings.musicVolume : 0.5;
        audioElements[currentMusicKey].volume = targetVolume;
    }
}

export function setMusicEnabled(enabled) {
    if (!currentMusicKey || !audioElements[currentMusicKey]) return;
    const music = audioElements[currentMusicKey];
    if (enabled) {
        const targetVolume = typeof gameState.settings.musicVolume === 'number' ? gameState.settings.musicVolume : 0.5;
        music.play().catch(e => {});
        fadeAudio(music, targetVolume);
    } else {
        fadeAudio(music, 0);
    }
}

export function pauseAllAudio() {
    if (currentMusicKey && audioElements[currentMusicKey]) {
        fadeAudio(audioElements[currentMusicKey], 0, 200);
    }
}

export function resumeAllAudio() {
    if (currentMusicKey && gameState.settings.music) {
        const music = audioElements[currentMusicKey];
        const targetVolume = typeof gameState.settings.musicVolume === 'number' ? gameState.settings.musicVolume : 0.5;
        music.play().catch(e => {});
        fadeAudio(music, targetVolume, 200);
    }
}