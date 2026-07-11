/* ════════════════════════════════════════════
   importarExcel.js — Importación desde .xlsx
   con SheetJS
   ════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const panel       = document.getElementById('import-panel');
  const dropzone    = document.getElementById('dropzone');
  const fileInput   = document.getElementById('excel-input');
  const preview     = document.getElementById('import-preview');
  const btnConfirmar = document.getElementById('btn-confirmar-import');
  const btnCancelar  = document.getElementById('btn-cancelar-import');
  const btnClose     = document.getElementById('import-close');

  let tareasParaImportar = [];

  // Abrir selector al hacer clic en la dropzone
  dropzone.addEventListener('click', () => fileInput.click());

  // Drag & Drop en la dropzone
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) procesarArchivo(file);
  });

  // Selector de archivo
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) procesarArchivo(fileInput.files[0]);
  });

  // Cerrar panel
  [btnCancelar, btnClose].forEach(btn => {
    btn.addEventListener('click', () => {
      panel.classList.remove('visible');
      resetPanel();
    });
  });
  panel.addEventListener('click', (e) => {
    if (e.target === panel) {
      panel.classList.remove('visible');
      resetPanel();
    }
  });

  // Confirmar importación → enviar al Backlog
  btnConfirmar.addEventListener('click', async () => {
    if (!tareasParaImportar.length) return;
    btnConfirmar.disabled = true;
    btnConfirmar.textContent = 'Importando...';

    const pid = MatrizApp.getProyectoId();
    let importadas = 0;

    for (const t of tareasParaImportar) {
      try {
        await fetch(`/api/eisenhower/proyectos/${pid}/tareas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...t,
            cuadrante: 'backlog' // Forzar al backlog
          })
        });
        importadas++;
      } catch (err) {
        console.error('Error importando tarea:', err);
      }
    }

    MatrizApp.actualizarTareas();
    mostrarToast(`${importadas} tareas importadas a la Bandeja de Entrada.`, 'success');

    panel.classList.remove('visible');
    resetPanel();
  });

  // ── Procesar archivo ──────────────────────
  function procesarArchivo(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(ext)) {
      mostrarToast('Solo se aceptan archivos .xlsx o .xls', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb   = XLSX.read(data, { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        tareasParaImportar = mapearFilas(rows);
        mostrarPreview(tareasParaImportar, rows.length);
      } catch (err) {
        mostrarToast('Error al leer el archivo Excel.', 'error');
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  const Q_MAP = {
    hacer:      'importante_urgente',
    planificar: 'importante_no_urgente',
    delegar:    'no_importante_urgente',
    eliminar:   'no_importante_no_urgente',
    urgente_importante:     'importante_urgente',
    importante_urgente:     'importante_urgente',
    importante_no_urgente:  'importante_no_urgente',
    no_importante_urgente:  'no_importante_urgente',
    no_importante_no_urgente: 'no_importante_no_urgente'
  };

  function mapearFilas(rows) {
    const pid = MatrizApp.getProyectoId();
    return rows
      .filter(r => r.titulo || r.Título || r.TITULO)
      .map(r => {
        const id     = r.id || r.ID || r.Id || null;
        const titulo = String(r.titulo || r.Título || r.TITULO || '').trim();
        const desc   = String(r.descripcion || r.Descripción || r.DESCRIPCION || '').trim();
        const qRaw   = String(r.cuadrante || r.Cuadrante || r.CUADRANTE || 'hacer').toLowerCase().trim().replace(/\s+/g, '_');
        const cuadrante = Q_MAP[qRaw] || 'importante_urgente';
        const pRaw   = String(r.prioridad || r.Prioridad || r.PRIORIDAD || 'media').toLowerCase().trim();
        const prioridad = ['alta', 'media', 'baja'].includes(pRaw) ? pRaw : 'media';
        return { id, titulo, descripcion: desc, cuadrante, prioridad };
      })
      .filter(t => t.titulo);
  }

  function mostrarPreview(tareas, totalFilas) {
    if (!tareas.length) {
      preview.style.display = 'block';
      preview.innerHTML = `<p style="color:var(--accent-danger);font-size:0.875rem;padding:12px;">No se encontraron filas válidas (¿la columna "titulo" existe?).</p>`;
      btnConfirmar.style.display = 'none';
      return;
    }

    const Q_LABELS = {
      importante_urgente: '🔥 Hacer', importante_no_urgente: '📅 Planificar',
      no_importante_urgente: '👋 Delegar', no_importante_no_urgente: '🗑️ Eliminar'
    };

    preview.style.display = 'block';
    preview.innerHTML = `
      <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:10px;">
        ${tareas.length} de ${totalFilas} filas válidas encontradas:
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:0.78rem;">
        <thead>
          <tr style="border-bottom:1px solid var(--border-color);">
            <th style="text-align:left;padding:6px 8px;color:var(--text-muted);">ID</th>
            <th style="text-align:left;padding:6px 8px;color:var(--text-muted);">Título</th>
            <th style="text-align:left;padding:6px 8px;color:var(--text-muted);">Cuadrante</th>
            <th style="text-align:left;padding:6px 8px;color:var(--text-muted);">Prioridad</th>
          </tr>
        </thead>
        <tbody>
          ${tareas.slice(0, 10).map(t => `
            <tr style="border-bottom:1px solid var(--border-color);">
              <td style="padding:6px 8px;color:var(--text-secondary);">${t.id || 'N/A'}</td>
              <td style="padding:6px 8px;color:var(--text-primary);">${escHtml(t.titulo)}</td>
              <td style="padding:6px 8px;color:var(--text-secondary);">${Q_LABELS[t.cuadrante] || t.cuadrante}</td>
              <td style="padding:6px 8px;color:var(--text-secondary);">${t.prioridad}</td>
            </tr>`).join('')}
          ${tareas.length > 10 ? `<tr><td colspan="3" style="padding:6px 8px;color:var(--text-muted);">... y ${tareas.length - 10} más.</td></tr>` : ''}
        </tbody>
      </table>`;
    btnConfirmar.style.display = 'flex';
  }

  function resetPanel() {
    tareasParaImportar = [];
    preview.style.display = 'none';
    preview.innerHTML = '';
    btnConfirmar.style.display = 'none';
    btnConfirmar.disabled = false;
    btnConfirmar.textContent = '✅ Importar tareas';
    fileInput.value = '';
  }

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
});
