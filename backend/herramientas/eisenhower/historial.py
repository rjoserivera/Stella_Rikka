import json
import os
import uuid
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
from backend.config import DATA_DIR_BASE
DATA_DIR = os.path.join(DATA_DIR_BASE, 'eisenhower')
HISTORIAL_FILE = os.path.join(DATA_DIR, 'historial.json')


def _leer():
    with open(HISTORIAL_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def _guardar(data):
    with open(HISTORIAL_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def registrar(proyecto_id, tarea_id, accion, detalle=''):
    historial = _leer()
    entrada = {
        'id': 'h' + str(uuid.uuid4())[:8],
        'proyecto_id': proyecto_id,
        'tarea_id': tarea_id,
        'accion': accion,
        'detalle': detalle,
        'timestamp': datetime.now().isoformat(timespec='seconds')
    }
    historial.append(entrada)
    _guardar(historial)
    return entrada


def listar_historial(proyecto_id=None, limite=100):
    historial = _leer()
    if proyecto_id:
        historial = [h for h in historial if h['proyecto_id'] == proyecto_id]
    # más recientes primero
    return sorted(historial, key=lambda h: h['timestamp'], reverse=True)[:limite]


def limpiar_historial(proyecto_id):
    historial = _leer()
    nuevos = [h for h in historial if h['proyecto_id'] != proyecto_id]
    _guardar(nuevos)
    return True
