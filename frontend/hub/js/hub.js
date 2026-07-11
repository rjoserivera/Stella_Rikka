/* ════════════════════════════════════════════════
   hub.js — Lógica para Hub Dashboard Rediseñado
   ════════════════════════════════════════════════ */

const urlParams = new URLSearchParams(window.location.search);
const pid = urlParams.get('pid');
const API = `/api/hub/proyectos/${pid}`;

if (!pid) window.location.href = '/hub/seleccion';

let proyecto = null;
let nodoActualId = null;
let archivosActuales = [];
let enlacesActuales = [];
let filtroActual = 'all';

const FASES = [
  { id: 1, nombre: '1. Ideación y Gestión', color: '#8b5cf6', sub: 'Modelos de negocio y priorización' },
  { id: 2, nombre: '2. Requisitos', color: '#3b82f6', sub: 'Historias de usuario y requerimientos' },
  { id: 3, nombre: '3. Diseño y Arquitectura', color: '#10b981', sub: 'Diagramas, wireframes y flujos' },
  { id: 4, nombre: '4. Desarrollo y Técnica', color: '#f59e0b', sub: 'APIs, código y guías técnicas' },
  { id: 5, nombre: '5. Pruebas y QA', color: '#ef4444', sub: 'Testing, control de calidad y bugs' },
  { id: 6, nombre: '6. Entrega y Documentación', color: '#06b6d4', sub: 'Manuales, release notes y actas de cierre' }
];

async function init() {
  await cargarProyecto();
  setupEvents();
  renderDashboard();
  
  if (!localStorage.getItem('hub_ayuda_vista')) {
    setTimeout(() => {
      document.getElementById('modal-ayuda').classList.add('visible');
      localStorage.setItem('hub_ayuda_vista', 'true');
    }, 500);
  }
}

async function cargarProyecto() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error();
    proyecto = await res.json();
    document.getElementById('project-name-input').value = proyecto.titulo;
  } catch {
    mostrarToast('Error al cargar proyecto', 'error');
  }
}

// ── Rendering Dashboard ──
function renderDashboard() {
  const container = document.getElementById('dashboard-inner');
  container.innerHTML = '';

  actualizarProgreso();

  const nodosPorFase = {};
  proyecto.nodos.forEach(n => {
    if (!nodosPorFase[n.fase]) nodosPorFase[n.fase] = [];
    nodosPorFase[n.fase].push(n);
  });

  FASES.forEach(fase => {
    const section = document.createElement('section');
    section.className = 'hub-phase';
    section.dataset.fase = fase.id;
    
    section.innerHTML = `
      <div class="hub-phase-header">
        <div>
          <h2 class="hub-phase-title" style="color: ${fase.color}; display: flex; align-items: center;">
            ${fase.nombre}
            <button class="hub-node-help-btn" style="position: relative; top: auto; right: auto; margin-left: 10px; font-size: 1.1rem; padding: 2px 6px;" title="Información sobre esta fase" onclick="mostrarAyudaFase(${fase.id}, '${fase.nombre}')">❓</button>
          </h2>
          <p class="hub-phase-subtitle">${fase.sub}</p>
        </div>
      </div>
    `;
    
    const body = document.createElement('div');
    body.className = 'hub-phase-body';
    body.id = `fase-body-${fase.id}`;
    section.appendChild(body);
    
    container.appendChild(section);

    let nodosFiltrados = nodosPorFase[fase.id] || [];
    if (filtroActual !== 'all') {
       if (filtroActual === 'herramienta') {
         nodosFiltrados = nodosFiltrados.filter(n => n.tipo === 'herramienta' || n.herramienta);
       } else {
         nodosFiltrados = nodosFiltrados.filter(n => n.tipo === filtroActual);
       }
    }

    // Nodos existentes
    if (nodosFiltrados.length > 0) {
      nodosFiltrados.forEach(nodo => {
        const el = document.createElement('div');
        el.className = 'hub-node';
        
        const statusMap = { 'pendiente': 'status-pendiente', 'proceso': 'status-proceso', 'completado': 'status-completado' };
        const statusText = { 'pendiente': 'Pendiente', 'proceso': 'En Proceso', 'completado': 'Completado' };
        const iconMap = { 'herramienta': '🛠️', 'markdown': '📝', 'link': '🔗', 'archivo': '📎' };

        const getAyudaParaNodo = (titulo) => {
          const t = titulo.toLowerCase();
          if (t.includes('lean canvas') || t.includes('modelo de negocio')) {
            return `
              <p style="margin-bottom: 10px;"><strong>💡 Modelo de Negocios / Lean Canvas:</strong></p>
              <p style="margin-bottom: 10px;">Aquí debes definir cómo tu proyecto generará valor, quién es tu cliente y cómo ganarás dinero.</p>
              <ul style="margin-left: 20px; margin-bottom: 10px; list-style-type: disc;">
                <li><strong>Problema:</strong> ¿Qué problema resuelves?</li>
                <li><strong>Solución:</strong> ¿Cómo lo resuelves?</li>
                <li><strong>Propuesta de valor:</strong> ¿Por qué te elegirán a ti?</li>
                <li><strong>Métricas:</strong> ¿Cómo medirás el éxito?</li>
              </ul>
              <p style="font-size: 0.9em; opacity: 0.8;"><em>Puedes utilizar la herramienta 'Lean Canvas' de esta suite, o subir tu propio documento.</em></p>
            `;
          }
          if (t.includes('idealización') || t.includes('ideación') || t.includes('gestión')) {
            return `
              <p style="margin-bottom: 10px;"><strong>💡 Idealización y Gestión:</strong></p>
              <p style="margin-bottom: 10px;">Este es el punto de partida. Aquí documentas la visión general y los objetivos de tu proyecto.</p>
              <ul style="margin-left: 20px; margin-bottom: 10px; list-style-type: disc;">
                <li><strong>Visión:</strong> ¿Qué quieres lograr a largo plazo?</li>
                <li><strong>Objetivos (SMART):</strong> Metas específicas, medibles y alcanzables.</li>
                <li><strong>Gestión:</strong> ¿Quién forma el equipo? ¿Qué metodologías usarán?</li>
              </ul>
              <p style="font-size: 0.9em; opacity: 0.8;"><em>Puedes usar texto enriquecido (Markdown) para redactar esto directamente aquí.</em></p>
            `;
          }
          if (t.includes('moscow') || t.includes('requisitos') || t.includes('backlog')) {
            return `
              <p style="margin-bottom: 10px;"><strong>💡 Requisitos y Priorización:</strong></p>
              <p style="margin-bottom: 10px;">En este documento debes listar todo lo que el sistema debe hacer, priorizado por importancia.</p>
              <ul style="margin-left: 20px; margin-bottom: 10px; list-style-type: disc;">
                <li><strong>Must Have:</strong> Lo que el sistema DEBE tener para funcionar.</li>
                <li><strong>Should Have:</strong> Lo que DEBERÍA tener (importante pero no crítico).</li>
                <li><strong>Could Have:</strong> Lo que PODRÍA tener (deseable si hay tiempo).</li>
                <li><strong>Won't Have:</strong> Lo que NO se incluirá en esta fase.</li>
              </ul>
              <p style="font-size: 0.9em; opacity: 0.8;"><em>Puedes usar la 'Matriz MoSCoW' de esta suite o adjuntar un Excel/PDF.</em></p>
            `;
          }
          if (t.includes('eisenhower') || t.includes('tareas')) {
            return `
              <p style="margin-bottom: 10px;"><strong>💡 Gestión de Tareas (Eisenhower):</strong></p>
              <p style="margin-bottom: 10px;">Aquí organizas tu carga de trabajo diaria basándote en la urgencia y la importancia.</p>
              <ul style="margin-left: 20px; margin-bottom: 10px; list-style-type: disc;">
                <li><strong>Hacer ya:</strong> Urgente e importante.</li>
                <li><strong>Planificar:</strong> Importante pero no urgente.</li>
                <li><strong>Delegar:</strong> Urgente pero no importante.</li>
                <li><strong>Eliminar:</strong> Ni urgente ni importante.</li>
              </ul>
              <p style="font-size: 0.9em; opacity: 0.8;"><em>Puedes enlazar la herramienta 'Matriz Eisenhower' de la suite.</em></p>
            `;
          }
          if (t.includes('arquitectura') || t.includes('diseño') || t.includes('mer') || t.includes('diagrama')) {
            return `
              <p style="margin-bottom: 10px;"><strong>💡 Diseño y Arquitectura:</strong></p>
              <p style="margin-bottom: 10px;">Aquí debes adjuntar todos los recursos visuales y estructurales del proyecto.</p>
              <ul style="margin-left: 20px; margin-bottom: 10px; list-style-type: disc;">
                <li><strong>Base de Datos:</strong> Diagramas Entidad-Relación (MER).</li>
                <li><strong>Interfaces (UI/UX):</strong> Enlaces a Figma, Adobe XD, etc.</li>
                <li><strong>Sistemas:</strong> Diagramas de arquitectura en la nube (AWS, red).</li>
              </ul>
              <p style="font-size: 0.9em; opacity: 0.8;"><em>Sube imágenes, PDFs o pon el link directo a tu herramienta de diseño.</em></p>
            `;
          }
          if (t.includes('pruebas') || t.includes('qa') || t.includes('bugs')) {
            return `
              <p style="margin-bottom: 10px;"><strong>💡 Pruebas y QA (Aseguramiento de Calidad):</strong></p>
              <p style="margin-bottom: 10px;">Documenta cómo asegurarás que el proyecto funciona correctamente.</p>
              <ul style="margin-left: 20px; margin-bottom: 10px; list-style-type: disc;">
                <li><strong>Plan de Pruebas:</strong> ¿Qué flujos vas a probar?</li>
                <li><strong>Reporte de Bugs:</strong> Lista de errores encontrados, quién los reportó y su estado.</li>
              </ul>
              <p style="font-size: 0.9em; opacity: 0.8;"><em>Puedes subir un archivo Excel o documentarlo aquí mismo usando Markdown.</em></p>
            `;
          }
          
          return `
            <p style="margin-bottom: 10px;"><strong>💡 Documento Personalizado:</strong></p>
            <p style="margin-bottom: 10px;">Has creado un nodo personalizado. Usa este espacio para agregar la información que consideres pertinente para esta fase del proyecto.</p>
            <ul style="margin-left: 20px; margin-bottom: 10px; list-style-type: disc;">
              <li><strong>Texto:</strong> Escribe en Markdown (ideal para actas o notas).</li>
              <li><strong>Enlaces:</strong> Vincula Google Docs, repositorios de GitHub, etc.</li>
              <li><strong>Archivos:</strong> Sube PDFs, imágenes o diagramas.</li>
            </ul>
          `;
        };

        const ayudaTexto = nodo.ayuda || getAyudaParaNodo(nodo.titulo);

        // Card Click opens view modal
        el.onclick = (e) => {
          if (e.target.closest('.hub-node-help-btn')) return;
          abrirModalNodo(nodo.id);
        };

        const safeTitulo = escHtml(nodo.titulo).replace(/'/g, "\\'");
        const safeAyuda = (nodo.ayuda || getAyudaParaNodo(nodo.titulo)).replace(/'/g, "&#39;").replace(/"/g, "&quot;");

        let icon = iconMap[nodo.tipo] || '📄';
        if (nodo.tipo === 'herramienta' || nodo.herramienta) {
           if (nodo.herramienta === 'leancanvas') icon = '📊';
           else if (nodo.herramienta === 'moscow') icon = '🎯';
           else if (nodo.herramienta === 'eisenhower') icon = '⚖️';
           else if (nodo.herramienta === 'kanban') icon = '📋';
           else icon = '🛠️';
        }

        let linksHtml = '';
        if (nodo.enlaces && nodo.enlaces.length > 0) {
          linksHtml = `<div class="hub-node-links" style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border-color); display:flex; flex-direction:column; gap:8px;">`;
          nodo.enlaces.forEach(link => {
            linksHtml += `<a href="${escHtml(link.url)}" target="_blank" onclick="event.stopPropagation()" style="color:var(--accent-primary); font-size:0.85rem; text-decoration:none; display:flex; align-items:center; gap:6px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escHtml(link.url)}">
              🔗 ${escHtml(link.titulo || link.url)}
            </a>`;
          });
          linksHtml += `</div>`;
        }

        el.innerHTML = `
          <div class="hub-node-header">
            <div class="hub-node-icon">${icon}</div>
            <div class="hub-node-info">
              <div class="hub-node-title">${escHtml(nodo.titulo)}</div>
              <div class="hub-node-type">${nodo.tipo}</div>
            </div>
            <button class="hub-node-help-btn" title="¿Qué es esto?" onclick="mostrarAyudaNodo('${safeTitulo}', '${safeAyuda}')">❓</button>
          </div>
          <div class="hub-node-footer">
            <div class="hub-node-status ${statusMap[nodo.estado] || 'status-pendiente'}">
              <div class="status-dot"></div>
              <span>${statusText[nodo.estado] || 'Pendiente'}</span>
            </div>
          </div>
          ${linksHtml}
        `;
        body.appendChild(el);
      });
    }

    // Botón Agregar (solo si no hay filtro estricto o si es all)
    if (filtroActual === 'all') {
      const btnAdd = document.createElement('div');
      btnAdd.className = 'add-node-btn';
      btnAdd.innerHTML = `
        <span style="font-size:1.5rem; color:var(--text-muted);">+</span>
        <span>Agregar Documento</span>
      `;
      btnAdd.onclick = () => abrirModalCrear(fase.id);
      body.appendChild(btnAdd);
    }
  });
}

// ── Modales de Creación y Edición ──

function mostrarAyudaFase(faseId, nombreFase) {
  const ayudas = {
    1: `
      <p style="margin-bottom: 10px;">En esta fase de <strong>Ideación y Gestión</strong>, se define el rumbo, alcance y viabilidad del proyecto antes de escribir código.</p>
      <h4 style="color: var(--accent-primary); margin-top: 15px; margin-bottom: 10px;">📑 Tipos de Documentos y Cuándo Usarlos:</h4>
      <ul style="margin-left: 20px; margin-bottom: 10px; list-style-type: disc;">
        <li style="margin-bottom: 5px;"><strong>Modelo de Negocios (Lean Canvas):</strong> Usa esto al inicio para definir quién es tu cliente, tu propuesta de valor y cómo el proyecto será rentable o sustentable.</li>
        <li style="margin-bottom: 5px;"><strong>Acta de Constitución (Project Charter):</strong> Úsala para formalizar el inicio del proyecto, dejando claros los objetivos principales y el alcance para todos los interesados.</li>
        <li style="margin-bottom: 5px;"><strong>Gestión de Tareas (Eisenhower):</strong> Ideal para el líder técnico que necesita decidir qué es urgente y qué se puede delegar.</li>
        <li style="margin-bottom: 5px;"><strong>Análisis Competitivo / Benchmarking:</strong> Para comparar tu idea con sistemas similares existentes en el mercado.</li>
        <li style="margin-bottom: 5px;"><strong>Matriz de Riesgos:</strong> Cuando el proyecto es grande y necesitas prever qué cosas podrían salir mal y cómo mitigarlas.</li>
        <li style="margin-bottom: 5px;"><strong>Presupuesto / Roadmap:</strong> Usa esto si necesitas pedir financiamiento o establecer hitos de entrega formales a largo plazo.</li>
      </ul>
    `,
    2: `
      <p style="margin-bottom: 10px;">En esta fase de <strong>Requisitos</strong>, traduces las necesidades del negocio en especificaciones concretas para los programadores.</p>
      <h4 style="color: var(--accent-primary); margin-top: 15px; margin-bottom: 10px;">📑 Tipos de Documentos y Cuándo Usarlos:</h4>
      <ul style="margin-left: 20px; margin-bottom: 10px; list-style-type: disc;">
        <li style="margin-bottom: 5px;"><strong>Matriz MoSCoW:</strong> Úsala para negociar con el cliente qué se hará en esta versión y qué quedará para el futuro (Must, Should, Could).</li>
        <li style="margin-bottom: 5px;"><strong>Backlog / Historias de Usuario:</strong> Esencial en metodologías ágiles. Se usa para escribir las funcionalidades desde la perspectiva del usuario.</li>
        <li style="margin-bottom: 5px;"><strong>Requisitos Funcionales (SRS):</strong> Documento formal que lista de manera técnica qué DEBE poder hacer el sistema.</li>
        <li style="margin-bottom: 5px;"><strong>Requisitos No Funcionales:</strong> Úsalo para definir estándares de seguridad, tiempos máximos de carga, o capacidad de concurrencia.</li>
        <li style="margin-bottom: 5px;"><strong>Casos de Uso (UML):</strong> Diagramas necesarios para visualizar actores (admin, usuario) y cómo interactúan con los módulos del sistema.</li>
        <li style="margin-bottom: 5px;"><strong>User Journeys:</strong> Para trazar el camino paso a paso que hará una persona al navegar la aplicación.</li>
      </ul>
    `,
    3: `
      <p style="margin-bottom: 10px;">En esta fase de <strong>Diseño y Arquitectura</strong>, decides cómo se verá el sistema (UI) y cómo estará estructurado por debajo.</p>
      <h4 style="color: var(--accent-primary); margin-top: 15px; margin-bottom: 10px;">📑 Tipos de Documentos y Cuándo Usarlos:</h4>
      <ul style="margin-left: 20px; margin-bottom: 10px; list-style-type: disc;">
        <li style="margin-bottom: 5px;"><strong>Wireframes / Mockups (Figma, XD):</strong> Fundamental antes de programar el Frontend. Muestra cómo lucirán las pantallas.</li>
        <li style="margin-bottom: 5px;"><strong>Diagrama de Base de Datos (MER):</strong> Obligatorio si usarás SQL/NoSQL. Sirve para ver las tablas, llaves primarias y relaciones.</li>
        <li style="margin-bottom: 5px;"><strong>Arquitectura de Software / Red:</strong> Úsalo para graficar los servidores, base de datos en la nube (AWS, Azure) y flujos de red.</li>
        <li style="margin-bottom: 5px;"><strong>Diagramas de Secuencia (UML):</strong> Para sistemas complejos donde necesitas mostrar el orden exacto de los llamados entre el frontend y múltiples APIs.</li>
        <li style="margin-bottom: 5px;"><strong>Diseño de API (Swagger):</strong> Para acordar los endpoints (rutas) que consumirá el frontend antes de que el backend empiece a programarlos.</li>
        <li style="margin-bottom: 5px;"><strong>Design System:</strong> Cuando el equipo es grande y necesitan reglas claras sobre colores, tipografías y componentes reutilizables.</li>
      </ul>
    `,
    4: `
      <p style="margin-bottom: 10px;">En esta fase de <strong>Desarrollo y Técnica</strong>, gestionas el código, las tareas del día a día y los manuales técnicos.</p>
      <h4 style="color: var(--accent-primary); margin-top: 15px; margin-bottom: 10px;">📑 Tipos de Documentos y Cuándo Usarlos:</h4>
      <ul style="margin-left: 20px; margin-bottom: 10px; list-style-type: disc;">
        <li style="margin-bottom: 5px;"><strong>Tablero Kanban:</strong> Imprescindible para que el equipo mueva tarjetas y todos sepan quién está programando qué cosa.</li>
        <li style="margin-bottom: 5px;"><strong>Guía de Instalación (README):</strong> Úsalo para explicar a un programador nuevo los comandos necesarios (npm install) para correr el código en su PC.</li>
        <li style="margin-bottom: 5px;"><strong>Diccionario de Datos:</strong> Documento textual que explica qué significa cada columna en la base de datos (si el diagrama MER no es suficiente).</li>
        <li style="margin-bottom: 5px;"><strong>Convenciones de Código:</strong> Para equipos. Define reglas de linting, formato (Prettier) y cómo nombrar variables.</li>
        <li style="margin-bottom: 5px;"><strong>Documentación de Endpoints:</strong> Lista exacta de qué parámetros requiere cada ruta de tu backend y qué JSON devuelve.</li>
        <li style="margin-bottom: 5px;"><strong>Scripts de BD (Migraciones):</strong> Archivos SQL esenciales para crear la estructura de la base de datos en los servidores.</li>
      </ul>
    `,
    5: `
      <p style="margin-bottom: 10px;">En esta fase de <strong>Pruebas y QA</strong>, auditas el producto para asegurar la calidad antes de que lo vea el cliente final.</p>
      <h4 style="color: var(--accent-primary); margin-top: 15px; margin-bottom: 10px;">📑 Tipos de Documentos y Cuándo Usarlos:</h4>
      <ul style="margin-left: 20px; margin-bottom: 10px; list-style-type: disc;">
        <li style="margin-bottom: 5px;"><strong>Plan Maestro de Pruebas:</strong> Úsalo para definir el enfoque general: ¿quién probará el sistema, en qué navegadores y cuándo?</li>
        <li style="margin-bottom: 5px;"><strong>Casos de Prueba (Test Cases):</strong> Lista exhaustiva de pasos a seguir para verificar si el login, pagos o registros funcionan.</li>
        <li style="margin-bottom: 5px;"><strong>Reporte de Bugs:</strong> Para llevar el control de los errores que encuentran los testers y verificar si ya fueron arreglados.</li>
        <li style="margin-bottom: 5px;"><strong>Matriz de Trazabilidad:</strong> Úsala para verificar que cada "Requisito" (Fase 2) haya sido programado y probado sin olvidar nada.</li>
        <li style="margin-bottom: 5px;"><strong>Pruebas de Rendimiento / Carga:</strong> Reportes (Ej. JMeter) para demostrar cuántos usuarios concurrentes soporta el servidor antes de caerse.</li>
        <li style="margin-bottom: 5px;"><strong>Reporte de Seguridad:</strong> Resultados de auditorías para garantizar que no hay vulnerabilidades (inyección SQL, XSS).</li>
      </ul>
    `,
    6: `
      <p style="margin-bottom: 10px;">En esta fase de <strong>Entrega y Documentación</strong>, finalizas los trámites de despliegue y empoderas a los usuarios finales.</p>
      <h4 style="color: var(--accent-primary); margin-top: 15px; margin-bottom: 10px;">📑 Tipos de Documentos y Cuándo Usarlos:</h4>
      <ul style="margin-left: 20px; margin-bottom: 10px; list-style-type: disc;">
        <li style="margin-bottom: 5px;"><strong>Manual de Usuario:</strong> Obligatorio. Una guía paso a paso (con capturas de pantalla) para la persona que no sabe nada del sistema.</li>
        <li style="margin-bottom: 5px;"><strong>Manual de Administrador:</strong> Para el encargado de dar permisos, ver logs de auditoría o configurar el sistema.</li>
        <li style="margin-bottom: 5px;"><strong>Release Notes (Notas de Versión):</strong> Documento que explica a los usuarios qué cosas nuevas o mejoras trae esta versión específica.</li>
        <li style="margin-bottom: 5px;"><strong>Acta de Cierre / Aceptación:</strong> Documento legal y formal donde el cliente firma que recibió todo a conformidad.</li>
        <li style="margin-bottom: 5px;"><strong>Guía de Despliegue en Producción:</strong> Pasos técnicos exactos para subir el sistema al servidor en vivo (hosting, dominios, SSL).</li>
        <li style="margin-bottom: 5px;"><strong>Plan de Capacitación:</strong> Cronograma de las clases o reuniones donde enseñarás a usar el software al personal.</li>
      </ul>
    `
  };
  mostrarAyudaNodo(`Ayuda: ${nombreFase}`, ayudas[faseId] || "Agrega aquí los documentos correspondientes a esta fase.");
}

function actualizarProgreso() {
  if (!proyecto || !proyecto.nodos) return;
  const total = proyecto.nodos.length;
  let completados = 0;
  
  if (total > 0) {
    completados = proyecto.nodos.filter(n => n.estado === 'completado').length;
  }
  
  const porcentaje = total === 0 ? 0 : Math.round((completados / total) * 100);
  
  const fill = document.getElementById('progress-fill');
  const text = document.getElementById('progress-text');
  
  if (fill) fill.style.width = `${porcentaje}%`;
  if (text) text.textContent = `${porcentaje}%`;
}

function abrirModalCrear(faseId) {
  document.getElementById('crear-fase').value = faseId;
  document.getElementById('crear-titulo').value = '';
  document.getElementById('crear-archivo-input').value = '';
  document.getElementById('crear-link-input').value = '';
  document.getElementById('modal-crear').classList.add('visible');
  document.getElementById('crear-titulo').focus();
}

document.getElementById('form-crear').addEventListener('submit', async (e) => {
  e.preventDefault();
  const faseId = document.getElementById('crear-fase').value;
  const titulo = document.getElementById('crear-titulo').value.trim();
  const tipo = document.querySelector('input[name="crear-tipo"]:checked').value;
  
  if (!titulo) return;
  
  let enlaces = [];
  if (tipo === 'link') {
    const url = document.getElementById('crear-link-input').value.trim();
    if (url) enlaces.push({ url, titulo });
  }

  try {
    const res = await fetch(`/api/hub/proyectos/${pid}/nodos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fase: parseInt(faseId), titulo, tipo, enlaces })
    });
    const nuevoNodo = await res.json();

    if (tipo === 'archivo') {
      const fileInput = document.getElementById('crear-archivo-input');
      if (fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        const resUpload = await fetch(`/api/hub/proyectos/${pid}/upload`, { method: 'POST', body: formData });
        if (resUpload.ok) {
           const dataFile = await resUpload.json();
           await fetch(`/api/hub/proyectos/${pid}/nodos/${nuevoNodo.id}`, {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ ...nuevoNodo, archivos: [dataFile] })
           });
        }
      }
    }

    document.getElementById('modal-crear').classList.remove('visible');
    await cargarProyecto();
    renderDashboard();
    mostrarToast('Documento creado', 'success');
  } catch {
    mostrarToast('Error al agregar', 'error');
  }
});

function abrirModalNodo(nodoId) {
  nodoActualId = nodoId;
  const nodo = proyecto.nodos.find(n => n.id === nodoId);
  if (!nodo) return;

  document.getElementById('nodo-titulo').value = nodo.titulo || '';
  document.getElementById('nodo-estado').value = nodo.estado || 'pendiente';
  document.getElementById('nodo-markdown').value = nodo.contenido || '';
  
  // Retrocompatibilidad con strings viejos
  archivosActuales = Array.isArray(nodo.archivos) ? [...nodo.archivos] : [];
  if (!Array.isArray(nodo.archivos) && nodo.archivo) {
    try { archivosActuales.push(JSON.parse(nodo.archivo)); }
    catch { archivosActuales.push({ url: nodo.archivo, filename: 'Archivo Antiguo' }); }
  }
  
  enlacesActuales = Array.isArray(nodo.enlaces) ? [...nodo.enlaces] : [];
  if (!Array.isArray(nodo.enlaces) && nodo.enlace) {
    enlacesActuales.push({ url: nodo.enlace, titulo: nodo.enlace });
  }

  document.getElementById('nodo-herramienta').value = nodo.herramienta || '';
  document.getElementById('upload-status').textContent = '';

  renderEnlaces();
  renderArchivos();

  const selectHerramienta = document.getElementById('nodo-herramienta');
  const selectHerramientaId = document.getElementById('nodo-herramienta-id');
  const btnAbrirHerramienta = document.getElementById('btn-abrir-herramienta');
  const actionContainer = document.getElementById('herramienta-action-container');
  
  const updateHerramientaUI = async () => {
    const herr = selectHerramienta.value;
    if (herr) {
      selectHerramientaId.style.display = 'block';
      selectHerramientaId.innerHTML = '<option value="">Cargando proyectos...</option>';
      try {
        const res = await fetch(`/api/${herr}/proyectos`);
        const proyectosExt = await res.json();
        let optionsHtml = '<option value="nuevo">-- Crear nuevo proyecto asociado --</option>';
        proyectosExt.forEach(p => {
          optionsHtml += `<option value="${p.id}">${escHtml(p.titulo)}</option>`;
        });
        selectHerramientaId.innerHTML = optionsHtml;
        if (nodo.herramienta === herr && nodo.herramienta_id) {
          selectHerramientaId.value = nodo.herramienta_id;
        }
      } catch (e) {
        selectHerramientaId.innerHTML = '<option value="nuevo">-- Crear nuevo proyecto asociado --</option>';
      }
      actionContainer.style.display = 'block';
    } else {
      selectHerramientaId.style.display = 'none';
      actionContainer.style.display = 'none';
    }
  };
  
  btnAbrirHerramienta.onclick = () => {
    const herr = selectHerramienta.value;
    let herrId = selectHerramientaId.value;
    if (herrId === 'nuevo') herrId = null;
    abrirHerramientaInPlace(herr, document.getElementById('nodo-titulo').value, herrId);
  };

  updateHerramientaUI();
  selectHerramienta.onchange = updateHerramientaUI;

  document.getElementById('modal-nodo').classList.add('visible');
}

// ── Renderizado de Arrays ──
function renderEnlaces() {
  const container = document.getElementById('enlaces-container');
  container.innerHTML = enlacesActuales.map((enlace, i) => `
    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:6px;">
      <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-right:10px;">
        <a href="${escHtml(enlace.url)}" target="_blank" style="color:var(--accent-primary); text-decoration:none;">
          ${escHtml(enlace.titulo || enlace.url)}
        </a>
      </div>
      <button type="button" class="btn btn-danger" style="padding:4px 8px; font-size:0.8rem;" onclick="eliminarEnlace(${i})">Eliminar</button>
    </div>
  `).join('');
}
window.eliminarEnlace = (index) => { enlacesActuales.splice(index, 1); renderEnlaces(); };

document.getElementById('btn-add-enlace').addEventListener('click', () => {
  const t = document.getElementById('nuevo-enlace-titulo').value.trim();
  const u = document.getElementById('nuevo-enlace-url').value.trim();
  if (u) {
    enlacesActuales.push({ url: u, titulo: t || u });
    document.getElementById('nuevo-enlace-titulo').value = '';
    document.getElementById('nuevo-enlace-url').value = '';
    renderEnlaces();
  }
});

function renderArchivos() {
  const container = document.getElementById('archivos-container');
  container.innerHTML = archivosActuales.map((arch, i) => `
    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:6px;">
      <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-right:10px;">
        📄 <a href="${escHtml(arch.url)}" target="_blank" style="color:var(--text-primary); text-decoration:none;">
          ${escHtml(arch.filename || 'Archivo')}
        </a>
      </div>
      <button type="button" class="btn btn-danger" style="padding:4px 8px; font-size:0.8rem;" onclick="eliminarArchivo(${i})">Eliminar</button>
    </div>
  `).join('');
}
window.eliminarArchivo = (index) => { archivosActuales.splice(index, 1); renderArchivos(); };

// Global Event Listener para File Upload (se ejecuta una vez)
document.getElementById('nodo-archivo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const statusLabel = document.getElementById('upload-status');
  statusLabel.textContent = 'Subiendo archivo...';
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const res = await fetch(`/api/hub/proyectos/${pid}/upload`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error();
    const data = await res.json();
    archivosActuales.push(data);
    renderArchivos();
    statusLabel.textContent = '✅ Subido con éxito: ' + data.filename;
    statusLabel.style.color = '#10b981';
  } catch {
    statusLabel.textContent = '❌ Error al subir el archivo.';
    statusLabel.style.color = '#ef4444';
  }
});

// ── In-Place IFrame Tool Launcher ──
async function abrirHerramientaInPlace(herramienta, titulo, herrId) {
  // Primero cerrar modal actual
  document.getElementById('modal-nodo').classList.remove('visible');
  
  const iframeModal = document.getElementById('modal-iframe');
  const iframeTitle = document.getElementById('iframe-title');
  const iframe = document.getElementById('tool-iframe');
  
  iframeTitle.textContent = titulo;
  iframeModal.classList.add('visible');
  iframe.src = ''; // reset
  
  let targetId = herrId;
  
  // Si eligió "nuevo", no tiene ID guardado, o el ID es igual al del proyecto actual
  if (!targetId || targetId === 'nuevo' || targetId === pid) {
    try {
      await fetch(`/api/hub/proyectos/${pid}/init_tool/${herramienta}`, { method: 'POST' });
      targetId = pid;
    } catch (e) {
      console.error("Error inicializando tool", e);
    }
  }

  // Cargar iframe con la ruta correcta
  const rutasHerramientas = {
    'eisenhower': 'matriz',
    'moscow': 'matriz',
    'leancanvas': 'canvas',
    'kanban': 'tablero'
  };
  const ruta = rutasHerramientas[herramienta] || 'board';
  iframe.src = `/${herramienta}/${ruta}?pid=${targetId}`;
}

// ── Guardar Cambios Nodo ──
document.getElementById('form-nodo').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!nodoActualId) return;

  const nodo = proyecto.nodos.find(n => n.id === nodoActualId);
  const titulo = document.getElementById('nodo-titulo').value.trim();
  const estado = document.getElementById('nodo-estado').value;
  
  const contenido = document.getElementById('nodo-markdown').value;
  const herramienta = document.getElementById('nodo-herramienta').value;
  
  let herramienta_id = document.getElementById('nodo-herramienta-id').value;
  if (herramienta_id === 'nuevo') herramienta_id = pid;

  try {
    await fetch(`/api/hub/proyectos/${pid}/nodos/${nodoActualId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        titulo, estado, contenido, herramienta, herramienta_id,
        archivos: archivosActuales,
        enlaces: enlacesActuales 
      })
    });
    
    nodo.titulo = titulo;
    nodo.estado = estado;
    nodo.contenido = contenido;
    nodo.herramienta = herramienta;
    nodo.herramienta_id = herramienta_id;
    nodo.archivos = [...archivosActuales];
    nodo.enlaces = [...enlacesActuales];
    
    document.getElementById('modal-nodo').classList.remove('visible');
    renderDashboard();
    mostrarToast('Guardado', 'success');
  } catch {
    mostrarToast('Error al guardar', 'error');
  }
});

// ── Eliminar Nodo ──
document.getElementById('btn-eliminar-nodo').addEventListener('click', async () => {
  if (!nodoActualId) return;
  if (!confirm('¿Seguro que deseas eliminar este documento?')) return;
  
  try {
    await fetch(`/api/hub/proyectos/${pid}/nodos/${nodoActualId}`, { method: 'DELETE' });
    document.getElementById('modal-nodo').classList.remove('visible');
    await cargarProyecto();
    renderDashboard();
    mostrarToast('Eliminado', 'success');
  } catch {
    mostrarToast('Error', 'error');
  }
});

// ── Ayuda de Nodos Específicos ──
function mostrarAyudaNodo(titulo, ayudaHTML) {
  document.getElementById('ayuda-nodo-titulo').textContent = titulo;
  document.getElementById('ayuda-nodo-texto').innerHTML = ayudaHTML;
  document.getElementById('modal-ayuda-nodo').classList.add('visible');
}
document.getElementById('btn-ayuda-nodo-cerrar').addEventListener('click', () => {
  document.getElementById('modal-ayuda-nodo').classList.remove('visible');
});

// ── Eventos Generales ──
function setupEvents() {
  // Filtros
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filtroActual = btn.getAttribute('data-filter');
      renderDashboard();
    });
  });

  // Selector de Tipo en Modal Crear
  document.querySelectorAll('input[name="crear-tipo"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const val = e.target.value;
      document.getElementById('group-crear-archivo').style.display = val === 'archivo' ? 'block' : 'none';
      document.getElementById('group-crear-link').style.display = val === 'link' ? 'block' : 'none';
    });
  });

  document.getElementById('project-name-input').addEventListener('change', async (e) => {
    mostrarToast('Nombre actualizado', 'success');
  });

  document.getElementById('btn-exportar-dossier').addEventListener('click', generarDossierGlobal);

  // Modal Ayuda
  document.getElementById('btn-ayuda').addEventListener('click', () => {
    document.getElementById('modal-ayuda').classList.add('visible');
  });
  ['modal-ayuda-close', 'btn-ayuda-cerrar'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
      document.getElementById('modal-ayuda').classList.remove('visible');
    });
  });

  // Modal Crear
  document.getElementById('btn-cancelar-crear').addEventListener('click', () => {
    document.getElementById('modal-crear').classList.remove('visible');
  });
  document.getElementById('modal-crear-close').addEventListener('click', () => {
    document.getElementById('modal-crear').classList.remove('visible');
  });

  // Modal Nodo
  document.getElementById('modal-nodo-close').addEventListener('click', () => {
    document.getElementById('modal-nodo').classList.remove('visible');
  });

  // Modal Iframe
  document.getElementById('modal-iframe-close').addEventListener('click', () => {
    document.getElementById('modal-iframe').classList.remove('visible');
    document.getElementById('tool-iframe').src = '';
  });
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

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Exportación Global (Dossier) ──
async function generarDossierGlobal() {
  try {
    const res = await fetch(`/api/hub/proyectos/${pid}/dossier`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    
    let md = `# Dossier Maestro: ${data.hub.titulo}\n\n`;
    md += `> Generado el ${new Date().toLocaleDateString()} a través de la Suite de Productividad.\n\n`;
    
    // 1. Hub Nodos
    md += `## 1. Documentación del Proyecto\n\n`;
    data.hub.nodos.forEach(n => {
      md += `### Fase ${n.fase}: ${n.titulo} (${n.estado})\n`;
      if (n.contenido) md += `${n.contenido}\n\n`;
      if (n.enlaces && n.enlaces.length > 0) {
        md += `**Enlaces:**\n`;
        n.enlaces.forEach(e => md += `- [${e.titulo || e.url}](${e.url})\n`);
        md += `\n`;
      }
    });
    
    // 2. MoSCoW
    if (data.moscow.proyecto) {
      md += `## 2. Requisitos (MoSCoW)\n\n`;
      const cols = { 'must': 'Must Have', 'should': 'Should Have', 'could': 'Could Have', 'wont': "Won't Have" };
      for (const col in cols) {
        md += `### ${cols[col]}\n`;
        const items = data.moscow.items.filter(i => i.columna === col);
        if (items.length === 0) md += `*Sin ítems*\n\n`;
        items.forEach(i => md += `- **${i.titulo}**: ${i.descripcion}\n`);
        md += `\n`;
      }
    }
    
    // 3. Eisenhower
    if (data.eisenhower.proyecto) {
      md += `## 3. Matriz de Eisenhower (Tareas)\n\n`;
      const quads = { 
        'importante_urgente': 'Hacer (Importante y Urgente)', 
        'importante_no_urgente': 'Planificar (Importante, No Urgente)', 
        'no_importante_urgente': 'Delegar (No Importante, Urgente)', 
        'no_importante_no_urgente': 'Eliminar (No Importante, No Urgente)' 
      };
      for (const q in quads) {
        md += `### ${quads[q]}\n`;
        const tareas = data.eisenhower.tareas.filter(t => t.cuadrante === q);
        if (tareas.length === 0) md += `*Sin tareas*\n\n`;
        tareas.forEach(t => md += `- **${t.titulo}**\n`);
        md += `\n`;
      }
    }
    
    // Descargar
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dossier_${data.hub.titulo.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarToast('Dossier generado', 'success');
  } catch (e) {
    mostrarToast('Error generando dossier', 'error');
  }
}

init();
