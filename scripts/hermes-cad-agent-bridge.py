#!/usr/bin/env python3
"""Local-only Hermes CAD agent bridge.

Binds to 127.0.0.1 so every browser/PC talks only to the Hermes agent running on
that same PC. The browser never receives API keys and never talks to another
machine's agent.
"""
from __future__ import annotations

import json
import os
import shutil
import socket
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

HOST = "127.0.0.1"
PORT = int(os.environ.get("HERMES_CAD_BRIDGE_PORT", "8766"))
ALLOWED_ORIGINS = {
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://192.168.178.21:5173",
}
MAX_BODY_BYTES = 2_000_000


def response_json(handler: BaseHTTPRequestHandler, status: int, payload: dict[str, Any]) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    origin = handler.headers.get("Origin")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    if origin in ALLOWED_ORIGINS:
      handler.send_header("Access-Control-Allow-Origin", origin)
      handler.send_header("Vary", "Origin")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.end_headers()
    handler.wfile.write(body)


def build_prompt(request: dict[str, Any]) -> str:
    return """
Du bist Hermes im Zeichnungsmodus für das Hermes CAD Sketching Programm.
Antworte ausschließlich als JSON mit dieser Form:
{"ok": true, "message": "kurze natürliche deutsche Antwort", "commands": "CAD-Befehl oder mehrere Zeilen"}

Verhalten:
- Normale Nachrichten, Begrüßungen und Rückfragen beantwortest du natürlich wie im Telegram-Chat.
- Wenn die Nachricht zusätzlich eine CAD-Aktion verlangt, lege die sichere Aktion in commands ab und erkläre sie kurz in message.

Sicherheitsregeln:
- Dies ist der lokale PC-Agent dieses Users. Keine fremden PC-/LAN-Agenten verwenden.
- Nutze nur sichere Hermes-CAD-Befehle: line, rectangle, box, move, rotate_z, resize, push_pull, extrude, delete, select, list.
- Keine Shell-Befehle, keine API-Keys, keine Systemänderungen.
- Wenn kein CAD-Befehl sinnvoll ist, gib commands als leeren String zurück und erkläre kurz.

Aktuelle Anfrage:
""".strip() + "\n" + json.dumps(request, ensure_ascii=False)


class Handler(BaseHTTPRequestHandler):
    server_version = "HermesCadAgentBridge/1.0"

    def do_OPTIONS(self) -> None:  # noqa: N802
        response_json(self, 204, {})

    def do_GET(self) -> None:  # noqa: N802
        if self.path != "/hermes-cad/identity":
            response_json(self, 404, {"ok": False, "message": "Unbekannter Endpunkt."})
            return
        response_json(self, 200, {
            "user": os.environ.get("USER") or os.environ.get("USERNAME") or "unknown",
            "hostname": socket.gethostname(),
            "profile": os.environ.get("HERMES_PROFILE", "default"),
        })

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/hermes-cad/agent":
            response_json(self, 404, {"ok": False, "message": "Unbekannter Endpunkt."})
            return
        origin = self.headers.get("Origin")
        if origin and origin not in ALLOWED_ORIGINS:
            response_json(self, 403, {"ok": False, "message": "Origin nicht erlaubt."})
            return
        length = int(self.headers.get("Content-Length", "0") or 0)
        if length <= 0 or length > MAX_BODY_BYTES:
            response_json(self, 413, {"ok": False, "message": "Anfrage ist leer oder zu groß."})
            return
        try:
            request = json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            response_json(self, 400, {"ok": False, "message": "Ungültiges JSON."})
            return
        if request.get("schema") != "hermes-cad-agent-request/v1" or request.get("userPolicy") != "local-pc-agent-only":
            response_json(self, 400, {"ok": False, "message": "Ungültiger Hermes-CAD-Agent-Vertrag."})
            return
        hermes = shutil.which(os.environ.get("HERMES_CAD_HERMES_BIN", "hermes"))
        if not hermes:
            response_json(self, 503, {"ok": False, "message": "Hermes CLI wurde auf diesem PC nicht gefunden.", "commands": ""})
            return
        prompt = build_prompt(request)
        try:
            completed = subprocess.run(
                [hermes, "chat", "--quiet", "--source", "hermes-cad-sketcher", "--toolsets", "safe", "-q", prompt],
                text=True,
                capture_output=True,
                timeout=int(os.environ.get("HERMES_CAD_AGENT_TIMEOUT", "120")),
                check=False,
            )
        except subprocess.TimeoutExpired:
            response_json(self, 504, {"ok": False, "message": "Hermes Agent hat zu lange gebraucht.", "commands": ""})
            return
        raw = completed.stdout.strip()
        try:
            payload = json.loads(raw[raw.find("{"):raw.rfind("}") + 1])
        except Exception:
            payload = {"ok": completed.returncode == 0, "message": raw or completed.stderr.strip() or "Hermes Agent hat keine Antwort geliefert.", "commands": ""}
        response_json(self, 200, payload)


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Hermes CAD Agent Bridge läuft auf http://{HOST}:{PORT}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
