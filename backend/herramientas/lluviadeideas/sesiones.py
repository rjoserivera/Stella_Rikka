import json
import os
import uuid
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
from backend.config import DATA_DIR_BASE
DATA_DIR = os.path.join(DATA_DIR_BASE, 'lluviadeideas')
SESIONES_FILE = os.path.join(DATA_DIR, 'sesiones.json')

def _leer():
    if not os.path.exists(SESIONES_FILE):
        return []
    with open(SESIONES_FILE, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def _guardar(data):
    with open(SESIONES_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def listar_sesiones():
    return _leer()

def obtener_sesion(sesion_id):
    return next((s for s in _leer() if s['id'] == sesion_id), None)

def crear_sesion(titulo):
    sesiones = _leer()
    nueva = {
        'id': 'li' + str(uuid.uuid4())[:8],
        'titulo': titulo,
        'fecha': datetime.now().strftime('%Y-%m-%d'),
        'nodos': [],
        'conexiones': []
    }
    sesiones.append(nueva)
    _guardar(sesiones)
    return nueva

def actualizar_sesion(sesion_id, datos):
    sesiones = _leer()
    for s in sesiones:
        if s['id'] == sesion_id:
            if 'titulo' in datos:
                s['titulo'] = datos['titulo']
            if 'nodos' in datos:
                s['nodos'] = datos['nodos']
            if 'conexiones' in datos:
                s['conexiones'] = datos['conexiones']
            _guardar(sesiones)
            return s
    return None

def eliminar_sesion(sesion_id):
    sesiones = _leer()
    nuevas = [s for s in sesiones if s['id'] != sesion_id]
    if len(nuevas) == len(sesiones):
        return False
    _guardar(nuevas)
    return True
