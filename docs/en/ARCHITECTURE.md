# System Architecture (Stella Rikka)

This document describes the technical architecture of Stella Rikka, data flow, and network topology.

## 1. Overview
Stella Rikka is a **Local-First** application designed to maximize privacy and performance. All persistence logic is handled locally on the user's device, while a modern web interface serves as the client.

### Core Technologies
* **Frontend:** HTML5, CSS3 (Vanilla), JavaScript (ES6+). No heavy frameworks to guarantee instant load times.
* **Backend:** Python 3 (Flask). Serves the REST API and static files.
* **Database:** Flat JSON files managed by Python.
* **Collaboration (Cloud Sharing):** Reverse SSH tunneling via `serveo.net`.

---

## 2. High-Level Architecture Diagram

```mermaid
graph TD
    subgraph "Local Environment (Localhost)"
        A[Web Browser / Frontend]
        B[Flask Server / Backend]
        
        subgraph "Local Storage"
            C[(data/hub/)]
            D[(data/eisenhower/)]
            E[(data/kanban/)]
            F[(...other tools/)]
        end
        
        A -- "REST API Calls" --> B
        B -- "JSON Read/Write" --> C
        B -- "JSON Read/Write" --> D
        B -- "JSON Read/Write" --> E
        B -- "JSON Read/Write" --> F
    end

    subgraph "Remote Collaboration"
        G[Remote Guest User]
        H((Serveo SSH Tunnel))
        
        G -- "HTTPS" --> H
        H -- "Forward to port 5000" --> B
    end

    classDef local fill:#2d3748,stroke:#4a5568,stroke-width:2px,color:#fff
    classDef remote fill:#2b6cb0,stroke:#3182ce,stroke-width:2px,color:#fff
    classDef storage fill:#2f855a,stroke:#38a169,stroke-width:2px,color:#fff
    
    class A,B local
    class C,D,E,F storage
    class G,H remote
```

## 3. Data Flow and Persistence

Stella Rikka does not use traditional relational databases like MySQL or PostgreSQL. To maintain portability, it uses the OS file system.

### Data Structure (Directories)
Each module has its own subdirectory within `backend/data/`.
Example for Kanban:
- `backend/data/kanban/proyectos.json`: Contains board metadata.
- `backend/data/kanban/tareas.json`: Contains individual cards and which project they belong to.

### Exporting and Interoperability (.rikka)
The `.rikka` files are simply structured JSON packages containing all information for a specific project, downloaded directly via a backend API and generated as a `Blob` in the frontend.

---

## 4. Collaboration Tunnel and Security Diagram

The following diagram shows what happens when the user activates the **Collaboration Tunnel** and how the system protects data against deletions (Partial Read-Only) and performs Auto-Backups.

```mermaid
sequenceDiagram
    participant Host
    participant Backend (Flask)
    participant File System
    participant Tunnel (Serveo)
    participant Guest

    Host->>Backend: Click "Start Connection"
    activate Backend
    Backend->>File System: Clone /data to /data_backups (Auto-Backup)
    Backend->>Tunnel: Run `ssh -R 80:localhost:5000 serveo.net`
    Tunnel-->>Backend: Returns Public URL (e.g. https://stella.serveo.net)
    Backend-->>Host: Displays URL and starts monitoring
    deactivate Backend

    Guest->>Tunnel: Enters public URL
    Tunnel->>Backend: Forward request (Adds X-Forwarded-For)
    
    alt Is a DELETE request to /proyectos
        Backend-->>Guest: 403 ERROR (Access Denied for Security)
    else Is a normal read/edit
        Backend->>File System: Update JSON
        File System-->>Backend: OK
        Backend-->>Guest: 200 OK
    end
```

## 5. Interface Design (Sea Horizon)
The Frontend uses a centralized visual architecture. Instead of having redundant CSS files, all modules consume design variables from `css/tema.css` and environment animations defined in the global script `navbar.js`, ensuring that regardless of the module (UML, Diagrams, Hub), the visual experience is cohesive.
