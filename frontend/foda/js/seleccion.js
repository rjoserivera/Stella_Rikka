/* ════════════════════════════════════════════
   seleccion.js — Análisis FODA (Proyectos)
   ════════════════════════════════════════════ */

const API = '/api/foda/proyectos';
let proyAEliminar = null;

// ── Tabs ─────────────────────────────────────
const btnNuevo    = document.getElementById('btn-nuevo');
const btnExistente = document.getElementById('btn-existente');
const panelNuevo  = document.getElementById('panel-nuevo');
const panelExist  = document.getElementById('panel-existente');

function activarTab(tab) {
    if (tab === 'nuevo') {
        btnNuevo.classList.add('active');      btnNuevo.setAttribute('aria-pressed', 'true');
        btnExistente.classList.remove('active'); btnExistente.setAttribute('aria-pressed', 'false');
        panelNuevo.classList.add('visible');   panelExist.classList.remove('visible');
    } else {
        btnExistente.classList.add('active');  btnExistente.setAttribute('aria-pressed', 'true');
        btnNuevo.classList.remove('active');   btnNuevo.setAttribute('aria-pressed', 'false');
        panelExist.classList.add('visible');   panelNuevo.classList.remove('visible');
        cargarProyectos();
    }
}

btnNuevo.addEventListener('click',    () => activarTab('nuevo'));
btnExistente.addEventListener('click', () => activarTab('existente'));
document.getElementById('btn-cancelar-nuevo').addEventListener('click', () => {
    document.getElementById('form-nuevo').reset();
});

// ── Toast ────────────────────────────────────
function mostrarToast(msg, tipo = 'info') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast toast-${tipo}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

// ── Crear Proyecto ────────────────────────────
document.getElementById('form-nuevo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const titulo      = document.getElementById('input-titulo').value.trim();
    const descripcion = document.getElementById('input-descripcion').value.trim();

    if (!titulo) {
        mostrarToast('El nombre del proyecto es obligatorio.', 'error');
        return;
    }

    const btn = document.getElementById('btn-crear');
    btn.disabled = true; btn.textContent = 'Creando...';

    try {
        const res = await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titulo, descripcion })
        });
        if (!res.ok) throw new Error();
        const proyecto = await res.json();
        mostrarToast(`Análisis "${proyecto.titulo}" creado.`, 'success');
        setTimeout(() => {
            window.location.href = `/foda/matriz?pid=${proyecto.id}`;
        }, 600);
    } catch {
        mostrarToast('Error al crear. ¿Está ejecutándose el servidor?', 'error');
        btn.disabled = false;
        btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg> Crear Análisis`;
    }
});

// ── Cargar Proyectos ──────────────────────────
async function cargarProyectos() {
    const list = document.getElementById('projects-list');
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⏳</div><p class="empty-state-text">Cargando...</p></div>`;
    try {
        const res  = await fetch(API);
        const proys = await res.json();
        renderizarProyectos(proys);
    } catch {
        list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><p class="empty-state-text">No se pudo conectar con el servidor.</p></div>`;
    }
}

function escHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderizarProyectos(proys) {
    const list = document.getElementById('projects-list');
    if (!proys.length) {
        list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div><p class="empty-state-text">No hay análisis creados aún.<br/>Crea el primero desde la pestaña de arriba.</p></div>`;
        return;
    }

    list.innerHTML = proys.map(p => {
        const fecha = p.fecha_creacion
            ? new Date(p.fecha_creacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
            : '—';
        return `
      <div class="project-item" data-pid="${p.id}" role="button" tabindex="0">
        <div class="project-item-icon">🎯</div>
        <div class="project-item-info">
          <div class="project-item-name">${escHtml(p.titulo)}</div>
          <div class="project-item-meta">${escHtml(p.descripcion) || 'Sin descripción'} &nbsp;·&nbsp;${fecha}</div>
        </div>
        <div class="project-item-actions">
          <button class="project-action-btn delete" data-pid="${p.id}" title="Eliminar">🗑️</button>
        </div>
        <svg style="color:var(--text-muted);flex-shrink:0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </div>`;
    }).join('');

    list.querySelectorAll('.project-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.project-action-btn')) return;
            window.location.href = `/foda/matriz?pid=${item.dataset.pid}`;
        });
    });

    list.querySelectorAll('.project-action-btn.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            proyAEliminar = btn.dataset.pid;
            const nombre = btn.closest('.project-item').querySelector('.project-item-name').textContent.trim();
            document.getElementById('modal-body').innerHTML = `¿Eliminar <strong>"${escHtml(nombre)}"</strong>? <strong>No se puede deshacer.</strong>`;
            document.getElementById('modal-eliminar').classList.add('visible');
        });
    });
}

// ── Modal ─────────────────────────────────────
document.getElementById('btn-modal-cancelar').addEventListener('click', cerrarModal);
document.getElementById('modal-eliminar').addEventListener('click', (e) => { if (e.target === e.currentTarget) cerrarModal(); });
document.getElementById('btn-modal-confirmar').addEventListener('click', async () => {
    if (!proyAEliminar) return;
    const btn = document.getElementById('btn-modal-confirmar');
    btn.disabled = true; btn.textContent = 'Eliminando...';
    try {
        const res = await fetch(`${API}/${proyAEliminar}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        mostrarToast('Archivo eliminado.', 'success');
        cerrarModal();
        cargarProyectos();
    } catch {
        mostrarToast('Error al eliminar.', 'error');
        btn.disabled = false; btn.textContent = 'Eliminar';
    }
});

function cerrarModal() {
    document.getElementById('modal-eliminar').classList.remove('visible');
    proyAEliminar = null;
    const btn = document.getElementById('btn-modal-confirmar');
    btn.disabled = false; btn.textContent = 'Eliminar';
}
