import { gameState } from './state.js';

const audioSources = {
    // Music
    main: 'assets/audio/main-music.mp3',
    nyanTree: 'assets/audio/nyantree-ambience.mp3',
    // SFX
    click: 'assets/audio/nyan-click.mp3',
    upgradeBuy: 'assets/audio/upgrade-buy.mp3',
    skinBuy: 'assets/audio/skin-buy.mp3',
    flash: 'assets/audio/flash.mp3', 
    // MODIFIED: Corrected file paths
    boost: 'assets/audio/boost.mp3',
    boostClick: 'assets/audio/boost-click.mp3',
};

const audioElements = {};
let currentMusicKey = null;
let userInteracted = false; // BUG FIX: Track user interaction for audio context

export function setUserInteracted() {
    userInteracted = true;
}

function fadeAudio(audio, targetVolume, duration = 500, onComplete = null) {
    const startVolume = audio.volume;
    if (audio.fadeInterval) clearInterval(audio.fadeInterval);
    if (startVolume === targetVolume && audio.paused === false) {
        if (onComplete) onComplete();
        return;
    }

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
    // BUG FIX & QoL: Check for interaction, global mute, and sfx toggle
    if (!userInteracted || !gameState.settings.sfx || gameState.settings.globalMute || !audioElements[key]) return;
    const sfx = audioElements[key];
    sfx.volume = typeof gameState.settings.sfxVolume === 'number' ? gameState.settings.sfxVolume : 0.8;
    sfx.currentTime = 0;
    sfx.play().catch(e => {}); // Suppress minor play errors
}

export function switchMusic(newKey, fadeDuration = 500) {
    if (currentMusicKey && audioElements[currentMusicKey]) {
        fadeAudio(audioElements[currentMusicKey], 0, fadeDuration);
    }

    currentMusicKey = newKey;

    // QoL: Check global mute
    if (gameState.settings.music && !gameState.settings.globalMute && audioElements[newKey]) {
        const newMusic = audioElements[newKey];
        const targetVolume = typeof gameState.settings.musicVolume === 'number' ? gameState.settings.musicVolume : 0.5;
        newMusic.currentTime = 0;
        newMusic.volume = 0;
        newMusic.play().catch(e => {});
        fadeAudio(newMusic, targetVolume, fadeDuration);
    }
}

export function updateMusicVolume() {
    if (currentMusicKey && gameState.settings.music && !gameState.settings.globalMute) {
        const targetVolume = typeof gameState.settings.musicVolume === 'number' ? gameState.settings.musicVolume : 0.5;
        audioElements[currentMusicKey].volume = targetVolume;
    }
}

export function setMusicEnabled(enabled) {
    if (!currentMusicKey || !audioElements[currentMusicKey]) return;
    const music = audioElements[currentMusicKey];
    if (enabled && !gameState.settings.globalMute) {
        const targetVolume = typeof gameState.settings.musicVolume === 'number' ? gameState.settings.musicVolume : 0.5;
        music.play().catch(e => {});
        fadeAudio(music, targetVolume);
    } else {
        fadeAudio(music, 0);
    }
}

// QoL: New function to handle global mute
export function setGlobalMute(muted) {
    if (muted) {
        if (currentMusicKey && audioElements[currentMusicKey]) {
            fadeAudio(audioElements[currentMusicKey], 0, 200);
        }
    } else {
        setMusicEnabled(gameState.settings.music);
    }
}

export function pauseAllAudio() {
    if (currentMusicKey && audioElements[currentMusicKey]) {
        fadeAudio(audioElements[currentMusicKey], 0, 200);
    }
}

export function resumeAllAudio() {
    if (currentMusicKey && gameState.settings.music && !gameState.settings.globalMute) {
        const music = audioElements[currentMusicKey];
        const targetVolume = typeof gameState.settings.musicVolume === 'number' ? gameState.settings.musicVolume : 0.5;
        music.play().catch(e => {});
        fadeAudio(music, targetVolume, 200);
    }
}
