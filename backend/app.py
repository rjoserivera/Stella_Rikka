import json
import os
import sys

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

# Asegurar que los módulos del backend y de raíz sean encontrables
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)
sys.path.insert(0, os.path.dirname(backend_dir))

from herramientas.eisenhower import proyectos as mod_proyectos
from herramientas.eisenhower import tareas as mod_tareas
from herramientas.eisenhower import historial as mod_historial
from herramientas.moscow import proyectos as mod_moscow_proyectos
from herramientas.moscow import items as mod_moscow_items
from herramientas.leancanvas import proyectos as mod_lc_proyectos
from herramientas.leancanvas import versiones as mod_lc_versiones
from herramientas.hub import proyectos as mod_hub_proyectos
from herramientas.kanban import proyectos as mod_kanban_proyectos
from herramientas.kanban import tareas as mod_kanban_tareas
from herramientas.diagramas import proyectos as mod_diagramas_proyectos
from herramientas.dbdiagrams import proyectos as mod_dbdiagramas_proyectos
from herramientas.casosdeuso import proyectos as mod_casos_proyectos

from herramientas.lluviadeideas import sesiones as mod_li_sesiones
from herramientas.lluviadeideas import fusion as mod_li_fusion
from herramientas.requerimientos import requerimientos as mod_req_reqs
from herramientas.requerimientos import trazabilidad as mod_req_trazabilidad
from herramientas.requerimientos import historial as mod_req_historial
from herramientas.requerimientos import proyectos as mod_req_proyectos
from herramientas.historias import proyectos as mod_hu_proyectos
from herramientas.historias import historias as mod_hu_historias
from herramientas.foda import proyectos as mod_foda_proyectos
from herramientas.foda import items as mod_foda_items

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, '..', 'frontend')
from backend.config import DATA_DIR_BASE
DATA_DIR = DATA_DIR_BASE
PREFERENCIAS_FILE = os.path.join(DATA_DIR, 'preferencias.json')

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
CORS(app)

# ── Inicializar datos Moscow si no existen ──
_moscow_data = os.path.join(DATA_DIR, 'moscow')
os.makedirs(_moscow_data, exist_ok=True)
for _fname in ['proyectos.json', 'items.json']:
    _fpath = os.path.join(_moscow_data, _fname)
    if not os.path.exists(_fpath):
        with open(_fpath, 'w', encoding='utf-8') as _f:
            json.dump([], _f)

# ── Inicializar datos Lean Canvas si no existen ──
_lc_data = os.path.join(DATA_DIR, 'leancanvas')
os.makedirs(_lc_data, exist_ok=True)
for _fname in ['proyectos.json', 'versiones.json']:
    _fpath = os.path.join(_lc_data, _fname)
    if not os.path.exists(_fpath):
        with open(_fpath, 'w', encoding='utf-8') as _f:
            json.dump([], _f)

# ── Inicializar datos Kanban si no existen ──
_kanban_data = os.path.join(DATA_DIR, 'kanban')
os.makedirs(_kanban_data, exist_ok=True)
for _fname in ['proyectos.json', 'tareas.json']:
    _fpath = os.path.join(_kanban_data, _fname)
    if not os.path.exists(_fpath):
        with open(_fpath, 'w', encoding='utf-8') as _f:
            json.dump([], _f)

# ── Inicializar datos Hub si no existen ──
_hub_data = os.path.join(DATA_DIR, 'hub')
os.makedirs(_hub_data, exist_ok=True)
for _fname in ['proyectos.json']:
    _fpath = os.path.join(_hub_data, _fname)
    if not os.path.exists(_fpath):
        with open(_fpath, 'w', encoding='utf-8') as _f:
            json.dump([], _f)

# ── Inicializar datos Diagramas si no existen ──
_diag_data = os.path.join(DATA_DIR, 'diagramas')
os.makedirs(_diag_data, exist_ok=True)
_diag_file = os.path.join(_diag_data, 'proyectos.json')
if not os.path.exists(_diag_file):
    with open(_diag_file, 'w', encoding='utf-8') as _f:
        json.dump([], _f)

# ── Inicializar datos DBDiagramas si no existen ──
_db_data = os.path.join(DATA_DIR, 'dbdiagrams')
os.makedirs(_db_data, exist_ok=True)
_db_file = os.path.join(_db_data, 'proyectos.json')
if not os.path.exists(_db_file):
    with open(_db_file, 'w', encoding='utf-8') as _f:
        json.dump([], _f)

# ── Inicializar datos Casos de Uso si no existen ──
_uc_data = os.path.join(DATA_DIR, 'casosdeuso')
os.makedirs(_uc_data, exist_ok=True)
_uc_file = os.path.join(_uc_data, 'proyectos.json')
if not os.path.exists(_uc_file):
    with open(_uc_file, 'w', encoding='utf-8') as _f:
        json.dump([], _f)

# ── Inicializar datos Lluvia de Ideas si no existen ──
_li_data = os.path.join(DATA_DIR, 'lluviadeideas')
os.makedirs(_li_data, exist_ok=True)
if not os.path.exists(os.path.join(_li_data, 'sesiones.json')):
    with open(os.path.join(_li_data, 'sesiones.json'), 'w', encoding='utf-8') as _f:
        json.dump([], _f)

# ── Inicializar datos Requerimientos si no existen ──
_req_data = os.path.join(DATA_DIR, 'requerimientos')
os.makedirs(_req_data, exist_ok=True)
for _fname in ['requerimientos.json', 'historial.json']:
    _fpath = os.path.join(_req_data, _fname)
    if not os.path.exists(_fpath):
        with open(_fpath, 'w', encoding='utf-8') as _f:
            json.dump([], _f)

# ── Inicializar datos FODA si no existen ──
_foda_data = os.path.join(DATA_DIR, 'foda')
os.makedirs(_foda_data, exist_ok=True)
for _fname in ['proyectos.json', 'items.json']:
    _fpath = os.path.join(_foda_data, _fname)
    if not os.path.exists(_fpath):
        with open(_fpath, 'w', encoding='utf-8') as _f:
            json.dump([], _f)

# ─────────────────────────────────────────────
# API — Global Stats
# ─────────────────────────────────────────────
@app.route('/api/global/stats', methods=['GET'])
def global_stats():
    # Hub
    hub_ps = mod_hub_proyectos.listar_proyectos()
    total_proyectos = len(hub_ps)
    total_nodos = sum(len(p.get('nodos', [])) for p in hub_ps)
    
    # Eisenhower
    eis_ps = mod_proyectos.listar_proyectos()
    total_tareas = 0
    tareas_urgentes = 0
    for p in eis_ps:
        tareas = mod_tareas.listar_tareas(p['id'])
        total_tareas += len(tareas)
        tareas_urgentes += sum(1 for t in tareas if t['cuadrante'] == 'importante_urgente')
        
    # MoSCoW
    mos_ps = mod_moscow_proyectos.listar_proyectos()
    total_reqs = 0
    reqs_must = 0
    for p in mos_ps:
        items = mod_moscow_items.listar_items(p['id'])
        total_reqs += len(items)
        reqs_must += sum(1 for i in items if i['columna'] == 'must')
        
    return jsonify({
        'proyectos_activos': total_proyectos,
        'documentos_creados': total_nodos,
        'tareas_totales': total_tareas,
        'tareas_urgentes': tareas_urgentes,
        'requisitos_totales': total_reqs,
        'requisitos_must': reqs_must
    })

# ─────────────────────────────────────────────
# Servir frontend
# ─────────────────────────────────────────────

@app.route('/')
def home():
    return send_from_directory(FRONTEND_DIR, 'home.html')

# ─────────────────────────────────────────────
# Frontend — FODA
# ─────────────────────────────────────────────
@app.route('/foda/seleccion')
def foda_seleccion():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'foda'), 'seleccion.html')

@app.route('/foda/matriz')
def foda_matriz():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'foda'), 'index.html')

@app.route('/foda/css/<path:filename>')
def css_foda(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'foda', 'css'), filename)
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return resp

@app.route('/foda/js/<path:filename>')
def js_foda(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'foda', 'js'), filename)
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return resp

@app.route('/eisenhower/seleccion')
def seleccion():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'eisenhower'), 'seleccion.html')

@app.route('/eisenhower/matriz')
def matriz():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'eisenhower'), 'index.html')

@app.route('/eisenhower/estadisticas')
def estadisticas():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'eisenhower'), 'estadisticas.html')

# Archivos estáticos del frontend (css, js, etc.)
@app.route('/css/<path:filename>')
def css_home(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'css'), filename)
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return resp

@app.route('/js/<path:filename>')
def js_home(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'js'), filename)
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return resp

@app.route('/eisenhower/css/<path:filename>')
def css_eisenhower(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'eisenhower', 'css'), filename)
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return resp

@app.route('/eisenhower/js/<path:filename>')
def js_eisenhower(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'eisenhower', 'js'), filename)
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return resp


# ─────────────────────────────────────────────
# API — Preferencias
# ─────────────────────────────────────────────

@app.route('/api/preferencias', methods=['GET'])
def get_preferencias():
    with open(PREFERENCIAS_FILE, 'r', encoding='utf-8') as f:
        return jsonify(json.load(f))

@app.route('/api/preferencias', methods=['PUT'])
def put_preferencias():
    with open(PREFERENCIAS_FILE, 'r', encoding='utf-8') as f:
        prefs = json.load(f)
    prefs.update(request.json)
    with open(PREFERENCIAS_FILE, 'w', encoding='utf-8') as f:
        json.dump(prefs, f, ensure_ascii=False, indent=2)
    return jsonify(prefs)


# ─────────────────────────────────────────────
# API — Proyectos Eisenhower
# ─────────────────────────────────────────────

@app.route('/api/eisenhower/proyectos', methods=['GET'])
def get_proyectos():
    return jsonify(mod_proyectos.listar_proyectos())

@app.route('/api/eisenhower/proyectos', methods=['POST'])
def post_proyecto():
    data = request.json
    nuevo = mod_proyectos.crear_proyecto(data['titulo'], data.get('descripcion', ''))
    return jsonify(nuevo), 201

@app.route('/api/eisenhower/proyectos/<proyecto_id>', methods=['GET'])
def get_proyecto(proyecto_id):
    p = mod_proyectos.obtener_proyecto(proyecto_id)
    if not p:
        return jsonify({'error': 'Proyecto no encontrado'}), 404
    return jsonify(p)

@app.route('/api/eisenhower/proyectos/<proyecto_id>', methods=['PUT'])
def put_proyecto(proyecto_id):
    actualizado = mod_proyectos.actualizar_proyecto(proyecto_id, request.json)
    if not actualizado:
        return jsonify({'error': 'Proyecto no encontrado'}), 404
    return jsonify(actualizado)

@app.route('/api/eisenhower/proyectos/<proyecto_id>', methods=['DELETE'])
def delete_proyecto(proyecto_id):
    ok = mod_proyectos.eliminar_proyecto(proyecto_id)
    if not ok:
        return jsonify({'error': 'Proyecto no encontrado'}), 404
    return jsonify({'mensaje': 'Proyecto eliminado'})

@app.route('/api/eisenhower/proyectos/<proyecto_id>/exportar', methods=['GET'])
def exportar_proyecto(proyecto_id):
    p = mod_proyectos.obtener_proyecto(proyecto_id)
    if not p:
        return jsonify({'error': 'Proyecto no encontrado'}), 404
    tareas = mod_tareas.listar_tareas(proyecto_id)
    return jsonify({
        'proyecto': p,
        'tareas': tareas
    })

@app.route('/api/eisenhower/proyectos/importar', methods=['POST'])
def importar_proyecto():
    data = request.json
    if not data or 'proyecto' not in data or 'tareas' not in data:
        return jsonify({'error': 'Formato inválido'}), 400
    
    nuevo_p = mod_proyectos.crear_proyecto(
        data['proyecto'].get('titulo', 'Proyecto Importado'), 
        data['proyecto'].get('descripcion', '')
    )
    nuevo_pid = nuevo_p['id']
    
    for t in data['tareas']:
        mod_tareas.crear_tarea(
            proyecto_id=nuevo_pid,
            titulo=t.get('titulo', 'Sin título'),
            descripcion=t.get('descripcion', ''),
            cuadrante=t.get('cuadrante', 'backlog'),
            prioridad=t.get('prioridad', 'media'),
            urgencia=t.get('urgencia', 'media'),
            importancia=t.get('importancia', 'media'),
            relacionadas=t.get('relacionadas', []),
            custom_id=t.get('id')
        )
    return jsonify({'mensaje': 'Importado', 'id': nuevo_pid}), 201
# ─────────────────────────────────────────────
# API — Tareas Eisenhower
# ─────────────────────────────────────────────

@app.route('/api/eisenhower/proyectos/<proyecto_id>/tareas', methods=['GET'])
def get_tareas(proyecto_id):
    return jsonify(mod_tareas.listar_tareas(proyecto_id))

@app.route('/api/eisenhower/proyectos/<proyecto_id>/tareas', methods=['POST'])
def post_tarea(proyecto_id):
    data = request.json
    nueva = mod_tareas.crear_tarea(
        proyecto_id=proyecto_id,
        titulo=data['titulo'],
        descripcion=data.get('descripcion', ''),
        cuadrante=data.get('cuadrante', 'importante_urgente'),
        prioridad=data.get('prioridad', 'media'),
        urgencia=data.get('urgencia', 'media'),
        importancia=data.get('importancia', 'media'),
        relacionadas=data.get('relacionadas', []),
        custom_id=data.get('id')
    )
    mod_historial.registrar(proyecto_id, nueva['id'], 'creada', f"Tarea '{nueva['titulo']}' creada en {nueva['cuadrante']}")
    return jsonify(nueva), 201

@app.route('/api/eisenhower/tareas/<tarea_id>', methods=['GET'])
def get_tarea(tarea_id):
    t = mod_tareas.obtener_tarea(tarea_id)
    if not t:
        return jsonify({'error': 'Tarea no encontrada'}), 404
    return jsonify(t)

@app.route('/api/eisenhower/tareas/<tarea_id>', methods=['PUT'])
def put_tarea(tarea_id):
    tarea_anterior = mod_tareas.obtener_tarea(tarea_id)
    actualizada = mod_tareas.actualizar_tarea(tarea_id, request.json)
    if not actualizada:
        return jsonify({'error': 'Tarea no encontrada'}), 404
    # Registrar historial si cambió de cuadrante
    if tarea_anterior and 'cuadrante' in request.json:
        if tarea_anterior['cuadrante'] != request.json['cuadrante']:
            mod_historial.registrar(
                actualizada['proyecto_id'], tarea_id, 'movio_cuadrante',
                f"de '{tarea_anterior['cuadrante']}' a '{actualizada['cuadrante']}'"
            )
        else:
            mod_historial.registrar(actualizada['proyecto_id'], tarea_id, 'editada', 'Tarea actualizada')
    return jsonify(actualizada)

@app.route('/api/eisenhower/tareas/<tarea_id>', methods=['DELETE'])
def delete_tarea(tarea_id):
    tarea = mod_tareas.obtener_tarea(tarea_id)
    ok = mod_tareas.eliminar_tarea(tarea_id)
    if not ok:
        return jsonify({'error': 'Tarea no encontrada'}), 404
    if tarea:
        mod_historial.registrar(tarea['proyecto_id'], tarea_id, 'eliminada', f"Tarea '{tarea['titulo']}' eliminada")
    return jsonify({'mensaje': 'Tarea eliminada'})

@app.route('/api/eisenhower/proyectos/<proyecto_id>/tareas/reordenar', methods=['PUT'])
def reordenar_tareas(proyecto_id):
    data = request.json
    mod_tareas.reordenar_tareas(proyecto_id, data['cuadrante'], data['ids'])
    return jsonify({'mensaje': 'Reordenado correctamente'})


# ─────────────────────────────────────────────
# API — Historial Eisenhower
# ─────────────────────────────────────────────

@app.route('/api/eisenhower/proyectos/<proyecto_id>/historial', methods=['GET'])
def get_historial(proyecto_id):
    limite = int(request.args.get('limite', 100))
    return jsonify(mod_historial.listar_historial(proyecto_id, limite))

@app.route('/api/eisenhower/proyectos/<proyecto_id>/historial', methods=['DELETE'])
def delete_historial(proyecto_id):
    mod_historial.limpiar_historial(proyecto_id)
    return jsonify({'mensaje': 'Historial limpiado'})


# ─────────────────────────────────────────────
# Estadísticas
# ─────────────────────────────────────────────

@app.route('/api/eisenhower/proyectos/<proyecto_id>/estadisticas', methods=['GET'])
def get_estadisticas(proyecto_id):
    tareas = mod_tareas.listar_tareas(proyecto_id)
    cuadrantes = ['importante_urgente', 'importante_no_urgente', 'no_importante_urgente', 'no_importante_no_urgente']
    stats = {
        'total': len(tareas),
        'completadas': sum(1 for t in tareas if t.get('completada')),
        'pendientes': sum(1 for t in tareas if not t.get('completada')),
        'por_cuadrante': {c: sum(1 for t in tareas if t['cuadrante'] == c) for c in cuadrantes},
        'completadas_por_cuadrante': {
            c: sum(1 for t in tareas if t['cuadrante'] == c and t.get('completada')) for c in cuadrantes
        }
    }
    return jsonify(stats)


# ─────────────────────────────────────────────
# Arranque
# ─────────────────────────────────────────────

# ─────────────────────────────────────────────
# MoSCoW — Frontend
# ─────────────────────────────────────────────

@app.route('/moscow/seleccion')
def moscow_seleccion():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'moscow'), 'seleccion.html')

@app.route('/moscow/matriz')
def moscow_matriz():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'moscow'), 'index.html')

@app.route('/moscow/css/<path:filename>')
def css_moscow(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'moscow', 'css'), filename)
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return resp

@app.route('/moscow/js/<path:filename>')
def js_moscow(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'moscow', 'js'), filename)
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return resp


# ─────────────────────────────────────────────
# MoSCoW — API Proyectos
# ─────────────────────────────────────────────

@app.route('/api/moscow/proyectos', methods=['GET'])
def moscow_get_proyectos():
    return jsonify(mod_moscow_proyectos.listar_proyectos())

@app.route('/api/moscow/proyectos', methods=['POST'])
def moscow_post_proyecto():
    data = request.json
    nuevo = mod_moscow_proyectos.crear_proyecto(data['titulo'], data.get('descripcion', ''))
    return jsonify(nuevo), 201

@app.route('/api/moscow/proyectos/<proyecto_id>', methods=['GET'])
def moscow_get_proyecto(proyecto_id):
    p = mod_moscow_proyectos.obtener_proyecto(proyecto_id)
    if not p: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(p)

@app.route('/api/moscow/proyectos/<proyecto_id>', methods=['PUT'])
def moscow_put_proyecto(proyecto_id):
    act = mod_moscow_proyectos.actualizar_proyecto(proyecto_id, request.json)
    if not act: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(act)

@app.route('/api/moscow/proyectos/<proyecto_id>', methods=['DELETE'])
def moscow_delete_proyecto(proyecto_id):
    ok = mod_moscow_proyectos.eliminar_proyecto(proyecto_id)
    if not ok: return jsonify({'error': 'No encontrado'}), 404
    return jsonify({'mensaje': 'Proyecto eliminado'})

@app.route('/api/moscow/proyectos/<proyecto_id>/exportar', methods=['GET'])
def moscow_exportar_proyecto(proyecto_id):
    p = mod_moscow_proyectos.obtener_proyecto(proyecto_id)
    if not p: return jsonify({'error': 'No encontrado'}), 404
    return jsonify({'proyecto': p, 'items': mod_moscow_items.listar_items(proyecto_id)})

@app.route('/api/moscow/proyectos/importar', methods=['POST'])
def moscow_importar_proyecto():
    data = request.json
    if not data or 'proyecto' not in data or 'items' not in data:
        return jsonify({'error': 'Formato inválido'}), 400
    nuevo_p = mod_moscow_proyectos.crear_proyecto(
        data['proyecto'].get('titulo', 'Proyecto Importado'),
        data['proyecto'].get('descripcion', '')
    )
    for i in data['items']:
        mod_moscow_items.crear_item(
            proyecto_id=nuevo_p['id'],
            titulo=i.get('titulo', 'Sin título'),
            descripcion=i.get('descripcion', ''),
            columna=i.get('columna', 'must'),
            prioridad=i.get('prioridad', 'media'),
            esfuerzo=i.get('esfuerzo', 'medio'),
            tipo=i.get('tipo', 'feature'),
            relacionados=i.get('relacionados', []),
            custom_id=i.get('id')
        )
    return jsonify({'mensaje': 'Importado', 'id': nuevo_p['id']}), 201


# ─────────────────────────────────────────────
# MoSCoW — API Ítems
# ─────────────────────────────────────────────

@app.route('/api/moscow/proyectos/<proyecto_id>/items', methods=['GET'])
def moscow_get_items(proyecto_id):
    return jsonify(mod_moscow_items.listar_items(proyecto_id))

@app.route('/api/moscow/proyectos/<proyecto_id>/items', methods=['POST'])
def moscow_post_item(proyecto_id):
    data = request.json
    nuevo = mod_moscow_items.crear_item(
        proyecto_id=proyecto_id,
        titulo=data['titulo'],
        descripcion=data.get('descripcion', ''),
        columna=data.get('columna', 'must'),
        prioridad=data.get('prioridad', 'media'),
        esfuerzo=data.get('esfuerzo', 'medio'),
        tipo=data.get('tipo', 'feature'),
        relacionados=data.get('relacionados', []),
        custom_id=data.get('id')
    )
    return jsonify(nuevo), 201

@app.route('/api/moscow/items/<item_id>', methods=['GET'])
def moscow_get_item(item_id):
    i = mod_moscow_items.obtener_item(item_id)
    if not i: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(i)

@app.route('/api/moscow/items/<item_id>', methods=['PUT'])
def moscow_put_item(item_id):
    act = mod_moscow_items.actualizar_item(item_id, request.json)
    if not act: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(act)

@app.route('/api/moscow/items/<item_id>', methods=['DELETE'])
def moscow_delete_item(item_id):
    ok = mod_moscow_items.eliminar_item(item_id)
    if not ok: return jsonify({'error': 'No encontrado'}), 404
    return jsonify({'mensaje': 'Ítem eliminado'})

@app.route('/api/moscow/proyectos/<proyecto_id>/items/reordenar', methods=['PUT'])
def moscow_reordenar_items(proyecto_id):
    data = request.json
    mod_moscow_items.reordenar_items(proyecto_id, data['columna'], data['ids'])
    return jsonify({'mensaje': 'Reordenado'})

@app.route('/api/moscow/proyectos/<proyecto_id>/resumen', methods=['GET'])
def moscow_resumen(proyecto_id):
    items = mod_moscow_items.listar_items(proyecto_id)
    total = len(items)
    cols  = ['must', 'should', 'could', 'wont']
    return jsonify({
        'total': total,
        'por_columna': {c: sum(1 for i in items if i['columna'] == c) for c in cols}
    })

# ─────────────────────────────────────────────
# Lean Canvas — Frontend
# ─────────────────────────────────────────────

@app.route('/leancanvas/seleccion')
def leancanvas_seleccion():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'leancanvas'), 'seleccion.html')

@app.route('/leancanvas/canvas')
def leancanvas_canvas():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'leancanvas'), 'index.html')

@app.route('/leancanvas/css/<path:filename>')
def css_leancanvas(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'leancanvas', 'css'), filename)
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return resp

@app.route('/leancanvas/js/<path:filename>')
def js_leancanvas(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'leancanvas', 'js'), filename)
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return resp

# ─────────────────────────────────────────────
# Lean Canvas — API
# ─────────────────────────────────────────────

@app.route('/api/leancanvas/proyectos', methods=['GET'])
def lc_get_proyectos():
    return jsonify(mod_lc_proyectos.listar_proyectos())

@app.route('/api/leancanvas/proyectos', methods=['POST'])
def lc_post_proyecto():
    data = request.json
    nuevo = mod_lc_proyectos.crear_proyecto(data['titulo'], data.get('descripcion', ''))
    return jsonify(nuevo), 201

@app.route('/api/leancanvas/proyectos/<proyecto_id>', methods=['GET'])
def lc_get_proyecto(proyecto_id):
    p = mod_lc_proyectos.obtener_proyecto(proyecto_id)
    if not p: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(p)

@app.route('/api/leancanvas/proyectos/<proyecto_id>', methods=['PUT'])
def lc_put_proyecto(proyecto_id):
    act = mod_lc_proyectos.actualizar_proyecto(proyecto_id, request.json)
    if not act: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(act)

@app.route('/api/leancanvas/proyectos/<proyecto_id>', methods=['DELETE'])
def lc_delete_proyecto(proyecto_id):
    ok = mod_lc_proyectos.eliminar_proyecto(proyecto_id)
    if not ok: return jsonify({'error': 'No encontrado'}), 404
    mod_lc_versiones.eliminar_todas_proyecto(proyecto_id)
    return jsonify({'mensaje': 'Proyecto eliminado'})

@app.route('/api/leancanvas/proyectos/<proyecto_id>/versiones', methods=['GET'])
def lc_get_versiones(proyecto_id):
    return jsonify(mod_lc_versiones.listar_versiones(proyecto_id))

@app.route('/api/leancanvas/proyectos/<proyecto_id>/versiones', methods=['POST'])
def lc_post_version(proyecto_id):
    data = request.json
    nuevo = mod_lc_versiones.crear_version(proyecto_id, data['nombre'], data['canvas'])
    return jsonify(nuevo), 201

@app.route('/api/leancanvas/versiones/<version_id>', methods=['GET'])
def lc_get_version(version_id):
    v = mod_lc_versiones.obtener_version(version_id)
    if not v: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(v)

@app.route('/api/leancanvas/versiones/<version_id>', methods=['PUT'])
def lc_put_version(version_id):
    act = mod_lc_versiones.actualizar_version(version_id, request.json.get('canvas', {}))
    if not act: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(act)

@app.route('/api/leancanvas/versiones/<version_id>', methods=['DELETE'])
def lc_delete_version(version_id):
    ok = mod_lc_versiones.eliminar_version(version_id)
    if not ok: return jsonify({'error': 'No encontrado'}), 404
    return jsonify({'mensaje': 'Version eliminada'})

@app.route('/api/leancanvas/proyectos/<proyecto_id>/exportar', methods=['GET'])
def lc_exportar(proyecto_id):
    p = mod_lc_proyectos.obtener_proyecto(proyecto_id)
    if not p: return jsonify({'error': 'No encontrado'}), 404
    versiones = mod_lc_versiones.listar_versiones(proyecto_id)
    return jsonify({
        'version_export': '1.0',
        'modulo': 'leancanvas',
        'proyecto': p,
        'versiones': versiones
    })

@app.route('/api/leancanvas/proyectos/importar', methods=['POST'])
def lc_importar():
    import uuid
    data = request.json
    if not data or data.get('modulo') != 'leancanvas':
        return jsonify({'error': 'Archivo inválido'}), 400
    
    nuevo_pid = 'lc' + str(uuid.uuid4())[:8]
    p_data = data['proyecto']
    
    p_data['id'] = nuevo_pid
    p_data['titulo'] = p_data.get('titulo', 'Importado') + ' (Importado)'
    
    datos = mod_lc_proyectos._cargar()
    datos.append(p_data)
    mod_lc_proyectos._guardar(datos)
    
    versiones = data.get('versiones', [])
    v_datos = mod_lc_versiones._cargar()
    for v in versiones:
        v['id'] = 'v' + str(uuid.uuid4())[:8]
        v['proyecto_id'] = nuevo_pid
        v_datos.append(v)
    mod_lc_versiones._guardar(v_datos)
        
    return jsonify({'id': nuevo_pid})

# ─────────────────────────────────────────────
# Kanban — Frontend
# ─────────────────────────────────────────────

@app.route('/kanban/seleccion')
def kanban_seleccion():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'kanban'), 'seleccion.html')

@app.route('/kanban/tablero')
@app.route('/kanban/matriz') # Alias por si el navegador guardó caché
def kanban_tablero():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'kanban'), 'index.html')

@app.route('/kanban/css/<path:filename>')
def css_kanban(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'kanban', 'css'), filename)
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return resp

@app.route('/kanban/js/<path:filename>')
def js_kanban(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'kanban', 'js'), filename)
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return resp

# ─────────────────────────────────────────────
# Kanban — API Proyectos
# ─────────────────────────────────────────────

@app.route('/api/kanban/proyectos', methods=['GET'])
def kanban_get_proyectos():
    return jsonify(mod_kanban_proyectos.listar_proyectos())

@app.route('/api/kanban/proyectos', methods=['POST'])
def kanban_post_proyecto():
    data = request.json
    nuevo = mod_kanban_proyectos.crear_proyecto(data['titulo'], data.get('descripcion', ''))
    return jsonify(nuevo), 201

@app.route('/api/kanban/proyectos/<proyecto_id>', methods=['GET'])
def kanban_get_proyecto(proyecto_id):
    p = mod_kanban_proyectos.obtener_proyecto(proyecto_id)
    if not p: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(p)

@app.route('/api/kanban/proyectos/<proyecto_id>', methods=['PUT'])
def kanban_put_proyecto(proyecto_id):
    act = mod_kanban_proyectos.actualizar_proyecto(proyecto_id, request.json)
    if not act: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(act)

@app.route('/api/kanban/proyectos/<proyecto_id>', methods=['DELETE'])
def kanban_delete_proyecto(proyecto_id):
    ok = mod_kanban_proyectos.eliminar_proyecto(proyecto_id)
    if not ok: return jsonify({'error': 'No encontrado'}), 404
    return jsonify({'mensaje': 'Proyecto eliminado'})

@app.route('/api/kanban/proyectos/<proyecto_id>/exportar', methods=['GET'])
def kanban_exportar_proyecto(proyecto_id):
    p = mod_kanban_proyectos.obtener_proyecto(proyecto_id)
    if not p: return jsonify({'error': 'No encontrado'}), 404
    return jsonify({'proyecto': p, 'tareas': mod_kanban_tareas.listar_tareas(proyecto_id)})

# ─────────────────────────────────────────────
# Kanban — API Tareas
# ─────────────────────────────────────────────

@app.route('/api/kanban/proyectos/<proyecto_id>/tareas', methods=['GET'])
def kanban_get_tareas(proyecto_id):
    return jsonify(mod_kanban_tareas.listar_tareas(proyecto_id))

@app.route('/api/kanban/proyectos/<proyecto_id>/tareas', methods=['POST'])
def kanban_post_tarea(proyecto_id):
    data = request.json
    nueva = mod_kanban_tareas.crear_tarea(
        proyecto_id=proyecto_id,
        titulo=data['titulo'],
        descripcion=data.get('descripcion', ''),
        columna=data.get('columna', 'backlog'),
        prioridad=data.get('prioridad', 'media'),
        esfuerzo=data.get('esfuerzo', 'medio'),
        tipo=data.get('tipo', 'feature'),
        relacionados=data.get('relacionados', []),
        custom_id=data.get('id')
    )
    return jsonify(nueva), 201

@app.route('/api/kanban/tareas/<tarea_id>', methods=['GET'])
def kanban_get_tarea(tarea_id):
    t = mod_kanban_tareas.obtener_tarea(tarea_id)
    if not t: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(t)

@app.route('/api/kanban/tareas/<tarea_id>', methods=['PUT'])
def kanban_put_tarea(tarea_id):
    act = mod_kanban_tareas.actualizar_tarea(tarea_id, request.json)
    if not act: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(act)

@app.route('/api/kanban/tareas/<tarea_id>', methods=['DELETE'])
def kanban_delete_tarea(tarea_id):
    ok = mod_kanban_tareas.eliminar_tarea(tarea_id)
    if not ok: return jsonify({'error': 'No encontrado'}), 404
    return jsonify({'mensaje': 'Tarea eliminada'})

@app.route('/api/kanban/proyectos/<proyecto_id>/tareas/reordenar', methods=['PUT'])
def kanban_reordenar_tareas(proyecto_id):
    data = request.json
    mod_kanban_tareas.reordenar_tareas(proyecto_id, data['columna'], data['ids'])
    return jsonify({'mensaje': 'Reordenado'})

@app.route('/api/kanban/proyectos/<proyecto_id>/resumen', methods=['GET'])
def kanban_resumen(proyecto_id):
    tareas = mod_kanban_tareas.listar_tareas(proyecto_id)
    total = len(tareas)
    cols  = ['backlog', 'progreso', 'pruebas', 'terminado']
    return jsonify({
        'total': total,
        'por_columna': {c: sum(1 for t in tareas if t['columna'] == c) for c in cols}
    })

# ─────────────────────────────────────────────
# Hub de Proyectos — Frontend
# ─────────────────────────────────────────────

@app.route('/hub/seleccion')
def hub_seleccion():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'hub'), 'seleccion.html')

@app.route('/hub/board')
def hub_board():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'hub'), 'index.html')

@app.route('/hub/css/<path:filename>')
def css_hub(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'hub', 'css'), filename)
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return resp

@app.route('/hub/js/<path:filename>')
def js_hub(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'hub', 'js'), filename)
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return resp

# ─────────────────────────────────────────────
# Hub de Proyectos — API
# ─────────────────────────────────────────────

@app.route('/api/hub/proyectos', methods=['GET'])
def hub_get_proyectos():
    return jsonify(mod_hub_proyectos.listar_proyectos())

@app.route('/api/hub/proyectos', methods=['POST'])
def hub_post_proyecto():
    data = request.json
    nuevo = mod_hub_proyectos.crear_proyecto(data['titulo'], data.get('descripcion', ''))
    return jsonify(nuevo), 201

@app.route('/api/hub/proyectos/<proyecto_id>', methods=['GET'])
def hub_get_proyecto(proyecto_id):
    p = mod_hub_proyectos.obtener_proyecto(proyecto_id)
    if not p: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(p)

@app.route('/api/hub/proyectos/<proyecto_id>', methods=['DELETE'])
def hub_delete_proyecto(proyecto_id):
    ok = mod_hub_proyectos.eliminar_proyecto(proyecto_id)
    if not ok: return jsonify({'error': 'No encontrado'}), 404
    return jsonify({'mensaje': 'Proyecto eliminado'})

@app.route('/api/hub/proyectos/<proyecto_id>/dossier', methods=['GET'])
def hub_get_dossier(proyecto_id):
    hub_p = mod_hub_proyectos.obtener_proyecto(proyecto_id)
    if not hub_p: return jsonify({'error': 'No encontrado'}), 404

    eis_p = mod_proyectos.obtener_proyecto(proyecto_id)
    eis_t = mod_tareas.listar_tareas(proyecto_id) if eis_p else []
    
    mos_p = mod_moscow_proyectos.obtener_proyecto(proyecto_id)
    mos_i = mod_moscow_items.listar_items(proyecto_id) if mos_p else []
    
    lc_p = mod_lc_proyectos.obtener_proyecto(proyecto_id)
    
    kb_p = mod_kanban_proyectos.obtener_proyecto(proyecto_id)
    kb_t = mod_kanban_tareas.listar_tareas(proyecto_id) if kb_p else []

    return jsonify({
        'hub': hub_p,
        'eisenhower': {'proyecto': eis_p, 'tareas': eis_t},
        'moscow': {'proyecto': mos_p, 'items': mos_i},
        'leancanvas': {'proyecto': lc_p},
        'kanban': {'proyecto': kb_p, 'tareas': kb_t}
    })

@app.route('/api/hub/proyectos/<proyecto_id>/exportar', methods=['GET'])
def hub_exportar_proyecto(proyecto_id):
    import os, json
    
    hub_p = mod_hub_proyectos.obtener_proyecto(proyecto_id)
    if not hub_p: return jsonify({'error': 'No encontrado'}), 404

    export_data = {
        'version': '1.0',
        'id_original': proyecto_id,
        'hub': hub_p,
        'modulos': {}
    }

    # Leer todos los módulos y recolectar sus datos vinculados a este proyecto_id
    modulos = ['eisenhower', 'moscow', 'leancanvas', 'kanban', 'diagramas', 'dbdiagrams', 'casosdeuso']
    for mod in modulos:
        mod_dir = os.path.join(DATA_DIR, mod)
        if not os.path.exists(mod_dir): continue
        export_data['modulos'][mod] = {}
        for fname in os.listdir(mod_dir):
            if fname.endswith('.json'):
                with open(os.path.join(mod_dir, fname), 'r', encoding='utf-8') as f:
                    try:
                        items = json.load(f)
                    except:
                        items = []
                if fname == 'proyectos.json':
                    filtrados = [i for i in items if i.get('id') == proyecto_id]
                else:
                    filtrados = [i for i in items if i.get('proyecto_id') == proyecto_id]
                
                export_data['modulos'][mod][fname] = filtrados

    return jsonify(export_data)

@app.route('/api/hub/proyectos/importar', methods=['POST'])
def hub_importar_proyecto():
    import os, json, uuid
    data = request.json
    if not data or 'hub' not in data:
        return jsonify({'error': 'Formato inválido'}), 400
    
    nuevo_pid = 'p' + str(uuid.uuid4())[:8]
    old_pid = data.get('id_original', data['hub'].get('id'))

    def replace_id(obj):
        if isinstance(obj, dict):
            new_obj = {}
            for k, v in obj.items():
                if k == 'id' and v == old_pid:
                    new_obj[k] = nuevo_pid
                elif k == 'proyecto_id' and v == old_pid:
                    new_obj[k] = nuevo_pid
                else:
                    new_obj[k] = replace_id(v)
            return new_obj
        elif isinstance(obj, list):
            return [replace_id(i) for i in obj]
        return obj

    # Importar hub
    hub_p = replace_id(data['hub'])
    hub_p['id'] = nuevo_pid
    hub_file = os.path.join(DATA_DIR, 'hub', 'proyectos.json')
    if os.path.exists(hub_file):
        with open(hub_file, 'r', encoding='utf-8') as f: hub_data = json.load(f)
    else: hub_data = []
    hub_data.append(hub_p)
    with open(hub_file, 'w', encoding='utf-8') as f: json.dump(hub_data, f, ensure_ascii=False, indent=2)

    # Importar modulos
    modulos_data = data.get('modulos', {})
    for mod, archivos in modulos_data.items():
        mod_dir = os.path.join(DATA_DIR, mod)
        os.makedirs(mod_dir, exist_ok=True)
        for fname, items in archivos.items():
            if not items: continue
            fpath = os.path.join(mod_dir, fname)
            if os.path.exists(fpath):
                with open(fpath, 'r', encoding='utf-8') as f: current = json.load(f)
            else: current = []
            
            items_procesados = replace_id(items)
            current.extend(items_procesados)
            
            with open(fpath, 'w', encoding='utf-8') as f:
                json.dump(current, f, ensure_ascii=False, indent=2)

    return jsonify({'mensaje': 'Proyecto importado', 'id': nuevo_pid}), 201

@app.route('/api/hub/proyectos/<proyecto_id>/nodos/<nodo_id>', methods=['PUT'])
def hub_put_nodo(proyecto_id, nodo_id):
    act = mod_hub_proyectos.actualizar_nodo(proyecto_id, nodo_id, request.json)
    if not act: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(act)

@app.route('/api/hub/proyectos/<proyecto_id>/nodos', methods=['POST'])
def hub_post_nodo(proyecto_id):
    data = request.json
    nuevo = mod_hub_proyectos.agregar_nodo(
        proyecto_id, 
        data['fase'], 
        data['titulo'], 
        data['tipo'],
        enlaces=data.get('enlaces', [])
    )
    if not nuevo: return jsonify({'error': 'Proyecto no encontrado'}), 404
    return jsonify(nuevo), 201

@app.route('/api/hub/proyectos/<proyecto_id>/nodos/<nodo_id>', methods=['DELETE'])
def hub_delete_nodo(proyecto_id, nodo_id):
    ok = mod_hub_proyectos.eliminar_nodo(proyecto_id, nodo_id)
    if not ok: return jsonify({'error': 'No encontrado'}), 404
    return jsonify({'mensaje': 'Nodo eliminado'})

# ─────────────────────────────────────────────
# DB Diagramas (Bases de Datos)
# ─────────────────────────────────────────────

@app.route('/dbdiagrams/seleccion')
def dbdiag_seleccion():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'dbdiagrams'), 'seleccion.html')

@app.route('/dbdiagrams/editor')
def dbdiag_editor():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'dbdiagrams'), 'index.html')

@app.route('/dbdiagrams/css/<path:filename>')
def css_dbdiag(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'dbdiagrams', 'css'), filename)
    resp.headers['Cache-Control'] = 'no-store'
    return resp

@app.route('/dbdiagrams/js/<path:filename>')
def js_dbdiag(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'dbdiagrams', 'js'), filename)
    resp.headers['Cache-Control'] = 'no-store'
    return resp

@app.route('/api/dbdiagrams/proyectos', methods=['GET'])
def dbdiag_get_proyectos():
    return jsonify(mod_dbdiagramas_proyectos.listar_proyectos())

@app.route('/api/dbdiagrams/proyectos', methods=['POST'])
def dbdiag_post_proyecto():
    data = request.json
    nuevo = mod_dbdiagramas_proyectos.crear_proyecto(data.get('titulo', 'Nuevo Proyecto'), data.get('descripcion', ''))
    return jsonify(nuevo), 201

@app.route('/api/dbdiagrams/proyectos/<pid>', methods=['GET'])
def dbdiag_get_proyecto(pid):
    p = mod_dbdiagramas_proyectos.obtener_proyecto(pid)
    if not p: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(p)

@app.route('/api/dbdiagrams/proyectos/<pid>', methods=['PUT'])
def dbdiag_put_proyecto(pid):
    act = mod_dbdiagramas_proyectos.actualizar_proyecto(pid, request.json)
    if not act: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(act)

@app.route('/api/dbdiagrams/proyectos/<pid>', methods=['DELETE'])
def dbdiag_delete_proyecto(pid):
    ok = mod_dbdiagramas_proyectos.eliminar_proyecto(pid)
    if not ok: return jsonify({'error': 'No encontrado'}), 404
    return jsonify({'mensaje': 'Eliminado'})

@app.route('/api/dbdiagrams/proyectos/<pid>/exportar', methods=['GET'])
def dbdiag_exportar_proyecto(pid):
    p = mod_dbdiagramas_proyectos.obtener_proyecto(pid)
    if not p: return jsonify({'error': 'No encontrado'}), 404
    return jsonify({'proyecto': p})

@app.route('/api/dbdiagrams/proyectos/importar', methods=['POST'])
def dbdiag_importar_proyecto():
    data = request.json
    if not data or 'proyecto' not in data:
        return jsonify({'error': 'Formato inválido'}), 400
    p_data = data['proyecto']
    nuevo = mod_dbdiagramas_proyectos.crear_proyecto(p_data.get('titulo', 'Importado'), p_data.get('descripcion', ''))
    if 'tablas' in p_data or 'relaciones' in p_data:
        mod_dbdiagramas_proyectos.actualizar_proyecto(nuevo['id'], {
            'tablas': p_data.get('tablas', []),
            'relaciones': p_data.get('relaciones', []),
            'posiciones': p_data.get('posiciones', {})
        })
    return jsonify({'mensaje': 'Importado', 'id': nuevo['id']}), 201

# ── Subida de Archivos ──
import werkzeug.utils

UPLOAD_DIR = os.path.join(DATA_DIR, 'hub', 'archivos')
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.route('/api/hub/proyectos/<proyecto_id>/upload', methods=['POST'])
def hub_upload_file(proyecto_id):
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    filename = werkzeug.utils.secure_filename(file.filename)
    import uuid
    uniq_name = f"{uuid.uuid4().hex[:8]}_{filename}"
    proj_dir = os.path.join(UPLOAD_DIR, proyecto_id)
    os.makedirs(proj_dir, exist_ok=True)
    file_path = os.path.join(proj_dir, uniq_name)
    file.save(file_path)
    
    url = f'/api/hub/proyectos/{proyecto_id}/archivos/{uniq_name}'
    return jsonify({'url': url, 'filename': filename})

@app.route('/api/hub/proyectos/<proyecto_id>/init_tool/<tool_name>', methods=['POST'])
def hub_init_tool(proyecto_id, tool_name):
    # Asegura que el proyecto exista en la herramienta destino
    p = mod_hub_proyectos.obtener_proyecto(proyecto_id)
    if not p: return jsonify({'error': 'Proyecto Hub no encontrado'}), 404
    
    titulo = p.get('titulo', 'Proyecto Enlazado')
    
    if tool_name == 'leancanvas':
        if not mod_lc_proyectos.obtener_proyecto(proyecto_id):
            mod_lc_proyectos.crear_proyecto(titulo)
            # Forzar el ID para que coincida (el método normal genera uno aleatorio)
            # Esto es un hack rápido, lo ideal sería modificar el crear_proyecto
            datos = mod_lc_proyectos._cargar()
            datos[-1]['id'] = proyecto_id
            mod_lc_proyectos._guardar(datos)
            
    elif tool_name == 'moscow':
        if not mod_moscow_proyectos.obtener_proyecto(proyecto_id):
            mod_moscow_proyectos.crear_proyecto(titulo, "")
            datos = mod_moscow_proyectos._cargar()
            datos[-1]['id'] = proyecto_id
            mod_moscow_proyectos._guardar(datos)
            
    elif tool_name == 'kanban':
        if not mod_kanban_proyectos.obtener_proyecto(proyecto_id):
            mod_kanban_proyectos.crear_proyecto(titulo, "")
            datos = mod_kanban_proyectos._cargar()
            datos[-1]['id'] = proyecto_id
            mod_kanban_proyectos._guardar(datos)
            
    # Asumiendo eisenhower ya tiene algo similar, si no, se deja pasar 
    # (Eisenhower fue tu otro proyecto, asumiré que sigue el mismo patrón _cargar/_guardar)
    elif tool_name == 'eisenhower':
        try:
            from herramientas.eisenhower import proyectos as mod_e_proyectos
            if not mod_e_proyectos.obtener_proyecto(proyecto_id):
                mod_e_proyectos.crear_proyecto(titulo)
                datos = mod_e_proyectos._cargar()
                datos[-1]['id'] = proyecto_id
                mod_e_proyectos._guardar(datos)
        except:
            pass # Si no existe o no tiene ese patrón
            
    elif tool_name == 'casosdeuso':
        if not mod_casos_proyectos.obtener_proyecto(proyecto_id):
            mod_casos_proyectos.crear_proyecto(titulo, "")
            datos = mod_casos_proyectos._cargar()
            datos[-1]['id'] = proyecto_id
            mod_casos_proyectos._guardar(datos)
            
    return jsonify({'status': 'ok'})

@app.route('/api/hub/proyectos/<proyecto_id>/archivos/<filename>')
def hub_get_file(proyecto_id, filename):
    return send_from_directory(os.path.join(UPLOAD_DIR, proyecto_id), filename)


# ─────────────────────────────────────────────
# Diagramas de Flujo — Frontend
# ─────────────────────────────────────────────

@app.route('/diagramas/seleccion')
def diagramas_seleccion():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'diagramas'), 'seleccion.html')

@app.route('/diagramas/editor')
def diagramas_editor():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'diagramas'), 'index.html')

@app.route('/diagramas/css/<path:filename>')
def css_diagramas(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'diagramas', 'css'), filename)
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return resp

@app.route('/diagramas/js/<path:filename>')
def js_diagramas(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'diagramas', 'js'), filename)
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return resp

# ─────────────────────────────────────────────
# Diagramas de Flujo — API
# ─────────────────────────────────────────────

@app.route('/api/diagramas/proyectos', methods=['GET'])
def diag_get_proyectos():
    return jsonify(mod_diagramas_proyectos.listar_proyectos())

@app.route('/api/diagramas/proyectos', methods=['POST'])
def diag_post_proyecto():
    data = request.json
    nuevo = mod_diagramas_proyectos.crear_proyecto(data['titulo'], data.get('descripcion', ''))
    return jsonify(nuevo), 201

@app.route('/api/diagramas/proyectos/<proyecto_id>', methods=['GET'])
def diag_get_proyecto(proyecto_id):
    p = mod_diagramas_proyectos.obtener_proyecto(proyecto_id)
    if not p: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(p)

@app.route('/api/diagramas/proyectos/<proyecto_id>', methods=['PUT'])
def diag_put_proyecto(proyecto_id):
    act = mod_diagramas_proyectos.actualizar_proyecto(proyecto_id, request.json)
    if not act: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(act)

@app.route('/api/diagramas/proyectos/<proyecto_id>', methods=['DELETE'])
def diag_delete_proyecto(proyecto_id):
    ok = mod_diagramas_proyectos.eliminar_proyecto(proyecto_id)
    if not ok: return jsonify({'error': 'No encontrado'}), 404
    return jsonify({'mensaje': 'Diagrama eliminado'})

@app.route('/api/diagramas/proyectos/<proyecto_id>/exportar', methods=['GET'])
def diag_exportar_proyecto(proyecto_id):
    p = mod_diagramas_proyectos.obtener_proyecto(proyecto_id)
    if not p: return jsonify({'error': 'No encontrado'}), 404
    return jsonify({'proyecto': p})

@app.route('/api/diagramas/proyectos/importar', methods=['POST'])
def diag_importar_proyecto():
    data = request.json
    if not data or 'proyecto' not in data:
        return jsonify({'error': 'Formato inválido'}), 400
    p_data = data['proyecto']
    nuevo = mod_diagramas_proyectos.crear_proyecto(p_data.get('titulo', 'Importado'), p_data.get('descripcion', ''))
    if 'nodos' in p_data or 'enlaces' in p_data:
        mod_diagramas_proyectos.actualizar_proyecto(nuevo['id'], {
            'nodos': p_data.get('nodos', []),
            'enlaces': p_data.get('enlaces', [])
        })
    return jsonify({'mensaje': 'Importado', 'id': nuevo['id']}), 201

# ─────────────────────────────────────────────
# Casos de Uso (UML)
# ─────────────────────────────────────────────

@app.route('/casosdeuso/seleccion')
def casosdeuso_seleccion():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'casosdeuso'), 'seleccion.html')

@app.route('/casosdeuso/editor')
def casosdeuso_editor():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'casosdeuso'), 'index.html')

@app.route('/casosdeuso/css/<path:filename>')
def css_casosdeuso(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'casosdeuso', 'css'), filename)
    resp.headers['Cache-Control'] = 'no-store'
    return resp

@app.route('/casosdeuso/js/<path:filename>')
def js_casosdeuso(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'casosdeuso', 'js'), filename)
    resp.headers['Cache-Control'] = 'no-store'
    return resp

@app.route('/api/casosdeuso/proyectos', methods=['GET'])
def uc_get_proyectos():
    return jsonify(mod_casos_proyectos.listar_proyectos())

@app.route('/api/casosdeuso/proyectos', methods=['POST'])
def uc_post_proyecto():
    data = request.json
    nuevo = mod_casos_proyectos.crear_proyecto(data.get('titulo', 'Nuevo Proyecto'), data.get('descripcion', ''))
    return jsonify(nuevo), 201

@app.route('/api/casosdeuso/proyectos/<pid>', methods=['GET'])
def uc_get_proyecto(pid):
    p = mod_casos_proyectos.obtener_proyecto(pid)
    if not p: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(p)

@app.route('/api/casosdeuso/proyectos/<pid>', methods=['PUT'])
def uc_put_proyecto(pid):
    act = mod_casos_proyectos.actualizar_proyecto(pid, request.json)
    if not act: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(act)

@app.route('/api/casosdeuso/proyectos/<pid>', methods=['DELETE'])
def uc_delete_proyecto(pid):
    ok = mod_casos_proyectos.eliminar_proyecto(pid)
    if not ok: return jsonify({'error': 'No encontrado'}), 404
    return jsonify({'mensaje': 'Eliminado'})

@app.route('/api/casosdeuso/proyectos/<pid>/exportar', methods=['GET'])
def uc_exportar_proyecto(pid):
    p = mod_casos_proyectos.obtener_proyecto(pid)
    if not p: return jsonify({'error': 'No encontrado'}), 404
    return jsonify({'proyecto': p})

@app.route('/api/casosdeuso/proyectos/importar', methods=['POST'])
def uc_importar_proyecto():
    data = request.json
    if not data or 'proyecto' not in data:
        return jsonify({'error': 'Formato inválido'}), 400
    p_data = data['proyecto']
    nuevo = mod_casos_proyectos.crear_proyecto(p_data.get('titulo', 'Importado'), p_data.get('descripcion', ''))
    if 'actores' in p_data or 'casos' in p_data:
        mod_casos_proyectos.actualizar_proyecto(nuevo['id'], {
            'actores': p_data.get('actores', []),
            'casos': p_data.get('casos', []),
            'relaciones': p_data.get('relaciones', []),
            'limites': p_data.get('limites', [])
        })
    return jsonify({'mensaje': 'Importado', 'id': nuevo['id']}), 201


# ─────────────────────────────────────────────
# Lluvia de Ideas
# ─────────────────────────────────────────────
@app.route('/lluviadeideas/seleccion')
def lluviadeideas_seleccion():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'lluviadeideas'), 'seleccion.html')

@app.route('/lluviadeideas/lienzo')
def lluviadeideas_lienzo():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'lluviadeideas'), 'index.html')

@app.route('/lluviadeideas')
def lluviadeideas_root():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'lluviadeideas'), 'seleccion.html')

@app.route('/lluviadeideas/css/<path:filename>')
def css_lluviadeideas(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'lluviadeideas', 'css'), filename)
    resp.headers['Cache-Control'] = 'no-store'
    return resp

@app.route('/lluviadeideas/js/<path:filename>')
def js_lluviadeideas(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'lluviadeideas', 'js'), filename)
    resp.headers['Cache-Control'] = 'no-store'
    return resp

@app.route('/api/lluviadeideas/sesiones', methods=['GET'])
def api_li_get_sesiones():
    return jsonify(mod_li_sesiones.listar_sesiones())

@app.route('/api/lluviadeideas/sesiones', methods=['POST'])
def api_li_post_sesiones():
    return jsonify(mod_li_sesiones.crear_sesion(request.json.get('titulo', 'Nueva sesión'))), 201

@app.route('/api/lluviadeideas/sesiones/<sid>', methods=['GET'])
def api_li_get_sesion(sid):
    s = mod_li_sesiones.obtener_sesion(sid)
    if not s: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(s)

@app.route('/api/lluviadeideas/sesiones/<sid>', methods=['PUT'])
def api_li_put_sesion(sid):
    s = mod_li_sesiones.actualizar_sesion(sid, request.json)
    if not s: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(s)

@app.route('/api/lluviadeideas/sesiones/<sid>', methods=['DELETE'])
def api_li_delete_sesion(sid):
    if mod_li_sesiones.eliminar_sesion(sid):
        return jsonify({'mensaje': 'Eliminado'})
    return jsonify({'error': 'No encontrado'}), 404

@app.route('/api/lluviadeideas/sesiones/<sid>/fusionar', methods=['POST'])
def api_li_fusionar(sid):
    data = request.json
    nuevo = mod_li_fusion.fusionar_nodos(sid, data.get('ids_nodos', []), data.get('nuevo_texto', 'Idea superadora'), data.get('categoria', 'producto'))
    if not nuevo: return jsonify({'error': 'Error en fusión'}), 400
    return jsonify(nuevo), 200

# ─────────────────────────────────────────────
# Toma de Requerimientos
# ─────────────────────────────────────────────
@app.route('/requerimientos/seleccion')
def requerimientos_seleccion():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'requerimientos'), 'seleccion.html')

@app.route('/requerimientos/listado')
def requerimientos_listado():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'requerimientos'), 'index.html')

@app.route('/requerimientos/trazabilidad')
def requerimientos_trazabilidad():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'requerimientos'), 'trazabilidad.html')

@app.route('/requerimientos')
def requerimientos_root():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'requerimientos'), 'seleccion.html')

@app.route('/requerimientos/css/<path:filename>')
def css_requerimientos(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'requerimientos', 'css'), filename)
    resp.headers['Cache-Control'] = 'no-store'
    return resp

@app.route('/requerimientos/js/<path:filename>')
def js_requerimientos(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'requerimientos', 'js'), filename)
    resp.headers['Cache-Control'] = 'no-store'
    return resp

@app.route('/api/requerimientos/proyectos', methods=['GET'])
def api_req_get_proyectos():
    return jsonify(mod_req_proyectos.listar_proyectos())

@app.route('/api/requerimientos/proyectos', methods=['POST'])
def api_req_post_proyectos():
    return jsonify(mod_req_proyectos.crear_proyecto(request.json.get('titulo', 'Nuevo Archivo'), request.json.get('descripcion', ''))), 201

@app.route('/api/requerimientos/proyectos/<pid>', methods=['GET'])
def api_req_get_proyecto(pid):
    p = mod_req_proyectos.obtener_proyecto(pid)
    if not p: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(p)

@app.route('/api/requerimientos/proyectos/<pid>', methods=['DELETE'])
def api_req_delete_proyecto(pid):
    if mod_req_proyectos.eliminar_proyecto(pid):
        return jsonify({'mensaje': 'Eliminado'})
    return jsonify({'error': 'No encontrado'}), 404

@app.route('/api/requerimientos', methods=['GET'])
def api_req_get():
    pid = request.args.get('pid')
    return jsonify(mod_req_reqs.listar_requerimientos(pid))

@app.route('/api/requerimientos', methods=['POST'])
def api_req_post():
    data = request.json
    nuevo = mod_req_reqs.crear_requerimiento(
        data['titulo'], data['descripcion'],
        data.get('tipo', 'funcional'), data.get('prioridad', 'media'),
        data.get('estado', 'borrador'), data.get('origen', ''),
        data.get('criterios_aceptacion', []),
        data.get('proyecto_id')
    )
    mod_req_historial.registrar(nuevo['id'], 'creacion', 'Requerimiento creado')
    return jsonify(nuevo), 201

@app.route('/api/requerimientos/<req_id>', methods=['GET'])
def api_req_get_one(req_id):
    r = mod_req_reqs.obtener_requerimiento(req_id)
    if not r: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(r)

@app.route('/api/requerimientos/<req_id>', methods=['PUT'])
def api_req_put(req_id):
    anterior = mod_req_reqs.obtener_requerimiento(req_id)
    r = mod_req_reqs.actualizar_requerimiento(req_id, request.json)
    if not r: return jsonify({'error': 'No encontrado'}), 404
    if anterior and anterior.get('estado') != r.get('estado'):
        mod_req_historial.registrar(req_id, 'cambio_estado', f"Estado cambió de {anterior.get('estado')} a {r.get('estado')}")
    else:
        mod_req_historial.registrar(req_id, 'actualizacion', 'Requerimiento actualizado')
    return jsonify(r)

@app.route('/api/requerimientos/<req_id>', methods=['DELETE'])
def api_req_delete(req_id):
    if mod_req_reqs.eliminar_requerimiento(req_id):
        return jsonify({'mensaje': 'Eliminado'})
    return jsonify({'error': 'No encontrado'}), 404

@app.route('/api/requerimientos/<req_id>/comentarios', methods=['POST'])
def api_req_post_comentario(req_id):
    r = mod_req_reqs.agregar_comentario(req_id, request.json.get('texto'))
    if not r: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(r), 201

@app.route('/api/requerimientos/<req_id>/historial', methods=['GET'])
def api_req_get_historial(req_id):
    return jsonify(mod_req_historial.listar_historial(req_id))

@app.route('/api/requerimientos_trazabilidad', methods=['GET'])
def api_req_trazabilidad():
    return jsonify(mod_req_trazabilidad.generar_matriz_trazabilidad())

# ─────────────────────────────────────────────
# Rutas HTML — Historias de Usuario
# ─────────────────────────────────────────────
@app.route('/historias')
@app.route('/historias/')
def html_historias_index():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'historias'), 'index.html')

@app.route('/historias/seleccion')
@app.route('/historias/seleccion.html')
def html_historias_seleccion():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'historias'), 'seleccion.html')

@app.route('/historias/css/<path:filename>')
def css_historias(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'historias', 'css'), filename)
    resp.headers['Cache-Control'] = 'no-store'
    return resp

@app.route('/historias/js/<path:filename>')
def js_historias(filename):
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'historias', 'js'), filename)
    resp.headers['Cache-Control'] = 'no-store'
    return resp

# ─────────────────────────────────────────────
# API — Historias de Usuario
# ─────────────────────────────────────────────
@app.route('/api/historias/proyectos', methods=['GET'])
def api_hu_get_proyectos():
    return jsonify(mod_hu_proyectos.listar_proyectos())

@app.route('/api/historias/proyectos', methods=['POST'])
def api_hu_post_proyectos():
    data = request.json
    return jsonify(mod_hu_proyectos.crear_proyecto(
        data.get('titulo', 'Nuevo Proyecto'),
        data.get('descripcion', '')
    )), 201

@app.route('/api/historias/proyectos/<pid>', methods=['GET'])
def api_hu_get_proyecto(pid):
    p = mod_hu_proyectos.obtener_proyecto(pid)
    if not p: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(p)

@app.route('/api/historias/proyectos/<pid>', methods=['DELETE'])
def api_hu_delete_proyecto(pid):
    if mod_hu_proyectos.eliminar_proyecto(pid):
        return jsonify({'mensaje': 'Eliminado'})
    return jsonify({'error': 'No encontrado'}), 404

@app.route('/api/historias', methods=['GET'])
def api_hu_get():
    pid = request.args.get('pid')
    return jsonify(mod_hu_historias.listar_historias(pid))

@app.route('/api/historias', methods=['POST'])
def api_hu_post():
    data = request.json
    nueva = mod_hu_historias.crear_historia(data.get('proyecto_id'), data)
    return jsonify(nueva), 201

@app.route('/api/historias/<hid>', methods=['GET'])
def api_hu_get_one(hid):
    h = mod_hu_historias.obtener_historia(hid)
    if not h: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(h)

@app.route('/api/historias/<hid>', methods=['PUT'])
def api_hu_put(hid):
    h = mod_hu_historias.actualizar_historia(hid, request.json)
    if not h: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(h)

@app.route('/api/historias/<hid>', methods=['DELETE'])
def api_hu_delete(hid):
    if mod_hu_historias.eliminar_historia(hid):
        return jsonify({'mensaje': 'Eliminado'})
    return jsonify({'error': 'No encontrado'}), 404

# ─────────────────────────────────────────────
# API — Sistema / Auto-actualización
# ─────────────────────────────────────────────

from updater import get_update_info, get_current_version, start_update_check
from host_manager import init_host_api

# Inicializar API de ngrok
init_host_api(app)

@app.route('/api/system/version', methods=['GET'])
def system_version():
    """Devuelve la versión actual instalada."""
    return jsonify({'version': get_current_version()})

@app.route('/api/system/update-status', methods=['GET'])
def system_update_status():
    """Devuelve el estado de la verificación de actualización."""
    return jsonify(get_update_info())


# ─────────────────────────────────────────────
# API — Análisis FODA
# ─────────────────────────────────────────────
@app.route('/api/foda/proyectos', methods=['GET'])
def get_foda_proyectos():
    return jsonify(mod_foda_proyectos.listar_proyectos())

@app.route('/api/foda/proyectos', methods=['POST'])
def post_foda_proyecto():
    data = request.json
    nuevo = mod_foda_proyectos.crear_proyecto(data.get('titulo', 'Sin título'), data.get('descripcion', ''))
    return jsonify(nuevo), 201

@app.route('/api/foda/proyectos/<pid>', methods=['GET'])
def get_foda_proyecto(pid):
    p = mod_foda_proyectos.obtener_proyecto(pid)
    if not p:
        return jsonify({'error': 'No encontrado'}), 404
    return jsonify(p)

@app.route('/api/foda/proyectos/<pid>', methods=['DELETE'])
def delete_foda_proyecto(pid):
    if mod_foda_proyectos.eliminar_proyecto(pid):
        return '', 204
    return jsonify({'error': 'No encontrado'}), 404

@app.route('/api/foda', methods=['GET'])
def get_foda_items():
    pid = request.args.get('pid')
    return jsonify(mod_foda_items.listar_items(pid))

@app.route('/api/foda', methods=['POST'])
def post_foda_item():
    data = request.json
    pid = data.get('proyecto_id')
    if not pid:
        return jsonify({'error': 'Falta proyecto_id'}), 400
    nuevo = mod_foda_items.crear_item(pid, data)
    return jsonify(nuevo), 201

@app.route('/api/foda/<iid>', methods=['PUT'])
def put_foda_item(iid):
    item = mod_foda_items.actualizar_item(iid, request.json)
    if not item:
        return jsonify({'error': 'No encontrado'}), 404
    return jsonify(item)

@app.route('/api/foda/<iid>', methods=['DELETE'])
def delete_foda_item(iid):
    if mod_foda_items.eliminar_item(iid):
        return '', 204
    return jsonify({'error': 'No encontrado'}), 404


if __name__ == '__main__':
    # Iniciar verificación de actualizaciones en background
    start_update_check()
    print(' ⬡  Stella Rikka Suite — http://localhost:5000')
    app.run(debug=False, port=5000, use_reloader=False)

