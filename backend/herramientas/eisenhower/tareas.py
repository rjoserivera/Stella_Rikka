import json
import os
import uuid
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# herramientas/eisenhower → herramientas → backend → backend/data/eisenhower
from backend.config import DATA_DIR_BASE
DATA_DIR = os.path.join(DATA_DIR_BASE, 'eisenhower')
TAREAS_FILE = os.path.join(DATA_DIR, 'tareas.json')


def _leer():
    with open(TAREAS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def _guardar(data):
    with open(TAREAS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def listar_tareas(proyecto_id):
    return [t for t in _leer() if t['proyecto_id'] == proyecto_id]


def obtener_tarea(tarea_id):
    return next((t for t in _leer() if t['id'] == tarea_id), None)


def crear_tarea(proyecto_id, titulo, descripcion='', cuadrante='importante_urgente',
                prioridad='media', urgencia='media', importancia='media', relacionadas=None, custom_id=None):
    tareas = _leer()
    # Orden dentro del cuadrante
    tareas_cuadrante = [t for t in tareas
                        if t['proyecto_id'] == proyecto_id and t['cuadrante'] == cuadrante]
    tarea_id = custom_id if custom_id else ('t' + str(uuid.uuid4())[:8])
    nueva = {
        'id': tarea_id,
        'proyecto_id': proyecto_id,
        'titulo': titulo,
        'descripcion': descripcion,
        'cuadrante': cuadrante,
        'prioridad': prioridad,
        'urgencia': urgencia,
        'importancia': importancia,
        'completada': False,
        'relacionadas': relacionadas or [],
        'orden': len(tareas_cuadrante) + 1,
        'fecha_creacion': datetime.now().isoformat(timespec='seconds')
    }
    tareas.append(nueva)
    _guardar(tareas)
    return nueva


def actualizar_tarea(tarea_id, datos):
    tareas = _leer()
    for t in tareas:
        if t['id'] == tarea_id:
            t.update(datos)
            _guardar(tareas)
            return t
    return None


def eliminar_tarea(tarea_id):
    tareas = _leer()
    nuevas = [t for t in tareas if t['id'] != tarea_id]
    if len(nuevas) == len(tareas):
        return False
    _guardar(nuevas)
    return True


def reordenar_tareas(proyecto_id, cuadrante, ids_ordenados):
    tareas = _leer()
    orden_map = {tid: idx + 1 for idx, tid in enumerate(ids_ordenados)}
    for t in tareas:
        if t['proyecto_id'] == proyecto_id and t['cuadrante'] == cuadrante:
            if t['id'] in orden_map:
                t['orden'] = orden_map[t['id']]
    _guardar(tareas)
    return True
