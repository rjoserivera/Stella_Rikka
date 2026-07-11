/* ════════════════════════════════════════════
   relaciones.js — Entrelazado de tareas
   ════════════════════════════════════════════ */

const RelacionesManager = (() => {
  let seleccionadas = new Set();

  function poblarSelector(todasLasTareas, tareaActualId, relacionadasActuales) {
    seleccionadas = new Set(relacionadasActuales || []);

    const select = document.getElementById('select-relacionadas');
    const lista  = document.getElementById('lista-relacionadas');

    // Poblar select con tareas que no son la actual
    select.innerHTML = '<option value="">— Vincular con otra tarea —</option>';
    todasLasTareas
      .filter(t => t.id !== tareaActualId)
      .forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.titulo.substring(0, 50) + (t.titulo.length > 50 ? '…' : '');
        if (seleccionadas.has(t.id)) opt.disabled = true;
        select.appendChild(opt);
      });

    // Renderizar chips de relacionadas
    renderChips(todasLasTareas);

    // Al seleccionar del dropdown
    select.onchange = () => {
      const tid = select.value;
      if (tid && !seleccionadas.has(tid)) {
        seleccionadas.add(tid);
        renderChips(todasLasTareas);
        // Deshabilitar la opción ya seleccionada
        const opt = select.querySelector(`option[value="${tid}"]`);
        if (opt) opt.disabled = true;
        select.value = '';
      }
    };
  }

  function renderChips(todasLasTareas) {
    const lista = document.getElementById('lista-relacionadas');
    lista.innerHTML = '';
    seleccionadas.forEach(tid => {
      const t = todasLasTareas.find(t => t.id === tid);
      if (!t) return;
      const chip = document.createElement('span');
      chip.style.cssText = `
        display:inline-flex;align-items:center;gap:5px;
        background:rgba(6,182,212,0.12);color:var(--accent-tertiary);
        border:1px solid rgba(6,182,212,0.25);border-radius:20px;
        padding:3px 10px 3px 12px;font-size:0.78rem;font-weight:600;
      `;
      chip.innerHTML = `🔗 ${escHtml(t.titulo.substring(0, 30))} <button style="background:none;border:none;cursor:pointer;color:inherit;font-size:0.9rem;padding:0 0 0 4px;" data-tid="${tid}" aria-label="Quitar relación">×</button>`;
      chip.querySelector('button').addEventListener('click', () => {
        seleccionadas.delete(tid);
        // Re-habilitar opción
        const opt = document.querySelector(`#select-relacionadas option[value="${tid}"]`);
        if (opt) opt.disabled = false;
        renderChips(todasLasTareas);
      });
      lista.appendChild(chip);
    });
  }

  function obtenerSeleccionadas() {
    return [...seleccionadas];
  }

  function limpiar() {
    seleccionadas.clear();
    const lista = document.getElementById('lista-relacionadas');
    if (lista) lista.innerHTML = '';
    const select = document.getElementById('select-relacionadas');
    if (select) select.innerHTML = '<option value="">— Vincular con otra tarea —</option>';
  }

  function actualizar(todasLasTareas) {
    // Actualizar indicadores visuales en las tarjetas (ya se manejan en el render)
    // Este hook puede usarse para futuras mejoras (líneas de conexión, etc.)
  }

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { poblarSelector, obtenerSeleccionadas, limpiar, actualizar };
})();
