import json
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
from backend.config import DATA_DIR_BASE
DATA_DIR = os.path.join(DATA_DIR_BASE, 'requerimientos')
HISTORIAL_FILE = os.path.join(DATA_DIR, 'historial.json')

def _leer():
    if not os.path.exists(HISTORIAL_FILE):
        return []
    with open(HISTORIAL_FILE, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def _guardar(data):
    with open(HISTORIAL_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def registrar(req_id, accion, detalle):
    hist = _leer()
    hist.append({
        'req_id': req_id,
        'accion': accion,
        'fecha': datetime.now().isoformat(),
        'detalle': detalle
    })
    _guardar(hist)

def listar_historial(req_id=None):
    hist = _leer()
    if req_id:
        hist = [h for h in hist if h['req_id'] == req_id]
    return sorted(hist, key=lambda x: x['fecha'], reverse=True)
