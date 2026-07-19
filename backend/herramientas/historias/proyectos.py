import json
import os
import uuid
from datetime import datetime

from backend.config import DATA_DIR_BASE
DATA_DIR = os.path.join(DATA_DIR_BASE, 'historias')
PROYECTOS_FILE = os.path.join(DATA_DIR, 'proyectos.json')
HISTORIAS_FILE = os.path.join(DATA_DIR, 'historias.json')

def init_archivos():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
    for fpath in [PROYECTOS_FILE, HISTORIAS_FILE]:
        if not os.path.exists(fpath):
            with open(fpath, 'w', encoding='utf-8') as f:
                json.dump([], f, ensure_ascii=False)
init_archivos()

def _leer(fpath):
    with open(fpath, 'r', encoding='utf-8-sig') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def _guardar(fpath, data):
    with open(fpath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ── PROYECTOS ──
def listar_proyectos():
    return _leer(PROYECTOS_FILE)

def obtener_proyecto(pid):
    return next((p for p in _leer(PROYECTOS_FILE) if p['id'] == pid), None)

def crear_proyecto(titulo, descripcion=''):
    proyectos = _leer(PROYECTOS_FILE)
    nuevo = {
        'id': 'hup' + str(uuid.uuid4())[:8],
        'titulo': titulo,
        'descripcion': descripcion,
        'fecha_creacion': datetime.now().isoformat(timespec='seconds')
    }
    proyectos.append(nuevo)
    _guardar(PROYECTOS_FILE, proyectos)
    return nuevo

def actualizar_proyecto(pid, datos):
    proyectos = _leer(PROYECTOS_FILE)
    for p in proyectos:
        if p['id'] == pid:
            p.update(datos)
            _guardar(PROYECTOS_FILE, proyectos)
            return p
    return None

def eliminar_proyecto(pid):
    proyectos = _leer(PROYECTOS_FILE)
    nuevos = [p for p in proyectos if p['id'] != pid]
    if len(nuevos) == len(proyectos):
        return False
    _guardar(PROYECTOS_FILE, proyectos)
    # También eliminar historias del proyecto
    historias = _leer(HISTORIAS_FILE)
    historias = [h for h in historias if h.get('proyecto_id') != pid]
    _guardar(HISTORIAS_FILE, historias)
    return True
