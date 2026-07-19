/* ════════════════════════════════════════════
   historias.js — Historias de Usuario
   ════════════════════════════════════════════ */

const sParams = new URLSearchParams(window.location.search);
const pid = sParams.get('pid');
if (!pid) window.location.href = '/historias/seleccion.html';

const API = '/api/historias';
let todasHUs = [];
let currentEditId = null;

const STATUS_LABELS = {
    backlog:       'Backlog',
    en_sprint:     'En Sprint',
    en_desarrollo: 'En Desarrollo',
    en_testing:    'En Testing',
    terminada:     'Terminada'
};
const STATUS_COLORS = {
    backlog:       '#6b7280',
    en_sprint:     '#3b82f6',
    en_desarrollo: '#f59e0b',
    en_testing:    '#8b5cf6',
    terminada:     '#10b981'
};
const PRIO_LABELS = { alta: '🔴 Alta', media: '🟡 Media', baja: '🟢 Baja' };

// ── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar nombre del proyecto
    try {
        const res = await fetch(`/api/historias/proyectos/${pid}`);
        if (res.ok) {
            const p = await res.json();
            document.getElementById('board-titulo').textContent = p.titulo;
        }
    } catch { }

    await cargarHistorias();

    document.getElementById('btn-add-hu-top').addEventListener('click',    () => abrirModal(null));
    document.getElementById('btn-add-hu-bottom').addEventListener('click', () => abrirModal(null));
    document.getElementById('modal-hu-cancel').addEventListener('click',   cerrarModal);
    document.getElementById('modal-hu').addEventListener('click', (e) => { if (e.target.id === 'modal-hu') cerrarModal(); });
    document.getElementById('modal-hu-save').addEventListener('click',     guardarHistoria);
    document.getElementById('modal-hu-delete').addEventListener('click',   eliminarHistoria);
    document.getElementById('btn-add-criterio').addEventListener('click',  agregarCriterio);

    document.getElementById('btn-export')?.addEventListener('click', exportarPNG);
    document.getElementById('btn-guardar')?.addEventListener('click', guardarComo);
    document.getElementById('btn-ayuda')?.addEventListener('click', () => {
        document.getElementById('modal-ayuda').classList.add('visible');
    });
    document.getElementById('btn-cerrar-ayuda')?.addEventListener('click', () => {
        document.getElementById('modal-ayuda').classList.remove('visible');
    });
});

// ── TOAST ────────────────────────────────────
function mostrarToast(msg, tipo = 'info') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast toast-${tipo}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
}

function escHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── CARGAR Y RENDERIZAR ───────────────────────
async function cargarHistorias() {
    try {
        const res = await fetch(`${API}?pid=${pid}`);
        todasHUs = await res.json();
        renderList();
    } catch {
        mostrarToast('Error al cargar historias', 'error');
    }
}

function renderList() {
    const list = document.getElementById('hu-list');

    if (!todasHUs.length) {
        list.innerHTML = `
            <div class="hu-empty-state">
                <div class="hu-empty-icon">📖</div>
                <p class="hu-empty-text">No hay historias de usuario todavía.<br/>¡Crea la primera con el botón de arriba!</p>
            </div>`;
        updateStatusCounters();
        return;
    }

    list.innerHTML = '';
    todasHUs.forEach(hu => {
        const rowClass = `row-${hu.estado || 'backlog'}`;
        const prioClass = `prioridad-${hu.prioridad || 'media'}`;
        const narrativa = [hu.como, hu.quiero, hu.para].filter(Boolean)
            .map((v, i) => `<em style="color:var(--accent-primary)">${['Como','quiero','para'][i]}</em> ${escHtml(v)}`)
            .join(' ');

        const item = document.createElement('div');
        item.className = `hu-item ${rowClass}`;
        item.dataset.id = hu.id;

        item.innerHTML = `
            <div class="hu-cell">
                <label>ID</label>
                <span class="hu-id-badge">${escHtml(hu.id)}</span>
            </div>

            <div class="hu-cell">
                <label>Historia</label>
                <div class="hu-cell-value" title="${escHtml(hu.titulo)}" style="flex-direction:column; align-items:flex-start; gap:2px;">
                    <strong style="font-size:0.9rem;">${escHtml(hu.titulo)}</strong>
                    ${narrativa ? `<span style="font-size:0.78rem; color:var(--text-secondary); white-space:normal; line-height:1.4;">${narrativa}</span>` : ''}
                </div>
            </div>

            <div class="hu-cell col-desc">
                <label>Épica / Sprint</label>
                <div class="hu-cell-value" style="flex-direction:column; align-items:flex-start; gap:2px;">
                    <span>${escHtml(hu.epica) || '<span style="color:var(--text-muted)">—</span>'}</span>
                    ${hu.sprint ? `<span style="font-size:0.78rem; color:var(--text-muted);">Sprint: ${escHtml(hu.sprint)}</span>` : ''}
                </div>
            </div>

            <div class="hu-cell">
                <label>Prioridad / SP</label>
                <div class="hu-cell-value" style="flex-direction:column; align-items:flex-start; gap:4px;">
                    <span class="hu-prioridad-badge ${prioClass}">${PRIO_LABELS[hu.prioridad] || '🟡 Media'}</span>
                    ${hu.estimacion ? `<span style="font-size:0.8rem; color:var(--text-muted);">${hu.estimacion} SP</span>` : ''}
                </div>
            </div>

            <div class="hu-cell">
                <label>Origen</label>
                <div class="hu-cell-value" style="font-size:0.82rem; color:var(--text-secondary);">${escHtml(hu.req_origen) || '—'}</div>
            </div>

            <div class="hu-cell">
                <label>Estado</label>
                <select class="hu-status-select select-estado">
                    <option value="backlog"       ${hu.estado === 'backlog'       ? 'selected' : ''}>Backlog</option>
                    <option value="en_sprint"     ${hu.estado === 'en_sprint'     ? 'selected' : ''}>En Sprint</option>
                    <option value="en_desarrollo" ${hu.estado === 'en_desarrollo' ? 'selected' : ''}>En Desarrollo</option>
                    <option value="en_testing"    ${hu.estado === 'en_testing'    ? 'selected' : ''}>En Testing</option>
                    <option value="terminada"     ${hu.estado === 'terminada'     ? 'selected' : ''}>Terminada</option>
                </select>
            </div>

            <div class="hu-cell" style="align-items:center;">
                <label>Ops.</label>
                <button class="btn-hu-opts btn-opts" title="Editar">⋯</button>
            </div>`;

        list.appendChild(item);

        item.querySelector('.btn-opts').addEventListener('click', () => abrirModal(hu));

        item.querySelector('.select-estado').addEventListener('change', async (e) => {
            const nuevoEstado = e.target.value;
            try {
                await fetch(`${API}/${hu.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estado: nuevoEstado })
                });
                const idx = todasHUs.findIndex(h => h.id === hu.id);
                if (idx !== -1) todasHUs[idx].estado = nuevoEstado;
                mostrarToast('Estado actualizado', 'success');
                renderList();
            } catch {
                mostrarToast('Error al actualizar estado', 'error');
                e.target.value = hu.estado;
            }
        });
    });

    updateStatusCounters();
}

function updateStatusCounters() {
    const container = document.getElementById('status-counters');
    if (!container) return;

    const counters = { backlog: 0, en_sprint: 0, en_desarrollo: 0, en_testing: 0, terminada: 0 };
    todasHUs.forEach(hu => {
        const est = hu.estado || 'backlog';
        if (counters[est] !== undefined) counters[est]++;
    });

    container.innerHTML = Object.keys(counters).map(key => {
        const color = STATUS_COLORS[key] || '#6b7280';
        const count = counters[key];
        return `<div style="display:flex; align-items:center; gap:6px; color:${color}; background:${color}1A; padding:4px 12px; border-radius:20px; border:1px solid ${color}40;">
            <span style="width:8px; height:8px; border-radius:50%; background-color:${color}; box-shadow: 0 0 5px ${color};"></span>
            <span style="font-size:0.82rem; font-weight:700;">${STATUS_LABELS[key]}: ${count}</span>
        </div>`;
    }).join('');
}

// ── CRITERIOS GHERKIN ─────────────────────────
let criterioCount = 0;
function agregarCriterio(datos = {}) {
    criterioCount++;
    const id = `criterio-${criterioCount}`;
    const div = document.createElement('div');
    div.className = 'criterio-block';
    div.dataset.cid = id;
    div.innerHTML = `
        <div class="criterio-header">
            <span class="criterio-num">Criterio ${criterioCount}</span>
            <button class="btn-del-criterio" data-cid="${id}" title="Eliminar criterio">✕</button>
        </div>
        <div class="criterio-fields">
            <div class="criterio-row">
                <span class="criterio-kw dado">Dado que</span>
                <input class="input" data-campo="dado" placeholder="el usuario está autenticado..." value="${escHtml(datos.dado || '')}" />
            </div>
            <div class="criterio-row">
                <span class="criterio-kw cuando">Cuando</span>
                <input class="input" data-campo="cuando" placeholder="hace clic en 'Registrar venta'..." value="${escHtml(datos.cuando || '')}" />
            </div>
            <div class="criterio-row">
                <span class="criterio-kw entonces">Entonces</span>
                <input class="input" data-campo="entonces" placeholder="el sistema descuenta el stock automáticamente..." value="${escHtml(datos.entonces || '')}" />
            </div>
        </div>`;

    div.querySelector('.btn-del-criterio').addEventListener('click', () => {
        div.remove();
        renumerarCriterios();
    });

    document.getElementById('criterios-list').appendChild(div);
}

function renumerarCriterios() {
    document.querySelectorAll('.criterio-block .criterio-num').forEach((el, i) => {
        el.textContent = `Criterio ${i + 1}`;
    });
}

function leerCriterios() {
    const criterios = [];
    document.querySelectorAll('.criterio-block').forEach(block => {
        criterios.push({
            dado:    block.querySelector('[data-campo="dado"]').value.trim(),
            cuando:  block.querySelector('[data-campo="cuando"]').value.trim(),
            entonces: block.querySelector('[data-campo="entonces"]').value.trim()
        });
    });
    return criterios;
}

// ── MODAL ─────────────────────────────────────
function abrirModal(hu) {
    currentEditId = hu ? hu.id : null;
    criterioCount = 0;
    document.getElementById('criterios-list').innerHTML = '';

    document.getElementById('modal-hu-titulo').textContent = hu ? `Editar: ${hu.id}` : 'Nueva Historia de Usuario';
    document.getElementById('modal-hu-delete').style.display = hu ? 'inline-flex' : 'none';

    document.getElementById('hu-id').value         = hu ? hu.id          : '(se asignará al guardar)';
    document.getElementById('hu-titulo').value      = hu ? hu.titulo      : '';
    document.getElementById('hu-epica').value       = hu ? hu.epica       : '';
    document.getElementById('hu-como').value        = hu ? hu.como        : '';
    document.getElementById('hu-quiero').value      = hu ? hu.quiero      : '';
    document.getElementById('hu-para').value        = hu ? hu.para        : '';
    document.getElementById('hu-prioridad').value   = hu ? hu.prioridad   : 'media';
    document.getElementById('hu-estimacion').value  = hu ? hu.estimacion  : '';
    document.getElementById('hu-estado').value      = hu ? hu.estado      : 'backlog';
    document.getElementById('hu-sprint').value      = hu ? hu.sprint      : '';
    document.getElementById('hu-req-origen').value  = hu ? hu.req_origen  : '';
    document.getElementById('hu-notas').value       = hu ? hu.notas       : '';

    if (hu && hu.criterios && hu.criterios.length) {
        hu.criterios.forEach(c => agregarCriterio(c));
    }

    document.getElementById('modal-hu').classList.add('visible');
    document.getElementById('hu-titulo').focus();
}

function cerrarModal() {
    document.getElementById('modal-hu').classList.remove('visible');
    currentEditId = null;
}

// ── GUARDAR ───────────────────────────────────
async function guardarHistoria() {
    const titulo = document.getElementById('hu-titulo').value.trim();
    if (!titulo) {
        mostrarToast('El título es obligatorio', 'error');
        document.getElementById('hu-titulo').focus();
        return;
    }

    const datos = {
        titulo:      titulo,
        epica:       document.getElementById('hu-epica').value.trim(),
        como:        document.getElementById('hu-como').value.trim(),
        quiero:      document.getElementById('hu-quiero').value.trim(),
        para:        document.getElementById('hu-para').value.trim(),
        criterios:   leerCriterios(),
        prioridad:   document.getElementById('hu-prioridad').value,
        estimacion:  document.getElementById('hu-estimacion').value,
        estado:      document.getElementById('hu-estado').value,
        sprint:      document.getElementById('hu-sprint').value.trim(),
        req_origen:  document.getElementById('hu-req-origen').value.trim(),
        notas:       document.getElementById('hu-notas').value.trim(),
        proyecto_id: pid
    };

    try {
        let res;
        if (currentEditId) {
            res = await fetch(`${API}/${currentEditId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
            const actualizada = await res.json();
            const idx = todasHUs.findIndex(h => h.id === currentEditId);
            if (idx !== -1) todasHUs[idx] = actualizada;
            mostrarToast('Historia actualizada', 'success');
        } else {
            res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
            const nueva = await res.json();
            todasHUs.push(nueva);
            mostrarToast(`Historia ${nueva.id} creada`, 'success');
        }
        cerrarModal();
        renderList();
    } catch {
        mostrarToast('Error al guardar', 'error');
    }
}

// ── ELIMINAR ──────────────────────────────────
async function eliminarHistoria() {
    if (!currentEditId) return;
    try {
        await fetch(`${API}/${currentEditId}`, { method: 'DELETE' });
        todasHUs = todasHUs.filter(h => h.id !== currentEditId);
        mostrarToast('Historia eliminada', 'success');
        cerrarModal();
        renderList();
    } catch {
        mostrarToast('Error al eliminar', 'error');
    }
}

// ── EXPORTAR PNG ──────────────────────────────
async function exportarPNG() {
    const container = document.querySelector('.hu-list-container');
    if (!container) return;
    mostrarToast('Generando imagen...', 'info');
    try {
        const canvas = await html2canvas(container, {
            backgroundColor: document.documentElement.getAttribute('data-tema') === 'claro' ? '#E8F7FB' : '#0A1628',
            scale: 2,
            onclone: (clonedDoc) => {
                // Ocultar botones de acción
                clonedDoc.querySelectorAll('#btn-add-hu-top, #btn-add-hu-bottom, .btn-hu-opts').forEach(el => el.style.display = 'none');
                // Reemplazar selects por divs
                clonedDoc.querySelectorAll('select.hu-status-select').forEach(sel => {
                    const div = clonedDoc.createElement('div');
                    div.className = sel.className;
                    div.style.cssText = 'display:block; line-height:19px; backgroundImage:none; padding:5px 8px;';
                    div.textContent = sel.options[sel.selectedIndex]?.text || '';
                    sel.parentNode.replaceChild(div, sel);
                });
                // Título del proyecto
                const titulo = document.getElementById('board-titulo').textContent;
                const header = clonedDoc.querySelector('.hu-list-header');
                if (header) {
                    const badge = clonedDoc.createElement('div');
                    badge.style.cssText = 'font-size:0.85rem; color:var(--text-muted); margin-top:6px;';
                    badge.textContent = `Proyecto: ${titulo}`;
                    header.appendChild(badge);
                }
            }
        });
        const link = document.createElement('a');
        link.download = `HistoriasUsuario-${pid || 'Lista'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        mostrarToast('Imagen exportada', 'success');
    } catch (e) {
        mostrarToast('Error al exportar PNG', 'error');
    }
}

// ── GUARDAR COMO JSON ─────────────────────────
function guardarComo() {
    if (!todasHUs.length) {
        mostrarToast('No hay historias para guardar', 'error');
        return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(todasHUs, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `HistoriasUsuario-${pid || 'Lista'}.json`);
    a.click();
    mostrarToast('Archivo guardado localmente', 'success');
}
