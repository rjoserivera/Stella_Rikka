from .requerimientos import listar_requerimientos

def generar_matriz_trazabilidad():
    reqs = listar_requerimientos()
    matriz = []
    for r in reqs:
        matriz.append({
            'id': r['id'],
            'titulo': r['titulo'],
            'estado': r['estado'],
            'kanban_tarjeta_id': r.get('vinculos', {}).get('kanban_tarjeta_id'),
            'uml_caso_uso_id': r.get('vinculos', {}).get('uml_caso_uso_id'),
            'moscow_item_id': r.get('vinculos', {}).get('moscow_item_id')
        })
    return matriz
