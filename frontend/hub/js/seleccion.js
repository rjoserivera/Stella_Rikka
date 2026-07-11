/* ════════════════════════════════════════════
   seleccion.js — Lógica pantalla de selección Hub
   ════════════════════════════════════════════ */

const API = '/api/hub';
let proyectoAEliminar = null;

// ── Tabs ──
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

// ── Crear proyecto ──
document.getElementById('form-nuevo').addEventListener('submit', async (e) => {
  e.preventDefault();
  const titulo = document.getElementById('input-titulo').value.trim();
  const descripcion = document.getElementById('input-descripcion').value.trim();

  if (!titulo) return;

  const btnCrear = document.getElementById('btn-crear');
  btnCrear.disabled = true;
  btnCrear.textContent = 'Creando...';

  try {
    const res = await fetch(`${API}/proyectos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, descripcion })
    });

    if (!res.ok) throw new Error();
    const proyecto = await res.json();

    await fetch('/api/preferencias', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ultima_herramienta_usada: 'hub',
        hub: { ultimo_proyecto_abierto: proyecto.id }
      })
    }).catch(() => {});

    mostrarToast(`Proyecto creado.`, 'success');
    setTimeout(() => { window.location.href = `/hub/board?pid=${proyecto.id}`; }, 600);

  } catch (err) {
    mostrarToast('Error al crear el proyecto.', 'error');
    btnCrear.disabled = false;
    btnCrear.innerHTML = `Crear y abrir`;
  }
});

// ── Cargar proyectos existentes ──
async function cargarProyectos() {
  const list = document.getElementById('projects-list');
  list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⏳</div><p class="empty-state-text">Cargando...</p></div>`;

  try {
    const res = await fetch(`${API}/proyectos`);
    const proyectos = await res.json();
    renderizarProyectos(proyectos);
  } catch {
    list.innerHTML = `<div class="empty-state"><p>Error de conexión.</p></div>`;
  }
}

function renderizarProyectos(proyectos) {
  const list = document.getElementById('projects-list');

  if (!proyectos.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div><p class="empty-state-text">No hay proyectos.</p></div>`;
    return;
  }

  list.innerHTML = proyectos.map(p => {
    return `
      <div class="project-item" data-pid="${p.id}" role="button" tabindex="0">
        <div class="project-item-icon" style="background: linear-gradient(135deg, rgba(244,63,94,0.2), rgba(225,29,72,0.2)); border-color: rgba(225,29,72,0.3);">📁</div>
        <div class="project-item-info">
          <div class="project-item-name">${escHtml(p.titulo)}</div>
          <div class="project-item-meta">${p.descripcion ? escHtml(p.descripcion) : 'Sin descripción'}</div>
        </div>
        <div class="project-item-actions">
          <button class="project-action-btn export" data-pid="${p.id}" title="Exportar proyecto en un archivo local">⬇️</button>
          <button class="project-action-btn delete" data-pid="${p.id}" title="Eliminar proyecto">🗑️</button>
        </div>
      </div>`;
  }).join('');

  list.querySelectorAll('.project-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.project-action-btn')) return;
      abrirProyecto(item.dataset.pid);
    });
  });

  list.querySelectorAll('.project-action-btn.delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      confirmarEliminar(btn.dataset.pid, btn.closest('.project-item').querySelector('.project-item-name').textContent);
    });
  });

  list.querySelectorAll('.project-action-btn.export').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const pid = btn.dataset.pid;
      const nombre = btn.closest('.project-item').querySelector('.project-item-name').textContent;
      try {
        mostrarToast('Preparando exportación...', 'info');
        const res = await fetch(`/api/hub/proyectos/${pid}/exportar`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${nombre}.rikka`;
        a.click();
        URL.revokeObjectURL(url);
        mostrarToast('Proyecto exportado exitosamente.', 'success');
      } catch (err) {
        mostrarToast('Error al exportar.', 'error');
      }
    });
  });
}

// ── Importar desde archivo (.json o .rikka) ──
document.getElementById('btn-importar-json').addEventListener('click', () => {
  document.getElementById('input-import-json').click();
});

document.getElementById('input-import-json').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const data = JSON.parse(event.target.result);
      mostrarToast('Importando proyecto...', 'info');
      
      const res = await fetch('/api/hub/proyectos/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) throw new Error();
      const result = await res.json();
      
      mostrarToast('Proyecto importado correctamente.', 'success');
      setTimeout(() => { window.location.href = `/hub/board?pid=${result.id}`; }, 600);
      
    } catch (err) {
      mostrarToast('Error al leer o importar el archivo. Verifica que sea un .rikka válido.', 'error');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
});

function abrirProyecto(pid) {
  window.location.href = `/hub/board?pid=${pid}`;
}

// ── Modal de eliminación ──
function confirmarEliminar(pid, nombre) {
  proyectoAEliminar = pid;
  document.getElementById('modal-body').innerHTML = `¿Seguro que quieres eliminar "${escHtml(nombre)}"?`;
  document.getElementById('modal-eliminar').classList.add('visible');
}

document.getElementById('btn-modal-cancelar').addEventListener('click', () => {
  document.getElementById('modal-eliminar').classList.remove('visible');
});

document.getElementById('btn-modal-confirmar').addEventListener('click', async () => {
  if (!proyectoAEliminar) return;
  try {
    await fetch(`${API}/proyectos/${proyectoAEliminar}`, { method: 'DELETE' });
    document.getElementById('modal-eliminar').classList.remove('visible');
    cargarProyectos();
    mostrarToast('Eliminado', 'success');
  } catch {
    mostrarToast('Error al eliminar', 'error');
  }
});

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
