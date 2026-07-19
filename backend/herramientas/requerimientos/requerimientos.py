import json
import os
import uuid
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
from backend.config import DATA_DIR_BASE
DATA_DIR = os.path.join(DATA_DIR_BASE, 'requerimientos')
REQS_FILE = os.path.join(DATA_DIR, 'requerimientos.json')

def _leer():
    if not os.path.exists(REQS_FILE):
        return []
    with open(REQS_FILE, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def _guardar(data):
    with open(REQS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def listar_requerimientos(proyecto_id=None):
    reqs = _leer()
    if proyecto_id:
        reqs = [r for r in reqs if r.get('proyecto_id') == proyecto_id]
    return reqs

def obtener_requerimiento(req_id):
    return next((r for r in _leer() if r['id'] == req_id), None)

def crear_requerimiento(titulo, descripcion, tipo='funcional', prioridad='media', estado='borrador', origen='', criterios_aceptacion=None, proyecto_id=None):
    reqs = _leer()
    
    # ID unicamente para este proyecto
    reqs_proj = [r for r in reqs if r.get('proyecto_id') == proyecto_id] if proyecto_id else reqs
    
    nuevo = {
        'id': 'RF-' + str(len(reqs_proj) + 1).zfill(3) if tipo == 'funcional' else 'RNF-' + str(len(reqs_proj) + 1).zfill(3),
        'proyecto_id': proyecto_id,
        'titulo': titulo,
        'descripcion': descripcion,
        'tipo': tipo,
        'prioridad': prioridad,
        'estado': estado,
        'origen': origen,
        'criterios_aceptacion': criterios_aceptacion or [],
        'vinculos': {
            'kanban_tarjeta_id': None,
            'uml_caso_uso_id': None,
            'moscow_item_id': None
        },
        'comentarios': [],
        'fecha_creacion': datetime.now().strftime('%Y-%m-%d')
    }
    reqs.append(nuevo)
    _guardar(reqs)
    return nuevo

def actualizar_requerimiento(req_id, datos):
    reqs = _leer()
    for r in reqs:
        if r['id'] == req_id:
            for k, v in datos.items():
                if k != 'id':
                    r[k] = v
            _guardar(reqs)
            return r
    return None

def eliminar_requerimiento(req_id):
    reqs = _leer()
    nuevos = [r for r in reqs if r['id'] != req_id]
    if len(nuevos) == len(reqs):
        return False
    _guardar(nuevos)
    return True

def agregar_comentario(req_id, texto):
    r = obtener_requerimiento(req_id)
    if not r: return None
    r['comentarios'].append({'texto': texto, 'fecha': datetime.now().strftime('%Y-%m-%d')})
    return actualizar_requerimiento(req_id, r)
