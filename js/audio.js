import { gameState } from './state.js';

const audioSources = {
    main: 'assets/audio/main-music.mp3',
    nyanTree: 'assets/audio/nyantree-ambience.mp3',
    click: 'assets/audio/nyan-click.mp3',
    upgradeBuy: 'assets/audio/upgrade-buy.mp3',
    skinBuy: 'assets/audio/skin-buy.mp3',
};

const audioElements = {};
let currentMusicKey = null;

function fadeAudio(audio, targetVolume, duration = 500, onComplete = null) {
    const startVolume = audio.volume;
    if (startVolume === targetVolume && audio.paused === false) return;

    // Clear any existing fade interval for this audio element
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
    sfx.volume = gameState.settings.sfxVolume;
    sfx.currentTime = 0;
    sfx.play().catch(e => {});
}

export function switchMusic(newKey, fadeDuration = 500) {
    if (currentMusicKey && audioElements[currentMusicKey]) {
        fadeAudio(audioElements[currentMusicKey], 0, fadeDuration);
    }

    currentMusicKey = newKey;

    if (gameState.settings.music && audioElements[newKey]) {
        const newMusic = audioElements[newKey];
        const targetVolume = gameState.settings.musicVolume;
        newMusic.currentTime = 0;
        newMusic.volume = 0;
        newMusic.play().catch(e => {});
        fadeAudio(newMusic, targetVolume, fadeDuration);
    }
}

export function updateMusicVolume() {
    if (currentMusicKey && gameState.settings.music) {
        audioElements[currentMusicKey].volume = gameState.settings.musicVolume;
    }
}

export function setMusicEnabled(enabled) {
    if (!currentMusicKey || !audioElements[currentMusicKey]) return;
    const music = audioElements[currentMusicKey];
    if (enabled) {
        const targetVolume = gameState.settings.musicVolume;
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
        const targetVolume = gameState.settings.musicVolume;
        music.play().catch(e => {});
        fadeAudio(music, targetVolume, 200);
    }
}