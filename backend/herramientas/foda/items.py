import json
import os
import uuid
from datetime import datetime

from backend.config import DATA_DIR_BASE
DATA_DIR = os.path.join(DATA_DIR_BASE, 'foda')
ITEMS_FILE = os.path.join(DATA_DIR, 'items.json')

def _leer():
    if not os.path.exists(ITEMS_FILE):
        return []
    with open(ITEMS_FILE, 'r', encoding='utf-8-sig') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def _guardar(data):
    with open(ITEMS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def listar_items(proyecto_id=None):
    items = _leer()
    if proyecto_id:
        items = [i for i in items if i.get('proyecto_id') == proyecto_id]
    return items

def obtener_item(item_id):
    return next((i for i in _leer() if i['id'] == item_id), None)

def crear_item(proyecto_id, datos):
    items = _leer()
    
    nuevo = {
        'id': 'itm' + str(uuid.uuid4())[:8],
        'proyecto_id': proyecto_id,
        'cuadrante': datos.get('cuadrante', 'fortalezas'),
        'texto': datos.get('texto', ''),
        'prioridad': datos.get('prioridad', 'media'),
        'responsable': datos.get('responsable', ''),
        'fecha': datos.get('fecha', ''),
        'fecha_creacion': datetime.now().strftime('%Y-%m-%d')
    }
    items.append(nuevo)
    _guardar(items)
    return nuevo

def actualizar_item(item_id, datos):
    items = _leer()
    for i in items:
        if i['id'] == item_id:
            campos = ['cuadrante', 'texto', 'prioridad', 'responsable', 'fecha']
            for campo in campos:
                if campo in datos:
                    i[campo] = datos[campo]
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
