/* ════════════════════════════════════════════
   dragdrop.js — Integración SortableJS
   ════════════════════════════════════════════ */

const DragDropManager = (() => {
  const API = '/api/eisenhower';
  const CUADRANTES = [
    'importante_urgente',
    'importante_no_urgente',
    'no_importante_urgente',
    'no_importante_no_urgente',
    'backlog'
  ];

  let sortables = [];

  function init() {
    // SortableJS puede no estar disponible si estamos offline
    if (typeof Sortable === 'undefined') {
      console.warn('[DragDrop] SortableJS no disponible.');
      return;
    }

    // Destruir instancias previas si las hay
    sortables.forEach(s => s.destroy());
    sortables = [];

    CUADRANTES.forEach(q => {
      const lista = document.getElementById(`list-${q}`);
      if (!lista) return;

      const sortable = Sortable.create(lista, {
        group: 'tareas',          // mismo grupo → intercambio entre cuadrantes
        animation: 200,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        handle: '.drag-item',     // toda la tarjeta o fila es mango de arrastre
        forceFallback: false,

        onStart() {
          // No necesitamos deshabilitar pan porque el diseño es estático
        },

        onEnd(evt) {

          const tid = evt.item.dataset.tid;
          const cuadranteDestino = evt.to.dataset.q;
          const cuadranteOrigen  = evt.from.dataset.q;

          if (cuadranteOrigen !== cuadranteDestino) {
            // Mover a otro cuadrante
            moverTarea(tid, cuadranteDestino);
          }

          // Actualizar orden en el cuadrante destino
          const idsOrden = [...evt.to.querySelectorAll('.drag-item')].map(el => el.dataset.tid);
          reordenar(cuadranteDestino, idsOrden);
        }
      });

      sortables.push(sortable);
    });
  }

  async function moverTarea(tid, nuevoCuadrante) {
    try {
      await fetch(`${API}/tareas/${tid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuadrante: nuevoCuadrante })
      });

      // Actualizar en memoria
      const tareas = MatrizApp.getTodas();
      const t = tareas.find(t => t.id === tid);
      if (t) t.cuadrante = nuevoCuadrante;

      // Actualizar contadores
      MatrizApp.renderizarTodas();
      mostrarToast('Tarea movida.', 'success');
      if (window.EstadisticasManager) EstadisticasManager.actualizar();
    } catch {
      mostrarToast('Error al mover la tarea.', 'error');
    }
  }

  async function reordenar(cuadrante, ids) {
    const proyectoId = MatrizApp.getProyectoId();
    try {
      await fetch(`${API}/proyectos/${proyectoId}/tareas/reordenar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuadrante, ids })
      });
    } catch {
      // Silencioso: no crítico
    }
  }

  // Re-inicializar cuando se vuelven a renderizar las tarjetas
  document.addEventListener('tarjetas-renderizadas', () => init());

  return { init };
})();

// Inicializar después de que MatrizApp cargue las tareas
document.addEventListener('DOMContentLoaded', () => {
  // Pequeño delay para asegurar que el DOM de tareas esté listo
  setTimeout(() => DragDropManager.init(), 300);
});
