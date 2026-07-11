
const API = '/api/dbdiagrams/proyectos';
let proyectoAEliminar = null;

// ── Tabs ──
const btnNuevo     = document.getElementById('btn-nuevo');
const btnExistente = document.getElementById('btn-existente');
const panelNuevo   = document.getElementById('panel-nuevo');
const panelExist  = document.getElementById('panel-existente');

function activarTab(tab) {
  if (tab === 'nuevo') {
    if(btnNuevo) { btnNuevo.classList.add('active'); btnNuevo.setAttribute('aria-pressed', 'true'); }
    if(btnExistente) { btnExistente.classList.remove('active'); btnExistente.setAttribute('aria-pressed', 'false'); }
    if(panelNuevo) panelNuevo.classList.add('visible');
    if(panelExist) panelExist.classList.remove('visible');
  } else {
    if(btnExistente) { btnExistente.classList.add('active'); btnExistente.setAttribute('aria-pressed', 'true'); }
    if(btnNuevo) { btnNuevo.classList.remove('active'); btnNuevo.setAttribute('aria-pressed', 'false'); }
    if(panelExist) panelExist.classList.add('visible');
    if(panelNuevo) panelNuevo.classList.remove('visible');
    cargarProyectos();
  }
}

if(btnNuevo) btnNuevo.addEventListener('click', () => activarTab('nuevo'));
if(btnExistente) btnExistente.addEventListener('click', () => activarTab('existente'));
if(document.getElementById('btn-cancelar-nuevo')) {
    document.getElementById('btn-cancelar-nuevo').addEventListener('click', () => {
      document.getElementById('form-nuevo').reset();
    });
}

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
if(document.getElementById('form-nuevo')) {
    document.getElementById('form-nuevo').addEventListener('submit', async (e) => {
      e.preventDefault();
      const titulo = document.getElementById('input-titulo').value.trim();
      const descripcion = document.getElementById('input-descripcion').value.trim();
    
      if (!titulo) return;
    
      const btnCrear = document.getElementById('btn-crear');
      btnCrear.disabled = true;
      btnCrear.textContent = 'Creando...';
    
      try {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo, descripcion })
        });
    
        if (!res.ok) throw new Error();
        const proyecto = await res.json();
    
        mostrarToast(`Proyecto creado.`, 'success');
        setTimeout(() => { window.location.href = `/dbdiagrams/editor?pid=${proyecto.id}`; }, 600);
    
      } catch (err) {
        mostrarToast('Error al crear el proyecto.', 'error');
        btnCrear.disabled = false;
        btnCrear.innerHTML = `Crear y abrir`;
      }
    });
}

// ── Cargar proyectos existentes ──
async function cargarProyectos() {
  const list = document.getElementById('projects-list');
  if(!list) return;
  list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⏳</div><p class="empty-state-text">Cargando...</p></div>`;

  try {
    const res = await fetch(API);
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
        <div class="project-item-icon" style="background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2)); border-color: rgba(99,102,241,0.3);">📄</div>
        <div class="project-item-info">
          <div class="project-item-name">${escHtml(p.titulo)}</div>
          <div class="project-item-meta">${p.descripcion ? escHtml(p.descripcion) : 'Sin descripción'}</div>
        </div>
        <div class="project-item-actions">
          <button class="project-action-btn export" data-pid="${p.id}" title="Exportar proyecto">⬇️</button>
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
        const res = await fetch(`${API}/${pid}/exportar`);
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
if(document.getElementById('btn-importar-json')) {
    document.getElementById('btn-importar-json').addEventListener('click', () => {
      document.getElementById('input-import-json').click();
    });
}

if(document.getElementById('input-import-json')) {
    document.getElementById('input-import-json').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
    
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          let data = JSON.parse(event.target.result);
          mostrarToast('Importando proyecto...', 'info');
          
          if (!data.proyecto) {
             data = { proyecto: data };
          }
          
          const res = await fetch(`${API}/importar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          
          if (!res.ok) throw new Error();
          const result = await res.json();
          
          mostrarToast('Proyecto importado correctamente.', 'success');
          setTimeout(() => { window.location.href = `/dbdiagrams/editor?pid=${result.id}`; }, 600);
          
        } catch (err) {
          mostrarToast('Error al leer o importar el archivo. Verifica que sea un .rikka válido.', 'error');
        }
        e.target.value = '';
      };
      reader.readAsText(file);
    });
}

function abrirProyecto(pid) {
  window.location.href = `/dbdiagrams/editor?pid=${pid}`;
}

// ── Modal de eliminación ──
function confirmarEliminar(pid, nombre) {
  proyectoAEliminar = pid;
  const mb = document.getElementById('modal-body');
  if(mb) mb.innerHTML = `¿Seguro que quieres eliminar "${escHtml(nombre)}"?`;
  const mo = document.getElementById('modal-eliminar');
  if(mo) mo.classList.add('visible');
}

if(document.getElementById('btn-modal-cancelar')) {
    document.getElementById('btn-modal-cancelar').addEventListener('click', () => {
      document.getElementById('modal-eliminar').classList.remove('visible');
    });
}

if(document.getElementById('btn-modal-confirmar')) {
    document.getElementById('btn-modal-confirmar').addEventListener('click', async () => {
      if (!proyectoAEliminar) return;
      try {
        await fetch(`${API}/${proyectoAEliminar}`, { method: 'DELETE' });
        document.getElementById('modal-eliminar').classList.remove('visible');
        cargarProyectos();
        mostrarToast('Eliminado', 'success');
      } catch {
        mostrarToast('Error al eliminar', 'error');
      }
    });
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
