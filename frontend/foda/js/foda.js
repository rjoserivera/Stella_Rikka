/* ════════════════════════════════════════════
   foda.js — Lógica de la Matriz FODA
   ════════════════════════════════════════════ */

const urlParams = new URLSearchParams(window.location.search);
const pid = urlParams.get('pid');
if (!pid) window.location.href = '/foda/seleccion';

let fodaItems = [];
let editingItemId = null;

// ── Nodos DOM ─────────────────────────────────
const boardTitulo = document.getElementById('board-titulo');
const listF = document.getElementById('list-fortalezas');
const listO = document.getElementById('list-oportunidades');
const listD = document.getElementById('list-debilidades');
const listA = document.getElementById('list-amenazas');
const tbody = document.getElementById('tbody-foda');

const btnViewGrid = document.getElementById('btn-view-grid');
const btnViewTable = document.getElementById('btn-view-table');
const viewGrid = document.getElementById('view-grid');
const viewTable = document.getElementById('view-table');
const searchInput = document.getElementById('search-input');

const modal = document.getElementById('modal-item');
const formItem = document.getElementById('form-item');
const selectCuadrante = document.getElementById('select-cuadrante');
const inputTexto = document.getElementById('input-texto');
const selectPrioridad = document.getElementById('select-prioridad');
const inputResponsable = document.getElementById('input-responsable');

// ── Inicialización ────────────────────────────
async function init() {
    try {
        const resP = await fetch(`/api/foda/proyectos/${pid}`);
        if (!resP.ok) throw new Error('Proyecto no encontrado');
        const proyecto = await resP.json();
        boardTitulo.textContent = proyecto.titulo;
        
        await cargarItems();
    } catch (err) {
        console.error(err);
        mostrarToast('Error cargando datos del análisis.', 'error');
    }
}

// ── Carga y Renderizado ───────────────────────
async function cargarItems() {
    try {
        const res = await fetch(`/api/foda?pid=${pid}`);
        fodaItems = await res.json();
        renderizarGrid(fodaItems);
        renderizarTabla(fodaItems);
    } catch (err) {
        mostrarToast('Error cargando ítems.', 'error');
    }
}

function renderizarGrid(items) {
    listF.innerHTML = ''; listO.innerHTML = '';
    listD.innerHTML = ''; listA.innerHTML = '';
    
    let count = { fortalezas: 0, oportunidades: 0, debilidades: 0, amenazas: 0 };
    
    items.forEach(item => {
        const c = item.cuadrante; // fortalezas, oportunidades, debilidades, amenazas
        if(count[c] !== undefined) count[c]++;
        
        const div = document.createElement('div');
        div.className = `foda-item item-prioridad-${item.prioridad}`;
        div.innerHTML = `
            <div class="item-actions">
                <button class="action-btn edit" onclick="editarItem('${item.id}')" title="Editar">✏️</button>
                <button class="action-btn del" onclick="eliminarItem('${item.id}')" title="Eliminar">🗑️</button>
            </div>
            <div class="foda-item-text">${escHtml(item.texto)}</div>
            <div class="foda-item-meta">
                <span class="prioridad-badge prioridad-${item.prioridad}">${item.prioridad}</span>
                <span>${escHtml(item.responsable) || ''}</span>
            </div>
        `;
        
        if(c === 'fortalezas') listF.appendChild(div);
        else if(c === 'oportunidades') listO.appendChild(div);
        else if(c === 'debilidades') listD.appendChild(div);
        else if(c === 'amenazas') listA.appendChild(div);
    });

    document.getElementById('count-f').textContent = count.fortalezas;
    document.getElementById('count-o').textContent = count.oportunidades;
    document.getElementById('count-d').textContent = count.debilidades;
    document.getElementById('count-a').textContent = count.amenazas;
}

const cuadranteLabels = {
    'fortalezas': '💪 Fortalezas',
    'oportunidades': '🌟 Oportunidades',
    'debilidades': '⚠️ Debilidades',
    'amenazas': '🔥 Amenazas'
};

function renderizarTabla(items) {
    tbody.innerHTML = '';
    if (items.length === 0) {
        document.getElementById('table-empty-state').classList.remove('hidden');
    } else {
        document.getElementById('table-empty-state').classList.add('hidden');
        items.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${cuadranteLabels[item.cuadrante]}</strong></td>
                <td>${escHtml(item.texto)}</td>
                <td><span class="prioridad-badge prioridad-${item.prioridad}">${item.prioridad}</span></td>
                <td>${escHtml(item.responsable) || '-'}</td>
                <td>
                    <button class="btn btn-ghost" onclick="editarItem('${item.id}')" style="padding:4px; font-size:12px;">✏️</button>
                    <button class="btn btn-danger" onclick="eliminarItem('${item.id}')" style="padding:4px; font-size:12px; margin-left:5px;">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// ── Funciones CRUD ────────────────────────────
document.getElementById('btn-add-foda').addEventListener('click', () => {
    editingItemId = null;
    formItem.reset();
    document.getElementById('modal-item-title').textContent = 'Nuevo Ítem FODA';
    modal.classList.add('visible');
});

document.getElementById('btn-close-modal').addEventListener('click', () => modal.classList.remove('visible'));
document.getElementById('btn-cancel-modal').addEventListener('click', () => modal.classList.remove('visible'));

formItem.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        proyecto_id: pid,
        cuadrante: selectCuadrante.value,
        texto: inputTexto.value.trim(),
        prioridad: selectPrioridad.value,
        responsable: inputResponsable.value.trim()
    };

    try {
        let res;
        if (editingItemId) {
            res = await fetch(`/api/foda/${editingItemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            res = await fetch(`/api/foda`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (!res.ok) throw new Error();
        mostrarToast(editingItemId ? 'Ítem actualizado.' : 'Ítem creado.', 'success');
        modal.classList.remove('visible');
        await cargarItems();
    } catch {
        mostrarToast('Error guardando ítem.', 'error');
    }
});

window.editarItem = (id) => {
    const item = fodaItems.find(i => i.id === id);
    if(!item) return;
    editingItemId = id;
    document.getElementById('modal-item-title').textContent = 'Editar Ítem FODA';
    selectCuadrante.value = item.cuadrante;
    inputTexto.value = item.texto;
    selectPrioridad.value = item.prioridad;
    inputResponsable.value = item.responsable || '';
    modal.classList.add('visible');
};

window.eliminarItem = async (id) => {
    if(!confirm('¿Eliminar este ítem?')) return;
    try {
        const res = await fetch(`/api/foda/${id}`, { method: 'DELETE' });
        if(!res.ok) throw new Error();
        mostrarToast('Ítem eliminado', 'success');
        await cargarItems();
    } catch {
        mostrarToast('Error al eliminar', 'error');
    }
};

// ── Vistas y Filtros ──────────────────────────
btnViewGrid.addEventListener('click', () => {
    btnViewGrid.classList.add('active');
    btnViewTable.classList.remove('active');
    viewGrid.classList.remove('hidden');
    viewTable.classList.add('hidden');
});

btnViewTable.addEventListener('click', () => {
    btnViewTable.classList.add('active');
    btnViewGrid.classList.remove('active');
    viewTable.classList.remove('hidden');
    viewGrid.classList.add('hidden');
});

searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtrados = fodaItems.filter(i => 
        i.texto.toLowerCase().includes(q) || 
        (i.responsable && i.responsable.toLowerCase().includes(q))
    );
    renderizarGrid(filtrados);
    renderizarTabla(filtrados);
});

// ── Exportar a PNG ────────────────────────────
document.getElementById('btn-export').addEventListener('click', async () => {
    // Forzar modo grid si estábamos en tabla
    const tablaActiva = btnViewTable.classList.contains('active');
    if (tablaActiva) {
        viewGrid.classList.remove('hidden');
    }
    
    try {
        // Crear un contenedor temporal oculto
        const exportContainer = document.createElement('div');
        exportContainer.style.padding = '40px';
        exportContainer.style.background = document.documentElement.getAttribute('data-tema') === 'oscuro' ? '#060D1E' : '#ffffff';
        exportContainer.style.position = 'absolute';
        exportContainer.style.left = '-9999px';
        exportContainer.style.top = '0';
        exportContainer.style.width = '1200px';

        // Crear título visible en la imagen
        const exportTitle = document.createElement('h1');
        exportTitle.textContent = `Análisis FODA - ${boardTitulo.textContent}`;
        exportTitle.style.color = document.documentElement.getAttribute('data-tema') === 'oscuro' ? '#ffffff' : '#000000';
        exportTitle.style.textAlign = 'center';
        exportTitle.style.marginBottom = '30px';
        exportTitle.style.fontFamily = "'Poppins', sans-serif";
        
        // Clonar la grilla para no afectar la original
        const clonedGrid = viewGrid.cloneNode(true);
        clonedGrid.classList.remove('hidden');
        
        // Ocultar botones de acciones
        clonedGrid.querySelectorAll('.item-actions').forEach(el => el.remove());

        exportContainer.appendChild(exportTitle);
        exportContainer.appendChild(clonedGrid);
        document.body.appendChild(exportContainer);

        const canvas = await html2canvas(exportContainer, {
            backgroundColor: exportContainer.style.background,
            scale: 2
        });

        // Limpieza
        exportContainer.remove();
        if (tablaActiva) {
            viewGrid.classList.add('hidden');
        }

        const safeTitle = boardTitulo.textContent.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
        const link = document.createElement('a');
        link.download = `Matriz_FODA_${safeTitle}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        mostrarToast('FODA exportado como imagen.', 'success');
    } catch (e) {
        console.error(e);
        mostrarToast('Error al exportar.', 'error');
    }
});

// ── Utilidades ────────────────────────────────
function escHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function mostrarToast(msg, tipo = 'info') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast toast-${tipo}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

// Iniciar app
init();

// ── Exportar a JSON (Guardar como) ────────────────────────────
document.getElementById('btn-guardar').addEventListener('click', async () => {
    const dataStr = JSON.stringify(fodaItems, null, 2);
    const safeTitle = boardTitulo.textContent.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
    try {
        if (window.showSaveFilePicker) {
            const handle = await window.showSaveFilePicker({
                suggestedName: `FODA_${safeTitle}.json`,
                types: [{
                    description: 'Análisis FODA Stella Rikka',
                    accept: { 'application/json': ['.json'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(dataStr);
            await writable.close();
            mostrarToast('Matriz guardada exitosamente', 'success');
        } else {
            // Fallback para navegadores antiguos
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `FODA_${safeTitle}.json`;
            a.click();
            URL.revokeObjectURL(url);
            mostrarToast('Matriz guardada exitosamente', 'success');
        }
    } catch (e) {
        if(e.name !== 'AbortError') mostrarToast('Error al guardar archivo', 'error');
    }
});

// ── Modal de Ayuda ──────────────────────────────
document.getElementById('btn-ayuda').addEventListener('click', () => {
    document.getElementById('modal-ayuda').classList.add('visible');
});

document.getElementById('btn-cerrar-ayuda').addEventListener('click', () => {
    document.getElementById('modal-ayuda').classList.remove('visible');
});

