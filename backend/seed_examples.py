import os
import json
import uuid

# Asegurar que se importan los paths desde config
from backend.config import DATA_DIR_BASE
from backend.herramientas.hub import proyectos as hub_proj
from backend.herramientas.moscow import proyectos as moscow_proj
from backend.herramientas.moscow import items as moscow_items
from backend.herramientas.leancanvas import proyectos as lc_proj
from backend.herramientas.leancanvas import versiones as lc_vers
from backend.herramientas.kanban import proyectos as kanban_proj
from backend.herramientas.kanban import tareas as kanban_tareas
from backend.herramientas.eisenhower import proyectos as eis_proj
from backend.herramientas.eisenhower import tareas as eis_tareas
from backend.herramientas.diagramas import proyectos as diag_proj
from backend.herramientas.dbdiagrams import proyectos as db_proj
from backend.herramientas.casosdeuso import proyectos as cu_proj

def seed_all():
    # 1. Asegurar que eisenhower directorios existan (faltaba en app.py)
    eis_data = os.path.join(DATA_DIR_BASE, 'eisenhower')
    os.makedirs(eis_data, exist_ok=True)
    for _fname in ['proyectos.json', 'tareas.json', 'historial.json']:
        _fpath = os.path.join(eis_data, _fname)
        if not os.path.exists(_fpath):
            with open(_fpath, 'w', encoding='utf-8') as f:
                json.dump([], f)
                
    # 2. Plantar datos de ejemplo si es primera vez (o vacío)
    try:
        if len(hub_proj.listar_proyectos()) == 0:
            hp = hub_proj.crear_proyecto("Stella Rikka - Proyecto de Ejemplo", "Descubre cómo usar el Hub para organizar tu visión técnica.")
        
        if len(eis_proj.listar_proyectos()) == 0:
            ep = eis_proj.crear_proyecto("Tareas Diarias - Ingeniería", "Gestión de prioridades")
            eis_tareas.crear_tarea(ep['id'], "Optimizar base de datos", "Urgente e importante", "importante_urgente")
            eis_tareas.crear_tarea(ep['id'], "Aprender nuevo framework", "Importante pero no urgente", "importante_no_urgente")
            eis_tareas.crear_tarea(ep['id'], "Revisar correos irrelevantes", "", "no_importante_urgente")
            
        if len(moscow_proj.listar_proyectos()) == 0:
            mp = moscow_proj.crear_proyecto("Lanzamiento v1.0", "Requerimientos")
            moscow_items.crear_item(mp['id'], "Autenticación", "Debe estar sí o sí", "must")
            moscow_items.crear_item(mp['id'], "Modo Oscuro", "Debería estar", "should")
            moscow_items.crear_item(mp['id'], "Animaciones 3D", "Se podría hacer", "could")
            moscow_items.crear_item(mp['id'], "App Móvil Nativa", "No se hará por ahora", "wont")
            
        if len(kanban_proj.listar_proyectos()) == 0:
            kp = kanban_proj.crear_proyecto("Desarrollo Stella Rikka", "Flujo de trabajo")
            kanban_tareas.crear_tarea(kp['id'], "Diseñar arquitectura", "", "terminado")
            kanban_tareas.crear_tarea(kp['id'], "Programar backend Python", "", "pruebas")
            kanban_tareas.crear_tarea(kp['id'], "Hacer tests unitarios", "", "progreso")
            kanban_tareas.crear_tarea(kp['id'], "Documentación final", "", "backlog")
            
        if len(lc_proj.listar_proyectos()) == 0:
            lcp = lc_proj.crear_proyecto("Startup Ejemplo SaaS", "Modelo de negocio")
            canvas_data = {
                "problema": "Desorganización en equipos locales",
                "solucion": "Suite Local-First unificada",
                "propuesta": "Toda la ingeniería en un solo lugar sin nubes",
                "ventaja": "No requiere internet, privacidad total",
                "segmentos": "Ingenieros de Software, Product Managers",
                "alternativas": "Jira, Trello",
                "metricas": "Usuarios activos diarios",
                "canales": "GitHub, Redes sociales",
                "coste": "Desarrollo y diseño UX",
                "ingresos": "Gratis / Open Source"
            }
            lc_vers.crear_version(lcp['id'], "Versión Inicial", canvas_data)
            
        if len(diag_proj.listar_proyectos()) == 0:
            diag_proj.crear_proyecto("Flujo de Autenticación", "Ejemplo")
            
        if len(db_proj.listar_proyectos()) == 0:
            db_proj.crear_proyecto("Esquema Ecommerce", "Ejemplo de DBML")
            
        if len(cu_proj.listar_proyectos()) == 0:
            cu_proj.crear_proyecto("Casos de Uso de Admin", "Ejemplo UML")

    except Exception as e:
        print("Error during seed:", e)

if __name__ == '__main__':
    seed_all()
