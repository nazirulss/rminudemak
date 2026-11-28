// Module: Organogram Zoom/Pan & Pengurus Interaction

// ==========================================
// FASE 1: ORGANOGRAM ZOOM-PAN CONTROLLER
// ==========================================
let organogramScale = 1;
let organogramPanX = 0;
let organogramPanY = 0;

function applyOrganogramTransform() {
    const tree = document.getElementById('organogram-tree-container');
    const label = document.getElementById('organogram-zoom-label');
    if (tree) {
        tree.style.transform = `translate(${organogramPanX}px, ${organogramPanY}px) scale(${organogramScale})`;
    }
    if (label) {
        label.innerText = `${Math.round(organogramScale * 100)}%`;
    }
}

function zoomOrganogram(delta) {
    organogramScale = Math.min(1.75, Math.max(0.55, +(organogramScale + delta).toFixed(2)));
    applyOrganogramTransform();
}

function resetOrganogramView() {
    organogramScale = 1;
    organogramPanX = 0;
    organogramPanY = 0;
    applyOrganogramTransform();
}

window.zoomOrganogram = zoomOrganogram;
window.resetOrganogramView = resetOrganogramView;

document.addEventListener('DOMContentLoaded', () => {
    const viewport = document.getElementById('organogram-viewport');
    if (!viewport) return;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    viewport.addEventListener('pointerdown', (e) => {
        if (e.target.closest('[onclick]') || e.target.closest('button')) return;
        isDragging = true;
        startX = e.clientX - organogramPanX;
        startY = e.clientY - organogramPanY;
    });
    window.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        organogramPanX = e.clientX - startX;
        organogramPanY = e.clientY - startY;
        applyOrganogramTransform();
    });
    window.addEventListener('pointerup', () => {
        isDragging = false;
    });
});

