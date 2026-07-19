import uuid

def fusionar_nodos(sesion_id, ids_nodos, nuevo_texto, categoria='producto'):
    from .sesiones import obtener_sesion, actualizar_sesion
    
    sesion = obtener_sesion(sesion_id)
    if not sesion:
        return None
    
    nuevo_nodo_id = 'n' + str(uuid.uuid4())[:8]
    nuevo_nodo = {
        'id': nuevo_nodo_id,
        'texto': nuevo_texto,
        'categoria': categoria,
        'x': sum(n.get('x', 0) for n in sesion['nodos'] if n['id'] in ids_nodos) / len(ids_nodos) if ids_nodos else 100,
        'y': sum(n.get('y', 0) for n in sesion['nodos'] if n['id'] in ids_nodos) / len(ids_nodos) if ids_nodos else 100,
        'votos': 0,
        'es_ganadora': False,
        'fusionado_de': ids_nodos
    }
    
    sesion['nodos'].append(nuevo_nodo)
    for nid in ids_nodos:
        sesion['conexiones'].append({'de': nid, 'a': nuevo_nodo_id})
        
    actualizar_sesion(sesion_id, {'nodos': sesion['nodos'], 'conexiones': sesion['conexiones']})
    return nuevo_nodo
