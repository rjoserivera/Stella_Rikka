/* ════════════════════════════════════════════
   exportar.js — Exportación PNG / PDF / CSV
   ════════════════════════════════════════════ */

function initExportar() {
  const btnSave = document.getElementById('btn-save-project');
  if (btnSave) btnSave.addEventListener('click', exportarJSON);
  const btnPng = document.getElementById('export-png');
  if (btnPng) btnPng.addEventListener('click', exportarPNG);
  const btnPdf = document.getElementById('export-pdf');
  if (btnPdf) btnPdf.addEventListener('click', exportarPDF);
  const btnCsv = document.getElementById('export-csv');
  if (btnCsv) btnCsv.addEventListener('click', exportarCSV);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExportar);
} else {
  initExportar();
}

// ── Helpers ───────────────────────────────────────
function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function obtenerBgColor() {
  // Intenta leer la variable CSS; usa color oscuro sólido como fallback
  const v = getComputedStyle(document.documentElement)
               .getPropertyValue('--bg-primary').trim();
  return v || '#0d0f17';
}

async function capturarGrid() {
  const grid = document.getElementById('canvas-inner');
  if (!grid) throw new Error('No se encontró #canvas-inner en la página');
  if (typeof html2canvas === 'undefined') throw new Error('html2canvas no está cargado');
  return html2canvas(grid, {
    backgroundColor: obtenerBgColor(),
    scale: 2,
    useCORS: true,
    logging: false,
    allowTaint: true
  });
}

// ── JSON (Guardar Proyecto) ───────────────────────────
async function exportarJSON() {
  mostrarToast('Preparando archivo...', 'info');
  try {
    const pid = MatrizApp.getProyectoId();
    if (!pid) throw new Error('No hay proyecto activo.');
    const res = await fetch(`/api/eisenhower/proyectos/${pid}/exportar`);
    if (!res.ok) throw new Error('Error al obtener datos.');
    const data = await res.json();
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const nombre = \`\${data.proyecto.titulo || 'Proyecto'}.rikka\`.replace(/\\s+/g, '_');
    descargarBlob(blob, nombre);
    mostrarToast('✅ Archivo guardado.', 'success');
  } catch (e) {
    console.error('[Exportar JSON]', e);
    mostrarToast('Error al guardar el archivo: ' + e.message, 'error');
  }
}

// ── PNG ───────────────────────────────────────────
async function exportarPNG() {
  mostrarToast('Generando imagen…', 'info');
  try {
    const canvas = await capturarGrid();
    canvas.toBlob(blob => {
      if (!blob) {
        mostrarToast('No se pudo generar la imagen.', 'error');
        return;
      }
      descargarBlob(blob, `eisenhower_${Date.now()}.png`);
      mostrarToast('✅ Imagen descargada.', 'success');
    }, 'image/png');
  } catch (e) {
    console.error('[Exportar PNG]', e);
    mostrarToast('Error al generar la imagen: ' + e.message, 'error');
  }
}

// ── PDF ───────────────────────────────────────────
async function exportarPDF() {
  mostrarToast('Generando PDF…', 'info');
  try {
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF no está cargado');
    const { jsPDF } = window.jspdf;
    const canvas = await capturarGrid();
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width / 2, canvas.height / 2]   // divide scale=2
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`eisenhower_${Date.now()}.pdf`);
    mostrarToast('✅ PDF descargado.', 'success');
  } catch (e) {
    console.error('[Exportar PDF]', e);
    mostrarToast('Error al generar el PDF: ' + e.message, 'error');
  }
}

// ── CSV ───────────────────────────────────────────
function exportarCSV() {
  const tareas = (typeof MatrizApp !== 'undefined') ? MatrizApp.getTodas() : [];
  if (!tareas.length) {
    mostrarToast('No hay tareas para exportar.', 'warning');
    return;
  }

  const Q_LABELS = {
    importante_urgente:        'Hacer',
    importante_no_urgente:     'Planificar',
    no_importante_urgente:     'Delegar',
    no_importante_no_urgente:  'Eliminar',
    backlog:                   'Backlog'
  };

  const esc = v => `"${String(v || '').replace(/"/g, '""')}"`;

  const cabecera = ['ID', 'Título', 'Descripción', 'Cuadrante', 'Prioridad', 'Urgencia', 'Importancia', 'Fecha Límite', 'Completada'];
  const filas = tareas.map(t => [
    t.id,
    esc(t.titulo),
    esc(t.descripcion),
    Q_LABELS[t.cuadrante] || t.cuadrante || '',
    t.prioridad || 'media',
    t.urgencia   || '',
    t.importancia || '',
    t.fecha_limite || '',
    t.completada ? 'Sí' : 'No'
  ]);

  const csv  = [cabecera.join(','), ...filas.map(f => f.join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  descargarBlob(blob, `eisenhower_${Date.now()}.csv`);
  mostrarToast('✅ CSV descargado.', 'success');
}
