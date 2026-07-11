/* ════════════════════════════════════════════
   tema.js — Manejo de modo claro/oscuro
   Compartido por toda la suite
   ════════════════════════════════════════════ */

const TemaManager = (() => {
  const CLAVE = 'suite_tema';

  function aplicar(tema) {
    document.documentElement.setAttribute('data-tema', tema);
    localStorage.setItem(CLAVE, tema);
    // Sincronizar con el backend
    fetch('/api/preferencias', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tema })
    }).catch(() => {});
  }

  function obtener() {
    return localStorage.getItem(CLAVE) || 'oscuro';
  }

  function alternar() {
    // Si hay un eclipse activo, cancelarlo primero antes de cambiar manualmente
    document.documentElement.removeAttribute('data-eclipse');
    const actual = obtener();
    aplicar(actual === 'oscuro' ? 'claro' : 'oscuro');
  }

  function inicializar() {
    // Obtener preferencia: localStorage primero (más rápido), luego backend
    const local = localStorage.getItem(CLAVE);
    if (local) {
      aplicar(local);
    } else {
      fetch('/api/preferencias')
        .then(r => r.json())
        .then(p => aplicar(p.tema || 'oscuro'))
        .catch(() => aplicar('oscuro'));
    }
  }

  return { aplicar, obtener, alternar, inicializar };
})();

// Auto-inicializar al cargar el script
document.addEventListener('DOMContentLoaded', () => {
  TemaManager.inicializar();

  // Conectar el toggle de tema (si existe en el HTML)
  const toggleBtn = document.getElementById('toggle-tema');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      TemaManager.alternar();
    });
  }
});

// Función global de toast/notificaciones
function mostrarToast(mensaje, tipo = 'info', duracion = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const iconos = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.innerHTML = `<span>${iconos[tipo] || 'ℹ️'}</span><span>${mensaje}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duracion);
}

// ── Widget de Soporte ──
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (path === '/' || path.endsWith('/seleccion')) {
    const widgetHTML = `
      <div class="soporte-widget" id="soporte-widget">
        <div class="soporte-bubble" id="soporte-bubble">Si encuentras algún bug o algún error házmelo saber, eso nos ayuda a mejorar este software</div>
        <div class="soporte-avatar" id="soporte-avatar" role="button" tabindex="0" aria-label="Soporte Técnico">
          
          <div class="inoue-fairy fairy-1"></div>
          <div class="inoue-fairy fairy-2"></div>
          <div class="inoue-fairy fairy-3"></div>
          <div class="inoue-fairy fairy-4"></div>
          <div class="inoue-fairy fairy-5"></div>
          <div class="inoue-fairy fairy-6"></div>
          <img src="/assets/soporte_avatar.png" alt="Soporte">

        </div>
      </div>
      <div class="soporte-modal" id="soporte-modal" role="dialog" aria-modal="true">
        <div class="soporte-modal-content">
          <button class="soporte-modal-close" id="soporte-modal-close" aria-label="Cerrar">&times;</button>
          <div class="soporte-modal-title">Contacto de Soporte</div>
          <div class="soporte-modal-info">
            <a href="mailto:Correo Electrónico" class="soporte-modal-item" id="soporte-email">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <span>Correo Electrónico</span>
            </a>
            <a href="https://wa.me/56973425549" target="_blank" class="soporte-modal-item" id="soporte-whatsapp" class="soporte-modal-item whatsapp-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    const bubble = document.getElementById('soporte-bubble');
    const avatar = document.getElementById('soporte-avatar');
    const modal = document.getElementById('soporte-modal');
    const closeBtn = document.getElementById('soporte-modal-close');

    // Mostrar burbuja cada cierto rato (ej. cada 15 segundos por 4 segundos)
    setInterval(() => {
      bubble.classList.add('show');
      setTimeout(() => bubble.classList.remove('show'), 4500);
    }, 15000);

    // Animación inicial al cargar página
    setTimeout(() => {
      bubble.classList.add('show');
      setTimeout(() => bubble.classList.remove('show'), 5000);
    }, 1000);

    // Abrir modal
    avatar.addEventListener('click', () => {
      modal.classList.add('visible');
    });

    // Cerrar modal
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('visible');
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('visible');
    });
  }
});
