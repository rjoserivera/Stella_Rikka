/* ════════════════════════════════════════════
   seleccion.js — Lógica pantalla de selección Lean Canvas
   ════════════════════════════════════════════ */

const API = '/api/leancanvas';
let proyectoAEliminar = null;

// ── Tabs: Nuevo / Existente ──────────────────
const btnNuevo     = document.getElementById('btn-nuevo');
const btnExistente = document.getElementById('btn-existente');
const panelNuevo   = document.getElementById('panel-nuevo');
const panelExist  = document.getElementById('panel-existente');

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
    cargarProyectos();
  }
}

btnNuevo.addEventListener('click', () => activarTab('nuevo'));
btnExistente.addEventListener('click', () => activarTab('existente'));
document.getElementById('btn-cancelar-nuevo').addEventListener('click', () => {
  document.getElementById('form-nuevo').reset();
});

// ── Toast de notificaciones ──────────────────
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

// ── Crear proyecto ───────────────────────────
document.getElementById('form-nuevo').addEventListener('submit', async (e) => {
  e.preventDefault();
  const titulo = document.getElementById('input-titulo').value.trim();
  const descripcion = document.getElementById('input-descripcion').value.trim();

  if (!titulo) {
    mostrarToast('El título es obligatorio.', 'error');
    document.getElementById('input-titulo').focus();
    return;
  }

  const btnCrear = document.getElementById('btn-crear');
  btnCrear.disabled = true;
  btnCrear.textContent = 'Creando...';

  try {
    const res = await fetch(`${API}/proyectos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, descripcion })
    });

    if (!res.ok) throw new Error('Error al crear el proyecto');
    const proyecto = await res.json();

    // Crear la primera versión vacía del canvas
    const canvas_inicial = {
        'problema': [], 'solucion': [], 'metricas': [], 'propuesta': [], 'ventaja': [],
        'canales': [], 'segmentos': [], 'costos': [], 'ingresos': []
    };
    await fetch(`${API}/proyectos/${proyecto.id}/versiones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: 'v1', canvas: canvas_inicial })
    });

    await fetch('/api/preferencias', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ultima_herramienta_usada: 'leancanvas',
        leancanvas: { ultimo_proyecto_abierto: proyecto.id }
      })
    }).catch(() => {});

    mostrarToast(`Proyecto "${proyecto.titulo}" creado exitosamente.`, 'success');
    setTimeout(() => {
      window.location.href = `/leancanvas/canvas?pid=${proyecto.id}`;
    }, 600);

  } catch (err) {
    mostrarToast('No se pudo crear el proyecto. ¿Está ejecutándose el servidor?', 'error');
    btnCrear.disabled = false;
    btnCrear.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Crear y abrir`;
  }
});

// ── Cargar proyectos existentes ──────────────
async function cargarProyectos() {
  const list = document.getElementById('projects-list');
  list.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">⏳</div>
      <p class="empty-state-text">Cargando proyectos...</p>
    </div>`;

  try {
    const res = await fetch(`${API}/proyectos`);
    const proyectos = await res.json();
    renderizarProyectos(proyectos);
  } catch {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <p class="empty-state-text">No se pudo conectar con el servidor.<br/>Asegúrate de que <code>app.py</code> está en ejecución.</p>
      </div>`;
  }
}

function renderizarProyectos(proyectos) {
  const list = document.getElementById('projects-list');

  if (!proyectos.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <p class="empty-state-text">Todavía no tienes proyectos guardados.<br/>Crea el primero desde la pestaña de arriba.</p>
      </div>`;
    return;
  }

  list.innerHTML = proyectos.map(p => {
    const fecha = p.fecha_creacion
      ? new Date(p.fecha_creacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
      : '—';
    return `
      <div class="project-item" data-pid="${p.id}" role="button" tabindex="0" aria-label="Abrir proyecto ${p.titulo}">
        <div class="project-item-icon">💡</div>
        <div class="project-item-info">
          <div class="project-item-name">${escHtml(p.titulo)}</div>
          <div class="project-item-meta">
            Creado el ${fecha}${p.descripcion ? ' · ' + escHtml(p.descripcion.substring(0, 50)) + (p.descripcion.length > 50 ? '…' : '') : ''}
          </div>
        </div>
        <div class="project-item-actions">
          <button class="project-action-btn delete" data-pid="${p.id}" aria-label="Eliminar ${escHtml(p.titulo)}" title="Eliminar">🗑️</button>
        </div>
        <svg style="color:var(--text-muted);flex-shrink:0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>`;
  }).join('');

  list.querySelectorAll('.project-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.project-action-btn')) return;
      abrirProyecto(item.dataset.pid);
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('.project-action-btn')) return;
        abrirProyecto(item.dataset.pid);
      }
    });
  });

  list.querySelectorAll('.project-action-btn.delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      confirmarEliminar(btn.dataset.pid, btn.closest('.project-item').querySelector('.project-item-name').textContent);
    });
  });
}

function abrirProyecto(pid) {
  fetch('/api/preferencias', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leancanvas: { ultimo_proyecto_abierto: pid } })
  }).catch(() => {});
  window.location.href = `/leancanvas/canvas?pid=${pid}`;
}

// ── Modal de eliminación ─────────────────────
function confirmarEliminar(pid, nombre) {
  proyectoAEliminar = pid;
  document.getElementById('modal-body').innerHTML =
    `¿Estás seguro de que quieres eliminar <strong>"${escHtml(nombre)}"</strong>? Se eliminarán también todas sus versiones. <strong>Esta acción no se puede deshacer.</strong>`;
  document.getElementById('modal-eliminar').classList.add('visible');
}

document.getElementById('btn-modal-cancelar').addEventListener('click', cerrarModal);
document.getElementById('modal-eliminar').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) cerrarModal();
});

document.getElementById('btn-modal-confirmar').addEventListener('click', async () => {
  if (!proyectoAEliminar) return;
  const btn = document.getElementById('btn-modal-confirmar');
  btn.disabled = true;
  btn.textContent = 'Eliminando...';

  try {
    const res = await fetch(`${API}/proyectos/${proyectoAEliminar}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    mostrarToast('Proyecto eliminado correctamente.', 'success');
    cerrarModal();
    cargarProyectos();
  } catch {
    mostrarToast('Error al eliminar el proyecto.', 'error');
    btn.disabled = false;
    btn.textContent = 'Eliminar';
  }
});

function cerrarModal() {
  document.getElementById('modal-eliminar').classList.remove('visible');
  proyectoAEliminar = null;
  const btn = document.getElementById('btn-modal-confirmar');
  btn.disabled = false;
  btn.textContent = 'Eliminar';
}

// ── Importar proyecto JSON ───────────────────
const btnImportarJson = document.getElementById('btn-importar-json');
const inputImportJson = document.getElementById('input-import-json');

if (btnImportarJson && inputImportJson) {
  btnImportarJson.addEventListener('click', () => {
    inputImportJson.click();
  });

  inputImportJson.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.proyecto || (!data.versiones && !data.canvas)) {
        throw new Error('El archivo no tiene el formato de proyecto Lean Canvas válido.');
      }

      mostrarToast('Importando proyecto no soportado todavía', 'info');
      
      // We would implement the import logic in backend later (RF-LC07 focuses on Excel/CSV to blocks)
      
    } catch (err) {
      console.error(err);
      mostrarToast('Error al importar: ' + err.message, 'error');
    } finally {
      inputImportJson.value = '';
    }
  });
}

// ── Utilidades ───────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
