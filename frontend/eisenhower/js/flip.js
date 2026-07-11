/* ════════════════════════════════════════════
   flip.js — Detalle de tarea (modal con efecto flip)
   ════════════════════════════════════════════ */

const FlipManager = (() => {
  const Q_COLORS = {
    importante_urgente:        '#ef4444',
    importante_no_urgente:     '#6366f1',
    no_importante_urgente:     '#f59e0b',
    no_importante_no_urgente:  '#6b7280'
  };

  const Q_LABELS = {
    importante_urgente:        '🔥 HACER — Importante + Urgente',
    importante_no_urgente:     '📅 PLANIFICAR — Importante + No Urgente',
    no_importante_urgente:     '👋 DELEGAR — No Importante + Urgente',
    no_importante_no_urgente:  '🗑️ ELIMINAR — No Importante + No Urgente'
  };

  function mostrarDetalle(tid, todasLasTareas) {
    const tarea = todasLasTareas.find(t => t.id === tid);
    if (!tarea) return;

    const modal = document.getElementById('detail-modal');
    const box   = document.getElementById('detail-box');

    // Dot de color
    const dot = document.getElementById('detail-dot');
    dot.style.background = Q_COLORS[tarea.cuadrante] || '#6b7280';
    dot.style.boxShadow  = `0 0 6px ${Q_COLORS[tarea.cuadrante] || '#6b7280'}`;

    // Título
    document.getElementById('detail-title').textContent = tarea.titulo;

    // Descripción
    const desc = document.getElementById('detail-descripcion');
    desc.textContent = tarea.descripcion || '(Sin descripción)';

    // Meta chips
    const meta = document.getElementById('detail-meta');
    const priColors = { alta: '#ef4444', media: '#f59e0b', baja: '#10b981' };
    const priLabel  = { alta: 'Alta', media: 'Media', baja: 'Baja' };
    const fechaHtml = tarea.fecha_limite
      ? `<span style="background:rgba(6,182,212,0.12);color:#06b6d4;font-size:0.78rem;font-weight:600;padding:3px 10px;border-radius:20px;">📅 ${tarea.fecha_limite}</span>`
      : '';
    const completadaHtml = tarea.completada
      ? `<span style="background:rgba(16,185,129,0.12);color:#10b981;font-size:0.78rem;font-weight:600;padding:3px 10px;border-radius:20px;">✅ Completada</span>`
      : '';

    meta.innerHTML = `
      <span style="background:rgba(99,102,241,0.1);color:#6366f1;font-size:0.78rem;font-weight:600;padding:3px 10px;border-radius:20px;">${Q_LABELS[tarea.cuadrante] || tarea.cuadrante}</span>
      <span style="background:rgba(${priColors[tarea.prioridad] === '#ef4444' ? '239,68,68' : priColors[tarea.prioridad] === '#f59e0b' ? '245,158,11' : '16,185,129'},0.12);color:${priColors[tarea.prioridad] || '#6b7280'};font-size:0.78rem;font-weight:600;padding:3px 10px;border-radius:20px;">Prioridad ${priLabel[tarea.prioridad] || 'Media'}</span>
      ${fechaHtml}
      ${completadaHtml}
    `;

    // Relacionadas
    const secRelated = document.getElementById('detail-related-section');
    const listRelated = document.getElementById('detail-related-list');
    if (tarea.relacionadas && tarea.relacionadas.length) {
      secRelated.style.display = 'block';
      listRelated.innerHTML = tarea.relacionadas.map(rid => {
        const rel = todasLasTareas.find(t => t.id === rid);
        if (!rel) return '';
        return `
          <button class="related-item" data-tid="${rid}">
            <span style="color:${Q_COLORS[rel.cuadrante] || '#6b7280'}">●</span>
            <span>${escHtml(rel.titulo)}</span>
          </button>`;
      }).join('');

      // Click en relacionada → abrir su detalle
      listRelated.querySelectorAll('.related-item').forEach(btn => {
        btn.addEventListener('click', () => {
          mostrarDetalle(btn.dataset.tid, todasLasTareas);
        });
      });
    } else {
      secRelated.style.display = 'none';
    }

    // Botón completar
    const btnCompletar = document.getElementById('detail-btn-completar');
    btnCompletar.textContent = tarea.completada ? '↩️ Marcar pendiente' : '✅ Marcar completada';
    btnCompletar.onclick = async () => {
      const nuevo = !tarea.completada;
      await fetch(`/api/eisenhower/tareas/${tid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completada: nuevo })
      });
      tarea.completada = nuevo;
      cerrarDetalle();
      MatrizApp.renderizarTodas();
      if (window.EstadisticasManager) EstadisticasManager.actualizar();
      mostrarToast(nuevo ? 'Tarea marcada como completada.' : 'Tarea marcada como pendiente.', 'success');
    };

    // Botón editar
    document.getElementById('detail-btn-editar').onclick = () => {
      cerrarDetalle();
      MatrizApp.abrirModalEditar(tid);
    };

    // Animación flip
    box.classList.remove('flip-enter');
    modal.classList.add('visible');
    requestAnimationFrame(() => box.classList.add('flip-enter'));
  }

  function cerrarDetalle() {
    document.getElementById('detail-modal').classList.remove('visible');
  }

  function bindCerrar() {
    document.getElementById('detail-close').addEventListener('click', cerrarDetalle);
    document.getElementById('detail-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) cerrarDetalle();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') cerrarDetalle();
    });
  }

  document.addEventListener('DOMContentLoaded', bindCerrar);

  return { mostrarDetalle, cerrarDetalle };
})();

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
