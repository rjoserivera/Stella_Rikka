<div align="center">
  <img src="installer/stella_rikka_logo.ico" alt="Stella Rikka Logo" width="120" />
  <h1>Stella Rikka v1.0</h1>
  <p><strong>Tu espacio personal de ingeniería, diseño y gestión de proyectos.</strong></p>
  
  <!-- Badges de Lenguajes y Tecnologías -->
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  
  <br/><br/>
  
  <!-- Animación de los 6 Espíritus Rikka -->
  <img src="stella_animation.svg" alt="Animación Shun Shun Rikka" width="100%" />
</div>

---

> 🌍 **Bilingual Documentation / Documentación Bilingüe:** 
> All detailed technical documentation, API manuals, and user guides can be found in the `docs/` folder. Available in **English (`docs/en/`)** and **Spanish (`docs/es/`)**.
> 
> Toda la documentación técnica detallada, manuales de API y guías de usuario se encuentran en la carpeta `docs/`. Disponible en **Inglés (`docs/en/`)** y en **Español (`docs/es/`)**.

---

## 📋 Tabla de Contenidos

1. [Sobre el Proyecto](#-sobre-el-proyecto)
2. [El Alma del Proyecto (Lore)](#-el-alma-del-proyecto-lore)
3. [Características Principales](#-características-principales)
4. [Módulos Integrados](#-módulos-integrados-versión-10)
5. [Instalación y Configuración](#-instalación-y-configuración)
6. [Estructura del Proyecto](#-estructura-del-proyecto)
7. [Seguridad y Modo Nube](#-seguridad-y-modo-nube)
8. [Próximos Pasos](#-próximos-pasos)

---

## 💡 Sobre el Proyecto

**Stella Rikka** es una suite de productividad *Local-First* diseñada específicamente para ingenieros de software, analistas y diseñadores que necesitan un entorno centralizado, inmersivo y libre de distracciones.

A diferencia de otras herramientas que dependen de servidores externos, Stella Rikka procesa y almacena todo localmente. No hay bases de datos complejas de configurar; toda la información se guarda en archivos `.json` estructurados, garantizando portabilidad absoluta y tiempos de carga instantáneos.

---

## 🌺 El Alma del Proyecto (Lore)

¿Por qué "Stella Rikka"? El nombre es una declaración de intenciones y un tributo:

* **Stella (Estrella):** En esta suite, cada módulo es un punto de luz en tu sistema de trabajo. El Hub centraliza, el Kanban ejecuta, el Eisenhower prioriza. Son constelaciones de productividad unidas en un mismo cielo.
* **Rikka:** Es un homenaje al poder **"Shun Shun Rikka"** (Seis Flores de Escudo de Hibisco) de Orihime Inoue (del anime *Bleach*). Sus seis espíritus florales protegen el entorno, rechazan el daño exterior y sanan lo que está roto.

De la misma forma, esta suite protege tu código, tus ideas y tu flujo de trabajo. *Rechaza el caos y restaura el orden* mediante sus espíritus (módulos):
- **Hinagiku** 🛡️ Organiza tu visión *(Hub de Proyectos)*
- **Lily** 🌸 Valida tu modelo de negocio *(Lean Canvas)*
- **Baigon** 🌱 Prioriza lo verdaderamente esencial *(MoSCoW)*
- **Ayame** 🌷 Ejecuta y mantiene el flujo *(Tablero Kanban)*
- **Shun'o** 🌼 Clasifica lo urgente y lo importante *(Eisenhower)*
- **Tsubaki** 🗡️ Ataca el caos con diagramas *(Flujo / BD / UML)*

---

## 🚀 Características Principales

* 🔒 **Local-First (Privacidad Absoluta):** Sin nubes corporativas. Tus datos se guardan en `/backend/data/` en tu propio disco duro.
* 🌅 **Estética "Sea Horizon":** Una UI fluida con transiciones animadas entre el ciclo Día/Noche, efectos climáticos sutiles y diseño *glassmorphism*.
* 🔗 **Interconectividad de Nodos:** Todas las herramientas se comunican. Desde el Hub puedes abrir directamente un Tablero Kanban específico o un Diagrama de Base de Datos.
* 📦 **Exportación Nativa `.rikka`:** Lleva tus proyectos en un pendrive y ábrelos en otro ordenador descargando el paquete JSON unificado. También soporta exportación a `PNG` y `CSV`.
* 🌐 **Túnel SSH Seguro (BETA):** Comparte tu entorno local instantáneamente mediante un túnel inverso (Serveo) con protección de solo-lectura contra invitados y *Auto-Backups* defensivos.

---

## 🛠️ Módulos Integrados (Versión 1.0)

Actualmente en la versión 1.0, la suite cuenta con **8 módulos estabilizados**. Se planean nuevas herramientas para futuras versiones (ej. editor de código, terminal integrada).

1. **Hub (Gestor Documental):** El cerebro de tu proyecto. Estructura la ideación y el desarrollo en fases mediante nodos Markdown interactivos.
2. **Matriz de Eisenhower:** Divide y prioriza tareas en 4 cuadrantes (Hacer, Planificar, Delegar, Eliminar) con estadísticas en tiempo real.
3. **Matriz MoSCoW:** Ideal para desarrollo ágil de software. Divide requerimientos en *Must, Should, Could, Won't*.
4. **Tablero Kanban:** Gestiona el flujo de trabajo con columnas *Drag & Drop* (Backlog, To Do, In Progress, Review, Done) y responsables.
5. **Lean Canvas:** Modela la viabilidad de startups usando los 9 bloques clásicos de Ash Maurya, con seguimiento de hipótesis validadas.
6. **Diagramas de Flujo:** Lienzo infinito con función *Snap-to-Grid* magnética para mapear procesos y algoritmos.
7. **Diagramas de Base de Datos:** Motor automático. Pega tu código de creación de tablas (`SQL` o `DBML`) y el sistema dibujará las relaciones gráficamente.
8. **Casos de Uso UML:** Mapea la interacción entre los actores y los límites del sistema para ingeniería de requisitos.

---

## 💻 Instalación y Configuración

Dado que Stella Rikka utiliza Vanilla JS en el frontend y Flask en el backend, no se requiere Node.js ni compilaciones pesadas (Webpack/Vite).

### Prerrequisitos
- **Python 3.8 o superior**.

### Pasos de Ejecución Manual

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/stella-rikka.git
   cd stella-rikka
   ```

2. **Instala las dependencias del backend:**
   ```bash
   pip install -r requirements.txt
   ```
   *(Nota: Flask y dependencias menores).*

3. **Inicia el servidor:**
   ```bash
   cd backend
   python app.py
   ```

4. **Abre el proyecto:**
   Ve a tu navegador y entra en `http://127.0.0.1:5000`.

### Uso del Instalador (Windows)
Si descargaste el código fuente, la carpeta `/installer/` incluye los scripts de Inno Setup (`stella_rikka_setup.iss`) para empaquetar todo el proyecto en un único archivo ejecutable `.exe` profesional.

---

## 📁 Estructura del Proyecto

```text
stella-rikka/
├── backend/
│   ├── app.py                 # Servidor Flask principal y enrutador
│   ├── host_manager.py        # Gestor del túnel SSH y Auto-Backups
│   ├── data/                  # Aquí se guardan tus proyectos (JSON)
│   └── herramientas/          # Lógica backend dividida por módulo
├── frontend/
│   ├── css/                   # Sistema de diseño unificado (tema.css)
│   ├── js/                    # Lógica global (navbar.js, tema.js)
│   ├── hub/                   # HTML/JS/CSS específicos del Hub
│   ├── kanban/                # HTML/JS/CSS específicos de Kanban
│   └── (otros módulos...)
├── docs/                      # Documentación completa (Español e Inglés)
├── installer/                 # Archivos para compilar el .exe de Windows
└── README.md                  # Este archivo
```

---

## 🛡️ Seguridad y Modo Nube

Stella Rikka posee un modo de colaboración por Internet utilizando un túnel SSH inverso (`serveo.net`). Para proteger tus datos cuando compartes la URL pública, el sistema incluye:

- **Aislamiento de Host:** Los visitantes remotos no pueden apagar o reiniciar el servidor.
- **Bloqueo Anti-Borrado:** Los invitados no pueden ejecutar comandos `DELETE` a los proyectos; recibirán un error `403`.
- **Auto-Backups:** Al instante de abrir un túnel público, tu carpeta `/data/` se respalda entera automáticamente para que puedas revertir daños.

📚 *Para un desglose de seguridad más detallado, lee el documento `SECURITY_ANALYSIS.md` en la carpeta `docs/`.*

---

## 🔮 Próximos Pasos
- [ ] Módulo de Análisis DAFO (SWOT).
- [ ] Autenticación opcional mediante contraseña en modo túnel.
- [ ] Exportador global del proyecto a formato PDF corporativo.
- [ ] Herramienta para diagramas de secuencia UML.

---

## 📜 Licencia y Derechos Reservados

© 2026 Creador Original. Todos los derechos reservados.

El código fuente, arquitectura y diseño de **Stella Rikka** son propiedad de su creador. Queda prohibida su distribución comercial sin autorización expresa.

> 🔗 **Sigue el desarrollo en GitHub:** [github.com/rjoserivera](https://github.com/rjoserivera)

---

<div align="center">
  <p>Construido con dedicación para creativos e ingenieros. 🌌</p>
</div>
