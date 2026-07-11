import json
import os
import uuid
from datetime import datetime

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
from backend.config import DATA_DIR_BASE
DATA_DIR = os.path.join(DATA_DIR_BASE, 'moscow')
ITEMS_FILE = os.path.join(DATA_DIR, 'items.json')

COLUMNAS_VALIDAS   = ['must', 'should', 'could', 'wont']
PRIORIDADES_VALIDAS = ['alta', 'media', 'baja']
ESFUERZOS_VALIDOS  = ['bajo', 'medio', 'alto']
TIPOS_VALIDOS      = ['feature', 'bug', 'tecnico', 'ux']


def _leer():
    with open(ITEMS_FILE, 'r', encoding='utf-8-sig') as f:
        return json.load(f)


def _guardar(data):
    with open(ITEMS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def listar_items(proyecto_id):
    return sorted(
        [i for i in _leer() if i['proyecto_id'] == proyecto_id],
        key=lambda x: x.get('orden', 9999)
    )


def obtener_item(item_id):
    return next((i for i in _leer() if i['id'] == item_id), None)


def crear_item(proyecto_id, titulo, descripcion='', columna='must',
               prioridad='media', esfuerzo='medio', tipo='feature',
               relacionados=None, custom_id=None):
    items = _leer()
    items_col = [i for i in items if i['proyecto_id'] == proyecto_id and i['columna'] == columna]
    item_id = custom_id if custom_id else ('mi' + str(uuid.uuid4())[:8])
    nuevo = {
        'id': item_id,
        'proyecto_id': proyecto_id,
        'titulo': titulo,
        'descripcion': descripcion,
        'columna': columna if columna in COLUMNAS_VALIDAS else 'must',
        'prioridad': prioridad if prioridad in PRIORIDADES_VALIDAS else 'media',
        'esfuerzo': esfuerzo if esfuerzo in ESFUERZOS_VALIDOS else 'medio',
        'tipo': tipo if tipo in TIPOS_VALIDOS else 'feature',
        'relacionados': relacionados or [],
        'orden': len(items_col) + 1,
        'fecha_creacion': datetime.now().isoformat(timespec='seconds')
    }
    items.append(nuevo)
    _guardar(items)
    return nuevo


def actualizar_item(item_id, datos):
    items = _leer()
    for i in items:
        if i['id'] == item_id:
            i.update(datos)
            _guardar(items)
            return i
    return None


def eliminar_item(item_id):
    items = _leer()
    nuevos = [i for i in items if i['id'] != item_id]
    if len(nuevos) == len(items):
        return False
    _guardar(nuevos)
    return True


def reordenar_items(proyecto_id, columna, ids_ordenados):
    items = _leer()
    orden_map = {iid: idx + 1 for idx, iid in enumerate(ids_ordenados)}
    for i in items:
        if i['proyecto_id'] == proyecto_id and i['columna'] == columna:
            if i['id'] in orden_map:
                i['orden'] = orden_map[i['id']]
    _guardar(items)
    return True
