/* ════════════════════════════════
   home.js — Lógica del Home
   ════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // Animación escalonada de las cards de herramientas
  const cards = document.querySelectorAll('.tool-card');
  cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.animationDelay = `${i * 0.1}s`;
    setTimeout(() => {
      card.style.opacity = '';
      card.classList.add('animate-fade-in');
    }, i * 100);
  });

  // Guardar última herramienta usada al hacer clic
  document.querySelectorAll('.tool-card.disponible').forEach(card => {
    card.addEventListener('click', () => {
      const herramienta = card.dataset.herramienta;
      if (herramienta) {
        fetch('/api/preferencias', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ultima_herramienta_usada: herramienta })
        }).catch(() => {});
      }
    });
  });
});
