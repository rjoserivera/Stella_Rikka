/* ════════════════════════════════════════════
   seleccion.js — Lluvia de Ideas
   ════════════════════════════════════════════ */

const API = '/api/lluviadeideas';
let sesionAEliminar = null;

const btnNuevo = document.getElementById('btn-nuevo');
const btnExistente = document.getElementById('btn-existente');
const panelNuevo = document.getElementById('panel-nuevo');
const panelExist = document.getElementById('panel-existente');

function activarTab(tab) {
    if (tab === 'nuevo') {
        btnNuevo.classList.add('active');
        btnNuevo.setAttribute('aria-pressed', 'true');
        btnExistente.classList.remove('active');
        btnExistente.setAttribute('aria-pressed', 'false');
        panelNuevo.classList.add('visible');
        panelExist.classList.remove('visible');
    } else {
        btnExistente.classList.add('active');
        btnExistente.setAttribute('aria-pressed', 'true');
        btnNuevo.classList.remove('active');
        btnNuevo.setAttribute('aria-pressed', 'false');
        panelExist.classList.add('visible');
        panelNuevo.classList.remove('visible');
        cargarSesiones();
    }
}

btnNuevo.addEventListener('click', () => activarTab('nuevo'));
btnExistente.addEventListener('click', () => activarTab('existente'));
document.getElementById('btn-cancelar-nuevo').addEventListener('click', () => {
    document.getElementById('form-nuevo').reset();
});

// ── Toast ────────────────────────────────────
function mostrarToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensaje;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ── Crear sesión ─────────────────────────────
document.getElementById('form-nuevo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const titulo = document.getElementById('input-titulo').value.trim();
    if (!titulo) {
        mostrarToast('El título es obligatorio.', 'error');
        document.getElementById('input-titulo').focus();
        return;
    }

    const btnCrear = document.getElementById('btn-crear');
    btnCrear.disabled = true;
    btnCrear.textContent = 'Creando...';

    try {
        const res = await fetch(`${API}/sesiones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titulo })
        });
        if (!res.ok) throw new Error();
        const sesion = await res.json();
        mostrarToast(`Sesión "${sesion.titulo}" creada.`, 'success');
        setTimeout(() => {
            window.location.href = `/lluviadeideas/lienzo?sid=${sesion.id}`;
        }, 600);
    } catch {
        mostrarToast('No se pudo crear la sesión. ¿Está ejecutándose el servidor?', 'error');
        btnCrear.disabled = false;
        btnCrear.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg> Crear y abrir`;
    }
});

// ── Cargar sesiones ──────────────────────────
async function cargarSesiones() {
    const list = document.getElementById('projects-list');
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⏳</div><p class="empty-state-text">Cargando sesiones...</p></div>`;
    try {
        const res = await fetch(`${API}/sesiones`);
        const sesiones = await res.json();
        renderizarSesiones(sesiones);
    } catch {
        list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><p class="empty-state-text">No se pudo conectar con el servidor.</p></div>`;
    }
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderizarSesiones(sesiones) {
    const list = document.getElementById('projects-list');
    if (!sesiones.length) {
        list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div><p class="empty-state-text">Todavía no tienes sesiones guardadas.<br/>Crea la primera desde la pestaña de arriba.</p></div>`;
        return;
    }
    list.innerHTML = sesiones.map(s => {
        const fecha = s.fecha ? new Date(s.fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
        const nNodos = (s.nodos || []).length;
        return `
      <div class="project-item" data-sid="${s.id}" role="button" tabindex="0" aria-label="Abrir sesión ${s.titulo}">
        <div class="project-item-icon">🧠</div>
        <div class="project-item-info">
          <div class="project-item-name">${escHtml(s.titulo)}</div>
          <div class="project-item-meta">${fecha} · ${nNodos} idea${nNodos !== 1 ? 's' : ''}</div>
        </div>
        <div class="project-item-actions">
          <button class="project-action-btn delete" data-sid="${s.id}" aria-label="Eliminar ${escHtml(s.titulo)}" title="Eliminar">🗑️</button>
        </div>
        <svg style="color:var(--text-muted);flex-shrink:0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </div>`;
    }).join('');

    list.querySelectorAll('.project-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.project-action-btn')) return;
            window.location.href = `/lluviadeideas/lienzo?sid=${item.dataset.sid}`;
        });
        item.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.project-action-btn')) {
                window.location.href = `/lluviadeideas/lienzo?sid=${item.dataset.sid}`;
            }
        });
    });

    list.querySelectorAll('.project-action-btn.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            sesionAEliminar = btn.dataset.sid;
            const nombre = btn.closest('.project-item').querySelector('.project-item-name').textContent;
            document.getElementById('modal-body').innerHTML = `¿Estás seguro de que quieres eliminar <strong>"${escHtml(nombre)}"</strong>? <strong>Esta acción no se puede deshacer.</strong>`;
            document.getElementById('modal-eliminar').classList.add('visible');
        });
    });
}

// ── Modal ────────────────────────────────────
document.getElementById('btn-modal-cancelar').addEventListener('click', cerrarModal);
document.getElementById('modal-eliminar').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) cerrarModal();
});
document.getElementById('btn-modal-confirmar').addEventListener('click', async () => {
    if (!sesionAEliminar) return;
    const btn = document.getElementById('btn-modal-confirmar');
    btn.disabled = true; btn.textContent = 'Eliminando...';
    try {
        const res = await fetch(`${API}/sesiones/${sesionAEliminar}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        mostrarToast('Sesión eliminada.', 'success');
        cerrarModal();
        cargarSesiones();
    } catch {
        mostrarToast('Error al eliminar.', 'error');
        btn.disabled = false; btn.textContent = 'Eliminar';
    }
});

function cerrarModal() {
    document.getElementById('modal-eliminar').classList.remove('visible');
    sesionAEliminar = null;
    const btn = document.getElementById('btn-modal-confirmar');
    btn.disabled = false; btn.textContent = 'Eliminar';
}
