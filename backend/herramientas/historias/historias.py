import json
import os
from datetime import datetime

from backend.config import DATA_DIR_BASE
DATA_DIR = os.path.join(DATA_DIR_BASE, 'historias')
HISTORIAS_FILE = os.path.join(DATA_DIR, 'historias.json')

def _leer():
    if not os.path.exists(HISTORIAS_FILE):
        return []
    with open(HISTORIAS_FILE, 'r', encoding='utf-8-sig') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def _guardar(data):
    with open(HISTORIAS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def listar_historias(proyecto_id=None):
    historias = _leer()
    if proyecto_id:
        historias = [h for h in historias if h.get('proyecto_id') == proyecto_id]
    return historias

def obtener_historia(hid):
    return next((h for h in _leer() if h['id'] == hid), None)

def crear_historia(proyecto_id, datos):
    historias = _leer()
    # Calcular el siguiente número para este proyecto
    reqs_proj = [h for h in historias if h.get('proyecto_id') == proyecto_id]
    num = str(len(reqs_proj) + 1).zfill(3)
    
    nueva = {
        'id': f'HU-{num}',
        'proyecto_id': proyecto_id,
        'titulo': datos.get('titulo', 'Nueva Historia'),
        'epica': datos.get('epica', ''),
        'como': datos.get('como', ''),
        'quiero': datos.get('quiero', ''),
        'para': datos.get('para', ''),
        'criterios': datos.get('criterios', []),
        'prioridad': datos.get('prioridad', 'media'),
        'estimacion': datos.get('estimacion', ''),
        'estado': datos.get('estado', 'backlog'),
        'sprint': datos.get('sprint', ''),
        'req_origen': datos.get('req_origen', ''),
        'notas': datos.get('notas', ''),
        'fecha_creacion': datetime.now().strftime('%Y-%m-%d')
    }
    historias.append(nueva)
    _guardar(historias)
    return nueva

def actualizar_historia(hid, datos):
    historias = _leer()
    for h in historias:
        if h['id'] == hid:
            campos = ['titulo', 'epica', 'como', 'quiero', 'para', 'criterios',
                      'prioridad', 'estimacion', 'estado', 'sprint', 'req_origen', 'notas']
            for campo in campos:
                if campo in datos:
                    h[campo] = datos[campo]
            _guardar(historias)
            return h
    return None

def eliminar_historia(hid):
    historias = _leer()
    nuevas = [h for h in historias if h['id'] != hid]
    if len(nuevas) == len(historias):
        return False
    _guardar(nuevas)
    return True
