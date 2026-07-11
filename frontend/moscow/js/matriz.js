/* ════════════════════════════════════════════
   matriz.js — Lógica principal MoSCoW
   ════════════════════════════════════════════ */

const API = '/api/moscow';
let proyectoId = null;
let todosLosItems = [];
let itemEditandoId = null;

async function init() {
  const params = new URLSearchParams(location.search);
  proyectoId = params.get('pid');
  if (!proyectoId) return window.location.href = '/moscow/seleccion';
  
  await cargarProyecto();
  await cargarItems();
  
  document.getElementById('fab-nuevo').addEventListener('click', () => abrirModal());
  document.querySelectorAll('.moscow-add-btn').forEach(btn => {
    btn.addEventListener('click', () => abrirModal(null, btn.dataset.col));
  });
  
  document.getElementById('form-item').addEventListener('submit', guardarItem);
  document.getElementById('modal-close').addEventListener('click', cerrarModal);
  document.getElementById('btn-cancelar').addEventListener('click', cerrarModal);
  document.getElementById('btn-eliminar').addEventListener('click', eliminarItem);
  
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
    window.location.href = '/moscow/seleccion';
  }
}

async function cargarItems() {
  const res = await fetch(`${API}/proyectos/${proyectoId}/items`);
  todosLosItems = await res.json();
  renderizarTodo();
}

function renderizarTodo() {
  ['must','should','could','wont'].forEach(col => renderizarColumna(col));
  actualizarResumen();
}

function renderizarColumna(col) {
  const lista = document.getElementById(`list-${col}`);
  const countLabel = document.getElementById(`count-${col}`);
  const items = todosLosItems.filter(i => i.columna === col);
  
  countLabel.textContent = items.length;
  
  if (!items.length) {
    lista.innerHTML = `<div style="width:100%;text-align:center;color:var(--text-muted);font-size:0.8rem;margin-top:20px;">Vacío</div>`;
    return;
  }
  
  lista.innerHTML = items.map(item => `
    <div class="moscow-card drag-item" data-iid="${item.id}" data-col="${item.columna}">
      <div class="moscow-card-id">${escHtml(item.id)}</div>
      <div class="moscow-card-top">
        <span class="moscow-badge tipo-${item.tipo}">${item.tipo}</span>
      </div>
      <div class="moscow-card-title">${escHtml(item.titulo)}</div>
      <div class="moscow-card-meta">
        <span class="moscow-prioridad prioridad-${item.prioridad}">${item.prioridad}</span>
        <span class="moscow-esfuerzo">⚡ ${item.esfuerzo}</span>
      </div>
    </div>
  `).join('');
  
  lista.querySelectorAll('.moscow-card').forEach(card => {
    card.addEventListener('click', () => {
      const item = todosLosItems.find(i => i.id === card.dataset.iid);
      if (item) abrirModal(item);
    });
  });
}

function actualizarResumen() {
  const total = todosLosItems.length;
  document.getElementById('resumen-total').textContent = total;
  
  let mustCount = 0;
  ['must','should','could','wont'].forEach(col => {
    const count = todosLosItems.filter(i => i.columna === col).length;
    if (col === 'must') mustCount = count;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    document.getElementById(`resumen-${col}-pct`).textContent = `${pct}%`;
    document.getElementById(`resumen-${col}-bar`).style.width = `${pct}%`;
  });
  
  const mustPct = total > 0 ? (mustCount / total * 100) : 0;
  const saludEl = document.getElementById('resumen-salud');
  if (mustPct < 60) saludEl.textContent = '🟢 Balanceado';
  else if (mustPct < 80) saludEl.textContent = '🟡 Cuidado, mucho MUST';
  else saludEl.textContent = '🔴 Scope en peligro';
}

function abrirModal(item = null, colDefecto = 'must') {
  document.getElementById('form-item').reset();
  const inpId = document.getElementById('item-id');
  
  if (item) {
    itemEditandoId = item.id;
    document.getElementById('modal-title').textContent = 'Editar Funcionalidad';
    inpId.value = item.id;
    inpId.readOnly = true;
    document.getElementById('item-titulo').value = item.titulo;
    document.getElementById('item-descripcion').value = item.descripcion;
    document.getElementById('item-columna').value = item.columna;
    document.getElementById('item-tipo').value = item.tipo;
    document.getElementById('item-prioridad').value = item.prioridad;
    document.getElementById('item-esfuerzo').value = item.esfuerzo;
    document.getElementById('btn-eliminar').style.display = 'block';
  } else {
    itemEditandoId = null;
    document.getElementById('modal-title').textContent = 'Nueva Funcionalidad';
    inpId.value = '';
    inpId.readOnly = false;
    document.getElementById('item-columna').value = colDefecto;
    document.getElementById('btn-eliminar').style.display = 'none';
  }
  document.getElementById('modal-item').classList.add('visible');
}

function cerrarModal() {
  document.getElementById('modal-item').classList.remove('visible');
}

async function guardarItem(e) {
  e.preventDefault();
  const idVal = document.getElementById('item-id').value.trim();
  const titulo = document.getElementById('item-titulo').value.trim();
  if(!idVal || !titulo) return;
  
  const data = {
    id: idVal,
    titulo,
    descripcion: document.getElementById('item-descripcion').value,
    columna: document.getElementById('item-columna').value,
    tipo: document.getElementById('item-tipo').value,
    prioridad: document.getElementById('item-prioridad').value,
    esfuerzo: document.getElementById('item-esfuerzo').value
  };

  try {
    if (itemEditandoId) {
      await fetch(`${API}/items/${itemEditandoId}`, {
        method: 'PUT', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      mostrarToast('Actualizado', 'success');
    } else {
      await fetch(`${API}/proyectos/${proyectoId}/items`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      mostrarToast('Creado', 'success');
    }
    cerrarModal();
    cargarItems();
  } catch (err) {
    mostrarToast('Error al guardar', 'error');
  }
}

async function eliminarItem() {
  if(!itemEditandoId) return;
  if(confirm('¿Eliminar esta funcionalidad?')) {
    await fetch(`${API}/items/${itemEditandoId}`, { method: 'DELETE' });
    mostrarToast('Eliminado', 'success');
    cerrarModal();
    cargarItems();
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
  getTodos: () => todosLosItems,
  actualizarItems: cargarItems
};
