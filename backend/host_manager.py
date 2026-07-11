import subprocess
import threading
import re
import atexit
from flask import jsonify, request

_tunnel_process = None
_tunnel_url = None
_lock = threading.Lock()

def _cleanup_tunnel():
    global _tunnel_process, _tunnel_url
    if _tunnel_process:
        try:
            _tunnel_process.kill()
        except:
            pass
    _tunnel_process = None
    _tunnel_url = None

atexit.register(_cleanup_tunnel)

def init_host_api(app):
    import time
    active_ips = {}

    @app.before_request
    def track_connections():
        ip = request.headers.get('X-Forwarded-For')
        if ip:
            ip = ip.split(',')[0].strip()
            active_ips[ip] = time.time()
            
            # Protección contra eliminación de proyectos por invitados
            if request.method == 'DELETE' and '/proyectos' in request.path:
                return jsonify({'error': 'Acceso denegado: Invitados no pueden eliminar proyectos.'}), 403

    @app.route('/api/host/connections', methods=['GET'])
    def host_connections():
        # Bloquear acceso a invitados remotos
        if request.headers.get('X-Forwarded-For'):
            return jsonify({'error': 'Acción no permitida'}), 403
            
        current_time = time.time()
        # Limpiar IPs expiradas (más de 30 segundos)
        keys_to_delete = [ip for ip, last_seen in active_ips.items() if current_time - last_seen > 30]
        for k in keys_to_delete:
            del active_ips[k]
            
        return jsonify({'count': len(active_ips)})

    @app.route('/api/host/status', methods=['GET'])
    def host_status():
        return jsonify({
            'active': _tunnel_url is not None,
            'url': _tunnel_url
        })

    @app.route('/api/host/start', methods=['POST'])
    def host_start():
        import shutil
        import os
        import datetime
        
        # Verificación de seguridad: Bloquear si viene de la web (invitados)
        if request.headers.get('X-Forwarded-For'):
            return jsonify({'error': 'Acción no permitida para invitados remotos.'}), 403
            
        global _tunnel_process, _tunnel_url
        with _lock:
            if _tunnel_url:
                return jsonify({'url': _tunnel_url}), 200
            
            try:
                # ── Auto-Backup de Seguridad ──
                # Crea un respaldo de toda la carpeta /data antes de abrir el túnel
                from backend.config import DATA_DIR_BASE
                data_dir = DATA_DIR_BASE
                backups_dir = os.path.join(os.path.dirname(DATA_DIR_BASE), 'data_backups')
                os.makedirs(backups_dir, exist_ok=True)
                timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
                backup_path = os.path.join(backups_dir, f'auto_backup_{timestamp}')
                if os.path.exists(data_dir):
                    shutil.copytree(data_dir, backup_path, dirs_exist_ok=True)
                # ──────────────────────────────
                # Usa SSH nativo de Windows para evadir antivirus y evitar ngrok
                # Usamos serveo.net y forzamos 127.0.0.1 en lugar de localhost para evitar el Error 502
                cmd = ["ssh", "-R", "80:127.0.0.1:5000", "serveo.net", "-o", "StrictHostKeyChecking=no"]
                
                # creationflags=0x08000000 oculta la ventana de cmd en Windows (CREATE_NO_WINDOW)
                _tunnel_process = subprocess.Popen(
                    cmd, 
                    stdout=subprocess.PIPE, 
                    stderr=subprocess.STDOUT, 
                    text=True,
                    creationflags=0x08000000
                )
                
                # Leer la salida para capturar la URL generada
                import time
                start_time = time.time()
                while time.time() - start_time < 12:
                    line = _tunnel_process.stdout.readline()
                    if not line:
                        break
                    # Busca el subdominio generado por serveo
                    match = re.search(r'(https://[a-zA-Z0-9.-]+\.serveo(?:usercontent\.com|\.net))', line)
                    if match:
                        _tunnel_url = match.group(1)
                        return jsonify({'url': _tunnel_url}), 200
                
                _cleanup_tunnel()
                return jsonify({'error': 'No se pudo obtener la URL de Serveo a tiempo. Intenta nuevamente.'}), 500

            except Exception as e:
                _cleanup_tunnel()
                return jsonify({'error': str(e)}), 500

    @app.route('/api/host/stop', methods=['POST'])
    def host_stop():
        # Verificación de seguridad: Bloquear si viene de la web (invitados)
        if request.headers.get('X-Forwarded-For'):
            return jsonify({'error': 'Acción no permitida para invitados remotos.'}), 403
            
        with _lock:
            _cleanup_tunnel()
        return jsonify({'mensaje': 'Host detenido'})
