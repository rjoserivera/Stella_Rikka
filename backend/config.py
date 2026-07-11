import os

# Directorio base del proyecto
BASE_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def get_data_dir():
    # If installed in Program Files, use APPDATA to avoid permission denied
    if "Program Files" in BASE_PATH or "ProgramFiles" in BASE_PATH:
        appdata = os.environ.get('LOCALAPPDATA', os.path.expanduser('~'))
        return os.path.join(appdata, 'StellaRikka', 'data')
    return os.path.join(BASE_PATH, 'backend', 'data')

DATA_DIR_BASE = get_data_dir()
os.makedirs(DATA_DIR_BASE, exist_ok=True)
