# Referencia de Herramientas (Módulos de la Suite)

Stella Rikka se compone actualmente de **8 módulos interconectados**. Este documento sirve como un manual técnico y de uso para comprender el propósito y las capacidades de cada herramienta.

---

## 1. Hub de Proyectos (Gestor Documental)
**Ruta Principal:** `/hub`
**Propósito:** Actúa como el centro neurálgico del proyecto. Permite organizar toda la documentación en un flujo estructurado (Ideación, Desarrollo, Testing, etc.).
**Características Clave:**
* **Nodos Flexibles:** Puedes crear notas en formato Markdown, adjuntar archivos o vincular recursos web.
* **Interconectividad:** Un nodo del Hub puede abrir directamente otra herramienta de la suite (por ejemplo, vincular un nodo a un Tablero Kanban específico).
* **Exportación de Dossier:** Compila todos los textos y enlaces de los nodos en un único documento Markdown (`.md`) para reportes rápidos.

## 2. Matriz de Eisenhower
**Ruta Principal:** `/eisenhower/seleccion`
**Propósito:** Gestión de tiempo y tareas basada en urgencia e importancia. Ideal para priorización diaria.
**Características Clave:**
* **4 Cuadrantes Drag & Drop:** Hacer (Urgente/Importante), Planificar, Delegar y Eliminar.
* **Estadísticas Visuales:** Gráficos circulares generados con Chart.js que muestran el rendimiento y la finalización de tareas.
* **Importación desde Excel:** Permite la ingesta masiva de tareas desde archivos `.xlsx`.

## 3. Matriz MoSCoW
**Ruta Principal:** `/moscow/seleccion`
**Propósito:** Priorización ágil de requisitos de software y features de un producto.
**Características Clave:**
* **Columnas Clasificatorias:** Must Have (Obligatorio), Should Have (Importante), Could Have (Deseable) y Won't Have (Descartado).
* **Estimación de Esfuerzo:** Cada tarjeta permite establecer el nivel de esfuerzo técnico esperado, lo que ayuda a planificar Sprints.

## 4. Tablero Kanban
**Ruta Principal:** `/kanban/seleccion`
**Propósito:** Flujo de trabajo y gestión del progreso visual continuo.
**Características Clave:**
* **Flujo Clásico:** Columnas de Backlog, To Do, In Progress, Review y Done.
* **Estados y Responsables:** Seguimiento detallado de quién está encargado de qué tarjeta.

## 5. Lean Canvas
**Ruta Principal:** `/leancanvas/seleccion`
**Propósito:** Modelado y validación de modelos de negocio (basado en Ash Maurya).
**Características Clave:**
* **9 Bloques Fundamentales:** Problema, Solución, Propuesta de Valor, Métricas, Ventajas Injustas, Canales, Segmentos, Costos e Ingresos.
* **Sistema de Hipótesis y Validación:** Cada nota añadida al canvas tiene un estado de color (Hipótesis [Gris], Validación [Naranja], Validado [Verde]).
* **Historial de Versiones:** Permite guardar versiones "v1", "v2" y comparar los cambios entre pivotes del modelo de negocio.

## 6. Diagramas de Flujo
**Ruta Principal:** `/diagramas/seleccion`
**Propósito:** Mapeo de procesos lógicos, algoritmos y flujos de usuario.
**Características Clave:**
* **Snap-to-Grid:** Lienzo con ajuste a la cuadrícula magnético.
* **Nodos Inteligentes:** Formas predeterminadas (Inicio, Proceso, Condición, Fin) que pueden conectarse dinámicamente mediante flechas vectoriales SVG.

## 7. Diagramas de Base de Datos (DBML / ER)
**Ruta Principal:** `/dbdiagrams/seleccion`
**Propósito:** Diseño visual y arquitectura de modelos relacionales de bases de datos.
**Características Clave:**
* **Auto-Generación por Código:** Permite pegar código `SQL` o `DBML` (Database Markup Language) y el motor renderizará las tablas y sus relaciones (1:N, N:M) de manera automática en el lienzo.
* **Conexiones Dinámicas:** Las líneas entre llaves foráneas y primarias se re-enrutan automáticamente al mover las tablas.

## 8. Casos de Uso (UML)
**Ruta Principal:** `/casosdeuso/seleccion`
**Propósito:** Modelado del comportamiento del sistema y la interacción de los usuarios (actores).
**Características Clave:**
* **Lienzo Infinito interactivo:** Pan y Zoom nativo para diagramas UML complejos.
* **Elementos Estandarizados:** Renderización de Actores (stickman), Casos de Uso (óvalos) y *System Boundaries* (Límites del sistema rectangulares).

---

## Resumen de Funciones Universales
A través de las 8 herramientas, los siguientes patrones se han estandarizado:
- **Barra de Navegación Global (Topbar):** Diseño uniforme en todos los módulos con acceso rápido al inicio y al tema.
- **Formato `.rikka`:** Todas las herramientas incluyen un botón `Descargar .rikka`, que genera un payload JSON con toda la metadata del proyecto para su portabilidad offline.
- **Ayuda Contextual Modal:** El botón `❓ Ayuda` siempre invoca un modal interactivo con reglas y tips "Prime" sobre cómo usar la metodología o herramienta actual.
