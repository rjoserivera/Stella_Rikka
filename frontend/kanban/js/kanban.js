/* ════════════════════════════════════════════
   kanban.js — Lógica principal Kanban
   ════════════════════════════════════════════ */

const API = '/api/kanban';
let proyectoId = null;
let todosLosTareas = [];
let tareaEditandoId = null;

async function init() {
  const params = new URLSearchParams(location.search);
  proyectoId = params.get('pid');
  if (!proyectoId) return window.location.href = '/kanban/seleccion';
  
  await cargarProyecto();
  await cargarTareas();
  
  document.getElementById('fab-nuevo').addEventListener('click', () => abrirModal());
  document.querySelectorAll('.kanban-add-btn').forEach(btn => {
    btn.addEventListener('click', () => abrirModal(null, btn.dataset.col));
  });
  
  document.getElementById('form-tarea').addEventListener('submit', guardarTarea);
  document.getElementById('modal-close').addEventListener('click', cerrarModal);
  document.getElementById('btn-cancelar').addEventListener('click', cerrarModal);
  document.getElementById('btn-eliminar').addEventListener('click', eliminarTarea);
  
  // Resumen
  document.getElementById('btn-toggle-resumen').addEventListener('click', () => {
    document.getElementById('resumen-panel').classList.toggle('visible');
  });
  document.getElementById('btn-close-resumen').addEventListener('click', () => {
    document.getElementById('resumen-panel').classList.remove('visible');
  });

  // Ayuda
  document.getElementById('btn-ayuda').addEventListener('click', () => {
    document.getElementById('modal-ayuda').classList.add('visible');
  });
  document.getElementById('modal-ayuda-close').addEventListener('click', () => {
    document.getElementById('modal-ayuda').classList.remove('visible');
  });
  document.getElementById('btn-ayuda-cerrar').addEventListener('click', () => {
    document.getElementById('modal-ayuda').classList.remove('visible');
  });

  // Título editable
  const inputTitulo = document.getElementById('project-name-input');
  inputTitulo.addEventListener('change', async (e) => {
    const nuevo = e.target.value.trim();
    if(nuevo) {
      await fetch(`${API}/proyectos/${proyectoId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ titulo: nuevo })
      });
      mostrarToast('Proyecto actualizado', 'success');
    }
  });
}

async function cargarProyecto() {
  try {
    const res = await fetch(`${API}/proyectos/${proyectoId}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    document.getElementById('project-name-input').value = data.titulo;
  } catch (e) {
    window.location.href = '/kanban/seleccion';
  }
}

async function cargarTareas() {
  const res = await fetch(`${API}/proyectos/${proyectoId}/tareas`);
  todosLosTareas = await res.json();
  renderizarTodo();
}

function renderizarTodo() {
  ['backlog','progreso','pruebas','terminado'].forEach(col => renderizarColumna(col));
  actualizarResumen();
}

function renderizarColumna(col) {
  const lista = document.getElementById(`list-${col}`);
  const countLabel = document.getElementById(`count-${col}`);
  const tareas = todosLosTareas.filter(i => i.columna === col);
  
  countLabel.textContent = tareas.length;
  
  if (!tareas.length) {
    lista.innerHTML = `<div style="width:100%;text-align:center;color:var(--text-muted);font-size:0.8rem;margin-top:20px;">Vacío</div>`;
    return;
  }
  
  lista.innerHTML = tareas.map(tarea => `
    <div class="kanban-card drag-tarea" data-iid="${tarea.id}" data-col="${tarea.columna}">
      <div class="kanban-card-id">${escHtml(tarea.id)}</div>
      <div class="kanban-card-top">
        <span class="kanban-badge tipo-${tarea.tipo}">${tarea.tipo}</span>
      </div>
      <div class="kanban-card-title">${escHtml(tarea.titulo)}</div>
      <div class="kanban-card-meta">
        <span class="kanban-prioridad prioridad-${tarea.prioridad}">${tarea.prioridad}</span>
        <span class="kanban-esfuerzo">⚡ ${tarea.esfuerzo}</span>
      </div>
    </div>
  `).join('');
  
  lista.querySelectorAll('.kanban-card').forEach(card => {
    card.addEventListener('click', () => {
      const tarea = todosLosTareas.find(i => i.id === card.dataset.iid);
      if (tarea) abrirModal(tarea);
    });
  });
}

function actualizarResumen() {
  const total = todosLosTareas.length;
  document.getElementById('resumen-total').textContent = total;
  
  let backlogCount = 0;
  ['backlog','progreso','pruebas','terminado'].forEach(col => {
    const count = todosLosTareas.filter(i => i.columna === col).length;
    if (col === 'backlog') backlogCount = count;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    document.getElementById(`resumen-${col}-pct`).textContent = `${pct}%`;
    document.getElementById(`resumen-${col}-bar`).style.width = `${pct}%`;
  });
  
  const backlogPct = total > 0 ? (backlogCount / total * 100) : 0;
  const saludEl = document.getElementById('resumen-salud');
  if (backlogPct < 60) saludEl.textContent = '🟢 Balanceado';
  else if (backlogPct < 80) saludEl.textContent = '🟡 Cuidado, mucho MUST';
  else saludEl.textContent = '🔴 Scope en peligro';
}

function abrirModal(tarea = null, colDefecto = 'backlog') {
  document.getElementById('form-tarea').reset();
  const inpId = document.getElementById('tarea-id');
  
  if (tarea) {
    tareaEditandoId = tarea.id;
    document.getElementById('modal-title').textContent = 'Editar Funcionalidad';
    inpId.value = tarea.id;
    inpId.readOnly = true;
    document.getElementById('tarea-titulo').value = tarea.titulo;
    document.getElementById('tarea-descripcion').value = tarea.descripcion;
    document.getElementById('tarea-columna').value = tarea.columna;
    document.getElementById('tarea-tipo').value = tarea.tipo;
    document.getElementById('tarea-prioridad').value = tarea.prioridad;
    document.getElementById('tarea-esfuerzo').value = tarea.esfuerzo;
    document.getElementById('btn-eliminar').style.display = 'block';
  } else {
    tareaEditandoId = null;
    document.getElementById('modal-title').textContent = 'Nueva Funcionalidad';
    inpId.value = '';
    inpId.readOnly = false;
    document.getElementById('tarea-columna').value = colDefecto;
    document.getElementById('btn-eliminar').style.display = 'none';
  }
  document.getElementById('modal-tarea').classList.add('visible');
}

function cerrarModal() {
  document.getElementById('modal-tarea').classList.remove('visible');
}

async function guardarTarea(e) {
  e.preventDefault();
  const idVal = document.getElementById('tarea-id').value.trim();
  const titulo = document.getElementById('tarea-titulo').value.trim();
  if(!idVal || !titulo) return;
  
  const data = {
    id: idVal,
    titulo,
    descripcion: document.getElementById('tarea-descripcion').value,
    columna: document.getElementById('tarea-columna').value,
    tipo: document.getElementById('tarea-tipo').value,
    prioridad: document.getElementById('tarea-prioridad').value,
    esfuerzo: document.getElementById('tarea-esfuerzo').value
  };

  try {
    if (tareaEditandoId) {
      await fetch(`${API}/tareas/${tareaEditandoId}`, {
        method: 'PUT', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      mostrarToast('Actualizado', 'success');
    } else {
      await fetch(`${API}/proyectos/${proyectoId}/tareas`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      mostrarToast('Creado', 'success');
    }
    cerrarModal();
    cargarTareas();
  } catch (err) {
    mostrarToast('Error al guardar', 'error');
  }
}

async function eliminarTarea() {
  if(!tareaEditandoId) return;
  if(confirm('¿Eliminar esta funcionalidad?')) {
    await fetch(`${API}/tareas/${tareaEditandoId}`, { method: 'DELETE' });
    mostrarToast('Eliminado', 'success');
    cerrarModal();
    cargarTareas();
  }
}

function escHtml(str) {
  return String(str||'').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function mostrarToast(msg, tipo='info') {
  const container = document.getElementById('toast-container');
  if(!container) return;
  const t = document.createElement('div');
  t.className = `toast toast-${tipo}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(()=>t.classList.add('show'),10);
  setTimeout(()=>{t.classList.remove('show'); setTimeout(()=>t.remove(),300);},3000);
}

document.addEventListener('DOMContentLoaded', init);

// Exponer para dragdrop.js
window.MoscowApp = {
  getProyectoId: () => proyectoId,
  getTodos: () => todosLosTareas,
  actualizarTareas: cargarTareas
};
