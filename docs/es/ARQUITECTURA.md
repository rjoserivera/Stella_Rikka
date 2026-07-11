# Arquitectura del Sistema (Stella Rikka)

Este documento describe la arquitectura técnica de Stella Rikka, el flujo de datos y la topología de red.

## 1. Visión General
Stella Rikka es una aplicación **Local-First** diseñada para maximizar la privacidad y el rendimiento. Toda la lógica de persistencia se maneja localmente en el dispositivo del usuario, mientras que una interfaz web moderna sirve como cliente.

### Tecnologías Principales
* **Frontend:** HTML5, CSS3 (Vanilla), JavaScript (ES6+). Sin frameworks pesados para garantizar tiempos de carga instantáneos.
* **Backend:** Python 3 (Flask). Sirve la API REST y los archivos estáticos.
* **Base de Datos:** Archivos JSON planos gestionados por Python.
* **Colaboración (Cloud Sharing):** SSH inverso mediante `serveo.net`.

---

## 2. Diagrama de Arquitectura de Alto Nivel

```mermaid
graph TD
    subgraph "Entorno Local (Localhost)"
        A[Navegador Web / Frontend]
        B[Servidor Flask / Backend]
        
        subgraph "Almacenamiento Local"
            C[(data/hub/)]
            D[(data/eisenhower/)]
            E[(data/kanban/)]
            F[(...otras herramientas/)]
        end
        
        A -- "Llamadas REST API" --> B
        B -- "Lectura/Escritura JSON" --> C
        B -- "Lectura/Escritura JSON" --> D
        B -- "Lectura/Escritura JSON" --> E
        B -- "Lectura/Escritura JSON" --> F
    end

    subgraph "Colaboración Remota"
        G[Usuario Invitado Remoto]
        H((Túnel SSH Serveo))
        
        G -- "HTTPS" --> H
        H -- "Reenvío a puerto 5000" --> B
    end

    classDef local fill:#2d3748,stroke:#4a5568,stroke-width:2px,color:#fff
    classDef remote fill:#2b6cb0,stroke:#3182ce,stroke-width:2px,color:#fff
    classDef storage fill:#2f855a,stroke:#38a169,stroke-width:2px,color:#fff
    
    class A,B local
    class C,D,E,F storage
    class G,H remote
```

## 3. Flujo de Datos y Persistencia

Stella Rikka no utiliza bases de datos relacionales tradicionales como MySQL o PostgreSQL. Para mantener la portabilidad, utiliza el sistema de archivos del sistema operativo.

### Estructura de Datos (Directorios)
Cada módulo tiene su propio subdirectorio dentro de `backend/data/`.
Ejemplo para Kanban:
- `backend/data/kanban/proyectos.json`: Contiene la metadata de los tableros.
- `backend/data/kanban/tareas.json`: Contiene las tarjetas individuales y a qué proyecto pertenecen.

### Exportación e Interoperabilidad (.rikka)
Los archivos `.rikka` son simplemente paquetes JSON estructurados que contienen toda la información de un proyecto específico, descargados directamente a través de una API en el backend y generados como un `Blob` en el frontend.

---

## 4. Diagrama del Túnel de Colaboración y Seguridad

El siguiente diagrama muestra qué sucede cuando el usuario activa el **Túnel de Colaboración** y cómo el sistema protege los datos contra eliminaciones (Read-Only Parcial) y realiza Auto-Backups.

```mermaid
sequenceDiagram
    participant Anfitrión (Host)
    participant Backend (Flask)
    participant Sistema de Archivos
    participant Túnel (Serveo)
    participant Invitado

    Anfitrión->>Backend: Clic en "Iniciar Conexión"
    activate Backend
    Backend->>Sistema de Archivos: Clonar /data a /data_backups (Auto-Backup)
    Backend->>Túnel: Ejecutar `ssh -R 80:localhost:5000 serveo.net`
    Túnel-->>Backend: Devuelve URL Pública (ej. https://stella.serveo.net)
    Backend-->>Anfitrión: Muestra URL y activa monitoreo
    deactivate Backend

    Invitado->>Túnel: Entra a URL pública
    Túnel->>Backend: Forward request (Agrega X-Forwarded-For)
    
    alt Es una petición DELETE a /proyectos
        Backend-->>Invitado: ERROR 403 (Acceso Denegado por Seguridad)
    else Es una lectura/edición normal
        Backend->>Sistema de Archivos: Actualizar JSON
        Sistema de Archivos-->>Backend: OK
        Backend-->>Invitado: 200 OK
    end
```

## 5. Diseño de Interfaz (Sea Horizon)
El Frontend utiliza una arquitectura visual centralizada. En lugar de tener archivos CSS redundantes, todos los módulos consumen las variables de diseño de `css/tema.css` y las animaciones de entorno definidas en el script global `navbar.js`, garantizando que sin importar el módulo (UML, Diagramas, Hub), la experiencia visual sea cohesiva.
