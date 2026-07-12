import json
import os
import uuid
from datetime import datetime

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
from backend.config import DATA_DIR_BASE
DATA_DIR = os.path.join(DATA_DIR_BASE, 'kanban')
ITEMS_FILE = os.path.join(DATA_DIR, 'tareas.json')

COLUMNAS_VALIDAS   = ['backlog', 'progreso', 'pruebas', 'terminado']
PRIORIDADES_VALIDAS = ['alta', 'media', 'baja']
ESFUERZOS_VALIDOS  = ['bajo', 'medio', 'alto']
TIPOS_VALIDOS      = ['feature', 'bug', 'tecnico', 'ux']


def _leer():
    with open(ITEMS_FILE, 'r', encoding='utf-8-sig') as f:
        return json.load(f)


def _guardar(data):
    with open(ITEMS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def listar_tareas(proyecto_id):
    return sorted(
        [i for i in _leer() if i['proyecto_id'] == proyecto_id],
        key=lambda x: x.get('orden', 9999)
    )


def obtener_tarea(tarea_id):
    return next((i for i in _leer() if i['id'] == tarea_id), None)


def crear_tarea(proyecto_id, titulo, descripcion='', columna='backlog',
               prioridad='media', esfuerzo='medio', tipo='feature',
               relacionados=None, custom_id=None):
    tareas = _leer()
    tareas_col = [i for i in tareas if i['proyecto_id'] == proyecto_id and i['columna'] == columna]
    tarea_id = custom_id if custom_id else ('mi' + str(uuid.uuid4())[:8])
    nuevo = {
        'id': tarea_id,
        'proyecto_id': proyecto_id,
        'titulo': titulo,
        'descripcion': descripcion,
        'columna': columna if columna in COLUMNAS_VALIDAS else 'backlog',
        'prioridad': prioridad if prioridad in PRIORIDADES_VALIDAS else 'media',
        'esfuerzo': esfuerzo if esfuerzo in ESFUERZOS_VALIDOS else 'medio',
        'tipo': tipo if tipo in TIPOS_VALIDOS else 'feature',
        'relacionados': relacionados or [],
        'orden': len(tareas_col) + 1,
        'fecha_creacion': datetime.now().isoformat(timespec='seconds')
    }
    tareas.append(nuevo)
    _guardar(tareas)
    return nuevo


def actualizar_tarea(tarea_id, datos):
    tareas = _leer()
    for i in tareas:
        if i['id'] == tarea_id:
            i.update(datos)
            _guardar(tareas)
            return i
    return None


def eliminar_tarea(tarea_id):
    tareas = _leer()
    nuevos = [i for i in tareas if i['id'] != tarea_id]
    if len(nuevos) == len(tareas):
        return False
    _guardar(nuevos)
    return True


def reordenar_tareas(proyecto_id, columna, ids_ordenados):
    tareas = _leer()
    orden_map = {iid: idx + 1 for idx, iid in enumerate(ids_ordenados)}
    for i in tareas:
        if i['proyecto_id'] == proyecto_id and i['columna'] == columna:
            if i['id'] in orden_map:
                i['orden'] = orden_map[i['id']]
    _guardar(tareas)
    return True
