(function() {
  /* ════════════════════════════════════════════════════════
     background.js — Stella Rikka / Orihime Inoue
     Espíritus Shun Shun Rikka + Tsubaki + Sky Sync
     ════════════════════════════════════════════════════════ */

  // ── Tsubaki — estrellas fugaces naranjas (espíritu ofensivo) ──
  const tsubakiColors = ['#FBBF24', '#F59E0B', '#F97316', '#FDE68A', '#ffffff'];

  function createTsubaki() {
    const container = document.getElementById('wr-shooting-stars');
    if (!container) return;
    const tema = document.documentElement.getAttribute('data-tema') || 'oscuro';
    if (tema !== 'oscuro') return;

    const star = document.createElement('div');
    star.className = 'wr-shooting-star';
    const startX  = Math.random() * 80 - 10;
    const startY  = Math.random() * 55;
    const travelX = 18 + Math.random() * 32;
    const travelY = 14 + Math.random() * 28;
    const dur     = 0.6 + Math.random() * 0.8;
    const delay   = Math.random() * 1.2;
    const color   = tsubakiColors[Math.floor(Math.random() * tsubakiColors.length)];
    const length  = 90 + Math.random() * 130;

    star.style.cssText = `
      left:${startX}vw; top:${startY}%;
      width:${length}px;
      background:linear-gradient(to right, transparent, ${color});
      animation-duration:${dur}s;
      animation-delay:${delay}s;
      --tx:${travelX}vw; --ty:${travelY}vh;
      box-shadow: 0 0 6px 2px ${color}99;
    `;
    container.appendChild(star);
    setTimeout(() => star.remove(), (dur + delay + 0.4) * 1000);
  }

  setInterval(createTsubaki, 480);
  for (let i = 0; i < 4; i++) setTimeout(createTsubaki, i * 220);

  // ── Sincronizar el cielo con el tema (colores Stella Rikka) ──
  function syncSkyTheme() {
    const tema   = document.documentElement.getAttribute('data-tema');
    const isDark = tema === 'oscuro';

    const sun  = document.getElementById('wr-sun');
    const moon = document.getElementById('wr-moon');
    if (sun)  sun.style.opacity  = isDark ? '0' : '1';
    if (moon) moon.style.opacity = isDark ? '1' : '0';

    const stars = document.getElementById('wr-sky-stars');
    if (stars) stars.style.opacity = isDark ? '1' : '0';

    const scene = document.getElementById('wr-sea-scene');
    if (scene) {
      // Modo oscuro: azul marino c\u00f3smico profundo (nebulosa)
      // Modo claro:  cielo de primavera japonesa — azul suave → durazno → arena
      scene.style.background = isDark
        ? 'linear-gradient(to bottom, #060D1E 0%, #0A1628 40%, #0D1B35 70%, transparent 100%)'
        : 'linear-gradient(to bottom, #87CEEB 0%, #B8E6FF 28%, #FFD4A8 62%, #FFE8C8 85%, transparent 100%)';
    }
  }

  const _prevSync = window.syncTema || function(){};
  window.syncTema = function() { _prevSync(); syncSkyTheme(); };
  syncSkyTheme();

  // ══════════════════════════════════════════════════════
  //  SHUN SHUN RIKKA — 6 Espíritus de la Horquilla
  //  Cada espíritu es un orbe de flor de 6 pétalos que flota
  // ══════════════════════════════════════════════════════

  // Los 6 espíritus con sus colores únicos
  const RIKKA_SPIRITS = [
    { name: 'Hinagiku', color: '#FCD34D', glow: '#F59E0B' }, // Dorado cálido
    { name: 'Lily',     color: '#FDE68A', glow: '#FBBF24' }, // Amarillo suave
    { name: 'Baigon',   color: '#FCA5A5', glow: '#F87171' }, // Rosa claro
    { name: 'Ayame',    color: '#C4B5FD', glow: '#A78BFA' }, // Lavanda (tímida)
    { name: "Shun'o",   color: '#6EE7B7', glow: '#34D399' }, // Verde curativo
    { name: 'Tsubaki',  color: '#FB923C', glow: '#F97316' }, // Naranja ofensivo
  ];

  // SVG de flor de 6 pétalos (la horquilla de Orihime)
  function buildRikkaSVG(color, glow) {
    return `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
      <defs>
        <radialGradient id="rg_${Math.random().toString(36).slice(2)}" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stop-color="${color}" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="${glow}"  stop-opacity="0.3"/>
        </radialGradient>
        <filter id="blur_glow">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <!-- 6 pétalos girados 60° cada uno -->
      <g transform="translate(30,30)">
        ${[0,60,120,180,240,300].map(deg => `
          <ellipse cx="0" cy="-11" rx="5" ry="9"
            transform="rotate(${deg})"
            fill="${color}" opacity="0.82"
            filter="url(#blur_glow)"/>
        `).join('')}
        <!-- Núcleo central -->
        <circle r="5" fill="${color}" opacity="0.95"
          style="filter:drop-shadow(0 0 4px ${glow})"/>
        <!-- Destello interior -->
        <circle r="2" fill="white" opacity="0.7"/>
      </g>
    </svg>`;
  }

  const fishContainer = document.getElementById('particles');
  if (fishContainer) {
    // Crear los 6 espíritus (múltiples instancias de cada uno)
    const spiritCount = 18; // 3 instancias de cada espíritu
    for (let i = 0; i < spiritCount; i++) {
      const spirit = RIKKA_SPIRITS[i % RIKKA_SPIRITS.length];
      const el     = document.createElement('div');
      el.className = 'particle-rikka';

      const size   = 22 + Math.random() * 22;
      const startY = 5  + Math.random() * 88;
      const dur    = 22 + Math.random() * 25;
      const delay  = -(Math.random() * dur);
      const flipY  = Math.random() > 0.5 ? 1 : -1;
      const wobble = 12 + Math.random() * 20; // amplitud de oscilación vertical

      el.style.cssText = `
        position: absolute;
        left: -80px;
        top: ${startY}%;
        width: ${size}px;
        height: ${size}px;
        animation: rikkaFloat ${dur}s ${delay}s linear infinite;
        --wobble: ${wobble}px;
        transform: scaleY(${flipY});
        opacity: ${0.55 + Math.random() * 0.35};
        filter: drop-shadow(0 0 6px ${spirit.glow}CC);
        pointer-events: none;
      `;
      el.innerHTML = buildRikkaSVG(spirit.color, spirit.glow);
      fishContainer.appendChild(el);
    }

    // Puntos de energía dorada flotante (pequeñas chispas)
    for (let i = 0; i < 35; i++) {
      const dot   = document.createElement('div');
      dot.className = 'particle-dot';
      const sp    = RIKKA_SPIRITS[i % RIKKA_SPIRITS.length];
      const size  = 3 + Math.random() * 4;
      dot.style.cssText = `
        position: absolute;
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
        background: ${sp.color};
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}vw;
        animation-delay: ${-(Math.random() * 10)}s;
        animation-duration: ${9 + Math.random() * 13}s;
        box-shadow: 0 0 ${size * 2}px ${sp.glow};
        pointer-events: none;
        animation-name: floatDot;
        animation-timing-function: ease-in-out;
        animation-iteration-count: infinite;
      `;
      fishContainer.appendChild(dot);
    }

    // ── Sakuras de Orihime (modo claro) — color del broche Stella Rikka ──
    // Colores del logo: degradado cian → azul eléctrico
    const sakuraColors = [
      { outer: '#00E5FF', inner: '#2979FF', glow: '#00E5FF' }, // cian puro
      { outer: '#00D4FF', inner: '#1565C0', glow: '#40C4FF' }, // cian profundo
      { outer: '#18FFFF', inner: '#2962FF', glow: '#84FFFF' }, // turquesa brillante
      { outer: '#00B0FF', inner: '#3D5AFE', glow: '#82B1FF' }, // azul cielo
      { outer: '#40C4FF', inner: '#2979FF', glow: '#00E5FF' }, // azul claro
      { outer: '#00E5FF', inner: '#651FFF', glow: '#B388FF' }, // cian a violeta
    ];

    // SVG de pétalo real — forma del logo Stella Rikka:
    // punta en la parte superior, cuerpo redondeado, base ancha
    function buildSakuraSVG(outer, inner, glow) {
      const id = Math.random().toString(36).slice(2, 7);
      return `<svg viewBox="0 0 60 90" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
        <defs>
          <linearGradient id="sg${id}" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%"   stop-color="${outer}" stop-opacity="0.95"/>
            <stop offset="100%" stop-color="${inner}" stop-opacity="0.80"/>
          </linearGradient>
          <filter id="gf${id}" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.2" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        <!-- Pétalo real: punta arriba, redondeado abajo (igual que el logo) -->
        <path d="
          M30,4
          C34,4 38,8 40,14
          C44,22 46,34 46,46
          C46,62 40,76 30,84
          C20,76 14,62 14,46
          C14,34 16,22 20,14
          C22,8 26,4 30,4 Z
        " fill="url(#sg${id})" opacity="0.88" filter="url(#gf${id})"/>
        <!-- Contorno brillante igual que el logo -->
        <path d="
          M30,4
          C34,4 38,8 40,14
          C44,22 46,34 46,46
          C46,62 40,76 30,84
          C20,76 14,62 14,46
          C14,34 16,22 20,14
          C22,8 26,4 30,4 Z
        " fill="none" stroke="${outer}" stroke-width="1.5" opacity="0.6"/>
        <!-- Vena central sutil -->
        <line x1="30" y1="10" x2="30" y2="78"
          stroke="rgba(255,255,255,0.35)" stroke-width="1"
          stroke-linecap="round"/>
      </svg>`;
    }

    for (let i = 0; i < 32; i++) {
      const sakura = document.createElement('div');
      sakura.className = 'particle-kite';
      const sp     = sakuraColors[i % sakuraColors.length];
      const size   = 20 + Math.random() * 28;
      const dur    = 10 + Math.random() * 14;
      const delay  = -(Math.random() * dur);
      const startY = -10 + Math.random() * 70;
      const drift  = 20 + Math.random() * 50;

      sakura.style.cssText = `
        position: absolute;
        left: -60px;
        top: ${startY}%;
        width: ${size}px;
        height: ${size * 1.5}px;
        animation: sakuraFall ${dur}s ${delay}s linear infinite;
        --drift: ${drift}vh;
        opacity: ${0.60 + Math.random() * 0.35};
        filter: drop-shadow(0 0 6px ${sp.glow}AA);
        pointer-events: none;
      `;
      sakura.innerHTML = buildSakuraSVG(sp.outer, sp.inner, sp.glow);
      fishContainer.appendChild(sakura);
    }
  }

  // ── Animación CSS rikkaFloat (la inyectamos por JS para no modificar más CSS) ──
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    .particle-rikka {
      position: absolute;
      left: -80px;
      pointer-events: none;
      animation-name: rikkaFloat;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
    }
    @keyframes rikkaFloat {
      0%   { left: -80px;              transform: translateY(0)              rotate(0deg); }
      25%  {                           transform: translateY(var(--wobble))  rotate(90deg); }
      50%  {                           transform: translateY(0)              rotate(180deg); }
      75%  {                           transform: translateY(calc(var(--wobble) * -1)) rotate(270deg); }
      100% { left: calc(100vw + 80px); transform: translateY(0)              rotate(360deg); }
    }

    /* Sakuras de Orihime — viaje diagonal izquierda → derecha (viento) */
    @keyframes sakuraFall {
      0% {
        left: -60px;
        transform: translateY(0)            rotate(0deg);
        opacity: 0;
      }
      6% {
        opacity: 1;
      }
      25% {
        transform: translateY(var(--drift)) rotate(100deg);
      }
      50% {
        transform: translateY(calc(var(--drift) * 1.6)) rotate(200deg);
      }
      75% {
        transform: translateY(calc(var(--drift) * 2.2)) rotate(300deg);
        opacity: 0.85;
      }
      100% {
        left: calc(100vw + 60px);
        transform: translateY(calc(var(--drift) * 2.8)) rotate(400deg);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(styleTag);

  // ══════════════════════════════════════════════════════
  //  🌥️ EASTER EGG — Eclipse de Nube
  //  Cuando una nube pasa sobre el sol → modo oscuro temporal
  //  Al despejarse → regresa al modo claro
  // ══════════════════════════════════════════════════════
  let eclipseActive = false;

  function rectsOverlap(a, b) {
    // Verifica si dos DOMRects se solapan
    return !(
      a.right  < b.left  ||
      a.left   > b.right ||
      a.bottom < b.top   ||
      a.top    > b.bottom
    );
  }

  function checkEclipse() {
    const tema      = document.documentElement.getAttribute('data-tema');
    const isEclipse = document.documentElement.hasAttribute('data-eclipse');

    // Solo actuamos si: estamos en modo claro, O si hay un eclipse activo que hay que deshacer
    if (tema !== 'claro' && !isEclipse) {
      eclipseActive = false;
      return;
    }

    const sun = document.getElementById('wr-sun');
    if (!sun) return;

    const sunRect = sun.getBoundingClientRect();
    const clouds  = document.querySelectorAll('.wr-cloud');
    let   covered = false;

    clouds.forEach(cloud => {
      // Solo la nube del eclipse (wr-cloud-2) puede activarlo
      if (!cloud.classList.contains('wr-cloud-2')) return;
      const cr = cloud.getBoundingClientRect();
      // La nube debe estar en pantalla (no invisible off-screen)
      if (cr.right > 0 && cr.left < window.innerWidth) {
        if (rectsOverlap(sunRect, cr)) covered = true;
      }
    });

    if (covered && !eclipseActive) {
      // ☁️ Eclipse — la nube cubre el sol
      eclipseActive = true;
      document.documentElement.setAttribute('data-eclipse', 'true');
      document.documentElement.setAttribute('data-tema', 'oscuro');
      if (window.syncTema) window.syncTema();
    } else if (!covered && eclipseActive) {
      // ☀️ Fin del eclipse — el sol vuelve
      eclipseActive = false;
      document.documentElement.removeAttribute('data-eclipse');
      document.documentElement.setAttribute('data-tema', 'claro');
      // Aseguramos que localStorage no quede en oscuro por el eclipse
      localStorage.setItem('suite_tema', 'claro');
      if (window.syncTema) window.syncTema();
    }
  }

  // Revisar posición cada 250ms
  setInterval(checkEclipse, 250);

})();
