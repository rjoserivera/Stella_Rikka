/* ════════════════════════════════════════════
   dragdrop.js — SortableJS para MoSCoW
   ════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const columnas = ['must', 'should', 'could', 'wont'];
  
  columnas.forEach(col => {
    const lista = document.getElementById(`list-${col}`);
    if (!lista) return;

    Sortable.create(lista, {
      group: 'moscow-items',
      animation: 200,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      handle: '.drag-item',
      onEnd: async function(evt) {
        const itemEl = evt.item;
        const iid = itemEl.dataset.iid;
        
        const origen = evt.from.dataset.col;
        const destino = evt.to.dataset.col;
        
        // 1. Si cambió de columna, actualizar backend
        if (origen !== destino) {
          try {
            await fetch(`/api/moscow/items/${iid}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ columna: destino })
            });
            // Update UI internal state optimistically
            const item = window.MoscowApp.getTodos().find(i => i.id === iid);
            if(item) item.columna = destino;
            itemEl.dataset.col = destino;
          } catch (e) {
            console.error('Error moviendo item', e);
          }
        }
        
        // 2. Guardar el nuevo orden de la columna destino
        const idsOrdenados = Array.from(evt.to.children)
                                 .filter(el => el.classList.contains('drag-item'))
                                 .map(el => el.dataset.iid);
                                 
        if (idsOrdenados.length > 0) {
          try {
            await fetch(`/api/moscow/proyectos/${window.MoscowApp.getProyectoId()}/items/reordenar`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ columna: destino, ids: idsOrdenados })
            });
          } catch (e) {
            console.error('Error reordenando', e);
          }
        }
        
        // Recargar la vista completa para reflejar contadores y resumen
        window.MoscowApp.actualizarItems();
      }
    });
  });
});
