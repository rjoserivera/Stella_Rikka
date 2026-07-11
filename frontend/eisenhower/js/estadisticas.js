/* ════════════════════════════════════════════
   estadisticas.js — Panel de estadísticas
   con Chart.js
   ════════════════════════════════════════════ */

const EstadisticasManager = (() => {
  let chartInstance = null;

  const Q_LABELS = {
    importante_urgente:        'Hacer',
    importante_no_urgente:     'Planificar',
    no_importante_urgente:     'Delegar',
    no_importante_no_urgente:  'Eliminar'
  };

  const Q_COLORS = [
    'rgba(239,68,68,0.75)',
    'rgba(99,102,241,0.75)',
    'rgba(245,158,11,0.75)',
    'rgba(107,114,128,0.75)'
  ];

  async function actualizar() {
    const pid = MatrizApp.getProyectoId();
    if (!pid) return;

    try {
      const res = await fetch(`/api/eisenhower/proyectos/${pid}/estadisticas`);
      const stats = await res.json();
      renderStats(stats);
    } catch {
      // Calcular offline desde las tareas en memoria
      const tareas = MatrizApp.getTodas();
      const cuadrantes = ['importante_urgente', 'importante_no_urgente', 'no_importante_urgente', 'no_importante_no_urgente'];
      const stats = {
        total:       tareas.length,
        completadas: tareas.filter(t => t.completada).length,
        pendientes:  tareas.filter(t => !t.completada).length,
        por_cuadrante: Object.fromEntries(cuadrantes.map(c => [c, tareas.filter(t => t.cuadrante === c).length]))
      };
      renderStats(stats);
    }
  }

  function renderStats(stats) {
    // Números principales
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-completadas').textContent = stats.completadas;
    document.getElementById('stat-pendientes').textContent = stats.pendientes;
    const pct = stats.total ? Math.round((stats.completadas / stats.total) * 100) : 0;
    document.getElementById('stat-pct').textContent = pct + '%';

    // Barras por cuadrante
    const cuadrantes = ['importante_urgente', 'importante_no_urgente', 'no_importante_urgente', 'no_importante_no_urgente'];
    const barColors  = ['#ef4444', '#6366f1', '#f59e0b', '#6b7280'];
    const barsEl     = document.getElementById('stats-bars');
    barsEl.innerHTML = cuadrantes.map((c, i) => {
      const n   = (stats.por_cuadrante || {})[c] || 0;
      const pct = stats.total ? Math.round((n / stats.total) * 100) : 0;
      return `
        <div class="stats-bar-section">
          <div class="stats-bar-title">
            <span>${Q_LABELS[c]}</span>
            <span style="color:${barColors[i]};font-weight:700;">${n}</span>
          </div>
          <div class="stats-bar">
            <div class="stats-bar-fill" style="width:${pct}%;background:${barColors[i]};"></div>
          </div>
        </div>`;
    }).join('');

    // Gráfico de dona
    const ctx = document.getElementById('stats-chart');
    if (!ctx) return;

    const data = cuadrantes.map(c => (stats.por_cuadrante || {})[c] || 0);

    if (chartInstance) {
      chartInstance.data.datasets[0].data = data;
      chartInstance.update();
      return;
    }

    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: cuadrantes.map(c => Q_LABELS[c]),
        datasets: [{
          data,
          backgroundColor: Q_COLORS,
          borderColor: 'transparent',
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#8b92b8',
              font: { family: 'Inter', size: 11 },
              padding: 12,
              boxWidth: 12,
              borderRadius: 4
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.parsed} tarea${ctx.parsed !== 1 ? 's' : ''}`
            }
          }
        },
        cutout: '68%',
        animation: { duration: 600 }
      }
    });
  }

  return { actualizar };
})();
