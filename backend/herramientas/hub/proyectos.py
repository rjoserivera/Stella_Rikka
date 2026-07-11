import json
import os
import uuid
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_FILE = os.path.join(BASE_DIR, 'data', 'hub', 'proyectos.json')

# Nodos por defecto para un nuevo proyecto Hub
NODOS_DEFAULT = [
    # Fase 1: Ideación
    {"id": "n1", "fase": 1, "titulo": "Idealización y gestión", "tipo": "markdown", "estado": "pendiente", "contenido": "", "ayuda": "<p>Espacio para detallar la visión, objetivos y gestión general de tu idea. Puedes usar texto, enlazar documentos externos o subir archivos.</p>"},
    {"id": "n2", "fase": 1, "titulo": "Modelo de negocios", "tipo": "markdown", "estado": "pendiente", "contenido": "", "ayuda": "<p>Define cómo tu proyecto generará valor. Puedes usar herramientas de la suite como Lean Canvas, adjuntar tu propio modelo o escribirlo en texto.</p>"}
]

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
        'fecha_creacion': datetime.now().isoformat(),
        'nodos': json.loads(json.dumps(NODOS_DEFAULT)) # Copia profunda
    }
    datos.append(nuevo)
    _guardar(datos)
    return nuevo

def actualizar_nodo(proyecto_id, nodo_id, datos_actualizados):
    datos = _cargar()
    for p in datos:
        if p['id'] == proyecto_id:
            for nodo in p['nodos']:
                if nodo['id'] == nodo_id:
                    nodo['titulo'] = datos_actualizados.get('titulo', nodo['titulo'])
                    nodo['estado'] = datos_actualizados.get('estado', nodo.get('estado', 'pendiente'))
                    nodo['contenido'] = datos_actualizados.get('contenido', nodo.get('contenido', ''))
                    # Nuevos campos flexibles
                    if 'archivo' in datos_actualizados:
                        nodo['archivo'] = datos_actualizados['archivo']
                    if 'enlace' in datos_actualizados:
                        nodo['enlace'] = datos_actualizados['enlace']
                    
                    # Nuevos campos de listas
                    if 'archivos' in datos_actualizados:
                        nodo['archivos'] = datos_actualizados['archivos']
                    if 'enlaces' in datos_actualizados:
                        nodo['enlaces'] = datos_actualizados['enlaces']

                    if 'herramienta' in datos_actualizados:
                        nodo['herramienta'] = datos_actualizados['herramienta']
                    if 'herramienta_id' in datos_actualizados:
                        nodo['herramienta_id'] = datos_actualizados['herramienta_id']
                    
                    _guardar(datos)
                    return nodo
    return None

def agregar_nodo(proyecto_id, fase, titulo, tipo, enlaces=None):
    if enlaces is None:
        enlaces = []
    datos = _cargar()
    for p in datos:
        if p['id'] == proyecto_id:
            nuevo = {
                'id': f"n_{uuid.uuid4().hex[:8]}",
                'fase': fase,
                'titulo': titulo,
                'tipo': tipo,
                'estado': 'pendiente',
                'contenido': '',
                'archivo': '',
                'enlace': '',
                'archivos': [],
                'enlaces': enlaces,
                'herramienta': '',
                'herramienta_id': ''
            }
            p['nodos'].append(nuevo)
            _guardar(datos)
            return nuevo
    return None

def eliminar_proyecto(proyecto_id):
    datos = _cargar()
    nuevo = [p for p in datos if p['id'] != proyecto_id]
    if len(nuevo) != len(datos):
        _guardar(nuevo)
        return True
    return False

def eliminar_nodo(proyecto_id, nodo_id):
    datos = _cargar()
    for p in datos:
        if p['id'] == proyecto_id:
            original_len = len(p.get('nodos', []))
            p['nodos'] = [n for n in p.get('nodos', []) if n['id'] != nodo_id]
            if len(p['nodos']) != original_len:
                _guardar(datos)
                return True
    return False
