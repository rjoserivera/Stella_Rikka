import json
import os
import uuid
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# herramientas/eisenhower → herramientas → backend → backend/data/eisenhower
from backend.config import DATA_DIR_BASE
DATA_DIR = os.path.join(DATA_DIR_BASE, 'eisenhower')
PROYECTOS_FILE = os.path.join(DATA_DIR, 'proyectos.json')


def _leer():
    with open(PROYECTOS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def _guardar(data):
    with open(PROYECTOS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def listar_proyectos():
    return _leer()


def obtener_proyecto(proyecto_id):
    proyectos = _leer()
    return next((p for p in proyectos if p['id'] == proyecto_id), None)


def crear_proyecto(titulo, descripcion=''):
    proyectos = _leer()
    nuevo = {
        'id': 'p' + str(uuid.uuid4())[:8],
        'titulo': titulo,
        'descripcion': descripcion,
        'fecha_creacion': datetime.now().strftime('%Y-%m-%d'),
        'ultimo_zoom': 1.0,
        'ultima_posicion': {'x': 0, 'y': 0}
    }
    proyectos.append(nuevo)
    _guardar(proyectos)
    return nuevo


def actualizar_proyecto(proyecto_id, datos):
    proyectos = _leer()
    for p in proyectos:
        if p['id'] == proyecto_id:
            p.update(datos)
            _guardar(proyectos)
            return p
    return None


def eliminar_proyecto(proyecto_id):
    proyectos = _leer()
    nuevos = [p for p in proyectos if p['id'] != proyecto_id]
    if len(nuevos) == len(proyectos):
        return False
    _guardar(nuevos)
    return True
