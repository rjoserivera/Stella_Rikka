# Análisis de Seguridad (Security Analysis)

El siguiente documento detalla la postura de seguridad de **Stella Rikka**, identificando riesgos conocidos, mitigaciones implementadas y consideraciones críticas para entornos de red.

## 1. Arquitectura Base (Local-First)
Stella Rikka fue diseñada originalmente como una aplicación *Local-First* monousuario.
* **Backend:** Flask (Python) ejecutándose localmente.
* **Almacenamiento:** Archivos JSON planos en el directorio `backend/data/`.
* **Red:** Por defecto, Flask se enlaza únicamente a `127.0.0.1:5000` (`localhost`), haciéndola inaccesible desde otras computadoras en la misma red LAN a menos que se configure explícitamente el `host="0.0.0.0"`.

### Postura de Seguridad Local: **ALTA**
En modo estrictamente local, la aplicación hereda la seguridad del sistema operativo del usuario. No hay exposición de puertos al exterior y los archivos se guardan con los permisos del usuario activo.

---

## 2. Prevención de Vulnerabilidades Clásicas

### 2.1 Cross-Site Scripting (XSS)
- **Riesgo:** Inyección de scripts maliciosos a través de inputs como nombres de proyectos, tareas en Kanban, descripciones de Hub o notas en Lean Canvas.
- **Mitigación:** El frontend utiliza métodos seguros de inserción en el DOM. Se emplea la función utilitaria `escHtml()` en la gran mayoría de las renderizaciones (ej. `String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')...`) para neutralizar etiquetas HTML no confiables.
- **Conclusión:** Riesgo bajo, aunque debe mantenerse la disciplina de escapar datos al añadir nuevos módulos.

### 2.2 Path Traversal (Salto de Directorios)
- **Riesgo:** Que un usuario malintencionado solicite archivos fuera del entorno del frontend mediante `../../`.
- **Mitigación:** La API del backend sirve archivos estáticos utilizando la función nativa `send_from_directory()` de Flask, la cual de manera intrínseca sanitiza las rutas relativas y previene el salto de directorios fuera de la carpeta designada (`FRONTEND_DIR`).
- **Conclusión:** Protegido nativamente por el framework.

### 2.3 Command Injection (Inyección de Comandos)
- **Riesgo:** Inyección de comandos en llamadas a `subprocess`.
- **Mitigación:** El único lugar donde se utiliza `subprocess` es en `host_manager.py` para levantar el túnel SSH. Los argumentos se pasan como una lista estricta (ej. `["ssh", "-R", "80:127.0.0.1:5000", "serveo.net"]`) y no existe concatenación de strings provistos por el usuario.
- **Conclusión:** Seguro.

---

## 3. Riesgos Críticos: Túnel de Colaboración (Cloud Sharing)

Stella Rikka posee un módulo para compartir el entorno local a través de Internet utilizando un túnel SSH inverso (`serveo.net`). **Aquí reside el mayor riesgo de seguridad de la suite.**

### 3.1 Falta de Autenticación y Autorización (CWE-284)
- **Vulnerabilidad:** La suite **carece completamente de un sistema de login, contraseñas o tokens de sesión**. Si el túnel está activo, cualquier persona en el mundo que posea (o adivine) la URL generada (`https://[subdominio].serveo.net`) tiene acceso total de Lectura y Escritura a toda la suite.
- **Impacto:** **Crítico.** Un atacante podría borrar proyectos, modificar bases de datos o inyectar código en los JSON locales del usuario anfitrión.
- **Mitigación Actual:** 
  1. **Aislamiento del Host:** Se bloquean los endpoints de control del túnel (`/api/host/start` y `/stop`) para requests que contengan la cabecera `X-Forwarded-For`.
  2. **Bloqueo de Eliminación (Read-Only Parcial):** El middleware intercepta cualquier petición `DELETE` hacia endpoints de `/proyectos` si la IP proviene de un invitado, arrojando un error 403. Esto protege la suite de borrados masivos malintencionados.
  3. **Auto-Backups de Seguridad:** Justo antes de abrir el túnel, el sistema clona toda la carpeta `data/` en `data_backups/auto_backup_[TIMESTAMP]`. Si los invitados alteran o dañan el proyecto, el host puede revertir los cambios manualmente usando esta instantánea.
  4. **Monitoreo en Tiempo Real:** El frontend realiza un sondeo cada 5 segundos al endpoint `/api/host/connections` para informar al anfitrión cuántos dispositivos activos (`X-Forwarded-For` únicos) hay dentro del túnel.
- **Mitigación Recomendada (Futuro):** Implementar *HTTP Basic Auth* en Flask, o un mecanismo de token simple que exija una clave en el frontend antes de renderizar la aplicación cuando se accede desde una IP no local.

### 3.2 Denegación de Servicio (DoS) en Archivos JSON
- **Vulnerabilidad:** Al no haber validación de longitud ni control de cuotas en el payload JSON que recibe el backend (`PUT` o `POST`), un atacante conectado por el túnel podría enviar un payload gigantesco de varios Gigabytes repetidas veces.
- **Impacto:** **Medio/Alto.** Agotamiento del espacio en disco (Disk Exhaustion) de la computadora host, o agotamiento de la memoria (OOM) en el proceso Python al intentar hacer `json.loads()`.
- **Mitigación Recomendada (Futuro):** Limitar en Flask el tamaño máximo del cuerpo de las peticiones (`app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024` para 16MB).

---

## 4. Conclusión y Recomendaciones

Stella Rikka es una herramienta **muy segura para uso personal en modo offline o red local (localhost)**. Las vulnerabilidades comunes de inyección y path traversal están bien cubiertas.

Sin embargo, el **Modo de Colaboración en la Nube es fundamentalmente inseguro** en su estado actual para entornos hostiles o públicos debido a la falta de autenticación.

**Guía para el Usuario Final:**
1. Activa el túnel solo cuando vayas a compartir explícitamente en el momento con un colega de confianza.
2. Cierra el túnel en cuanto termines la sesión colaborativa.
3. No compartas el enlace del túnel en foros o chats públicos.
