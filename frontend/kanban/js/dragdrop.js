/* ════════════════════════════════════════════
   dragdrop.js — SortableJS para Kanban
   ════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const columnas = ['backlog', 'progreso', 'pruebas', 'terminado'];
  
  columnas.forEach(col => {
    const lista = document.getElementById(`list-${col}`);
    if (!lista) return;

    Sortable.create(lista, {
      group: 'kanban-tareas',
      animation: 200,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      handle: '.drag-tarea',
      onEnd: async function(evt) {
        const tareaEl = evt.tarea;
        const iid = tareaEl.dataset.iid;
        
        const origen = evt.from.dataset.col;
        const destino = evt.to.dataset.col;
        
        // 1. Si cambió de columna, actualizar backend
        if (origen !== destino) {
          try {
            await fetch(`/api/kanban/tareas/${iid}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ columna: destino })
            });
            // Update UI internal state optimistically
            const tarea = window.MoscowApp.getTodos().find(i => i.id === iid);
            if(tarea) tarea.columna = destino;
            tareaEl.dataset.col = destino;
          } catch (e) {
            console.error('Error moviendo tarea', e);
          }
        }
        
        // 2. Guardar el nuevo orden de la columna destino
        const idsOrdenados = Array.from(evt.to.children)
                                 .filter(el => el.classList.contains('drag-tarea'))
                                 .map(el => el.dataset.iid);
                                 
        if (idsOrdenados.length > 0) {
          try {
            await fetch(`/api/kanban/proyectos/${window.MoscowApp.getProyectoId()}/tareas/reordenar`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ columna: destino, ids: idsOrdenados })
            });
          } catch (e) {
            console.error('Error reordenando', e);
          }
        }
        
        // Recargar la vista completa para reflejar contadores y resumen
        window.MoscowApp.actualizarTareas();
      }
    });
  });
});
