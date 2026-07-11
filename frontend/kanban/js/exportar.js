/* ════════════════════════════════════════════
   exportar.js — Exportación PNG y CSV Kanban
   ════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const btnSave = document.getElementById('btn-save-project');
  const btnExport = document.getElementById('btn-exportar');
  const menuExport = document.getElementById('export-menu');
  
  const btnPng = document.getElementById('export-png');
  const btnCsv = document.getElementById('export-csv');

  if (btnSave) btnSave.addEventListener('click', exportarJSON);
  if (btnPng) btnPng.addEventListener('click', () => { menuExport.classList.remove('visible'); exportarPNG(); });
  if (btnCsv) btnCsv.addEventListener('click', () => { menuExport.classList.remove('visible'); exportarCSV(); });

  if (btnExport && menuExport) {
    btnExport.addEventListener('click', (e) => {
      e.stopPropagation();
      menuExport.classList.toggle('visible');
    });
    document.addEventListener('click', (e) => {
      if (!menuExport.contains(e.target)) menuExport.classList.remove('visible');
    });
  }
});

function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

// ── JSON (Guardar) ─────────────────────────────
async function exportarJSON() {
  mostrarToast('Preparando archivo...', 'info');
  try {
    const pid = window.MoscowApp.getProyectoId();
    if (!pid) throw new Error('No hay proyecto activo.');
    const res = await fetch(`/api/kanban/proyectos/${pid}/exportar`);
    if (!res.ok) throw new Error('Error al obtener datos.');
    const data = await res.json();
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const nombre = `${data.proyecto.titulo || 'Proyecto'}.rikka`.replace(/\s+/g, '_');
    descargarBlob(blob, nombre);
    mostrarToast('✅ Archivo guardado.', 'success');
  } catch (e) {
    console.error(e);
    mostrarToast('Error al guardar: ' + e.message, 'error');
  }
}

// ── PNG ─────────────────────────────────────────
async function exportarPNG() {
  if (typeof html2canvas === 'undefined') {
    mostrarToast('Cargando librería de imagen...', 'info');
    await loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
  }
  
  mostrarToast('Generando imagen...', 'info');
  try {
    const grid = document.getElementById('kanban-grid');
    const v = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim();
    
    const canvas = await html2canvas(grid, {
      backgroundColor: v || '#0d0f17',
      scale: 2, useCORS: true, logging: false
    });
    
    canvas.toBlob(blob => {
      if (!blob) throw new Error('Blob vacío');
      descargarBlob(blob, `kanban_${Date.now()}.png`);
      mostrarToast('✅ Imagen descargada.', 'success');
    }, 'image/png');
  } catch (e) {
    console.error(e);
    mostrarToast('Error al generar imagen.', 'error');
  }
}

// ── CSV ─────────────────────────────────────────
function exportarCSV() {
  const tareas = window.MoscowApp.getTodos();
  if (!tareas.length) {
    mostrarToast('No hay ítems para exportar.', 'warning');
    return;
  }

  const cabecera = ['ID', 'Título', 'Descripción', 'Columna', 'Tipo', 'Prioridad', 'Esfuerzo'];
  const esc = v => `"${String(v || '').replace(/"/g, '""')}"`;
  
  const filas = tareas.map(t => [
    t.id, esc(t.titulo), esc(t.descripcion),
    t.columna, t.tipo, t.prioridad, t.esfuerzo
  ]);

  const csv = [cabecera.join(','), ...filas.map(f => f.join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  descargarBlob(blob, `kanban_${Date.now()}.csv`);
  mostrarToast('✅ CSV descargado.', 'success');
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
