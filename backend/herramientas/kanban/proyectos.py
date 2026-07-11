import json
import os
import uuid
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
from backend.config import DATA_DIR_BASE
DATA_DIR = os.path.join(DATA_DIR_BASE, 'kanban')
PROYECTOS_FILE = os.path.join(DATA_DIR, 'proyectos.json')
ITEMS_FILE     = os.path.join(DATA_DIR, 'items.json')


def _leer():
    with open(PROYECTOS_FILE, 'r', encoding='utf-8-sig') as f:
        return json.load(f)


def _guardar(data):
    with open(PROYECTOS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def listar_proyectos():
    return _leer()


def obtener_proyecto(pid):
    return next((p for p in _leer() if p['id'] == pid), None)


def crear_proyecto(titulo, descripcion=''):
    proyectos = _leer()
    nuevo = {
        'id': 'mp' + str(uuid.uuid4())[:8],
        'titulo': titulo,
        'descripcion': descripcion,
        'fecha_creacion': datetime.now().isoformat(timespec='seconds')
    }
    proyectos.append(nuevo)
    _guardar(proyectos)
    return nuevo


def actualizar_proyecto(pid, datos):
    proyectos = _leer()
    for p in proyectos:
        if p['id'] == pid:
            p.update(datos)
            _guardar(proyectos)
            return p
    return None


def eliminar_proyecto(pid):
    proyectos = _leer()
    nuevos = [p for p in proyectos if p['id'] != pid]
    if len(nuevos) == len(proyectos):
        return False
    _guardar(nuevos)
    # Eliminar también los ítems del proyecto
    try:
        with open(ITEMS_FILE, 'r', encoding='utf-8-sig') as f:
            items = json.load(f)
        items = [i for i in items if i['proyecto_id'] != pid]
        with open(ITEMS_FILE, 'w', encoding='utf-8') as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
    except Exception:
        pass
    return True
