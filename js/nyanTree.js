import { gameState, T } from './state.js';
import { NYAN_TREE_UPGRADES } from './data.js';
import { playSfx } from './audio.js';

let selectedNode = null;
let nyanTreeWrapper = null; // Cache element

// MODIFIED: Reworked panning and zooming to include touch support
export function setupNyanTree() {
    const canvas = document.getElementById('nyan-tree-canvas');
    nyanTreeWrapper = document.getElementById('nyan-tree-wrapper');
    const resetButton = document.getElementById('nyan-tree-reset-view-btn');

    let isPanning = false;
    let startX, startY;
    let panX = 0, panY = 0;
    let scale = 1;

    const updateTransform = () => {
        nyanTreeWrapper.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    };

    const resetView = () => {
        panX = 0;
        panY = 0;
        scale = 1;
        updateTransform();
    };
    
    resetButton.addEventListener('click', resetView);

    const handlePanStart = (e) => {
        // Prevent default behavior for touch events, like scrolling
        if (e.type === 'touchstart') e.preventDefault();
        
        isPanning = true;
        const point = e.type === 'touchstart' ? e.touches[0] : e;
        startX = point.clientX - panX;
        startY = point.clientY - panY;
        canvas.style.cursor = 'grabbing';
    };

    const handlePanMove = (e) => {
        if (!isPanning) return;
        // Prevent default behavior for touch events, like scrolling
        if (e.type === 'touchmove') e.preventDefault();

        const point = e.type === 'touchmove' ? e.touches[0] : e;
        panX = point.clientX - startX;
        panY = point.clientY - startY;
        updateTransform();
    };

    const handlePanEnd = () => {
        isPanning = false;
        canvas.style.cursor = 'grab';
    };
    
    // Mouse events
    canvas.addEventListener('mousedown', handlePanStart);
    canvas.addEventListener('mousemove', handlePanMove);
    canvas.addEventListener('mouseup', handlePanEnd);
    canvas.addEventListener('mouseleave', handlePanEnd);

    // Touch events
    canvas.addEventListener('touchstart', handlePanStart, { passive: false });
    canvas.addEventListener('touchmove', handlePanMove, { passive: false });
    canvas.addEventListener('touchend', handlePanEnd);
    canvas.addEventListener('touchcancel', handlePanEnd);

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const scaleAmount = -e.deltaY * 0.001;
        const newScale = Math.max(0.2, Math.min(2, scale + scaleAmount));

        // Adjust pan to zoom towards the mouse pointer
        panX = mouseX - (mouseX - panX) * (newScale / scale);
        panY = mouseY - (mouseY - panY) * (newScale / scale);
        
        scale = newScale;
        updateTransform();
    });
    
    resetView(); // Initialize view on setup
}


function buyNyanTreeUpgrade(upgrade) {
    if (!upgrade || !gameState.isRebirthing) return;
    const ownedLevel = gameState.nyanTreeUpgrades[upgrade.id] || 0;
    const isMaxLevel = ownedLevel >= upgrade.maxLevel;

    if (gameState.rebirthPoints >= upgrade.cost && !isMaxLevel) {
        playSfx('upgradeBuy');
        T({
            ...gameState,
            rebirthPoints: gameState.rebirthPoints - upgrade.cost,
            nyanTreeUpgrades: {
                ...gameState.nyanTreeUpgrades,
                [upgrade.id]: (ownedLevel || 0) + 1
            }
        });
        // OPTIMIZATION: Manually update points instead of full re-render
        document.getElementById('nyan-tree-points-display').textContent = gameState.rebirthPoints;
        renderNyanTree(); // Re-render to update node states and lines
        const currentSelectedUpgrade = NYAN_TREE_UPGRADES.find(u => u.id === selectedNode.id);
        if(currentSelectedUpgrade) selectNode(currentSelectedUpgrade);
    }
}

function selectNode(upgrade) {
    selectedNode = upgrade;
    const detailsPanel = document.getElementById('details-content');
    const buyBtn = document.getElementById('nyan-tree-buy-btn');
    
    const ownedLevel = gameState.nyanTreeUpgrades[upgrade.id] || 0;
    const maxLevelText = upgrade.maxLevel > 1 ? `/${upgrade.maxLevel}` : '';

    detailsPanel.innerHTML = `
        <h4>${upgrade.name} (Level ${ownedLevel}${maxLevelText})</h4>
        <p>${upgrade.description}</p>
        <p>Cost: ${upgrade.cost} Rebirth Points</p>
    `;

    const canAfford = gameState.rebirthPoints >= upgrade.cost;
    const isMaxed = ownedLevel >= upgrade.maxLevel;

    if (!isMaxed && gameState.isRebirthing) {
        buyBtn.style.display = 'block';
        buyBtn.textContent = `Buy (Cost: ${upgrade.cost})`;
        buyBtn.disabled = !canAfford;
        buyBtn.onclick = () => buyNyanTreeUpgrade(upgrade);
    } else {
        buyBtn.style.display = 'none';
    }

    document.querySelectorAll('.nyan-tree-node.selected').forEach(n => n.classList.remove('selected'));
    const nodeEl = document.querySelector(`.nyan-tree-node[data-id="${upgrade.id}"]`);
    if (nodeEl) nodeEl.classList.add('selected');
}

export function renderNyanTree() {
    const wrapper = document.getElementById('nyan-tree-wrapper');
    const pointsDisplay = document.getElementById('nyan-tree-points-display');
    wrapper.innerHTML = ''; // Clear previous nodes and lines
    pointsDisplay.textContent = gameState.rebirthPoints;

    if (NYAN_TREE_UPGRADES.some(u => u.isStarter) && !gameState.nyanTreeUpgrades['starter']) {
        gameState.nyanTreeUpgrades['starter'] = 1;
    }

    // Render nodes
    NYAN_TREE_UPGRADES.forEach(upgrade => {
        const dependenciesMet = upgrade.dependencies.every(depId => (gameState.nyanTreeUpgrades[depId] || 0) > 0);
        if (!dependenciesMet && !upgrade.isStarter) return;

        const node = document.createElement('div');
        node.className = 'nyan-tree-node';
        node.dataset.id = upgrade.id;
        node.style.left = `${upgrade.x}px`;
        node.style.top = `${upgrade.y}px`;
        node.style.transform = 'translate(-50%, -50%)';

        const ownedLevel = gameState.nyanTreeUpgrades[upgrade.id] || 0;
        if (ownedLevel >= upgrade.maxLevel) {
            node.classList.add('purchased');
        } else if (ownedLevel > 0) {
            node.classList.add('in-progress');
        }
        
        if (gameState.rebirthPoints < upgrade.cost && ownedLevel < upgrade.maxLevel) {
            node.classList.add('cant-afford');
        }
        
        node.innerHTML = `<img src="${upgrade.icon}" alt="${upgrade.name}">`;
        node.addEventListener('click', () => selectNode(upgrade));
        
        wrapper.appendChild(node);
    });

    // Render lines
    NYAN_TREE_UPGRADES.forEach(upgrade => {
        const dependenciesMet = upgrade.dependencies.every(depId => (gameState.nyanTreeUpgrades[depId] || 0) > 0);
        if (!dependenciesMet) return;

        upgrade.dependencies.forEach(depId => {
            const parent = NYAN_TREE_UPGRADES.find(u => u.id === depId);
            if (!parent) return;

            const line = document.createElement('div');
            line.className = 'nyan-tree-line';
            
            const x1 = parent.x;
            const y1 = parent.y;
            const x2 = upgrade.x;
            const y2 = upgrade.y;

            const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

            line.style.width = `${length}px`;
            line.style.left = `${x1}px`;
            line.style.top = `${y1}px`;
            line.style.transform = `rotate(${angle}deg)`;
            
            wrapper.insertBefore(line, wrapper.firstChild);
        });
    });

    if (!selectedNode) {
        document.getElementById('details-content').innerHTML = 'Select a node to see details.';
        document.getElementById('nyan-tree-buy-btn').style.display = 'none';
    } else {
        const currentSelectedUpgrade = NYAN_TREE_UPGRADES.find(u => u.id === selectedNode.id);
        if(currentSelectedUpgrade) selectNode(currentSelectedUpgrade);
    }
}