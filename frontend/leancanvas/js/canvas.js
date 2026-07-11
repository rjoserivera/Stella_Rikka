/* ════════════════════════════════════════════════
   canvas.js — Lógica para Lean Canvas (Pan, Zoom, Datos)
   ════════════════════════════════════════════════ */

const urlParams = new URLSearchParams(window.location.search);
const pid = urlParams.get('pid');
const API_PROYECTOS = '/api/leancanvas/proyectos';
const API_VERSIONES = `/api/leancanvas/proyectos/${pid}/versiones`;

if (!pid) {
  window.location.href = '/leancanvas/seleccion';
}

let proyecto = null;
let versiones = [];
let versionActualId = null;
let canvasActual = {};

window.canvasScale = 1;

const defaultLayout = {
  problema: { x: 16, y: 16, w: 275, h: 512 },
  solucion: { x: 303, y: 16, w: 275, h: 250 },
  metricas: { x: 303, y: 278, w: 275, h: 250 },
  propuesta: { x: 590, y: 16, w: 275, h: 512 },
  ventaja: { x: 877, y: 16, w: 275, h: 250 },
  canales: { x: 877, y: 278, w: 275, h: 250 },
  segmentos: { x: 1164, y: 16, w: 275, h: 512 },
  costos: { x: 16, y: 540, w: 710, h: 250 },
  ingresos: { x: 738, y: 540, w: 701, h: 250 }
};

// Modal Estado
let modalModo = 'crear'; // 'crear' o 'editar'
let bloqueActual = null;
let notaActualIndex = null;

// ── Inicialización ──
async function init() {
  await cargarProyecto();
  await cargarVersiones();
  
  if (versiones.length > 0) {
    // Cargar la última versión por defecto
    const ultima = versiones[versiones.length - 1];
    cargarVersion(ultima.id);
  } else {
    // Si por alguna razón no hay versiones, crear la v1
    await crearNuevaVersion('v1');
    await cargarVersiones();
    cargarVersion(versiones[0].id);
  }

  setupPanZoom();
  setupEvents();
}

async function cargarProyecto() {
  try {
    const res = await fetch(`${API_PROYECTOS}/${pid}`);
    if (!res.ok) throw new Error();
    proyecto = await res.json();
    document.getElementById('project-name-input').value = proyecto.titulo;
  } catch {
    mostrarToast('Error al cargar proyecto.', 'error');
  }
}

async function cargarVersiones() {
  try {
    const res = await fetch(API_VERSIONES);
    versiones = await res.json();
    // Ordenar por fecha asc (la más nueva al final)
    versiones.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    const select = document.getElementById('select-version');
    const selectCompA = document.getElementById('select-comp-a');
    const selectCompB = document.getElementById('select-comp-b');

    select.innerHTML = '';
    selectCompA.innerHTML = '';
    selectCompB.innerHTML = '';

    versiones.forEach(v => {
      const option = new Option(v.nombre, v.id);
      select.add(option.cloneNode(true));
      selectCompA.add(option.cloneNode(true));
      selectCompB.add(option.cloneNode(true));
    });
    
    if (versionActualId) {
      select.value = versionActualId;
    }
  } catch {
    mostrarToast('Error al cargar versiones.', 'error');
  }
}

async function cargarVersion(vid) {
  versionActualId = vid;
  document.getElementById('select-version').value = vid;
  const version = versiones.find(v => v.id === vid);
  
  if (version) {
    canvasActual = JSON.parse(JSON.stringify(version.canvas || {}));
    renderCanvas();
  }
}

// ── Renderizado del Canvas ──
function renderCanvas() {
  const bloques = ['problema', 'solucion', 'metricas', 'propuesta', 'ventaja', 'canales', 'segmentos', 'costos', 'ingresos'];
  
  if (!canvasActual.layout) {
    canvasActual.layout = JSON.parse(JSON.stringify(defaultLayout));
  }
  
  // Auto-fix si el layout está corrupto (bloques apilados en el mismo X, Y)
  const l_prob = canvasActual.layout.problema;
  const l_sol = canvasActual.layout.solucion;
  const l_met = canvasActual.layout.metricas;
  if (l_prob && l_sol && l_met) {
    if (l_prob.x === l_sol.x && l_sol.x === l_met.x && l_prob.y === l_sol.y) {
      // Están apilados de un glitch pasado. Reseteamos.
      canvasActual.layout = JSON.parse(JSON.stringify(defaultLayout));
      setTimeout(guardarVersionActual, 500); // Guardamos la corrección
    }
  }

  let maxRight = 1500;
  let maxBottom = 900;
  
  bloques.forEach(b => {
    // Aplicar posicionamiento libre
    const blockEl = document.querySelector(`.lc-block[data-block="${b}"]`);
    if(blockEl) {
      let lay = canvasActual.layout[b];
      if (!lay) lay = { ...defaultLayout[b] };
      
      const x = typeof lay.x === 'number' && !isNaN(lay.x) ? lay.x : defaultLayout[b].x;
      const y = typeof lay.y === 'number' && !isNaN(lay.y) ? lay.y : defaultLayout[b].y;
      const w = typeof lay.w === 'number' && !isNaN(lay.w) && lay.w > 0 ? lay.w : defaultLayout[b].w;
      const h = typeof lay.h === 'number' && !isNaN(lay.h) && lay.h > 0 ? lay.h : defaultLayout[b].h;
      
      canvasActual.layout[b] = { x, y, w, h };

      blockEl.style.left = x + 'px';
      blockEl.style.top = y + 'px';
      blockEl.style.width = w + 'px';
      blockEl.style.height = h + 'px';
      
      const right = x + w + 20;
      const bottom = y + h + 20;
      if (right > maxRight) maxRight = right;
      if (bottom > maxBottom) maxBottom = bottom;
    }

    const list = document.getElementById(`list-${b}`);
    list.innerHTML = '';
    const notas = canvasActual[b] || [];
    
    notas.forEach((nota, index) => {
      const el = document.createElement('div');
      el.className = 'lc-note';
      el.onclick = () => abrirModalEditar(b, index);
      
      const statusClass = {
        'hipotesis': 'status-hipotesis',
        'validacion': 'status-validacion',
        'validado': 'status-validado'
      }[nota.estado] || 'status-hipotesis';

      const statusText = {
        'hipotesis': '🤔 Hipótesis',
        'validacion': '🧪 En Validación',
        'validado': '✅ Validado'
      }[nota.estado] || 'Hipótesis';

      el.innerHTML = `
        <div class="lc-note-status ${statusClass}">${statusText}</div>
        <div class="lc-note-text">${escHtml(nota.texto)}</div>
      `;
      list.appendChild(el);
    });
  });

  const grid = document.getElementById('lean-canvas-grid');
  grid.style.width = maxRight + 'px';
  grid.style.height = maxBottom + 'px';
}

// ── Eventos y Guardado ──
function setupEvents() {
  // Cambio de versión
  document.getElementById('select-version').addEventListener('change', (e) => {
    cargarVersion(e.target.value);
  });

  // Guardar proyecto title
  document.getElementById('project-name-input').addEventListener('change', async (e) => {
    const newTitle = e.target.value.trim();
    if (!newTitle) return;
    try {
      await fetch(`${API_PROYECTOS}/${pid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: newTitle })
      });
      mostrarToast('Título guardado.', 'success');
    } catch {}
  });

  // Nueva Versión
  document.getElementById('btn-nueva-version')?.addEventListener('click', async () => {
    const count = versiones.length;
    const nombre = prompt('Nombre para la nueva versión:', `v${count + 1}`);
    if (nombre) {
      await crearNuevaVersion(nombre);
      await cargarVersiones();
      cargarVersion(versiones[versiones.length - 1].id);
      mostrarToast('Nueva versión creada.', 'success');
    }
  });

  // Añadir notas
  document.querySelectorAll('.lc-add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const b = e.target.closest('.lc-block').dataset.block;
      abrirModalCrear(b);
    });
  });

  // Modales
  document.getElementById('modal-nota-close').addEventListener('click', cerrarModalNota);
  document.getElementById('btn-cancelar-nota').addEventListener('click', cerrarModalNota);
  
  document.getElementById('form-nota').addEventListener('submit', async (e) => {
    e.preventDefault();
    const texto = document.getElementById('nota-texto').value.trim();
    const estado = document.getElementById('nota-estado').value;
    
    if (!canvasActual[bloqueActual]) canvasActual[bloqueActual] = [];

    if (modalModo === 'crear') {
      canvasActual[bloqueActual].push({ texto, estado });
    } else {
      canvasActual[bloqueActual][notaActualIndex] = { texto, estado };
    }
    
    await guardarVersionActual();
    renderCanvas();
    cerrarModalNota();
  });

  document.getElementById('btn-eliminar-nota').addEventListener('click', async () => {
    if (modalModo === 'editar') {
      canvasActual[bloqueActual].splice(notaActualIndex, 1);
      await guardarVersionActual();
      renderCanvas();
      cerrarModalNota();
    }
  });

  // Comparar
  document.getElementById('btn-comparar')?.addEventListener('click', () => {
    document.getElementById('modal-comparar').classList.add('visible');
    compararVersiones();
  });
  document.getElementById('modal-comparar-close')?.addEventListener('click', () => {
    document.getElementById('modal-comparar').classList.remove('visible');
  });
  document.getElementById('select-comp-a')?.addEventListener('change', compararVersiones);
  document.getElementById('select-comp-b')?.addEventListener('change', compararVersiones);

  // Exportar
  document.getElementById('btn-exportar').addEventListener('click', () => {
    document.getElementById('export-menu').classList.toggle('show');
  });

  document.getElementById('export-png').addEventListener('click', () => {
    exportarPNG();
    document.getElementById('export-menu').classList.remove('show');
  });

  document.getElementById('export-png-clean')?.addEventListener('click', async () => {
    document.getElementById('export-menu').classList.remove('show');
    // Hide status labels
    document.querySelectorAll('.lc-note-status').forEach(el => el.style.display = 'none');
    await exportarPNG();
    // Show them again
    document.querySelectorAll('.lc-note-status').forEach(el => el.style.display = '');
  });

  document.getElementById('export-pdf').addEventListener('click', () => {
    exportarComoPDF();
    document.getElementById('export-menu').classList.remove('show');
  });

  const btnExportRikka = document.getElementById('export-rikka');
  if (btnExportRikka) {
    btnExportRikka.addEventListener('click', async () => {
      document.getElementById('export-menu').classList.remove('show');
      try {
        mostrarToast('Preparando exportación del proyecto completo...', 'info');
        const res = await fetch(`/api/leancanvas/proyectos/${currentProjectId}/exportar`);
        if (!res.ok) throw new Error('Error al exportar');
        const data = await res.json();
        const pName = data.proyecto && data.proyecto.titulo ? data.proyecto.titulo : 'Proyecto';
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${pName}.rikka`;
        a.click();
        URL.revokeObjectURL(url);
        mostrarToast('Proyecto exportado como .rikka', 'success');
      } catch (err) {
        mostrarToast('Error al generar archivo .rikka', 'error');
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.export-dropdown')) {
      document.getElementById('export-menu').classList.remove('show');
    }
  });

  // Setup Resize Observer for blocks
  const resizeObserver = new ResizeObserver(entries => {
    let changed = false;
    for (let entry of entries) {
      const el = entry.target;
      const b = el.dataset.block;
      if (b && canvasActual.layout && canvasActual.layout[b]) {
        const parent = el.parentElement;
        const currentRight = parseInt(el.style.left || 0) + el.offsetWidth + 20;
        const currentBottom = parseInt(el.style.top || 0) + el.offsetHeight + 20;
        
        if (currentRight > parent.offsetWidth) parent.style.width = currentRight + 'px';
        if (currentBottom > parent.offsetHeight) parent.style.height = currentBottom + 'px';

        const newW = el.offsetWidth;
        const newH = el.offsetHeight;
        if (canvasActual.layout[b].w !== newW || canvasActual.layout[b].h !== newH) {
          canvasActual.layout[b].w = newW;
          canvasActual.layout[b].h = newH;
          changed = true;
        }
      }
    }
    if (changed) guardarVersionActual();
  });
  
  document.querySelectorAll('.lc-block').forEach(el => {
    resizeObserver.observe(el);
  });

  // Setup Drag and Drop for blocks
  let isDraggingBlock = false;
  let activeBlock = null;
  let startMouseX = 0;
  let startMouseY = 0;
  let startBlockX = 0;
  let startBlockY = 0;

  document.querySelectorAll('.lc-block-header').forEach(header => {
    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.lc-add-btn')) return;
      isDraggingBlock = true;
      activeBlock = header.closest('.lc-block');
      startMouseX = e.clientX;
      startMouseY = e.clientY;
      startBlockX = parseInt(activeBlock.style.left) || 0;
      startBlockY = parseInt(activeBlock.style.top) || 0;
      activeBlock.style.zIndex = 100;
    });
  });

  window.addEventListener('mousemove', (e) => {
    if (isDraggingBlock && activeBlock) {
      const scale = window.canvasScale || 1;
      const dx = (e.clientX - startMouseX) / scale;
      const dy = (e.clientY - startMouseY) / scale;
      
      const parent = activeBlock.parentElement;
      let newX = Math.max(0, startBlockX + dx);
      let newY = Math.max(0, startBlockY + dy);
      
      activeBlock.style.left = newX + 'px';
      activeBlock.style.top = newY + 'px';
      
      const currentRight = newX + activeBlock.offsetWidth + 20;
      const currentBottom = newY + activeBlock.offsetHeight + 20;
      
      if (currentRight > parent.offsetWidth) parent.style.width = currentRight + 'px';
      if (currentBottom > parent.offsetHeight) parent.style.height = currentBottom + 'px';
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDraggingBlock && activeBlock) {
      isDraggingBlock = false;
      const b = activeBlock.dataset.block;
      if (b && canvasActual.layout) {
        canvasActual.layout[b].x = parseInt(activeBlock.style.left) || 0;
        canvasActual.layout[b].y = parseInt(activeBlock.style.top) || 0;
        guardarVersionActual();
      }
      activeBlock.style.zIndex = '';
      activeBlock = null;
    }
  });
}

// ── Acciones de Version ──
async function crearNuevaVersion(nombre) {
  try {
    await fetch(API_VERSIONES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, canvas: canvasActual })
    });
  } catch {
    mostrarToast('Error al crear versión', 'error');
  }
}

async function guardarVersionActual() {
  try {
    await fetch(`/api/leancanvas/versiones/${versionActualId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canvas: canvasActual })
    });
    // Actualizar cache local
    const v = versiones.find(x => x.id === versionActualId);
    if(v) v.canvas = JSON.parse(JSON.stringify(canvasActual));
  } catch {
    mostrarToast('Error al guardar cambios', 'error');
  }
}

// ── Modales de Nota ──
function abrirModalCrear(bloque) {
  bloqueActual = bloque;
  modalModo = 'crear';
  document.getElementById('modal-nota-title').textContent = 'Añadir Nota';
  document.getElementById('nota-texto').value = '';
  document.getElementById('nota-estado').value = 'hipotesis';
  document.getElementById('btn-eliminar-nota').style.display = 'none';
  document.getElementById('modal-nota').classList.add('visible');
  setTimeout(() => document.getElementById('nota-texto').focus(), 100);
}

function abrirModalEditar(bloque, index) {
  bloqueActual = bloque;
  notaActualIndex = index;
  modalModo = 'editar';
  
  const nota = canvasActual[bloque][index];
  document.getElementById('modal-nota-title').textContent = 'Editar Nota';
  document.getElementById('nota-texto').value = nota.texto;
  document.getElementById('nota-estado').value = nota.estado || 'hipotesis';
  document.getElementById('btn-eliminar-nota').style.display = 'block';
  document.getElementById('modal-nota').classList.add('visible');
}

function cerrarModalNota() {
  document.getElementById('modal-nota').classList.remove('visible');
}

// ── Comparar Versiones ──
function compararVersiones() {
  const idA = document.getElementById('select-comp-a').value;
  const idB = document.getElementById('select-comp-b').value;
  
  const vA = versiones.find(v => v.id === idA);
  const vB = versiones.find(v => v.id === idB);
  const diffBox = document.getElementById('diff-results');

  if (!vA || !vB) {
    diffBox.innerHTML = '<p>Selecciona dos versiones.</p>';
    return;
  }

  const bloques = ['problema', 'solucion', 'metricas', 'propuesta', 'ventaja', 'canales', 'segmentos', 'costos', 'ingresos'];
  const nombresBloques = {
    'problema': 'Problema', 'solucion': 'Solución', 'metricas': 'Métricas', 
    'propuesta': 'Propuesta de Valor', 'ventaja': 'Ventaja Injusta', 'canales': 'Canales',
    'segmentos': 'Segmentos', 'costos': 'Costos', 'ingresos': 'Ingresos'
  };

  let html = '';
  let diferencias = 0;

  bloques.forEach(b => {
    const cA = vA.canvas[b] || [];
    const cB = vB.canvas[b] || [];

    const textsA = cA.map(x => x.texto);
    const textsB = cB.map(x => x.texto);

    const added = cB.filter(x => !textsA.includes(x.texto));
    const removed = cA.filter(x => !textsB.includes(x.texto));

    // Cambios de estado (texto igual, estado distinto)
    const changed = cB.filter(xB => {
      const xA = cA.find(a => a.texto === xB.texto);
      return xA && xA.estado !== xB.estado;
    });

    if (added.length > 0 || removed.length > 0 || changed.length > 0) {
      diferencias++;
      html += `<div class="diff-item">
        <div class="diff-block-name">${nombresBloques[b]}</div>`;
      
      removed.forEach(n => html += `<div class="diff-removed">- ${escHtml(n.texto)}</div>`);
      added.forEach(n => html += `<div class="diff-added">+ ${escHtml(n.texto)} (Nuevo: ${n.estado})</div>`);
      changed.forEach(n => html += `<div class="diff-changed">~ ${escHtml(n.texto)} (Estado: ${n.estado})</div>`);
      
      html += `</div>`;
    }
  });

  if (diferencias === 0) {
    html = '<p style="color:var(--accent-success)">No hay diferencias entre estas dos versiones.</p>';
  }

  diffBox.innerHTML = html;
}

// ── Zoom y Pan ──
function setupPanZoom() {
  const container = document.getElementById('canvas-container');
  const inner = document.getElementById('canvas-inner');

  window.canvasScale = 1;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let translateX = 50; // offset inicial
  let translateY = 50;

  // Actualizar Transform
  const updateTransform = () => {
    inner.style.transform = `translate(${translateX}px, ${translateY}px) scale(${window.canvasScale})`;
  };

  // Paneo
  container.addEventListener('mousedown', (e) => {
    if (e.target.closest('.lc-block')) return; // No panear si hace clic en un bloque
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    container.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    updateTransform();
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    container.style.cursor = 'grab';
  });

  
  // Zoom buttons
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  
  const applyZoom = (zoomFactor) => {
    let oldScale = window.canvasScale;
    if (zoomFactor > 0) {
      window.canvasScale = Math.min(window.canvasScale + zoomFactor, 2);
    } else {
      window.canvasScale = Math.max(window.canvasScale + zoomFactor, 0.4);
    }
    
    // Zoom around the center of the viewport
    const rect = container.getBoundingClientRect();
    const mouseX = rect.width / 2;
    const mouseY = rect.height / 2;
    
    translateX = mouseX - ((mouseX - translateX) * (window.canvasScale / oldScale));
    translateY = mouseY - ((mouseY - translateY) * (window.canvasScale / oldScale));
    
    updateTransform();
  };

  if (btnZoomIn) btnZoomIn.addEventListener('click', () => applyZoom(0.1));
  if (btnZoomOut) btnZoomOut.addEventListener('click', () => applyZoom(-0.1));

  // Zoom wheel
  container.addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return; // Requerir CTRL para zoom
    e.preventDefault();
    
    const zoomFactor = 0.1;
    let oldScale = window.canvasScale;
    
    if (e.deltaY < 0) window.canvasScale = Math.min(window.canvasScale + zoomFactor, 2);
    else window.canvasScale = Math.max(window.canvasScale - zoomFactor, 0.4);
    
    // Zoom a donde está el mouse
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    translateX = mouseX - ((mouseX - translateX) * (window.canvasScale / oldScale));
    translateY = mouseY - ((mouseY - translateY) * (window.canvasScale / oldScale));
    
    updateTransform();
  }, { passive: false });
}

// ── Exportar ──
async function exportarPNG() {
  document.getElementById('export-menu').classList.remove('show');
  const grid = document.getElementById('lean-canvas-grid');
  
  // Guardar estado original
  const originalTransform = document.getElementById('canvas-inner').style.transform;
  document.getElementById('canvas-inner').style.transform = 'none';
  
  // Expandir cuerpos para asegurar que todo sea visible
  const bodies = grid.querySelectorAll('.lc-block-body');
  bodies.forEach(b => b.style.overflow = 'visible');

  try {
    const canvas = await html2canvas(grid, { 
      backgroundColor: '#1e293b', 
      scale: 2 
    });
    const link = document.createElement('a');
    link.download = `leancanvas_${proyecto.titulo}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    mostrarToast('Exportado a PNG exitosamente', 'success');
  } catch {
    mostrarToast('Error al exportar PNG', 'error');
  } finally {
    // Restaurar
    document.getElementById('canvas-inner').style.transform = originalTransform;
    bodies.forEach(b => b.style.overflow = '');
  }
}

async function exportarPDF() {
  document.getElementById('export-menu').classList.remove('show');
  const grid = document.getElementById('lean-canvas-grid');
  
  const originalTransform = document.getElementById('canvas-inner').style.transform;
  document.getElementById('canvas-inner').style.transform = 'none';
  
  const bodies = grid.querySelectorAll('.lc-block-body');
  bodies.forEach(b => b.style.overflow = 'visible');

  try {
    const canvas = await html2canvas(grid, { backgroundColor: '#1e293b', scale: 2 });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    const pdf = new jspdf.jsPDF('l', 'mm', 'a4'); // Landscape A4
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'JPEG', 0, 10, pdfWidth, pdfHeight);
    pdf.save(`leancanvas_${proyecto.titulo}.pdf`);
    
    mostrarToast('Exportado a PDF exitosamente', 'success');
  } catch {
    mostrarToast('Error al exportar PDF', 'error');
  } finally {
    document.getElementById('canvas-inner').style.transform = originalTransform;
    bodies.forEach(b => b.style.overflow = '');
  }
}

// Utils
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

// ── Importar desde Excel/CSV ──
document.getElementById('btn-importar').addEventListener('click', () => {
  document.getElementById('modal-importar').classList.add('visible');
});
document.getElementById('modal-importar-close').addEventListener('click', () => {
  document.getElementById('modal-importar').classList.remove('visible');
});
document.getElementById('btn-cancelar-importar').addEventListener('click', () => {
  document.getElementById('modal-importar').classList.remove('visible');
});

document.getElementById('btn-confirmar-importar').addEventListener('click', async () => {
  const fileInput = document.getElementById('input-importar-excel');
  if (!fileInput.files.length) {
    mostrarToast('Selecciona un archivo', 'error');
    return;
  }
  
  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (rows.length === 0) {
        mostrarToast('El archivo está vacío', 'error');
        return;
      }

      // Mapear filas a los bloques. Columnas esperadas: bloque, texto, estado
      let agregados = 0;
      const aliasBloques = {
        'problema': 'problema', 'solucion': 'solucion', 'metricas': 'metricas', 'propuesta': 'propuesta',
        'ventaja': 'ventaja', 'canales': 'canales', 'segmentos': 'segmentos', 'costos': 'costos', 'ingresos': 'ingresos',
        // Algunas traducciones probables
        'problem': 'problema', 'solution': 'solucion', 'key metrics': 'metricas', 'metrics': 'metricas',
        'value proposition': 'propuesta', 'uvp': 'propuesta', 'unfair advantage': 'ventaja',
        'customer segments': 'segmentos', 'cost structure': 'costos', 'revenue streams': 'ingresos'
      };

      for (const row of rows) {
        const keyBloque = Object.keys(row).find(k => k.toLowerCase().includes('bloque') || k.toLowerCase() === 'block');
        const keyTexto = Object.keys(row).find(k => k.toLowerCase().includes('text'));
        const keyEstado = Object.keys(row).find(k => k.toLowerCase().includes('estad') || k.toLowerCase().includes('status'));
        
        if (!keyBloque || !keyTexto) continue;
        
        let targetBlock = aliasBloques[row[keyBloque].toString().toLowerCase().trim()];
        let targetText = row[keyTexto].toString().trim();
        let targetEstado = keyEstado ? row[keyEstado].toString().toLowerCase().trim() : 'hipotesis';
        
        // Validar estado
        if (!['hipotesis', 'validacion', 'validado'].includes(targetEstado)) {
          targetEstado = 'hipotesis';
        }

        if (targetBlock && targetText) {
          if (!canvasActual[targetBlock]) canvasActual[targetBlock] = [];
          canvasActual[targetBlock].push({ texto: targetText, estado: targetEstado });
          agregados++;
        }
      }

      if (agregados > 0) {
        await guardarVersionActual();
        renderCanvas();
        mostrarToast(`${agregados} notas importadas a la versión actual`, 'success');
        document.getElementById('modal-importar').classList.remove('visible');
        fileInput.value = '';
      } else {
        mostrarToast('No se encontraron filas válidas para importar. Revisa las columnas.', 'warning');
      }

    } catch (err) {
      console.error(err);
      mostrarToast('Error al leer el archivo Excel/CSV', 'error');
    }
  };
  
  reader.readAsArrayBuffer(file);
});

// ── Ayuda / Guía de uso ──
document.getElementById('btn-ayuda').addEventListener('click', () => {
  document.getElementById('modal-ayuda').classList.add('visible');
});
document.getElementById('modal-ayuda-close').addEventListener('click', () => {
  document.getElementById('modal-ayuda').classList.remove('visible');
});
document.getElementById('btn-ayuda-cerrar').addEventListener('click', () => {
  document.getElementById('modal-ayuda').classList.remove('visible');
});

// Mostrar ayuda la primera vez
window.addEventListener('DOMContentLoaded', () => {
  const ayudaVista = localStorage.getItem('leancanvas_ayuda_vista');
  if (!ayudaVista) {
    // Es la primera vez
    setTimeout(() => {
      document.getElementById('modal-ayuda').classList.add('visible');
      localStorage.setItem('leancanvas_ayuda_vista', 'true');
    }, 500);
  }
});

// Iniciar
init();
