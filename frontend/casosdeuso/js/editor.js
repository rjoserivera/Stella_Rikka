const urlParams = new URLSearchParams(window.location.search);
const proyectoId = urlParams.get('pid') || urlParams.get('id');

if (!proyectoId) {
    window.location.href = '/casosdeuso/seleccion';
}

const canvasContainer = document.getElementById('canvas-container');
const nodesLayer = document.getElementById('nodes-layer');
const svgLayer = document.getElementById('svg-layer');
const connectionsGroup = document.getElementById('connections-group');

let proyecto = null;
let selectedElement = null; // node or connection

// State arrays
let actores = [];
let casos_uso = [];
let conexiones = [];
let sistemas = [];
let notas = [];

// Drag creation state
let dragType = null;

// Drag move state
let isDragging = false;
let dragNode = null;
let startX, startY;

// Connection drawing state
let isDrawing = false;
let startPortNodeId = null;
let tempLine = null;

// Custom Resize State
let isResizing = false;
let resizeNode = null;
let resizeDir = '';
let startW, startH, startX_node, startY_node;

init();

async function init() {
    await cargarProyecto();
    setupToolbar();
    setupCanvasEvents();
    renderAll();
    setupHelp();
    
    const btnExportRikka = document.getElementById('btn-export-rikka');
    if(btnExportRikka) {
        btnExportRikka.addEventListener('click', async () => {
            try {
                document.getElementById('save-status').innerHTML = 'Exportando...';
                const res = await fetch(`/api/casosdeuso/proyectos/${proyectoId}/exportar`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${proyecto.titulo || 'CasosDeUso'}.rikka`;
                a.click();
                URL.revokeObjectURL(url);
                document.getElementById('save-status').innerHTML = '<i class="fa-solid fa-check text-success me-1"></i>Exportado';
            } catch (err) {
                document.getElementById('save-status').innerHTML = '<i class="fa-solid fa-xmark text-danger me-1"></i>Error';
            }
        });
    }
}

async function cargarProyecto() {
    try {
        const res = await fetch(`/api/casosdeuso/proyectos/${proyectoId}`);
        if (!res.ok) throw new Error('No encontrado');
        proyecto = await res.json();
        
        document.getElementById('header-titulo').textContent = proyecto.titulo;
        
        const d = proyecto.datos || {};
        actores = d.actores || [];
        casos_uso = d.casos_uso || [];
        conexiones = d.conexiones || [];
        sistemas = d.sistemas || [];
        notas = d.notas || [];
    } catch (e) {
        console.error(e);
        window.location.href = '/casosdeuso/seleccion';
    }
}

async function guardarProyecto() {
    document.getElementById('save-status').innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i>Guardando...';
    
    proyecto.datos = {
        actores,
        casos_uso,
        conexiones,
        sistemas,
        notas
    };

    try {
        await fetch(`/api/casosdeuso/proyectos/${proyectoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(proyecto)
        });
        setTimeout(() => {
            document.getElementById('save-status').innerHTML = '<i class="fa-solid fa-check text-success me-1"></i>Guardado';
        }, 500);
    } catch (e) {
        document.getElementById('save-status').innerHTML = '<i class="fa-solid fa-xmark text-danger me-1"></i>Error';
    }
}

// ─── RENDERING ─────────────────────────────────────────────────────────────

function renderAll() {
    nodesLayer.innerHTML = '';
    connectionsGroup.innerHTML = '';
    
    // 1. Render Systems (background)
    sistemas.forEach(s => renderSystem(s));
    // 2. Render Actors & Cases
    actores.forEach(a => renderActor(a));
    casos_uso.forEach(c => renderCase(c));
    notas.forEach(n => renderNote(n));
    // 3. Render Connections
    conexiones.forEach(c => renderConnection(c));
}

function renderSystem(s) {
    const div = document.createElement('div');
    div.className = 'node-system';
    div.id = `sys_${s.id}`;
    div.style.left = s.x + 'px';
    div.style.top = s.y + 'px';
    div.style.width = s.w + 'px';
    div.style.height = s.h + 'px';
    
    if (s.border_color) div.style.borderColor = s.border_color;
    
    div.innerHTML = `<div class="node-system-header" style="${s.bg_color ? `background-color:${s.bg_color}; border-bottom-color:${s.bg_color};` : ''} ${s.text_color ? `color:${s.text_color};` : ''}">${s.nombre}</div>`;
    
    div.addEventListener('mousedown', (e) => startDragNode(e, s, 'system', div));
    div.addEventListener('click', (e) => { e.stopPropagation(); selectElement(s, 'system', div); });
    
    addResizeHandles(div, s);
    nodesLayer.appendChild(div);
}

function renderNote(n) {
    const div = document.createElement('div');
    div.className = 'node-note';
    div.id = `note_${n.id}`;
    div.style.left = n.x + 'px';
    div.style.top = n.y + 'px';
    if(n.w) div.style.width = n.w + 'px';
    if(n.h) div.style.height = n.h + 'px';
    
    if(n.bg_color) div.style.backgroundColor = n.bg_color;
    if(n.text_color) div.style.color = n.text_color;
    
    div.innerHTML = `<div class="note-content">${escHtml(n.texto || 'Nueva Nota')}</div>`;
    
    div.addEventListener('mousedown', (e) => startDragNode(e, n, 'note', div));
    div.addEventListener('click', (e) => { e.stopPropagation(); selectElement(n, 'note', div); });
    
    addResizeHandles(div, n);
    nodesLayer.appendChild(div);
}

function addResizeHandles(div, data) {
    if (data.locked) return;
    const dirs = ['nw','n','ne','e','se','s','sw','w'];
    dirs.forEach(dir => {
        const handle = document.createElement('div');
        handle.className = `resize-handle rh-${dir}`;
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizing = true;
            resizeNode = { data, el: div };
            resizeDir = dir;
            startX = e.clientX;
            startY = e.clientY;
            startW = data.w || parseInt(div.style.width) || 100;
            startH = data.h || parseInt(div.style.height) || 100;
            startX_node = data.x;
            startY_node = data.y;
        });
        div.appendChild(handle);
    });
}

function renderActor(a) {
    const div = document.createElement('div');
    div.className = 'node-actor';
    div.id = `act_${a.id}`;
    div.style.left = a.x + 'px';
    div.style.top = a.y + 'px';
    
    div.innerHTML = `
        <i class="fa-solid fa-user actor-icon" ${a.color ? `style="color:${a.color}"` : ''}></i>
        <div class="actor-name" ${a.color ? `style="color:${a.color}"` : ''}>${a.nombre}</div>
        <div class="port" data-id="${a.id}"></div>
    `;
    
    div.addEventListener('mousedown', (e) => startDragNode(e, a, 'actor', div));
    div.addEventListener('click', (e) => { e.stopPropagation(); selectElement(a, 'actor', div); });
    
    setupPorts(div, a.id);
    nodesLayer.appendChild(div);
}

function renderCase(c) {
    const div = document.createElement('div');
    div.className = 'node-case';
    div.id = `case_${c.id}`;
    div.style.left = c.x + 'px';
    div.style.top = c.y + 'px';
    
    if (c.bg_color) div.style.backgroundColor = c.bg_color;
    if (c.border_color) div.style.borderColor = c.border_color;
    if (c.text_color) div.style.color = c.text_color;
    
    div.innerHTML = `
        <span>${c.nombre}</span>
        <div class="port port-l" data-id="${c.id}"></div>
        <div class="port port-r" data-id="${c.id}"></div>
        <div class="port port-t" data-id="${c.id}"></div>
        <div class="port port-b" data-id="${c.id}"></div>
    `;
    
    div.addEventListener('mousedown', (e) => startDragNode(e, c, 'case', div));
    div.addEventListener('click', (e) => { e.stopPropagation(); selectElement(c, 'case', div); });
    
    setupPorts(div, c.id);
    nodesLayer.appendChild(div);
}

function setupPorts(nodeDiv, id) {
    const ports = nodeDiv.querySelectorAll('.port');
    ports.forEach(p => {
        p.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            startDrawingConnection(id, e);
        });
        p.addEventListener('mouseup', (e) => {
            e.stopPropagation();
            finishDrawingConnection(id);
        });
    });
    
    nodeDiv.addEventListener('mouseup', (e) => {
        if (isDrawing && startPortNodeId !== id) {
            e.stopPropagation();
            finishDrawingConnection(id);
        }
    });
}

function renderConnection(conn) {
    const n1 = getNodeById(conn.origen);
    const n2 = getNodeById(conn.destino);
    if (!n1 || !n2) return;
    
    // Simple center-to-center line for now
    const c1 = getCenter(n1, getTypeById(conn.origen));
    const c2 = getCenter(n2, getTypeById(conn.destino));
    
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute('d', `M ${c1.x} ${c1.y} L ${c2.x} ${c2.y}`);
    path.setAttribute('class', `connection-line ${conn.tipo}`);
    path.id = `conn_${conn.id}`;
    
    if (conn.tipo === 'include' || conn.tipo === 'extend') {
        path.setAttribute('marker-end', 'url(#arrow)');
    }
    if (conn.color) {
        path.setAttribute('stroke', conn.color);
    }
    
    path.addEventListener('click', (e) => {
        e.stopPropagation();
        selectElement(conn, 'connection', path);
    });
    
    connectionsGroup.appendChild(path);
    
    if (conn.tipo !== 'asociacion') {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute('x', (c1.x + c2.x)/2);
        text.setAttribute('y', (c1.y + c2.y)/2 - 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', 'connection-label');
        if (conn.color) text.setAttribute('fill', conn.color);
        text.textContent = `<<${conn.tipo}>>`;
        connectionsGroup.appendChild(text);
    }
}

function updateConnections() {
    connectionsGroup.innerHTML = '';
    conexiones.forEach(c => renderConnection(c));
}

function getCenter(node, type) {
    if (type === 'actor') return { x: node.x + 30, y: node.y + 45 };
    if (type === 'case') return { x: node.x + 70, y: node.y + 35 };
    return { x: 0, y: 0 };
}

function getNodeById(id) {
    return actores.find(a => a.id === id) || casos_uso.find(c => c.id === id);
}

function getTypeById(id) {
    if(actores.find(a => a.id === id)) return 'actor';
    if(casos_uso.find(c => c.id === id)) return 'case';
    return null;
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── DRAG & DROP CREATION ──────────────────────────────────────────────────

function setupToolbar() {
    document.querySelectorAll('.tool-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            dragType = item.dataset.type;
        });
    });
}

function setupCanvasEvents() {
    canvasContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    canvasContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!dragType) return;
        
        const rect = canvasContainer.getBoundingClientRect();
        const x = e.clientX - rect.left + canvasContainer.scrollLeft;
        const y = e.clientY - rect.top + canvasContainer.scrollTop;
        
        const id = 'id_' + Date.now();
        
        if (dragType === 'actor') {
            actores.push({ id, nombre: 'Actor', x: x - 30, y: y - 45 });
        } else if (dragType === 'case') {
            casos_uso.push({ id, nombre: 'Caso de Uso', x: x - 70, y: y - 35 });
        } else if (dragType === 'system') {
            sistemas.push({ id, nombre: 'Sistema', x: x - 150, y: y - 100, w: 300, h: 400 });
        } else if (dragType === 'note') {
            notas.push({ id, texto: 'Nueva Nota', x: x - 75, y: y - 50, w: 150, h: 100 });
        }
        
        dragType = null;
        renderAll();
        guardarProyecto();
    });
    
    // Canvas Click (Deselect)
    canvasContainer.addEventListener('click', () => {
        selectElement(null, null, null);
    });
    
    // Node dragging, drawing & resizing
    canvasContainer.addEventListener('mousemove', (e) => {
        if (isDrawing) {
            updateTempLine(e);
        } else if (isResizing && resizeNode) {
            let dx = e.clientX - startX;
            let dy = e.clientY - startY;
            let newW = startW, newH = startH;
            let newX = startX_node, newY = startY_node;

            if (resizeDir.includes('e')) newW = Math.max(50, startW + dx);
            if (resizeDir.includes('s')) newH = Math.max(50, startH + dy);
            if (resizeDir.includes('w')) {
                newW = Math.max(50, startW - dx);
                if (newW > 50) newX = startX_node + dx;
            }
            if (resizeDir.includes('n')) {
                newH = Math.max(50, startH - dy);
                if (newH > 50) newY = startY_node + dy;
            }
            
            resizeNode.data.w = newW;
            resizeNode.data.h = newH;
            resizeNode.data.x = newX;
            resizeNode.data.y = newY;
            
            resizeNode.el.style.width = newW + 'px';
            resizeNode.el.style.height = newH + 'px';
            resizeNode.el.style.left = newX + 'px';
            resizeNode.el.style.top = newY + 'px';
            
            updateConnections();
        } else if (isDragging && dragNode) {
            const rect = canvasContainer.getBoundingClientRect();
            let dx = (e.clientX - startX);
            let dy = (e.clientY - startY);
            
            dragNode.data.x += dx;
            dragNode.data.y += dy;
            
            dragNode.el.style.left = dragNode.data.x + 'px';
            dragNode.el.style.top = dragNode.data.y + 'px';
            
            startX = e.clientX;
            startY = e.clientY;
            
            updateConnections();
        }
    });
    
    window.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            resizeNode = null;
            guardarProyecto();
        }
        if (isDragging) {
            isDragging = false;
            dragNode = null;
            guardarProyecto();
        }
        if (isDrawing) {
            cancelDrawing();
        }
    });
}

// ─── NODE DRAGGING ─────────────────────────────────────────────────────────

function startDragNode(e, data, type, el) {
    if (e.target.classList.contains('port')) return; // handled by drawing
    
    if (!data.locked) {
        isDragging = true;
        dragNode = { data, type, el };
        startX = e.clientX;
        startY = e.clientY;
    }
    
    selectElement(data, type, el);
}

// ─── CONNECTION DRAWING ────────────────────────────────────────────────────

function startDrawingConnection(id, e) {
    isDrawing = true;
    startPortNodeId = id;
    
    const n1 = getNodeById(id);
    const c1 = getCenter(n1, getTypeById(id));
    
    tempLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    tempLine.setAttribute('class', 'connection-line');
    tempLine.setAttribute('stroke-dasharray', '5,5');
    tempLine.setAttribute('d', `M ${c1.x} ${c1.y} L ${c1.x} ${c1.y}`);
    connectionsGroup.appendChild(tempLine);
}

function updateTempLine(e) {
    if(!tempLine) return;
    const n1 = getNodeById(startPortNodeId);
    const c1 = getCenter(n1, getTypeById(startPortNodeId));
    
    const rect = canvasContainer.getBoundingClientRect();
    const x = e.clientX - rect.left + canvasContainer.scrollLeft;
    const y = e.clientY - rect.top + canvasContainer.scrollTop;
    
    tempLine.setAttribute('d', `M ${c1.x} ${c1.y} L ${x} ${y}`);
}

function finishDrawingConnection(targetId) {
    if (!isDrawing || startPortNodeId === targetId) {
        cancelDrawing();
        return;
    }
    
    const tipo = document.getElementById('conn-type-select').value;
    
    conexiones.push({
        id: 'conn_' + Date.now(),
        origen: startPortNodeId,
        destino: targetId,
        tipo: tipo
    });
    
    cancelDrawing();
    renderAll();
    guardarProyecto();
}

function cancelDrawing() {
    isDrawing = false;
    startPortNodeId = null;
    if (tempLine) {
        tempLine.remove();
        tempLine = null;
    }
}

// ─── SELECTION & PROPERTIES ────────────────────────────────────────────────

function selectElement(data, type, el) {
    // clear classes
    document.querySelectorAll('.selected').forEach(x => {
        if(x.tagName === 'path') {
            x.style.stroke = ''; x.style.strokeWidth = '';
            if(x.getAttribute('marker-end')) x.setAttribute('marker-end', 'url(#arrow)');
        }
        x.classList.remove('selected');
    });
    
    selectedElement = { data, type, el };
    
    document.getElementById('no-selection').classList.add('d-none');
    document.getElementById('prop-actor').classList.add('d-none');
    document.getElementById('prop-case').classList.add('d-none');
    document.getElementById('prop-system').classList.add('d-none');
    document.getElementById('prop-note').classList.add('d-none');
    document.getElementById('prop-conn').classList.add('d-none');
    
    if (!data) {
        document.getElementById('no-selection').classList.remove('d-none');
        return;
    }
    
    if (type !== 'connection') {
        el.classList.add('selected');
    } else {
        el.style.stroke = '#ffc107';
        el.style.strokeWidth = '3';
        if(el.getAttribute('marker-end')) el.setAttribute('marker-end', 'url(#arrow-hover)');
        el.classList.add('selected');
    }
    
    if (type === 'actor') {
        document.getElementById('prop-actor').classList.remove('d-none');
        const inp = document.getElementById('actor-name-input');
        inp.value = data.nombre;
        inp.oninput = () => { data.nombre = inp.value; el.querySelector('.actor-name').textContent = data.nombre; guardarProyecto(); };
        
        const col = document.getElementById('actor-color-input');
        col.value = data.color || '#ffffff';
        col.oninput = () => { data.color = col.value; el.querySelector('.actor-icon').style.color = data.color; el.querySelector('.actor-name').style.color = data.color; };
        col.onchange = () => { data.color = col.value; renderAll(); guardarProyecto(); selectElement(data, type, document.getElementById(`act_${data.id}`)); };
        
        const lock = document.getElementById('actor-lock-input');
        lock.checked = !!data.locked;
        lock.onchange = () => { data.locked = lock.checked; renderAll(); guardarProyecto(); selectElement(data, type, document.getElementById(`act_${data.id}`)); };
    } 
    else if (type === 'case') {
        document.getElementById('prop-case').classList.remove('d-none');
        const inp = document.getElementById('case-name-input');
        inp.value = data.nombre;
        inp.oninput = () => { data.nombre = inp.value; el.querySelector('span').textContent = data.nombre; guardarProyecto(); };
        
        const bgCol = document.getElementById('case-bg-color-input');
        bgCol.value = data.bg_color || '#1e1e1e';
        bgCol.oninput = () => { data.bg_color = bgCol.value; el.style.backgroundColor = data.bg_color; };
        bgCol.onchange = () => { data.bg_color = bgCol.value; renderAll(); guardarProyecto(); selectElement(data, type, document.getElementById(`case_${data.id}`)); };
        
        const borderCol = document.getElementById('case-border-color-input');
        borderCol.value = data.border_color || '#0d6efd';
        borderCol.oninput = () => { data.border_color = borderCol.value; el.style.borderColor = data.border_color; };
        borderCol.onchange = () => { data.border_color = borderCol.value; renderAll(); guardarProyecto(); selectElement(data, type, document.getElementById(`case_${data.id}`)); };
        
        const textCol = document.getElementById('case-text-color-input');
        textCol.value = data.text_color || '#ffffff';
        textCol.oninput = () => { data.text_color = textCol.value; el.style.color = data.text_color; };
        textCol.onchange = () => { data.text_color = textCol.value; renderAll(); guardarProyecto(); selectElement(data, type, document.getElementById(`case_${data.id}`)); };
        
        const lock = document.getElementById('case-lock-input');
        lock.checked = !!data.locked;
        lock.onchange = () => { data.locked = lock.checked; renderAll(); guardarProyecto(); selectElement(data, type, document.getElementById(`case_${data.id}`)); };
    }
    else if (type === 'system') {
        document.getElementById('prop-system').classList.remove('d-none');
        const inp = document.getElementById('system-name-input');
        inp.value = data.nombre;
        inp.oninput = () => { data.nombre = inp.value; el.querySelector('.node-system-header').textContent = data.nombre; guardarProyecto(); };
        
        const bgCol = document.getElementById('system-bg-color-input');
        bgCol.value = data.bg_color || '#333333';
        bgCol.oninput = () => { data.bg_color = bgCol.value; el.querySelector('.node-system-header').style.backgroundColor = data.bg_color; el.querySelector('.node-system-header').style.borderBottomColor = data.bg_color; };
        bgCol.onchange = () => { data.bg_color = bgCol.value; renderAll(); guardarProyecto(); selectElement(data, type, document.getElementById(`sys_${data.id}`)); };

        const borderCol = document.getElementById('system-border-color-input');
        borderCol.value = data.border_color || '#444444';
        borderCol.oninput = () => { data.border_color = borderCol.value; el.style.borderColor = data.border_color; };
        borderCol.onchange = () => { data.border_color = borderCol.value; renderAll(); guardarProyecto(); selectElement(data, type, document.getElementById(`sys_${data.id}`)); };

        const textCol = document.getElementById('system-text-color-input');
        textCol.value = data.text_color || '#ffffff';
        textCol.oninput = () => { data.text_color = textCol.value; el.querySelector('.node-system-header').style.color = data.text_color; };
        textCol.onchange = () => { data.text_color = textCol.value; renderAll(); guardarProyecto(); selectElement(data, type, document.getElementById(`sys_${data.id}`)); };
        
        const lock = document.getElementById('system-lock-input');
        lock.checked = !!data.locked;
        lock.onchange = () => { data.locked = lock.checked; renderAll(); guardarProyecto(); selectElement(data, type, document.getElementById(`sys_${data.id}`)); };
    }
    else if (type === 'note') {
        document.getElementById('prop-note').classList.remove('d-none');
        const inp = document.getElementById('note-text-input');
        inp.value = data.texto || '';
        inp.oninput = () => { data.texto = inp.value; el.querySelector('.note-content').textContent = escHtml(data.texto); guardarProyecto(); };
        
        const bgCol = document.getElementById('note-bg-color-input');
        bgCol.value = data.bg_color || '#ffeb3b';
        bgCol.oninput = () => { data.bg_color = bgCol.value; el.style.backgroundColor = data.bg_color; };
        bgCol.onchange = () => { data.bg_color = bgCol.value; renderAll(); guardarProyecto(); selectElement(data, type, document.getElementById(`note_${data.id}`)); };

        const textCol = document.getElementById('note-text-color-input');
        textCol.value = data.text_color || '#000000';
        textCol.oninput = () => { data.text_color = textCol.value; el.style.color = data.text_color; };
        textCol.onchange = () => { data.text_color = textCol.value; renderAll(); guardarProyecto(); selectElement(data, type, document.getElementById(`note_${data.id}`)); };
        
        const lock = document.getElementById('note-lock-input');
        lock.checked = !!data.locked;
        lock.onchange = () => { data.locked = lock.checked; renderAll(); guardarProyecto(); selectElement(data, type, document.getElementById(`note_${data.id}`)); };
    }
    else if (type === 'connection') {
        document.getElementById('prop-conn').classList.remove('d-none');
        const sel = document.getElementById('conn-edit-type');
        sel.value = data.tipo;
        sel.onchange = () => { data.tipo = sel.value; renderAll(); guardarProyecto(); selectElement(data, type, document.getElementById(`conn_${data.id}`)); };
        
        const col = document.getElementById('conn-color-input');
        col.value = data.color || '#aaaaaa';
        col.oninput = () => { data.color = col.value; el.setAttribute('stroke', data.color); };
        col.onchange = () => { data.color = col.value; renderAll(); guardarProyecto(); selectElement(data, type, document.getElementById(`conn_${data.id}`)); };
    }
}

// Global Deletions from Properties Panel
document.querySelectorAll('.btn-delete-node').forEach(btn => {
    btn.addEventListener('click', () => {
        if(!selectedElement) return;
        const id = selectedElement.data.id;
        
        if (selectedElement.type === 'actor') actores = actores.filter(x => x.id !== id);
        if (selectedElement.type === 'case') casos_uso = casos_uso.filter(x => x.id !== id);
        if (selectedElement.type === 'system') sistemas = sistemas.filter(x => x.id !== id);
        if (selectedElement.type === 'note') notas = notas.filter(x => x.id !== id);
        
        // Remove related connections
        conexiones = conexiones.filter(x => x.origen !== id && x.destino !== id);
        
        selectElement(null, null, null);
        renderAll();
        guardarProyecto();
    });
});

document.getElementById('btn-delete-conn').addEventListener('click', () => {
    if(!selectedElement || selectedElement.type !== 'connection') return;
    conexiones = conexiones.filter(x => x.id !== selectedElement.data.id);
    selectElement(null, null, null);
    renderAll();
    guardarProyecto();
});

// Export
document.getElementById('btn-export-png').addEventListener('click', () => {
    document.getElementById('modal-export').classList.remove('d-none');
});

document.getElementById('export-close').addEventListener('click', () => {
    document.getElementById('modal-export').classList.add('d-none');
});

document.getElementById('export-cancel').addEventListener('click', () => {
    document.getElementById('modal-export').classList.add('d-none');
});

document.getElementById('export-confirm').addEventListener('click', async () => {
    document.getElementById('modal-export').classList.add('d-none');
    selectElement(null, null, null);
    
    // Find boundaries
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    [...actores, ...casos_uso, ...notas].forEach(n => {
        let nx = Number(n.x) || 0;
        let ny = Number(n.y) || 0;
        let nw = Number(n.w) || 150;
        let nh = Number(n.h) || 100;
        
        if(nx < minX) minX = nx;
        if(ny < minY) minY = ny;
        if(nx + nw > maxX) maxX = nx + nw;
        if(ny + nh > maxY) maxY = ny + nh;
    });
    sistemas.forEach(s => {
        let sx = Number(s.x) || 0;
        let sy = Number(s.y) || 0;
        let sw = Number(s.w) || 200;
        let sh = Number(s.h) || 200;
        
        if(sx < minX) minX = sx;
        if(sy < minY) minY = sy;
        if(sx + sw > maxX) maxX = sx + sw;
        if(sy + sh > maxY) maxY = sy + sh;
    });
    
    if (minX === Infinity) return; // empty
    
    // pad
    minX = Math.max(0, minX - 60);
    minY = Math.max(0, minY - 60);
    maxX += 60;
    maxY += 60;
    
    const cloneWidth = Math.max(maxX + 200, window.innerWidth);
    const cloneHeight = Math.max(maxY + 200, window.innerHeight);
    
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.top = '0px';
    wrapper.style.left = '0px';
    wrapper.style.width = '0px';
    wrapper.style.height = '0px';
    wrapper.style.overflow = 'hidden';
    
    const clone = canvasContainer.cloneNode(true);
    // Make clone huge enough to not clip any children
    clone.style.width = cloneWidth + 'px';
    clone.style.height = cloneHeight + 'px';
    clone.style.overflow = 'visible';
    clone.style.position = 'relative';
    
    const scale = parseInt(document.getElementById('export-res').value) || 2;
    const bgVal = document.getElementById('export-bg').value;
    let bgConfig = null;
    
    if (bgVal === 'oscuro') {
        bgConfig = window.getComputedStyle(document.body).backgroundColor;
    } else if (bgVal === 'blanco') {
        bgConfig = '#ffffff';
        clone.style.background = '#ffffff';
    } else if (bgVal === 'transparente') {
        bgConfig = null;
        clone.style.background = 'transparent';
    }
    
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);
    
    try {
        const canvas = await html2canvas(clone, {
            scale: scale,
            backgroundColor: bgConfig,
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            windowWidth: cloneWidth,
            windowHeight: cloneHeight,
            logging: false
        });
        
        const link = document.createElement('a');
        link.download = `${proyecto.titulo.replace(/\s+/g, '_')}_UML.png`;
        link.href = canvas.toDataURL();
        link.click();
    } finally {
        document.body.removeChild(wrapper);
    }
});

function setupHelp() {
  const btn = document.getElementById('btn-ayuda');
  const modal = document.getElementById('modal-ayuda');
  const btnClose = document.getElementById('modal-ayuda-close');
  const btnCerrar = document.getElementById('btn-ayuda-cerrar');
  if(btn && modal) {
    btn.addEventListener('click', () => { modal.classList.remove('d-none'); });
    const closeFn = () => { modal.classList.add('d-none'); };
    if(btnClose) btnClose.addEventListener('click', closeFn);
    if(btnCerrar) btnCerrar.addEventListener('click', closeFn);
  }
}
