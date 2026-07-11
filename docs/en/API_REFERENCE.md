# API Reference (REST JSON)

Stella Rikka uses a REST API powered by Flask (Python) to manage the persistence and reading of project data. All API responses are in `application/json` format.

## General Endpoint Structure
Because Stella Rikka consists of 8 distinct modules, API routes follow a unified convention:
`/api/{module}/{entity}/{id}`

---

## 1. Modules and their Base Routes

| Module | Base Route | Local Persistence |
|--------|-----------|--------------------|
| Hub | `/api/hub` | `data/hub/proyectos.json` |
| Eisenhower | `/api/eisenhower` | `data/eisenhower/proyectos.json` and `tareas.json` |
| Kanban | `/api/kanban` | `data/kanban/proyectos.json` and `tareas.json` |
| MoSCoW | `/api/moscow` | `data/moscow/proyectos.json` and `items.json` |
| Lean Canvas | `/api/leancanvas` | `data/leancanvas/proyectos.json` and `versiones.json` |
| Flowcharts | `/api/diagramas` | `data/diagramas/proyectos.json` |
| DB Diagrams | `/api/dbdiagrams` | `data/dbdiagrams/proyectos.json` |
| Use Cases | `/api/casosdeuso` | `data/casosdeuso/proyectos.json` |

---

## 2. Standard Endpoints (Example: Hub)

### Get all projects
* **Route:** `GET /api/hub/proyectos`
* **Response (200 OK):**
```json
[
  {
    "id": "hub_1a2b3c",
    "titulo": "My Project",
    "fecha_creacion": "2024-05-15T10:00:00Z"
  }
]
```

### Create a new project
* **Route:** `POST /api/hub/proyectos`
* **Request Body:**
```json
{
  "titulo": "New Design"
}
```

### Update or Modify Project (Metadata/Nodes)
* **Route:** `PUT /api/hub/proyectos/<id>`
* **Request Body:** *(Depends on module, e.g. layout replacement, node updates).*

### Delete Project
* **Route:** `DELETE /api/hub/proyectos/<id>`
* **Security Note:** Requests from guests via the tunnel (with `X-Forwarded-For` header) will receive a `403 Forbidden` status when attempting to execute a `DELETE` method.

### Native Export (.rikka)
* **Route:** `GET /api/hub/proyectos/<id>/exportar`
* **Description:** This endpoint compiles the entire current state of the project, its dependencies, and visual structure, returning it as a single JSON object that the frontend processes and downloads as a `.rikka` file.

---

## 3. Global Endpoints

### Suite Statistics
* **Route:** `GET /api/global/stats`
* **Description:** Returns a metric summary of the entire suite by scanning all modules to feed the central Home dashboard.
* **Response:**
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

### User Preferences (Theme)
* **Route:** `GET /api/preferencias` & `PUT /api/preferencias`
* **Description:** Reads and saves global environment preferences stored in `data/preferencias.json`.

---

## 4. Cloud Manager Endpoints (SSH Tunnel)

The `host_manager.py` service manages external web collaboration:

* **`POST /api/host/start`**: Starts the `ssh -R...` subprocess and returns the generated public URL (e.g., `https://[subdomain].serveo.net`). Blocked for remote IPs.
* **`POST /api/host/stop`**: Kills the subprocess and destroys the SSH connection. Blocked for remote IPs.
* **`GET /api/host/status`**: Checks current connection status.
* **`GET /api/host/connections`**: Returns the real-time active device count by filtering `X-Forwarded-For` logs from the last 30 seconds.
