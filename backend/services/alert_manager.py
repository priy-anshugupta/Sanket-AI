"""
SANKET · AI — WebSocket Real-Time Alert System
<500ms push to Control Room dashboard for critical SIF precursors.

Implements Mentor Feedback Challenge 2: Zero-Delay Emergency Reflex.
"""

import asyncio
import json
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set


class AlertManager:
    """
    Manages WebSocket connections for real-time SIF alert push.
    
    When a report scores >= 0.85 (CRITICAL SIF), the alert is pushed
    instantly to all connected Control Room dashboards without polling.
    """

    def __init__(self):
        self._connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)
        print(f"[AlertManager] Control Room connected. Active: {len(self._connections)}")

    async def disconnect(self, websocket: WebSocket):
        """Remove a disconnected WebSocket."""
        async with self._lock:
            self._connections.discard(websocket)
        print(f"[AlertManager] Control Room disconnected. Active: {len(self._connections)}")

    async def broadcast_sif_alert(self, alert_data: dict):
        """
        Push a critical SIF alert to ALL connected Control Room dashboards.
        
        This is the core of the <500ms Emergency Reflex:
        - Called immediately after SIF classification completes
        - No polling delay — instant WebSocket push
        - Includes: report_id, sif_score, sif_label, location, raw_text, timestamp
        """
        if not self._connections:
            return

        message = json.dumps({
            "type": "SIF_ALERT",
            "priority": "CRITICAL" if alert_data.get("sif_score", 0) >= 0.85 else "HIGH",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "data": alert_data,
        })

        dead_connections = set()
        async with self._lock:
            for ws in self._connections:
                try:
                    await ws.send_text(message)
                except Exception:
                    dead_connections.add(ws)

            # Clean up dead connections
            self._connections -= dead_connections

    async def broadcast_report_update(self, report_id: str, status: str, sif_label: str = None):
        """Push a report status update (COMPLETED/FAILED) to all dashboards."""
        if not self._connections:
            return

        message = json.dumps({
            "type": "REPORT_UPDATE",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "data": {
                "report_id": report_id,
                "status": status,
                "sif_label": sif_label,
            },
        })

        dead_connections = set()
        async with self._lock:
            for ws in self._connections:
                try:
                    await ws.send_text(message)
                except Exception:
                    dead_connections.add(ws)
            self._connections -= dead_connections

    async def broadcast_new_report(self, report_data: dict):
        """Push a newly ingested and classified report to all dashboards for instant live sync."""
        if not self._connections:
            return

        message = json.dumps({
            "type": "NEW_REPORT",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "data": report_data,
        })

        dead_connections = set()
        async with self._lock:
            for ws in self._connections:
                try:
                    await ws.send_text(message)
                except Exception:
                    dead_connections.add(ws)
            self._connections -= dead_connections

    @property
    def active_connections(self) -> int:
        return len(self._connections)


# Singleton
alert_manager = AlertManager()
