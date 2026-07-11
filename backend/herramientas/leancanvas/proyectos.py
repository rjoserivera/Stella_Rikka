import json
import os
import uuid
from datetime import datetime

# Definimos la ruta al archivo
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_FILE = os.path.join(BASE_DIR, 'data', 'leancanvas', 'proyectos.json')

def _cargar():
    if not os.path.exists(DATA_FILE): return []
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def _guardar(datos):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)

def listar_proyectos():
    return _cargar()

def obtener_proyecto(proyecto_id):
    for p in _cargar():
        if p['id'] == proyecto_id:
            return p
    return None

def crear_proyecto(titulo, descripcion=''):
    datos = _cargar()
    nuevo = {
        'id': str(uuid.uuid4()),
        'titulo': titulo,
        'descripcion': descripcion,
        'fecha_creacion': datetime.now().isoformat()
    }
    datos.append(nuevo)
    _guardar(datos)
    return nuevo

def actualizar_proyecto(proyecto_id, campos):
    datos = _cargar()
    for p in datos:
        if p['id'] == proyecto_id:
            for k, v in campos.items():
                if k != 'id': p[k] = v
            _guardar(datos)
            return p
    return None

def eliminar_proyecto(proyecto_id):
    datos = _cargar()
    nuevo = [p for p in datos if p['id'] != proyecto_id]
    if len(nuevo) != len(datos):
        _guardar(nuevo)
        return True
    return False
