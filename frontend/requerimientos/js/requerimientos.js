/* ════════════════════════════════════════════
   requerimientos.js — Lista de Requerimientos
   ════════════════════════════════════════════ */

const sParams = new URLSearchParams(window.location.search);
const pid = sParams.get('pid');
const API = '/api/requerimientos';
let todosReqs = [];
let currentEditId = null;

const STATUS_DOT_CLASS = {
    borrador:     'status-borrador',
    en_revision:  'status-en_revision',
    aprobado:     'status-aprobado',
    implementado: 'status-implementado',
    obsoleto:     'status-obsoleto'
};

const STATUS_LABELS = {
    borrador:     'Borrador',
    en_revision:  'En Revisión',
    aprobado:     'Aprobado',
    implementado: 'Implementado',
    obsoleto:     'Obsoleto'
};

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    cargarRequerimientos();

    document.getElementById('btn-add-req-top').addEventListener('click', () => abrirModal());
    document.getElementById('btn-add-req-bottom').addEventListener('click', () => abrirModal());

    document.getElementById('modal-req-cancel').addEventListener('click', cerrarModal);
    document.getElementById('modal-req').addEventListener('click', (e) => {
        if (e.target.id === 'modal-req') cerrarModal();
    });
    document.getElementById('modal-req-save').addEventListener('click', guardarRequerimiento);
    document.getElementById('modal-req-delete').addEventListener('click', eliminarRequerimiento);

    document.getElementById('btn-export')?.addEventListener('click', exportarPNG);
    document.getElementById('btn-guardar')?.addEventListener('click', guardarComo);

    document.getElementById('btn-ayuda')?.addEventListener('click', () => {
        document.getElementById('modal-ayuda').classList.add('visible');
    });
    document.getElementById('btn-cerrar-ayuda')?.addEventListener('click', () => {
        document.getElementById('modal-ayuda').classList.remove('visible');
    });
});

// ── TOAST ──
function mostrarToast(msg, tipo = 'info') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast toast-${tipo}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { t.remove(); }, 3200);
}

function escHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── CARGA DESDE API ──
async function cargarRequerimientos() {
    if (!pid) {
        // Sin pid: mostrar lista vacía lista para agregar
        renderList();
        return;
    }
    try {
        const res = await fetch(`${API}?pid=${pid}`);
        todosReqs = await res.json();

        const prRes = await fetch(`/api/requerimientos/proyectos/${pid}`);
        if (prRes.ok) {
            const pr = await prRes.json();
            document.getElementById('board-titulo').textContent = pr.titulo || 'Requerimientos';
        }

        renderList();
    } catch (e) {
        mostrarToast('Error de conexión al cargar requerimientos', 'error');
        renderList();
    }
}

// ── RENDER LISTA ──
function renderList() {
    const list = document.getElementById('req-list');
    list.innerHTML = '';

    if (todosReqs.length === 0) {
        list.innerHTML = `
            <div class="req-empty">
                <div class="req-empty-icon">📋</div>
                <p>No hay requerimientos todavía.</p>
                <p style="font-size:0.85rem; margin-top:4px;">Haz clic en <strong>+ Agregar requerimiento</strong> para comenzar.</p>
            </div>`;
        return;
    }

    todosReqs.forEach(req => {
        const dotClass = STATUS_DOT_CLASS[req.estado] || 'status-borrador';
        const rowClass = `row-${req.estado || 'borrador'}`;

        const item = document.createElement('div');
        item.className = `req-list-item ${rowClass}`;
        item.dataset.id = req.id;

        item.innerHTML = `
            <div class="req-item-id">
                <span class="req-badge-id">${escHtml(req.id)}</span>
            </div>

            <div class="req-item-field req-item-title">
                <label>Título</label>
                <div class="req-input" title="${escHtml(req.titulo)}">${escHtml(req.titulo)}</div>
            </div>

            <div class="req-item-field req-item-desc">
                <label>Descripción</label>
                <div class="req-input" title="${escHtml(req.descripcion)}">${escHtml(req.descripcion)}</div>
            </div>

            <div class="req-item-field req-item-status">
                <label>Estado</label>
                <div class="status-select-wrapper">
                    <span class="status-dot ${dotClass}"></span>
                    <select class="status-select select-inline">
                        <option value="borrador"     ${req.estado === 'borrador'     ? 'selected' : ''}>Borrador</option>
                        <option value="en_revision"  ${req.estado === 'en_revision'  ? 'selected' : ''}>En Revisión</option>
                        <option value="aprobado"     ${req.estado === 'aprobado'     ? 'selected' : ''}>Aprobado</option>
                        <option value="implementado" ${req.estado === 'implementado' ? 'selected' : ''}>Implementado</option>
                        <option value="obsoleto"     ${req.estado === 'obsoleto'     ? 'selected' : ''}>Obsoleto</option>
                    </select>
                </div>
            </div>

            <div class="req-item-actions">
                <button class="btn-icon btn-opts" title="Editar requerimiento">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                </button>
            </div>
        `;

        list.appendChild(item);
        item.querySelector('.btn-opts').addEventListener('click', () => abrirModal(req));

        item.querySelector('.select-inline').addEventListener('change', async (e) => {
            const newStatus = e.target.value;
            try {
                await fetch(`${API}/${req.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estado: newStatus })
                });
                const idx = todosReqs.findIndex(r => r.id === req.id);
                if (idx !== -1) todosReqs[idx].estado = newStatus;
                mostrarToast('Estado actualizado', 'success');
                renderList();
            } catch (err) {
                mostrarToast('Error al actualizar estado', 'error');
                e.target.value = req.estado;
            }
        });
    });
    
    updateStatusCounters();
}

function updateStatusCounters() {
    const container = document.getElementById('status-counters');
    if (!container) return;

    const counters = { borrador: 0, en_revision: 0, aprobado: 0, implementado: 0, obsoleto: 0 };
    todosReqs.forEach(req => {
        const est = req.estado || 'borrador';
        if (counters[est] !== undefined) counters[est]++;
    });

    const COLORS = {
        borrador: '#fca311',
        en_revision: '#3b82f6',
        aprobado: '#10b981',
        implementado: '#8b5cf6',
        obsoleto: '#ef4444'
    };

    container.innerHTML = Object.keys(counters).map(key => {
        const color = COLORS[key] || '#fca311';
        const count = counters[key];
        return `<div style="display:flex; align-items:center; gap:6px; color: ${color}; background: ${color}1A; padding: 4px 12px; border-radius: 20px; border: 1px solid ${color}40;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; box-shadow: 0 0 5px ${color};"></span>
            <span style="font-size: 0.85rem; font-weight: 700; letter-spacing: 0.02em;">${STATUS_LABELS[key]}: ${count}</span>
        </div>`;
    }).join('');
}

// ── MODAL ──
function abrirModal(req = null) {
    const m   = document.getElementById('modal-req');
    const dlt = document.getElementById('modal-req-delete');

    if (req) {
        currentEditId = req.id;
        document.getElementById('modal-title').textContent = `Editar ${req.id}`;
        document.getElementById('req-titulo').value    = req.titulo      || '';
        document.getElementById('req-desc').value      = req.descripcion || '';
        document.getElementById('req-tipo').value      = req.tipo        || 'funcional';
        document.getElementById('req-prioridad').value = req.prioridad   || 'media';
        document.getElementById('req-estado').value    = req.estado      || 'borrador';
        dlt.style.display = 'block';
    } else {
        currentEditId = null;
        document.getElementById('modal-title').textContent = 'Registrar Requerimiento';
        document.getElementById('req-titulo').value    = '';
        document.getElementById('req-desc').value      = '';
        document.getElementById('req-tipo').value      = 'funcional';
        document.getElementById('req-prioridad').value = 'media';
        document.getElementById('req-estado').value    = 'borrador';
        dlt.style.display = 'none';
    }

    m.classList.add('visible');
    document.getElementById('req-titulo').focus();
}

function cerrarModal() {
    document.getElementById('modal-req').classList.remove('visible');
    currentEditId = null;
}

// ── GUARDAR ──
async function guardarRequerimiento() {
    const titulo      = document.getElementById('req-titulo').value.trim();
    const descripcion = document.getElementById('req-desc').value.trim();
    const tipo        = document.getElementById('req-tipo').value;
    const prioridad   = document.getElementById('req-prioridad').value;
    const estado      = document.getElementById('req-estado').value;

    if (!titulo || !descripcion) {
        mostrarToast('Título y descripción son obligatorios', 'error');
        return;
    }

    const payload = { titulo, descripcion, tipo, prioridad, estado, proyecto_id: pid };

    const btn = document.getElementById('modal-req-save');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
        if (currentEditId) {
            await fetch(`${API}/${currentEditId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            // actualizar en cache local
            const idx = todosReqs.findIndex(r => r.id === currentEditId);
            if (idx !== -1) todosReqs[idx] = { ...todosReqs[idx], ...payload };
            mostrarToast('Requerimiento actualizado', 'success');
        } else {
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const nuevo = await res.json();
            todosReqs.push(nuevo);
            mostrarToast('Requerimiento creado', 'success');
        }
        cerrarModal();
        renderList();
    } catch (e) {
        mostrarToast('Error al guardar', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Guardar';
    }
}

// ── ELIMINAR ──
async function eliminarRequerimiento() {
    if (!currentEditId) return;
    if (!confirm('¿Seguro que deseas eliminar este requerimiento?')) return;

    try {
        await fetch(`${API}/${currentEditId}`, { method: 'DELETE' });
        todosReqs = todosReqs.filter(r => r.id !== currentEditId);
        mostrarToast('Requerimiento eliminado', 'success');
        cerrarModal();
        renderList();
    } catch (e) {
        mostrarToast('Error al eliminar', 'error');
    }
}

// ── EXPORTAR PNG ──
async function exportarPNG() {
    const list = document.querySelector('.req-list-container');
    if (!list) return;
    try {
        mostrarToast('Generando PNG...', 'info');
        const canvas = await html2canvas(list, {
            backgroundColor: document.documentElement.getAttribute('data-tema') === 'claro' ? '#E8F7FB' : '#0A1628',
            scale: 2,
            onclone: (clonedDoc) => {
                const clonedList = clonedDoc.querySelector('.req-list-container');
                
                // Ocultar botones
                const btnTop = clonedList.querySelector('#btn-add-req-top');
                const btnBottom = clonedList.querySelector('#btn-add-req-bottom');
                const opts = clonedList.querySelectorAll('.req-item-actions');
                
                if (btnTop) btnTop.style.display = 'none';
                if (btnBottom) btnBottom.style.display = 'none';
                opts.forEach(el => el.style.display = 'none');

                // Reemplazar selects por divs estáticos perfectos
                const selects = clonedList.querySelectorAll('select.status-select');
                selects.forEach(sel => {
                    const div = clonedDoc.createElement('div');
                    div.className = sel.className;
                    div.style.display = 'block';
                    div.style.lineHeight = '19px';
                    div.style.backgroundImage = 'none';
                    div.textContent = sel.options[sel.selectedIndex].text;
                    sel.parentNode.replaceChild(div, sel);
                });

                // Agregar el título del proyecto arriba
                const nombreProyecto = document.getElementById('board-titulo').textContent;
                const tituloExport = clonedDoc.createElement('div');
                tituloExport.style.textAlign = 'right';
                tituloExport.style.color = 'var(--text-muted)';
                tituloExport.style.fontSize = '1.1rem';
                tituloExport.style.fontWeight = '700';
                tituloExport.style.marginBottom = '15px';
                tituloExport.style.borderBottom = '1px solid var(--border-color)';
                tituloExport.style.paddingBottom = '10px';
                tituloExport.textContent = `Archivo: ${nombreProyecto}`;
                
                clonedList.insertBefore(tituloExport, clonedList.firstChild);
            }
        });
        const link = document.createElement('a');
        link.download = `Requerimientos-${pid || 'Lista'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        mostrarToast('Imagen exportada', 'success');
    } catch (e) {
        mostrarToast('Error al exportar PNG', 'error');
    }
}

// ── GUARDAR COMO JSON ──
function guardarComo() {
    if (!todosReqs || todosReqs.length === 0) {
        mostrarToast('No hay requerimientos para guardar', 'error');
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(todosReqs, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `Requerimientos-${pid || 'Lista'}.json`);
    dlAnchorElem.click();
    mostrarToast('Archivo guardado localmente', 'success');
}
