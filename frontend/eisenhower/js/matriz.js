/* ════════════════════════════════════════════
   matriz.js — CRUD de tareas y renderizado
   ════════════════════════════════════════════ */

const MatrizApp = (() => {
  const API = '/api/eisenhower';
  let proyectoId = null;
  let todasLasTareas = [];
  let tareaEditandoId = null;

  const CUADRANTES = [
    'importante_urgente',
    'importante_no_urgente',
    'no_importante_urgente',
    'no_importante_no_urgente',
    'backlog'
  ];

  const Q_COLORS = {
    importante_urgente:        '#ef4444',
    importante_no_urgente:     '#6366f1',
    no_importante_urgente:     '#f59e0b',
    no_importante_no_urgente:  '#6b7280'
  };

  // ── Inicialización ─────────────────────────
  async function init() {
    const params = new URLSearchParams(window.location.search);
    proyectoId = params.get('pid');

    if (!proyectoId) {
      window.location.href = '/eisenhower/seleccion';
      return;
    }

    await cargarProyecto();
    await cargarTareas();
    bindEventos();
  }

  async function cargarProyecto() {
    try {
      const res = await fetch(`${API}/proyectos/${proyectoId}`);
      if (!res.ok) throw new Error();
      const proyecto = await res.json();
      const input = document.getElementById('project-name-input');
      input.value = proyecto.titulo;
      document.title = `${proyecto.titulo} — Matriz de Eisenhower`;

      // Guardar al editar el nombre
      input.addEventListener('change', async () => {
        const nuevo = input.value.trim();
        if (!nuevo) { input.value = proyecto.titulo; return; }
        await fetch(`${API}/proyectos/${proyectoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo: nuevo })
        });
        mostrarToast('Nombre del proyecto actualizado.', 'success');
      });
    } catch {
      mostrarToast('No se pudo cargar el proyecto.', 'error');
    }
  }

  async function cargarTareas() {
    try {
      const res = await fetch(`${API}/proyectos/${proyectoId}/tareas`);
      todasLasTareas = await res.json();
      renderizarTodas();
    } catch {
      mostrarToast('Error al cargar las tareas.', 'error');
    }
  }

  // ── Renderizado ────────────────────────────
  function renderizarTodas() {
    CUADRANTES.forEach(q => renderizarCuadrante(q));
    RelacionesManager.actualizar(todasLasTareas);
  }

  function renderizarCuadrante(cuadrante) {
    const lista = document.getElementById(`list-${cuadrante}`);
    const count = document.getElementById(`count-${cuadrante}`);
    if (!lista) return;

    const tareas = todasLasTareas
      .filter(t => t.cuadrante === cuadrante)
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

    if (cuadrante === 'backlog') {
      const todas = [...todasLasTareas].sort((a, b) => {
        if (a.cuadrante === 'backlog' && b.cuadrante !== 'backlog') return -1;
        if (a.cuadrante !== 'backlog' && b.cuadrante === 'backlog') return 1;
        return (a.orden ?? 0) - (b.orden ?? 0);
      });
      count.textContent = todas.filter(t => t.cuadrante === 'backlog').length;
      if (todas.length === 0) {
        lista.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted);font-style:italic;">No hay tareas en la bandeja de entrada.</td></tr>`;
      } else {
        lista.innerHTML = todas.map(t => renderFilaBacklog(t)).join('');
      }

      // Eventos para la tabla de backlog
      lista.querySelectorAll('.st-title-input').forEach(inp => {
        inp.addEventListener('change', async () => {
          const tid = inp.dataset.tid;
          const tarea = todasLasTareas.find(t => t.id === tid);
          if (tarea) {
            tarea.titulo = inp.value;
            await fetch(`${API}/tareas/${tid}`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ titulo: inp.value })
            });
          }
        });
      });


      lista.querySelectorAll('.st-del-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const tid = btn.dataset.tid;
          if (confirm('¿Eliminar esta tarea del backlog?')) {
            await fetch(`${API}/tareas/${tid}`, { method: 'DELETE' });
            todasLasTareas = todasLasTareas.filter(t => t.id !== tid);
            renderizarCuadrante('backlog');
          }
        });
      });
      lista.querySelectorAll('.st-add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const tid = btn.dataset.tid;
          FlipManager.mostrarDetalle(tid, todasLasTareas);
        });
      });

    } else {
      count.textContent = tareas.length;
      lista.innerHTML = tareas.map(t => renderTarjeta(t)).join('');

      // Eventos de tarjetas
      lista.querySelectorAll('.task-card').forEach(card => {
        const tid = card.dataset.tid;
        card.addEventListener('click', (e) => {
          if (e.target.closest('.task-checkbox')) return;
          FlipManager.mostrarDetalle(tid, todasLasTareas);
        });
      });


    }
  }

  function renderTarjeta(t) {
    const priClass   = `task-priority-${t.prioridad || 'media'}`;
    const priLabel   = { alta: 'Alta', media: 'Media', baja: 'Baja' }[t.prioridad] || 'Media';

    const relacionIcon = t.relacionadas && t.relacionadas.length
      ? `<span class="task-related-icon" title="${t.relacionadas.length} tarea(s) relacionada(s)">🔗</span>` : '';

    return `
      <div class="task-card drag-item" data-tid="${t.id}" data-q="${t.cuadrante}" role="button" tabindex="0" aria-label="${escHtml(t.titulo)}">
        <div class="task-card-id">${escHtml(t.id)}</div>
        <div class="task-card-top">
          <div class="task-title">${escHtml(t.titulo)}</div>
        </div>
        <div class="task-meta">
          <span class="task-priority ${priClass}">${priLabel}</span>
          ${relacionIcon}
        </div>
        <span class="task-drag-handle" aria-hidden="true">⠿</span>
      </div>`;
  }

  function renderFilaBacklog(t) {
    const Q_LABELS = {
      importante_urgente: '🔥 Hacer',
      importante_no_urgente: '📅 Planificar',
      no_importante_urgente: '👋 Delegar',
      no_importante_no_urgente: '🗑️ Eliminar',
      backlog: '📥 Backlog'
    };

    const isPrioritized = t.cuadrante !== 'backlog';
    
    // Colores vívidos para las filas priorizadas
    const bgColors = {
      importante_urgente: '#ef4444',
      importante_no_urgente: '#6366f1',
      no_importante_urgente: '#f59e0b',
      no_importante_no_urgente: '#6b7280'
    };

    // Color distinto para las no priorizadas (ej. un azul pizarra oscuro)
    const rowStyle = isPrioritized 
      ? `background: ${bgColors[t.cuadrante]}; color: #ffffff; cursor: default; border-bottom: 2px solid rgba(0,0,0,0.1);` 
      : `background: #334155; color: #f8fafc; cursor: grab; border-bottom: 2px solid rgba(0,0,0,0.1);`;
      
    const badge = isPrioritized 
      ? `<div style="font-size:0.75rem; color:#ffffff; margin-top:4px; font-weight: 600; opacity: 0.95;">📌 Priorizada en: ${Q_LABELS[t.cuadrante] || t.cuadrante}</div>` 
      : '';
      
    const inputStyle = isPrioritized 
      ? 'color: #ffffff; font-weight: 700;' 
      : 'color: #f8fafc; font-weight: 600;';

    return `
      <tr class="st-row ${!isPrioritized ? 'drag-item' : ''}" data-tid="${t.id}" data-q="${t.cuadrante}" style="${rowStyle}">
        <td class="st-col-num" style="color: rgba(255,255,255,0.8);">
          <span class="st-num">${t.id.slice(-4)}</span>
        </td>
        <td class="st-col-title">
          <input type="text" class="st-title-input" data-tid="${t.id}" value="${escHtml(t.titulo)}" placeholder="Título de la tarea" ${isPrioritized ? 'readonly' : ''} style="${inputStyle}" />
          ${badge}
        </td>
        <td class="st-col-action">
          <button class="st-add-btn" data-tid="${t.id}" title="Editar detalle" aria-label="Editar" style="${isPrioritized ? 'color: rgba(255,255,255,0.9);' : ''}">
            ✏️
          </button>
          <button class="st-del-btn" data-tid="${t.id}" title="Eliminar" aria-label="Eliminar" style="${isPrioritized ? 'color: rgba(255,255,255,0.9);' : ''}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </td>
      </tr>`;
  }

  // ── Eventos del modal de tarea ─────────────
  function bindEventos() {
    // FAB nueva tarea
    document.getElementById('fab-nueva-tarea').addEventListener('click', () => abrirModal());

    // Botones "Nueva tarea" en cuadrantes
    document.querySelectorAll('.quadrant-add-btn').forEach(btn => {
      btn.addEventListener('click', () => abrirModal(btn.dataset.q));
    });

    // Cerrar modal
    document.getElementById('modal-tarea-close').addEventListener('click', cerrarModal);
    document.getElementById('btn-cancelar-tarea').addEventListener('click', cerrarModal);
    document.getElementById('modal-tarea').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) cerrarModal();
    });

    // Guardar tarea
    document.getElementById('form-tarea').addEventListener('submit', guardarTarea);

    // Eliminar tarea
    document.getElementById('btn-eliminar-tarea').addEventListener('click', eliminarTareaActual);

    // Exportar dropdown
    const btnExp = document.getElementById('btn-exportar');
    const expMenu = document.getElementById('export-menu');
    btnExp.addEventListener('click', (e) => {
      e.stopPropagation();
      expMenu.classList.toggle('visible');
      btnExp.setAttribute('aria-expanded', expMenu.classList.contains('visible'));
    });
    document.addEventListener('click', () => expMenu.classList.remove('visible'));

    // Stats panel
    document.getElementById('btn-stats').addEventListener('click', () => {
      const panel = document.getElementById('stats-panel');
      const histPanel = document.getElementById('history-panel');
      histPanel.classList.remove('visible');
      panel.classList.toggle('visible');
      if (panel.classList.contains('visible')) EstadisticasManager.actualizar();
    });
    document.getElementById('stats-close').addEventListener('click', () => {
      document.getElementById('stats-panel').classList.remove('visible');
    });

    // History panel
    document.getElementById('btn-historial').addEventListener('click', () => {
      const panel = document.getElementById('history-panel');
      const statsPanel = document.getElementById('stats-panel');
      statsPanel.classList.remove('visible');
      panel.classList.toggle('visible');
      if (panel.classList.contains('visible')) cargarHistorial();
    });
    document.getElementById('history-close').addEventListener('click', () => {
      document.getElementById('history-panel').classList.remove('visible');
    });

    // FAB importar Excel
    document.getElementById('fab-importar').addEventListener('click', () => {
      document.getElementById('import-panel').classList.add('visible');
    });

    // Añadir tarea directa al backlog (desde la zona de backlog)
    const btnAddBacklog = document.querySelector('.backlog-add-btn');
    if (btnAddBacklog) {
      btnAddBacklog.addEventListener('click', () => {
        document.getElementById('modal-tarea-title').textContent = 'Nueva tarea (Sin priorizar)';
        document.getElementById('tarea-id').value = '';
        document.getElementById('tarea-titulo').value = '';
        document.getElementById('tarea-descripcion').value = '';
        document.getElementById('tarea-cuadrante').value = 'backlog';
        document.getElementById('tarea-prioridad').value = 'media';
        // Limpiar lista de relacionadas en el modal (visual)
        document.getElementById('lista-relacionadas').innerHTML = '';
        // Reiniciar el select
        const sel = document.getElementById('select-relacionadas');
        if (sel) sel.value = '';
        
        document.getElementById('modal-tarea').classList.add('visible');
      });
    }

    // ── Modal de Ayuda ──────────────────────
    const btnAyuda       = document.getElementById('btn-ayuda');
    const modalAyuda     = document.getElementById('modal-ayuda');
    const btnAyudaCerrar = document.getElementById('btn-ayuda-cerrar');
    const btnAyudaClose  = document.getElementById('modal-ayuda-close');

    function abrirAyuda() {
      modalAyuda.classList.add('visible');
      // Guardar en localStorage para no mostrarlo automáticamente la próxima vez
      localStorage.setItem('suite_ayuda_vista', '1');
    }
    function cerrarAyuda() {
      modalAyuda.classList.remove('visible');
    }

    btnAyuda.addEventListener('click', abrirAyuda);
    btnAyudaCerrar.addEventListener('click', cerrarAyuda);
    btnAyudaClose.addEventListener('click', cerrarAyuda);
    modalAyuda.addEventListener('click', (e) => {
      if (e.target === modalAyuda) cerrarAyuda();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalAyuda.classList.contains('visible')) cerrarAyuda();
    });

    // Mostrar automáticamente en la primera visita
    if (!localStorage.getItem('suite_ayuda_vista')) {
      setTimeout(abrirAyuda, 800);
    }
  }

  // ── Modal ──────────────────────────────────
  function abrirModal(cuadrante = 'importante_urgente', tarea = null) {
    tareaEditandoId = tarea ? tarea.id : null;
    const modal = document.getElementById('modal-tarea');
    document.getElementById('modal-tarea-title').textContent = tarea ? 'Editar tarea' : 'Nueva tarea';
    const inputId = document.getElementById('tarea-id');
    inputId.value = tarea?.id || '';
    inputId.readOnly = !!tarea;
    inputId.style.opacity = tarea ? '0.6' : '1';

    document.getElementById('tarea-titulo').value = tarea?.titulo || '';
    document.getElementById('tarea-descripcion').value = tarea?.descripcion || '';
    document.getElementById('tarea-cuadrante').value = tarea?.cuadrante || cuadrante;
    document.getElementById('tarea-prioridad').value = tarea?.prioridad || 'media';

    const btnEliminar = document.getElementById('btn-eliminar-tarea');
    btnEliminar.style.display = tarea ? 'flex' : 'none';

    // Poblar selector de relacionadas
    RelacionesManager.poblarSelector(todasLasTareas, tarea?.id, tarea?.relacionadas || []);

    modal.classList.add('visible');
    setTimeout(() => document.getElementById('tarea-titulo').focus(), 100);
  }

  function cerrarModal() {
    document.getElementById('modal-tarea').classList.remove('visible');
    document.getElementById('form-tarea').reset();
    tareaEditandoId = null;
    RelacionesManager.limpiar();
  }

  async function guardarTarea(e) {
    e.preventDefault();
    const titulo = document.getElementById('tarea-titulo').value.trim();
    if (!titulo) {
      mostrarToast('El título es obligatorio.', 'error');
      return;
    }

    const btn = document.getElementById('btn-guardar-tarea');
    btn.disabled = true;

    const datos = {
      id: document.getElementById('tarea-id').value.trim(),
      titulo,
      descripcion:  document.getElementById('tarea-descripcion').value.trim(),
      cuadrante:    document.getElementById('tarea-cuadrante').value,
      prioridad:    document.getElementById('tarea-prioridad').value,
      relacionadas: RelacionesManager.obtenerSeleccionadas()
    };

    try {
      if (tareaEditandoId) {
        const res = await fetch(`${API}/tareas/${tareaEditandoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos)
        });
        const actualizada = await res.json();
        const idx = todasLasTareas.findIndex(t => t.id === tareaEditandoId);
        if (idx !== -1) todasLasTareas[idx] = actualizada;
        mostrarToast('Tarea actualizada.', 'success');
      } else {
        const res = await fetch(`${API}/proyectos/${proyectoId}/tareas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos)
        });
        const nueva = await res.json();
        todasLasTareas.push(nueva);
        mostrarToast('Tarea creada.', 'success');
      }
      cerrarModal();
      renderizarTodas();
      if (window.EstadisticasManager) EstadisticasManager.actualizar();
    } catch {
      mostrarToast('Error al guardar la tarea.', 'error');
    } finally {
      btn.disabled = false;
    }
  }

  async function eliminarTareaActual() {
    if (!tareaEditandoId) return;
    if (!confirm('¿Eliminar esta tarea? Esta acción no se puede deshacer.')) return;

    try {
      await fetch(`${API}/tareas/${tareaEditandoId}`, { method: 'DELETE' });
      todasLasTareas = todasLasTareas.filter(t => t.id !== tareaEditandoId);
      cerrarModal();
      renderizarTodas();
      mostrarToast('Tarea eliminada.', 'success');
    } catch {
      mostrarToast('Error al eliminar la tarea.', 'error');
    }
  }

  // ── Historial ──────────────────────────────
  async function cargarHistorial() {
    const lista = document.getElementById('history-list');
    lista.innerHTML = `<div style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:20px;">Cargando...</div>`;

    try {
      const res = await fetch(`${API}/proyectos/${proyectoId}/historial?limite=50`);
      const historial = await res.json();
      if (!historial.length) {
        lista.innerHTML = `<div style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:20px;">Sin registros todavía.</div>`;
        return;
      }
      lista.innerHTML = historial.map(h => {
        const ts = new Date(h.timestamp).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        return `
          <div class="history-item">
            <div class="history-item-dot"></div>
            <div class="history-item-info">
              <div class="history-item-accion">${escHtml(h.accion)}</div>
              <div class="history-item-detalle">${escHtml(h.detalle)}</div>
              <div class="history-item-time">${ts}</div>
            </div>
          </div>`;
      }).join('');
    } catch {
      lista.innerHTML = `<div style="color:var(--accent-danger);font-size:0.85rem;text-align:center;padding:20px;">Error al cargar historial.</div>`;
    }
  }

  // ── Utilidades públicas ────────────────────
  function getTodas()      { return todasLasTareas; }
  function getProyectoId() { return proyectoId; }
  function getAPI()        { return API; }
  function actualizarTareas() { return cargarTareas(); }
  function abrirModalEditar(tid) {
    const t = todasLasTareas.find(t => t.id === tid);
    if (t) abrirModal(t.cuadrante, t);
  }
  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return {
    init, renderizarTodas, getTodas, getProyectoId, getAPI,
    actualizarTareas, abrirModalEditar, escHtml
  };
})();

document.addEventListener('DOMContentLoaded', () => MatrizApp.init());

// Helper global para los otros módulos
function escHtml(str) { return MatrizApp.escHtml(str); }
