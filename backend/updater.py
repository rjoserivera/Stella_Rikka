"""
updater.py — Sistema de auto-actualización de Stella Rikka Suite
Verifica GitHub Releases y notifica al usuario si hay una versión nueva.
"""

import threading
import json
import urllib.request
import urllib.error
from packaging import version

# ── Configuración ──────────────────────────────────────────
CURRENT_VERSION = "1.0.0"
GITHUB_USER     = "tu-usuario"          # ← Cambiar cuando subas a GitHub
GITHUB_REPO     = "stella-rikka-suite"
RELEASES_URL    = f"https://api.github.com/repos/{GITHUB_USER}/{GITHUB_REPO}/releases/latest"
TIMEOUT_SECONDS = 5

# Estado compartido (thread-safe)
_update_info = {
    "checked":      False,
    "available":    False,
    "latest":       CURRENT_VERSION,
    "url":          "",
    "release_name": "",
    "body":         "",
}


def get_current_version() -> str:
    return CURRENT_VERSION


def get_update_info() -> dict:
    """Devuelve el estado actual de la verificación de actualización."""
    return dict(_update_info)


def _check_in_background():
    """Verifica GitHub Releases en un hilo de fondo (no bloquea el inicio)."""
    try:
        req = urllib.request.Request(
            RELEASES_URL,
            headers={
                "User-Agent":  f"StellaRikka/{CURRENT_VERSION}",
                "Accept":      "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            }
        )
        with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
            data = json.loads(resp.read().decode())

        latest_tag  = data.get("tag_name", "").lstrip("v")
        release_url = data.get("html_url", "")
        release_name = data.get("name", latest_tag)
        body        = data.get("body", "")

        is_newer = version.parse(latest_tag) > version.parse(CURRENT_VERSION)

        _update_info.update({
            "checked":      True,
            "available":    is_newer,
            "latest":       latest_tag,
            "url":          release_url,
            "release_name": release_name,
            "body":         body,
        })

    except Exception:
        # Fallo silencioso — no interrumpir la app por una verificación fallida
        _update_info["checked"] = True


def start_update_check():
    """Inicia la verificación en background. Llamar al arrancar la app."""
    thread = threading.Thread(target=_check_in_background, daemon=True)
    thread.start()
