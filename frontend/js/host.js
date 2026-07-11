(function() {
    function injectToastContainer() {
        if (!document.getElementById('host-toast-container')) {
            const container = document.createElement('div');
            container.id = 'host-toast-container';
            container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;';
            document.body.appendChild(container);
        }
    }

    function showToast(msg, type='info', duration=5000) {
        injectToastContainer();
        const toast = document.createElement('div');
        toast.style.cssText = `
            background: ${type==='error'? 'rgba(220,50,50,0.9)' : 'rgba(10,20,40,0.95)'};
            color: #fff;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 0.9rem;
            border: 1px solid ${type==='error'? '#ff5a6a' : '#00e5ff'};
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            animation: slideInHost 0.3s ease forwards;
            max-width: 350px;
            word-wrap: break-word;
            font-family: 'Inter', sans-serif;
        `;
        toast.innerHTML = msg;
        document.getElementById('host-toast-container').appendChild(toast);
        
        if (duration > 0) {
            setTimeout(() => {
                toast.style.animation = 'slideOutHost 0.3s ease forwards';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
        return toast;
    }

    if (!document.getElementById('host-css')) {
        const style = document.createElement('style');
        style.id = 'host-css';
        style.innerHTML = `
            @keyframes slideInHost { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes slideOutHost { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
            
            .host-wifi-btn {
                background: none;
                border: 2px solid transparent;
                color: #e5e7eb;
                cursor: pointer;
                padding: 8px;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                z-index: 9999;
                pointer-events: auto;
            }
            .host-wifi-btn:hover {
                background: rgba(255,255,255,0.1);
            }
            
            /* Estado: Buscando / Animando */
            .host-wifi-btn[data-state="searching"] {
                color: #ef4444; /* base roja */
            }
            .host-wifi-btn[data-state="searching"] .wifi-arc-1 { animation: wifiPulseRed 1.2s infinite 0.2s; opacity: 0.2; }
            .host-wifi-btn[data-state="searching"] .wifi-arc-2 { animation: wifiPulseOrange 1.2s infinite 0.4s; opacity: 0.2; }
            .host-wifi-btn[data-state="searching"] .wifi-arc-3 { animation: wifiPulseYellow 1.2s infinite 0.6s; opacity: 0.2; }
            
            /* Estado: Conectado (Verde) */
            .host-wifi-btn[data-state="active"] {
                color: #22c55e;
                filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.6));
            }
            
            @keyframes wifiPulseRed {
                0% { opacity: 0.2; stroke: #ef4444; }
                50% { opacity: 1; stroke: #ef4444; filter: drop-shadow(0 0 4px #ef4444); }
                100% { opacity: 0.2; stroke: #ef4444; }
            }
            @keyframes wifiPulseOrange {
                0% { opacity: 0.2; stroke: #f97316; }
                50% { opacity: 1; stroke: #f97316; filter: drop-shadow(0 0 4px #f97316); }
                100% { opacity: 0.2; stroke: #f97316; }
            }
            @keyframes wifiPulseYellow {
                0% { opacity: 0.2; stroke: #eab308; }
                50% { opacity: 1; stroke: #eab308; filter: drop-shadow(0 0 4px #eab308); }
                100% { opacity: 0.2; stroke: #eab308; }
            }

            /* DROPDOWN MENU */
            .host-wifi-dropdown {
                position: fixed;
                background: rgba(15, 20, 35, 0.95);
                border: 1px solid rgba(0, 229, 255, 0.4);
                border-radius: 12px;
                padding: 15px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.6);
                backdrop-filter: blur(10px);
                display: flex;
                flex-direction: column;
                gap: 12px;
                z-index: 100000;
                min-width: 220px;
                opacity: 0;
                transform: translateY(-10px);
                pointer-events: none;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                font-family: 'Inter', sans-serif;
            }
            .host-wifi-dropdown.show {
                opacity: 1;
                transform: translateY(0);
                pointer-events: auto;
            }
            .host-dropdown-item {
                background: rgba(255,255,255,0.05);
                border: 1px solid transparent;
                color: #e5e7eb;
                padding: 10px 15px;
                border-radius: 8px;
                cursor: pointer;
                text-align: center;
                font-size: 0.9rem;
                font-weight: 500;
                transition: all 0.2s ease;
            }
            .host-dropdown-item:hover {
                background: rgba(0, 229, 255, 0.1);
                border-color: rgba(0, 229, 255, 0.4);
                color: #00e5ff;
            }
            .host-dropdown-item.danger:hover {
                background: rgba(239, 68, 68, 0.1);
                border-color: rgba(239, 68, 68, 0.4);
                color: #ef4444;
            }
            .host-link-text {
                font-size: 0.8rem;
                color: #00e5ff;
                background: rgba(0, 229, 255, 0.05);
                border: 1px dashed rgba(0, 229, 255, 0.3);
                padding: 8px;
                border-radius: 6px;
                word-break: break-all;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .host-link-text:hover { 
                background: rgba(0, 229, 255, 0.15); 
                border-color: rgba(0, 229, 255, 0.8);
            }
        `;
        document.head.appendChild(style);
    }

    const svgOff = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
        <line x1="3" y1="3" x2="21" y2="21" stroke-width="2" />
    </svg>`;

    const svgOn = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path class="wifi-arc wifi-arc-3" d="M1.42 9a16 16 0 0121.16 0" />
        <path class="wifi-arc wifi-arc-2" d="M5 12.55a11 11 0 0114.08 0" />
        <path class="wifi-arc wifi-arc-1" d="M8.53 16.11a6 6 0 016.95 0" />
        <path class="wifi-dot" d="M12 20h.01" />
    </svg>`;

    const svgActive = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path class="wifi-arc wifi-arc-3" d="M1.42 9a16 16 0 0121.16 0" />
        <path class="wifi-arc wifi-arc-2" d="M5 12.55a11 11 0 0114.08 0" />
        <path class="wifi-arc wifi-arc-1" d="M8.53 16.11a6 6 0 016.95 0" />
        <path class="wifi-dot" d="M12 20h.01" />
    </svg>`;

    let dropdownMenu = document.getElementById('host-dropdown');
    if (!dropdownMenu) {
        dropdownMenu = document.createElement('div');
        dropdownMenu.id = 'host-dropdown';
        dropdownMenu.className = 'host-wifi-dropdown';
        document.body.appendChild(dropdownMenu);
    }

    async function checkStatus(btn) {
        try {
            const res = await fetch('/api/host/status');
            const data = await res.json();
            btn.dataset.url = data.url || '';
            updateBtn(btn, data.active ? 'active' : 'off');
        } catch(e) {}
    }

    function updateBtn(btn, state) {
        btn.dataset.state = state;
        if(state === 'active') {
            btn.innerHTML = svgActive;
            btn.title = "Nube Activa (Opciones)";
        } else if(state === 'searching') {
            btn.innerHTML = svgOn;
            btn.title = "Conectando a la nube...";
        } else {
            btn.innerHTML = svgOff;
            btn.title = "Modo Nube (Opciones)";
        }
    }

    let pollInterval = null;

    function stopPollingConnections() {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    }

    function startPollingConnections() {
        stopPollingConnections();
        updateConnections();
        pollInterval = setInterval(updateConnections, 5000);
    }

    async function updateConnections() {
        const countEl = document.getElementById('host-connections-count');
        if (!countEl) return;
        try {
            const res = await fetch('/api/host/connections');
            if(res.ok) {
                const data = await res.json();
                if (data.count !== undefined) {
                    countEl.innerHTML = `👥 Dispositivos: <strong>${data.count}</strong>`;
                }
            }
        } catch(e) {}
    }

    function renderDropdown(btn) {
        const state = btn.dataset.state || 'off';
        const url = btn.dataset.url || '';
        let html = `<div style="font-size:0.8rem; color:#aaa; text-align:center; text-transform:uppercase; font-weight:bold; letter-spacing:1px; margin-bottom:4px;">Menú de Red</div>`;
        
        if (state === 'active') {
            html += `<div style="text-align:center; font-size:0.8rem; color:#22c55e; margin-bottom:4px;">◉ Conectado</div>`;
            html += `<div id="host-connections-count" style="text-align:center; font-size:0.8rem; color:#00e5ff; margin-bottom:8px; background:rgba(0,229,255,0.1); padding:4px; border-radius:4px;">👥 Dispositivos: <strong>...</strong></div>`;
            html += `<div class="host-link-text" onclick="navigator.clipboard.writeText('${url}'); alert('¡Enlace copiado al portapapeles!')" title="Haz clic para copiar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                        </svg>
                        Copiar Enlace
                     </div>`;
            html += `<button class="host-dropdown-item danger" id="host-btn-stop" style="margin-top:4px;">Desconectar</button>`;
            startPollingConnections();
        } else if (state === 'searching') {
            html += `<div style="text-align:center; color:#eab308; padding:15px 0; font-size:0.9rem;">
                        <svg class="wifi-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle; margin-right:8px; animation: wifiPulseYellow 1s infinite;">
                            <path d="M12 20h.01" />
                        </svg> Buscando señal...
                     </div>`;
            stopPollingConnections();
        } else {
            html += `<div style="text-align:center; font-size:0.8rem; color:#ef4444; margin-bottom:4px;">○ Desconectado</div>`;
            html += `<button class="host-dropdown-item" id="host-btn-start" style="margin-top:4px;">Iniciar Conexión</button>`;
            stopPollingConnections();
        }
        
        dropdownMenu.innerHTML = html;
        
        const btnStart = document.getElementById('host-btn-start');
        const btnStop = document.getElementById('host-btn-stop');
        
        if (btnStart) btnStart.onclick = () => { dropdownMenu.classList.remove('show'); stopPollingConnections(); startHost(btn); };
        if (btnStop) btnStop.onclick = () => { dropdownMenu.classList.remove('show'); stopPollingConnections(); stopHost(btn); };
    }

    function toggleDropdown(btn) {
        const rect = btn.getBoundingClientRect();
        dropdownMenu.style.top = (rect.bottom + 15) + 'px';
        dropdownMenu.style.left = (rect.right - 220) + 'px'; // alinear a la derecha del botón
        
        if (dropdownMenu.classList.contains('show')) {
            dropdownMenu.classList.remove('show');
            stopPollingConnections();
        } else {
            renderDropdown(btn);
            dropdownMenu.classList.add('show');
        }
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.host-wifi-btn') && !e.target.closest('.host-wifi-dropdown')) {
            dropdownMenu.classList.remove('show');
            stopPollingConnections();
        }
    });

    async function stopHost(btn) {
        updateBtn(btn, 'searching');
        try {
            await fetch('/api/host/stop', {method:'POST'});
            btn.dataset.url = '';
            updateBtn(btn, 'off');
            showToast("Conexión en la nube detenida.");
        } catch(e) {
            showToast("Error al detener", 'error');
            updateBtn(btn, 'active');
        }
    }

    async function startHost(btn) {
        updateBtn(btn, 'searching');
        const loadingToast = showToast("Iniciando túnel seguro... Esto puede tardar unos segundos.", "info", 0);
        try {
            const res = await fetch('/api/host/start', {method:'POST'});
            const data = await res.json();
            loadingToast.remove();
            if (data.url) {
                btn.dataset.url = data.url;
                updateBtn(btn, 'active');
                showToast(`<b>Nube Activa</b><br><a href="${data.url}" target="_blank" style="color:#00e5ff; text-decoration:none;">${data.url}</a>`, "info", 15000);
            } else if(data.error) {
                showToast("Error: " + data.error, 'error');
                updateBtn(btn, 'off');
            }
        } catch(e) {
            loadingToast.remove();
            showToast("Error al iniciar conexión.", 'error');
            updateBtn(btn, 'off');
        }
    }

    window.initHostBtn = function(btnId) {
        const btn = document.getElementById(btnId);
        if (btn && !btn.dataset.initialized) {
            btn.dataset.initialized = "true";
            
            // Verificación de seguridad: si no es el Host (localhost), ocultamos el botón
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            if (!isLocal) {
                btn.style.display = 'none';
                return;
            }
            
            updateBtn(btn, 'off'); // inicial por defecto
            checkStatus(btn);
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleDropdown(btn);
            });
        }
    }

})();
