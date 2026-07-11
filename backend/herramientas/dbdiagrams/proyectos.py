import json
import os
import uuid
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
from backend.config import DATA_DIR_BASE
DATA_DIR = os.path.join(DATA_DIR_BASE, 'dbdiagrams')
PROYECTOS_FILE = os.path.join(DATA_DIR, 'proyectos.json')

os.makedirs(DATA_DIR, exist_ok=True)


def _cargar():
    if not os.path.exists(PROYECTOS_FILE):
        return []
    with open(PROYECTOS_FILE, 'r', encoding='utf-8-sig') as f:
        return json.load(f)


def _guardar(data):
    with open(PROYECTOS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def listar_proyectos():
    return _cargar()


def obtener_proyecto(pid):
    return next((p for p in _cargar() if p['id'] == pid), None)


def crear_proyecto(titulo, descripcion=''):
    proyectos = _cargar()
    nuevo = {
        'id': 'db' + str(uuid.uuid4())[:8],
        'titulo': titulo,
        'descripcion': descripcion,
        'fecha_creacion': datetime.now().isoformat(timespec='seconds'),
        'fecha_modificacion': datetime.now().isoformat(timespec='seconds'),
        'config': {'zoom': 1.0, 'panX': 0, 'panY': 0, 'snapGrid': True, 'gridSize': 20},
        'nodos': [],
        'enlaces': []
    }
    proyectos.append(nuevo)
    _guardar(proyectos)
    return nuevo


def actualizar_proyecto(pid, datos):
    proyectos = _cargar()
    for p in proyectos:
        if p['id'] == pid:
            p.update(datos)
            p['fecha_modificacion'] = datetime.now().isoformat(timespec='seconds')
            _guardar(proyectos)
            return p
    return None


def eliminar_proyecto(pid):
    proyectos = _cargar()
    nuevos = [p for p in proyectos if p['id'] != pid]
    if len(nuevos) == len(proyectos):
        return False
    _guardar(nuevos)
    return True
