import { gameState, T } from './state.js';
import { playSfx } from './audio.js';
import { updateSkinAndMode } from './main.js';
import { hideModal, renderEasterEggs } from './ui.js';

// This function will be called from main.js to set up the listeners
export function initEasterEggListeners(achievementsContent, easterEggsModal, transitionOverlay, achievementsModalEl, saveGame) {
    // Listener for unlocking the 'WORD.' mode/skin
    achievementsContent.addEventListener('click', (e) => {
        const card = e.target.closest('.achievement-card.clickable');
        if (card && card.dataset.id === 'misc_words_apart' && !gameState.isWordMode) {
            playSfx('flash');
            transitionOverlay.style.backgroundColor = '#FFF';
            transitionOverlay.style.transition = 'opacity 0.2s ease-in';

            transitionOverlay.addEventListener('transitionend', () => {
                if (!gameState.ownedSkins.includes('word')) {
                    T({ ownedSkins: [...gameState.ownedSkins, 'word'] });
                }
                updateSkinAndMode('word');
                saveGame(true);
                hideModal(achievementsModalEl);

                transitionOverlay.style.transition = 'opacity 1.2s ease-out';
                transitionOverlay.classList.remove('active');
                
                transitionOverlay.addEventListener('transitionend', () => {
                    transitionOverlay.style.backgroundColor = '#000';
                    transitionOverlay.style.transition = 'opacity 1s ease-in-out';
                }, { once: true });
            }, { once: true });
            transitionOverlay.classList.add('active');
        }
    });

    // Listener for equipping secret skins from the easter egg modal
    easterEggsModal.addEventListener('click', (e) => {
        if (e.target.classList.contains('easter-egg-equip-btn')) {
            const card = e.target.closest('.achievement-card');
            if (card) {
                const skinId = card.dataset.skinId;
                if (skinId && gameState.currentSkin !== skinId) {
                    playSfx('skinBuy');
                    updateSkinAndMode(skinId);
                    saveGame(true);
                    renderEasterEggs(); // Re-render the modal content to update the button
                }
            }
        }
    });
}