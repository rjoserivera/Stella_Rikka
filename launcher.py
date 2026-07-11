import os
import sys
import threading
import webbrowser
import pystray
from PIL import Image

# Importar el backend (Flask app y updater)
from backend.app import app, start_update_check

def run_server():
    """Ejecuta el servidor Flask en un hilo secundario."""
    start_update_check()
    # Usar use_reloader=False es vital para que no se duplique el proceso en el hilo
    app.run(port=5000, debug=False, use_reloader=False)

def open_browser(icon, item):
    """Abre la suite en el navegador predeterminado."""
    webbrowser.open('http://localhost:5000')

def exit_app(icon, item):
    """Cierra la aplicación y el servidor."""
    icon.stop()
    os._exit(0)

if __name__ == '__main__':
    # 1. Iniciar servidor Flask en segundo plano
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    # 2. Cargar el icono para la bandeja del sistema (System Tray)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    icon_path = os.path.join(base_dir, 'frontend', 'assets', 'stella_rikka_logo.ico')
    image = Image.open(icon_path)

    # 3. Crear el menú del click derecho
    menu = pystray.Menu(
        pystray.MenuItem('Abrir Stella Rikka', open_browser, default=True),
        pystray.MenuItem('Salir', exit_app)
    )

    # 4. Configurar e iniciar el icono en la barra de tareas
    icon = pystray.Icon('Stella Rikka', image, 'Stella Rikka Suite', menu)
    
    # 5. Abrir la página automáticamente al iniciar
    webbrowser.open('http://localhost:5000')
    
    # 6. Mantener el programa corriendo en el System Tray
    icon.run()
