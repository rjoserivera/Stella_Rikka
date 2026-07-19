/* ════════════════════════════════════════════
   lienzo.js — Lienzo Infinito Multitipo
   ════════════════════════════════════════════ */

const sParams = new URLSearchParams(window.location.search);
const sid = sParams.get('sid');

// ── ESTADO DEL GRAFO ──
let nodes = {}; // { 'id': { id, type, x, y, color, text, subtexts, title, w, h } }
let edges = []; // [ { source, target, sourcePort, targetPort } ]
let selectedNodeIds = new Set();

const canvasWrapper = document.getElementById('canvas-wrapper');
const panContainer = document.getElementById('pan-container');
const nodesContainer = document.getElementById('nodes-container');
const svgGroup = document.getElementById('paths-group');
const drawPath = document.getElementById('drawing-path');
const colorPicker = document.getElementById('color-picker');

let scale = 1, translateX = 0, translateY = 0;
let isPanning = false, startPan = { x: 0, y: 0 };
let currentMode = 'move';
let isDraggingNode = false, draggedNodeId = null, dragNodeStart = { x: 0, y: 0 };
let currentDrawState = null;

const PORTS = ['t-l', 't-c', 't-r', 'b-l', 'b-c', 'b-r', 'l-t', 'l-c', 'l-b', 'r-t', 'r-c', 'r-b'];

// Convertimos HexColor a hex con alpha. 
function hexToAlpha(hex, opacity) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
    const r = parseInt(hex.substring(0, 2), 16), g = parseInt(hex.substring(2, 4), 16), b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${opacity})`;
}

function getContrastColor(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
    const r = parseInt(hex.substring(0, 2), 16), g = parseInt(hex.substring(2, 4), 16), b = parseInt(hex.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#111' : '#fff';
}

async function initCanvas() {
    document.getElementById('btn-mover').addEventListener('click', () => setMode('move'));
    document.getElementById('btn-add-pildora').addEventListener('click', () => setMode('add-pildora'));
    document.getElementById('btn-add-ronda').addEventListener('click', () => setMode('add-ronda'));
    document.getElementById('btn-add-idea').addEventListener('click', () => setMode('add-idea'));

    document.getElementById('btn-delete').addEventListener('click', deleteSelected);
    document.getElementById('btn-guardar').addEventListener('click', guardarGraph);
    document.getElementById('btn-export').addEventListener('click', exportarPNG);

    // Cambiar el color de los elementos seleccionados en tiempo real
    colorPicker.addEventListener('input', (e) => {
        const newColor = e.target.value;
        selectedNodeIds.forEach(id => {
            if (nodes[id]) {
                nodes[id].color = newColor;
                actualizarColores(id);
            }
        });
    });

    canvasWrapper.addEventListener('wheel', handleWheel, { passive: false });
    canvasWrapper.addEventListener('mousedown', handleCanvasMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    document.getElementById('btn-zoom-in').addEventListener('click', () => setZoom(scale + 0.1));
    document.getElementById('btn-zoom-out').addEventListener('click', () => setZoom(scale - 0.1));
    document.getElementById('btn-zoom-reset').addEventListener('click', () => setZoom(1, true));

    window.addEventListener('keydown', e => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && e.target.tagName !== 'TEXTAREA') {
            deleteSelected();
        }
    });

    if (sid) {
        try {
            const res = await fetch(`/api/lluviadeideas/sesiones/${sid}`);
            if (res.ok) {
                const data = await res.json();
                if (data.nodes) nodes = data.nodes;
                if (data.edges) edges = data.edges;
                if (data.camera) {
                    scale = data.camera.scale || 1; translateX = data.camera.tx || 0; translateY = data.camera.ty || 0;
                }
                renderAllNodes(); renderAllEdges(); updateTransform();
            }
        } catch { }
    }
}

function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${mode === 'move' ? 'mover' : mode}`).classList.add('active');
}

function handleCanvasMouseDown(e) {
    if (e.button !== 0 && e.button !== 1) return;
    if (e.target === canvasWrapper || e.target === panContainer || e.target.tagName === 'svg') {
        if (currentMode.startsWith('add-')) {
            const type = currentMode.split('-')[1]; // pildora | ronda | idea
            const { x, y } = getLogicalCoords(e.clientX, e.clientY);
            createNode(type, x, y, colorPicker.value);
            setMode('move');
            return;
        }
        isPanning = true;
        startPan = { x: e.clientX - translateX, y: e.clientY - translateY };
        clearSelection();
    }
}

function handleMouseMove(e) {
    if (isPanning) {
        translateX = e.clientX - startPan.x; translateY = e.clientY - startPan.y;
        updateTransform(); return;
    }
    if (isDraggingNode && draggedNodeId) {
        nodes[draggedNodeId].x = dragNodeStart.x + (e.clientX - startPan.x) / scale;
        nodes[draggedNodeId].y = dragNodeStart.y + (e.clientY - startPan.y) / scale;
        document.getElementById(draggedNodeId).style.transform = `translate(${nodes[draggedNodeId].x}px, ${nodes[draggedNodeId].y}px)`;
        renderAllEdges(); return;
    }
    if (currentDrawState) {
        drawPath.style.display = 'block';
        const cSource = getPortCoords(currentDrawState.sourceNode, currentDrawState.sourcePort);
        const { x, y } = getLogicalCoords(e.clientX, e.clientY);
        drawPath.setAttribute('d', getBezierPath(cSource.x, cSource.y, x, y, currentDrawState.sourcePort, null));
    }
}

function handleMouseUp(e) {
    isPanning = false; isDraggingNode = false; draggedNodeId = null;
    if (currentDrawState) {
        let dp = e.target.closest('.port');
        if (dp && dp.dataset.nid !== currentDrawState.sourceNode) {
            edges.push({
                source: currentDrawState.sourceNode, sourcePort: currentDrawState.sourcePort,
                target: dp.dataset.nid, targetPort: dp.dataset.port
            });
            renderAllEdges();
        }
        currentDrawState = null; drawPath.style.display = 'none';
    }
}

function handleWheel(e) {
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(scale + (e.deltaY > 0 ? -0.1 : 0.1), false, e.clientX, e.clientY); }
    else { translateX -= e.deltaX; translateY -= e.deltaY; updateTransform(); }
}

function setZoom(ns, center = false, mx = window.innerWidth / 2, my = window.innerHeight / 2) {
    if (ns < 0.2) ns = 0.2; if (ns > 4) ns = 4;
    if (center) { translateX = 0; translateY = 0; scale = ns; }
    else { const xs = (mx - translateX) / scale, ys = (my - translateY) / scale; scale = ns; translateX = mx - xs * scale; translateY = my - ys * scale; }
    updateTransform();
}

function updateTransform() {
    panContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    document.getElementById('zoom-level').textContent = `${Math.round(scale * 100)}%`;
}

function getLogicalCoords(cx, cy) {
    const rect = canvasWrapper.getBoundingClientRect();
    return { x: (cx - rect.left - translateX) / scale, y: (cy - rect.top - translateY) / scale };
}

// ── NODE LOGIC ──
function createNode(type, x, y, color) {
    const id = 'n_' + Date.now() + Math.random().toString(36).substr(2, 5);
    // Centrar en cursor aprox
    if (type === 'pildora') { x -= 200; y -= 40; }
    else if (type === 'ronda') { x -= 200; y -= 90; }
    else { x -= 100; y -= 100; }

    nodes[id] = { id, type, x, y, color, text: '', subtexts: ['', '', ''] };
    renderNode(id);
    selectNode(id);
}

function actualizarColores(id) {
    const n = nodes[id];
    const el = document.getElementById(id);
    if (!el || !n) return;

    const contentEl = el.querySelector('.node-content');
    if (n.type === 'pildora') {
        contentEl.style.backgroundColor = n.color;
        contentEl.style.color = getContrastColor(n.color);
    } else if (n.type === 'ronda') {
        const gridItems = el.querySelectorAll('.ronda-item');
        gridItems.forEach((itm) => {
            itm.style.borderColor = hexToAlpha(n.color, 0.4);
            const isDark = document.documentElement.getAttribute('data-tema') === 'oscuro';
            itm.style.backgroundColor = hexToAlpha(n.color, isDark ? 0.15 : 0.25);
        });
    } else if (n.type === 'idea') {
        contentEl.style.borderColor = hexToAlpha(n.color, 0.4);
        const isDark = document.documentElement.getAttribute('data-tema') === 'oscuro';
        contentEl.style.backgroundColor = hexToAlpha(n.color, isDark ? 0.15 : 0.25);
    }
}

function renderNode(id) {
    const n = nodes[id];
    let el = document.getElementById(id);
    if (!el) {
        el = document.createElement('div'); el.id = id; el.className = 'canvas-node';

        // Add Ports
        PORTS.forEach(dir => {
            const p = document.createElement('div'); p.className = `port port-${dir}`;
            p.dataset.nid = id; p.dataset.port = dir;
            p.addEventListener('mousedown', e => { e.stopPropagation(); currentDrawState = { sourceNode: id, sourcePort: dir, startX: e.clientX, startY: e.clientY }; });
            el.appendChild(p);
        });

        const content = document.createElement('div');
        content.className = `node-content node-content-${n.type}`;

        if (n.type === 'pildora') {
            const ta = document.createElement('textarea');
            ta.placeholder = "Las ideas empiezan aquí...";
            ta.addEventListener('input', e => n.text = e.target.value);
            ta.addEventListener('mousedown', e => { selectNode(id); e.stopPropagation(); });
            content.appendChild(ta);
        } else if (n.type === 'ronda') {
            const head = document.createElement('div'); head.className = 'ronda-header';
            head.textContent = 'RONDA / CAJÓN';
            content.appendChild(head);

            const grid = document.createElement('div'); grid.className = 'ronda-grid';
            for (let i = 0; i < 3; i++) {
                const itm = document.createElement('div'); itm.className = 'ronda-item';
                const ta = document.createElement('textarea');
                ta.placeholder = 'Idea...';
                ta.addEventListener('input', e => n.subtexts[i] = e.target.value);
                ta.addEventListener('mousedown', e => { selectNode(id); e.stopPropagation(); });
                itm.appendChild(ta); grid.appendChild(itm);
            }
            content.appendChild(grid);
        } else if (n.type === 'idea') {
            const ta = document.createElement('textarea');
            ta.placeholder = "Idea individual...";
            ta.addEventListener('input', e => n.text = e.target.value);
            ta.addEventListener('mousedown', e => { selectNode(id); e.stopPropagation(); });
            content.appendChild(ta);
        }

        el.appendChild(content);

        el.addEventListener('mousedown', e => {
            if (e.target.tagName === 'TEXTAREA' || e.target.classList.contains('port')) return;
            e.stopPropagation(); selectNode(id);
            if (currentMode === 'move') { isDraggingNode = true; draggedNodeId = id; startPan = { x: e.clientX, y: e.clientY }; dragNodeStart = { x: n.x, y: n.y }; }
        });

        // Guardar tamaños si el usuario modifica el textarea/div resizeado en el DOM
        new ResizeObserver((entries) => {
            n.w = entries[0].contentRect.width;
            n.h = entries[0].contentRect.height;
            renderAllEdges();
        }).observe(content);

        nodesContainer.appendChild(el);
    }

    el.style.transform = `translate(${n.x}px, ${n.y}px)`;

    if (n.type === 'pildora') el.querySelector('textarea').value = n.text || '';
    if (n.type === 'ronda') { const inps = el.querySelectorAll('textarea'); inps[0].value = n.subtexts[0] || ''; inps[1].value = n.subtexts[1] || ''; inps[2].value = n.subtexts[2] || ''; }
    if (n.type === 'idea') el.querySelector('textarea').value = n.text || '';

    actualizarColores(id);

    el.classList.toggle('selected', selectedNodeIds.has(id));
}

function renderAllNodes() { nodesContainer.innerHTML = ''; Object.keys(nodes).forEach(renderNode); }

function selectNode(id) {
    clearSelection(); selectedNodeIds.add(id);
    const el = document.getElementById(id);
    if (el) {
        el.classList.add('selected');
        // Actualizar el color picker al color del nodo tocado
        if (nodes[id]) colorPicker.value = nodes[id].color;
    }
    highlightAdjacent(id);
}

function clearSelection() {
    selectedNodeIds.clear();
    document.querySelectorAll('.canvas-node').forEach(el => { el.classList.remove('selected'); el.classList.remove('highlighted-adjacent'); });
    document.querySelectorAll('path.connection-line').forEach(p => p.classList.remove('highlight'));
}

function highlightAdjacent(id) {
    edges.forEach((e, idx) => {
        if (e.source === id || e.target === id) {
            document.querySelector(`path[data-idx="${idx}"]`)?.classList.add('highlight');
            document.getElementById(e.source === id ? e.target : e.source)?.classList.add('highlighted-adjacent');
        }
    });
}

function deleteSelected() {
    Array.from(selectedNodeIds).forEach(id => {
        document.getElementById(id)?.remove(); delete nodes[id];
        edges = edges.filter(e => e.source !== id && e.target !== id);
    });
    selectedNodeIds.clear(); renderAllEdges(); clearSelection();
}

function getPortCoords(nid, port) {
    const n = nodes[nid]; if (!n) return { x: 0, y: 0 };
    const el = document.getElementById(nid); const content = el ? el.querySelector('.node-content') : null;
    const w = content ? content.offsetWidth : 320, h = content ? content.offsetHeight : 100;
    let cx = n.x, cy = n.y;
    const pMap = { 't-l': [0.1, 0], 't-c': [0.5, 0], 't-r': [0.9, 0], 'b-l': [0.1, 1], 'b-c': [0.5, 1], 'b-r': [0.9, 1], 'l-t': [0, 0.1], 'l-c': [0, 0.5], 'l-b': [0, 0.9], 'r-t': [1, 0.1], 'r-c': [1, 0.5], 'r-b': [1, 0.9] };
    if (pMap[port]) { cx += w * pMap[port][0]; cy += h * pMap[port][1]; }
    return { x: cx, y: cy };
}

function getBezierPath(x1, y1, x2, y2, p1, p2) {
    const cDist = Math.max(50, Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) / 2.5);
    let c1x = x1, c1y = y1, c2x = x2, c2y = y2;
    const m1 = p1.split('-')[0];
    if (m1 === 't') c1y -= cDist; else if (m1 === 'b') c1y += cDist; else if (m1 === 'l') c1x -= cDist; else c1x += cDist;
    if (p2) {
        const m2 = p2.split('-')[0];
        if (m2 === 't') c2y -= cDist; else if (m2 === 'b') c2y += cDist; else if (m2 === 'l') c2x -= cDist; else c2x += cDist;
    }
    return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
}

function renderAllEdges() {
    svgGroup.innerHTML = '';
    edges.forEach((eObj, idx) => {
        const sPt = getPortCoords(eObj.source, eObj.sourcePort), tPt = getPortCoords(eObj.target, eObj.targetPort);
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', getBezierPath(sPt.x, sPt.y, tPt.x, tPt.y, eObj.sourcePort, eObj.targetPort));
        p.classList.add('connection-line');
        p.setAttribute('marker-end', 'url(#arrowhead)'); p.setAttribute('data-idx', idx);
        p.addEventListener('click', e => {
            e.stopPropagation(); clearSelection(); p.classList.add('highlight');
            document.getElementById(eObj.source)?.classList.add('highlighted-adjacent');
            document.getElementById(eObj.target)?.classList.add('highlighted-adjacent');
        });
        svgGroup.appendChild(p);
    });
    if (selectedNodeIds.size > 0) highlightAdjacent(Array.from(selectedNodeIds)[0]);
}

async function guardarGraph() {
    const dataStr = JSON.stringify({ nodes, edges, camera: { scale, tx: translateX, ty: translateY } }, null, 2);
    try {
        if (window.showSaveFilePicker) {
            const handle = await window.showSaveFilePicker({
                suggestedName: `Ideacion_${sid || 'nueva'}.rikap`,
                types: [{
                    description: 'Stella Rikka Brainstorming',
                    accept: { 'application/json': ['.rikap'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(dataStr);
            await writable.close();
            mostrarToast("¡Guardado exitosamente!", 'success');
        } else {
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Ideacion_${sid || 'nueva'}.rikap`;
            a.click();
            URL.revokeObjectURL(url);
            mostrarToast("¡Descarga iniciada!", 'success');
        }
    } catch (e) {
        if (e.name !== 'AbortError') {
            mostrarToast("Error al guardar", "error");
        }
    }
}

function exportarPNG() {
    if (typeof html2canvas === 'undefined') return;
    clearSelection();
    const oldScale = scale, oldTx = translateX, oldTy = translateY;
    setZoom(1, true);

    const textareas = document.querySelectorAll('#canvas-wrapper textarea');
    const replacements = [];
    textareas.forEach(ta => {
        const div = document.createElement('div');
        const style = window.getComputedStyle(ta);
        div.style.cssText = style.cssText;
        div.style.whiteSpace = 'pre-wrap';
        div.style.overflowWrap = 'break-word';
        div.style.overflow = 'hidden';
        div.style.display = 'flex';
        div.style.alignItems = 'flex-start';
        div.style.justifyContent = style.textAlign === 'center' ? 'center' : 'flex-start';
        if (ta.closest('.node-content-pildora')) {
           div.style.paddingTop = style.paddingTop;
           div.style.textAlign = 'center';
           div.style.alignItems = 'center';
        }
        div.textContent = ta.value;
        ta.parentNode.insertBefore(div, ta);
        ta.style.display = 'none';
        replacements.push({ ta, div });
    });

    html2canvas(document.getElementById('canvas-wrapper'), { backgroundColor: null, logging: false }).then(canvas => {
        replacements.forEach(({ ta, div }) => {
            div.remove();
            ta.style.display = '';
        });
        const a = document.createElement('a'); a.download = `Ideacion_${sid || 'demo'}.png`; a.href = canvas.toDataURL('image/png'); a.click();
        scale = oldScale; translateX = oldTx; translateY = oldTy; updateTransform();
    }).catch(err => {
        replacements.forEach(({ ta, div }) => {
            div.remove();
            ta.style.display = '';
        });
        scale = oldScale; translateX = oldTx; translateY = oldTy; updateTransform();
    });
}

function mostrarToast(msg, tipo = 'info') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div'); t.className = `toast toast-${tipo}`; t.textContent = msg;
    c.appendChild(t); setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

document.addEventListener('DOMContentLoaded', initCanvas);
