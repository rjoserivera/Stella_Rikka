# Referencia de la API (REST JSON)

Stella Rikka utiliza una API REST impulsada por Flask (Python) para gestionar la persistencia y lectura de los datos de los proyectos. Todas las respuestas de la API son en formato `application/json`.

## Estructura General de Endpoints
Debido a que Stella Rikka se compone de 8 módulos distintos, las rutas de la API siguen una convención unificada:
`/api/{modulo}/{entidad}/{id}`

---

## 1. Módulos y sus Rutas Base

| Módulo | Ruta Base | Persistencia Local |
|--------|-----------|--------------------|
| Hub | `/api/hub` | `data/hub/proyectos.json` |
| Eisenhower | `/api/eisenhower` | `data/eisenhower/proyectos.json` y `tareas.json` |
| Kanban | `/api/kanban` | `data/kanban/proyectos.json` y `tareas.json` |
| MoSCoW | `/api/moscow` | `data/moscow/proyectos.json` y `items.json` |
| Lean Canvas | `/api/leancanvas` | `data/leancanvas/proyectos.json` y `versiones.json` |
| Flujos | `/api/diagramas` | `data/diagramas/proyectos.json` |
| DB Diagramas | `/api/dbdiagrams` | `data/dbdiagrams/proyectos.json` |
| Casos de Uso | `/api/casosdeuso` | `data/casosdeuso/proyectos.json` |

---

## 2. Endpoints Estándar (Ejemplo: Hub)

### Obtener todos los proyectos
* **Ruta:** `GET /api/hub/proyectos`
* **Respuesta (200 OK):**
```json
[
  {
    "id": "hub_1a2b3c",
    "titulo": "Mi Proyecto",
    "fecha_creacion": "2024-05-15T10:00:00Z"
  }
]
```

### Crear un nuevo proyecto
* **Ruta:** `POST /api/hub/proyectos`
* **Body Request:**
```json
{
  "titulo": "Nuevo Diseño"
}
```

### Actualizar o Modificar Proyecto (Metadata/Nodos)
* **Ruta:** `PUT /api/hub/proyectos/<id>`
* **Body Request:** *(Depende del módulo, ej. reemplazo del layout, actualización de nodos).*

### Eliminar Proyecto
* **Ruta:** `DELETE /api/hub/proyectos/<id>`
* **Nota de Seguridad:** Los requests provenientes de invitados a través del túnel (con cabecera `X-Forwarded-For`) recibirán un estado `403 Forbidden` al intentar ejecutar un método `DELETE`.

### Exportación Nativa (.rikka)
* **Ruta:** `GET /api/hub/proyectos/<id>/exportar`
* **Descripción:** Este endpoint recopila el estado actual completo del proyecto, sus dependencias y estructura visual, y lo retorna como un único objeto JSON que el frontend procesa y descarga como un archivo de extensión `.rikka`.

---

## 3. Endpoints Globales

### Estadísticas de la Suite
* **Ruta:** `GET /api/global/stats`
* **Descripción:** Retorna una sumatoria métrica de toda la suite, escaneando todos los módulos para alimentar el panel central del Inicio.
* **Respuesta:**
```json
{
  "proyectos_activos": 12,
  "documentos_creados": 45,
  "tareas_totales": 128,
  "tareas_urgentes": 15,
  "requisitos_totales": 34,
  "requisitos_must": 8
}
```

### Preferencias del Usuario (Tema)
* **Ruta:** `GET /api/preferencias` y `PUT /api/preferencias`
* **Descripción:** Lee y guarda preferencias de entorno globales almacenadas en `data/preferencias.json`.

---

## 4. Endpoints del Gestor de Nube (Túnel SSH)

El servicio `host_manager.py` administra la colaboración web externa:

* **`POST /api/host/start`**: Inicia el subproceso `ssh -R...` y retorna la URL pública generada (Ej. `https://[subdominio].serveo.net`). Bloqueado para IPs remotas.
* **`POST /api/host/stop`**: Mata el subproceso y destruye la conexión SSH. Bloqueado para IPs remotas.
* **`GET /api/host/status`**: Consulta el estado actual de la conexión.
* **`GET /api/host/connections`**: Retorna el conteo numérico de dispositivos activos en tiempo real filtrando los logs de `X-Forwarded-For` de los últimos 30 segundos.
