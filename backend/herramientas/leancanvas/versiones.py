import json
import os
import uuid
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_FILE = os.path.join(BASE_DIR, 'data', 'leancanvas', 'versiones.json')

def _cargar():
    if not os.path.exists(DATA_FILE): return []
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def _guardar(datos):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)

def listar_versiones(proyecto_id):
    return [v for v in _cargar() if v.get('proyecto_id') == proyecto_id]

def obtener_version(version_id):
    for v in _cargar():
        if v['id'] == version_id:
            return v
    return None

def crear_version(proyecto_id, nombre, datos_canvas):
    datos = _cargar()
    nueva = {
        'id': str(uuid.uuid4()),
        'proyecto_id': proyecto_id,
        'nombre': nombre,
        'fecha': datetime.now().isoformat(),
        'canvas': datos_canvas
    }
    datos.append(nueva)
    _guardar(datos)
    return nueva

def actualizar_version(version_id, canvas):
    datos = _cargar()
    for v in datos:
        if v['id'] == version_id:
            v['canvas'] = canvas
            v['fecha_actualizacion'] = datetime.now().isoformat()
            _guardar(datos)
            return v
    return None

def eliminar_version(version_id):
    datos = _cargar()
    nuevo = [v for v in datos if v['id'] != version_id]
    if len(nuevo) != len(datos):
        _guardar(nuevo)
        return True
    return False

def eliminar_todas_proyecto(proyecto_id):
    datos = _cargar()
    nuevo = [v for v in datos if v.get('proyecto_id') != proyecto_id]
    _guardar(nuevo)
