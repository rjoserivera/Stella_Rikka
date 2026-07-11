/* ══════════════════════════════════════════════════
   navbar.js — Navbar global de Stella Rikka (Módulos)
   Inyecta el navbar simple en las páginas de herramientas.
   ══════════════════════════════════════════════════ */

(function () {
  // ── Detect current module from path ──
  const path = window.location.pathname;
  const moduleMap = {
    '/hub':         'Hub de Proyectos',
    '/leancanvas':  'Lean Canvas',
    '/moscow':      'MoSCoW',
    '/kanban':      'Kanban',
    '/eisenhower':  'Eisenhower',
    '/diagramas':   'Diagramas de Flujo',
    '/dbdiagrams':  'Diagramas BD / ER',
    '/casosdeuso':  'Casos de Uso UML',
  };
  let currentModule = '';
  for (const [key, label] of Object.entries(moduleMap)) {
    if (path.startsWith(key)) { currentModule = label; break; }
  }
  const isHome = path === '/' || path === '/home.html';

  if (isHome) return; // En home no inyectamos esto, ya tiene su propio header.

  const isSeleccion = path.includes('/seleccion');

  if (isSeleccion) {
    const bgHTML = `
      <div class="particles-container" id="particles"></div>
      <div class="bg-orbs">
        <div class="orb orb-1"></div><div class="orb orb-2"></div><div class="orb orb-3"></div>
      </div>
      <div class="wr-sea-scene" id="wr-sea-scene">
        <div class="wr-sky-objects">
          <div class="wr-sun" id="wr-sun" style="opacity: 0; width: 120px; height: 120px; position: absolute; top: 50px; right: 10vw;">
            <div class="wr-sun-core"></div>
            <div class="wr-sun-rays">
              <span></span><span></span><span></span><span></span>
              <span></span><span></span><span></span><span></span>
            </div>
          </div>
          <svg class="wr-moon" id="wr-moon" style="opacity: 0; width: 100px; height: 100px; position: absolute; top: 50px; right: 10vw;" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="moonGrad" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stop-color="#f8f4e8"/><stop offset="70%" stop-color="#e8dfc0"/><stop offset="100%" stop-color="#c4b38a"/>
              </radialGradient>
            </defs>
            <circle cx="40" cy="40" r="28" fill="url(#moonGrad)"/>
            <circle cx="32" cy="35" r="4" fill="rgba(180,160,110,0.35)"/>
            <circle cx="50" cy="46" r="5" fill="rgba(180,160,110,0.3)"/>
            <circle cx="38" cy="52" r="3" fill="rgba(180,160,110,0.25)"/>
          </svg>
          <div class="wr-cloud wr-cloud-1"><div class="wr-cloud-puff wr-cp-1"></div><div class="wr-cloud-puff wr-cp-2"></div><div class="wr-cloud-puff wr-cp-3"></div><div class="wr-cloud-puff wr-cp-4"></div></div>
          <div class="wr-cloud wr-cloud-2"><div class="wr-cloud-puff wr-cp-1"></div><div class="wr-cloud-puff wr-cp-2"></div><div class="wr-cloud-puff wr-cp-3"></div></div>
          <div class="wr-cloud wr-cloud-3"><div class="wr-cloud-puff wr-cp-1"></div><div class="wr-cloud-puff wr-cp-2"></div><div class="wr-cloud-puff wr-cp-3"></div></div>
        </div>
        <div class="wr-sky-stars" id="wr-sky-stars"></div>
        <div class="wr-shooting-stars" id="wr-shooting-stars"></div>
        <div class="wr-sea-waves">
          <svg class="svg-wave svg-wave-1" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,115,192.73,98.58,239.5,86.27,281.71,67.72,321.39,56.44Z"></path></svg>
          <svg class="svg-wave svg-wave-2" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" opacity=".75"></path>
          </svg>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', bgHTML);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/background.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = '/js/background.js';
    document.body.appendChild(script);
  }

  // ── Build HTML ──
  const navHTML = `
    <nav class="wr-navbar" id="wr-navbar">
      <div class="wr-navbar-left">
        <a href="/" class="wr-navbar-brand" aria-label="Stella Rikka" style="display: flex; align-items: center; text-decoration: none;">
          <img src="/assets/stella_rikka_logo.png" alt="Stella Rikka" class="wr-brand-logo" />
          <span class="wr-brand-name" style="font-family: 'Space Grotesk', sans-serif; font-weight: 700; margin-left: 10px; font-size: 1.1rem; color: var(--text-primary); letter-spacing: -0.02em;">Stella<span style="background: linear-gradient(90deg, #F59E0B 0%, #FB923C 50%, #FBBF24 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Rikka</span></span>
        </a>
        
        <div style="display: flex; gap: 8px; margin-left: 20px;">
          <a href="/" class="wr-nav-link wr-inicio-btn" style="padding: 6px 12px; border-radius: 8px; font-size: 0.85rem; font-weight: 500; color: var(--text-muted); text-decoration: none;">Inicio</a>
          <a href="/#tools" class="wr-nav-link" style="padding: 6px 12px; border-radius: 8px; font-size: 0.85rem; font-weight: 500; color: var(--text-muted); text-decoration: none;">Módulos</a>
          <a href="/#stats" class="wr-nav-link" style="padding: 6px 12px; border-radius: 8px; font-size: 0.85rem; font-weight: 500; color: var(--text-muted); text-decoration: none;">Métricas</a>
        </div>
      </div>
      
      <div class="wr-navbar-center" id="wr-navbar-center">
        <span class="wr-module-title" style="margin-right: 15px;">${currentModule}</span>
      </div>

      <div class="wr-navbar-right" id="wr-navbar-right" style="display: flex; align-items: center; gap: 15px;">
        <button id="btn-host-nav" class="host-wifi-btn" aria-label="Modo Nube"></button>
        <button class="wr-theme-btn" id="wr-toggle-tema" aria-label="Cambiar tema">
          <!-- Sol (modo claro) -->
          <div class="wr-btn-sun">
            <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="9" fill="#FFD700" />
              <g stroke="#FFD700" stroke-width="2.5" stroke-linecap="round">
                <line x1="20" y1="3" x2="20" y2="7" />
                <line x1="20" y1="33" x2="20" y2="37" />
                <line x1="3" y1="20" x2="7" y2="20" />
                <line x1="33" y1="20" x2="37" y2="20" />
                <line x1="8" y1="8" x2="11" y2="11" />
                <line x1="29" y1="29" x2="32" y2="32" />
                <line x1="8" y1="32" x2="11" y2="29" />
                <line x1="29" y1="11" x2="32" y2="8" />
              </g>
            </svg>
          </div>
          <!-- Luna (modo oscuro) -->
          <div class="wr-btn-moon">
            <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="btnMoonGrad" cx="38%" cy="32%" r="60%">
                  <stop offset="0%"   stop-color="#fffde7"/>
                  <stop offset="60%"  stop-color="#e8dfc0"/>
                  <stop offset="100%" stop-color="#c4b38a"/>
                </radialGradient>
              </defs>
              <circle cx="20" cy="20" r="14" fill="url(#btnMoonGrad)"/>
              <circle cx="16" cy="17" r="2"   fill="rgba(180,155,100,0.35)"/>
              <circle cx="25" cy="23" r="2.5" fill="rgba(180,155,100,0.30)"/>
              <circle cx="19" cy="26" r="1.5" fill="rgba(180,155,100,0.25)"/>
            </svg>
          </div>
          <!-- Estrellas fugaces del botón -->
          <div class="wr-btn-star wr-btn-star-1"></div>
          <div class="wr-btn-star wr-btn-star-2"></div>
        </button>
      </div>
    </nav>
  `;

  document.body.insertAdjacentHTML('afterbegin', navHTML);
  document.body.classList.add('wr-body-offset-tool');

  // Mover controles del topbar antiguo al nuevo navbar si existe
  const oldTopbar = document.querySelector('.topbar');
  if (oldTopbar) {
    const center = document.getElementById('wr-navbar-center');
    const right = document.getElementById('wr-navbar-right');
    
    // Mover botón volver a la izquierda
    const left = document.querySelector('.wr-navbar-left');
    const backBtn = oldTopbar.querySelector('.topbar-back, .back-btn, .btn-back');
    const navLinksContainer = left ? (left.querySelector('.wr-nav-links') || left.querySelector('div[style*="gap"]')) : null;
    if (backBtn && navLinksContainer) {
        backBtn.style.padding = '6px 12px';
        backBtn.style.borderRadius = '8px';
        backBtn.style.fontSize = '0.85rem';
        backBtn.style.fontWeight = '500';
        backBtn.style.color = 'var(--text-muted)';
        backBtn.style.textDecoration = 'none';
        backBtn.style.display = 'flex';
        backBtn.style.alignItems = 'center';
        
        const span = backBtn.querySelector('span');
        if (span) span.style.marginLeft = '4px';

        navLinksContainer.insertBefore(backBtn, navLinksContainer.firstChild);
    }
    
    // Mover project name
    const pName = oldTopbar.querySelector('.project-name-wrapper, .header-title');
    if (pName && center) center.appendChild(pName);

    // Mover actions (except theme toggle since wr-navbar has one)
    const actions = oldTopbar.querySelector('.topbar-actions');
    if (actions && right) {
      const oldTheme = actions.querySelector('.theme-toggle');
      if (oldTheme) oldTheme.remove();
      
      while(actions.firstChild) {
        right.insertBefore(actions.firstChild, right.lastElementChild);
      }
    }
    oldTopbar.style.display = 'none';
  }

  // ── Sincronizar el estado del tema al cargar ──
  const btn = document.getElementById('wr-toggle-tema');

  // ── Theme toggle & sync ──
  function syncNavTheme() {
    // Left blank since there is no dual logo toggling anymore
  }

  document.addEventListener('DOMContentLoaded', () => {
    syncNavTheme();
    const btn = document.getElementById('wr-toggle-tema');
    if (btn) {
      btn.addEventListener('click', () => {
        const actual = document.documentElement.getAttribute('data-tema') || 'oscuro';
        const nuevo  = actual === 'oscuro' ? 'claro' : 'oscuro';
        document.documentElement.setAttribute('data-tema', nuevo);
        localStorage.setItem('suite_tema', nuevo);
        if (window.TemaManager) TemaManager.aplicar(nuevo);
        syncNavTheme();
        if (typeof window.syncTema === 'function') window.syncTema();
      });
    }
    
    // Inyectar script de host.js si no existe
    if (!document.querySelector('script[src="/js/host.js"]')) {
      const hostScript = document.createElement('script');
      hostScript.src = '/js/host.js';
      hostScript.onload = () => { if(window.initHostBtn) window.initHostBtn('btn-host-nav'); };
      document.body.appendChild(hostScript);
    } else {
      setTimeout(() => { if(window.initHostBtn) window.initHostBtn('btn-host-nav'); }, 200);
    }
  });

  setTimeout(syncNavTheme, 80);
})();

