"""
SANKET · AI — Knowledge Graph Store
In-memory NetworkX graph singleton with canonical entity normalization
and Bow-Tie Causal Risk chaining (Zero Noise, Zero Fragment Tokens).
"""

import networkx as nx
from datetime import datetime


# ── Canonical Normalization Dictionaries ──
CANONICAL_LOCATIONS = {
    "baghjan": "Baghjan Well #5",
    "well pad 7": "Well Pad 7",
    "pad 7": "Well Pad 7",
    "wellpad": "Well Pad 7",
    "moran": "Moran OCS-3",
    "ocs-3": "Moran OCS-3",
    "duliajan": "Duliajan Plant (HQ)",
    "naharkatia": "Naharkatia Field",
    "nhk": "Naharkatia Field",
    "digboi": "Digboi Pad 14",
    "geleki": "Geleki Processing",
    "lakwa": "Lakwa Gathering",
    "tengakhat": "Tengakhat Station",
    "rudrasagar": "Rudrasagar Pad 2",
}

CANONICAL_EQUIPMENT = {
    "bop": "Blowout Preventer (BOP)",
    "annular": "Blowout Preventer (BOP)",
    "pump": "Mud Circulation Pump",
    "pump-04": "Mud Circulation Pump",
    "crane": "Crawler Crane (5-Ton)",
    "lifting": "Crawler Crane (5-Ton)",
    "scaffold": "12m Scaffold Tower",
    "tower": "12m Scaffold Tower",
    "manifold": "High-Pressure Manifold",
    "forklift": "Heavy Industrial Forklift",
    "valve": "Isolation Gate Valve",
    "drill": "Pressurized Drill String",
    "pipe": "High-Pressure Piping",
    "hose": "Hydraulic Pressure Line",
    "tank": "Crude Storage Tank",
    "cylinder": "Gas Cylinder Bank",
}

CANONICAL_BARRIERS = {
    "containment": "Primary Well Containment",
    "bop seal": "BOP Valve Hydraulic Seal",
    "seal": "BOP Valve Hydraulic Seal",
    "harness": "100% Fall Arrest Harness",
    "tie off": "100% Fall Arrest Harness",
    "spotter": "Ground Lifting Spotter",
    "clearance": "Overhead Line Clearance",
    "speed": "Vehicle Speed Governor",
    "barrier": "Physical Crash Barrier",
    "permit": "PTW Hot Work Authorization",
    "lockout": "Lock-Out / Tag-Out Isolation",
    "cracked": "Pressure Gauge Barrier",
    "bypass": "Control System Bypass Approval",
}

CANONICAL_ENERGIES = {
    "pressure": "1800 PSI Gas Surge",
    "psi": "1800 PSI Gas Surge",
    "surge": "1800 PSI Gas Surge",
    "power": "33,000V Power Grid",
    "33kv": "33,000V Power Grid",
    "electric": "33,000V Power Grid",
    "gravity": "12m Fall Drop Energy",
    "height": "12m Fall Drop Energy",
    "flammable": "Pressurized Flammable Gas",
    "gas": "Pressurized Flammable Gas",
    "mechanical": "5-Ton Suspended Load",
    "load": "5-Ton Suspended Load",
    "h2s": "Toxic H2S Sour Gas",
}

STOP_WORDS = {
    "without", "with", "the", "and", "for", "from", "near", "under", "over", 
    "into", "that", "this", "been", "have", "were", "where", "cr", "essu", 
    "pipe", "drill", "hose", "tank", "valve"
}


class GraphStore:
    """
    Process-wide NetworkX graph instance.
    Nodes = Equipment, Location, Barrier Failures, Energy Sources, LSR Rules.
    Edges = Bow-Tie Causal Connections (No Complete Clique Noise).
    """

    def __init__(self):
        self.graph = nx.Graph()
        self._report_registry: dict[str, list[str]] = {}

    def normalize_entity(self, ent_type: str, ent_val: str) -> tuple[str, str] | None:
        """Clean and map raw entity string to canonical safety taxonomy."""
        v = ent_val.strip().lower()
        if len(v) < 3 or v in STOP_WORDS:
            return None

        t = ent_type.upper()

        if t == "LOCATION":
            for k, canonical in CANONICAL_LOCATIONS.items():
                if k in v:
                    return "LOCATION", canonical
            return "LOCATION", ent_val.title()

        if t == "EQUIPMENT":
            for k, canonical in CANONICAL_EQUIPMENT.items():
                if k in v:
                    return "EQUIPMENT", canonical
            return "EQUIPMENT", ent_val.title()

        if t in ["BARRIER_FAILURE", "BARRIER"]:
            for k, canonical in CANONICAL_BARRIERS.items():
                if k in v:
                    return "BARRIER_FAILURE", canonical
            return "BARRIER_FAILURE", f"{ent_val.title()} Barrier"

        if t in ["ENERGY_SOURCE", "ENERGY"]:
            for k, canonical in CANONICAL_ENERGIES.items():
                if k in v:
                    return "ENERGY_SOURCE", canonical
            return "ENERGY_SOURCE", f"{ent_val.title()} Hazard"

        if t == "ACTIVITY":
            if "emergency" in v or "swa" in v:
                return "ACTIVITY", "Emergency SWA Protocol"
            if "drill" in v:
                return "ACTIVITY", "Drilling Operations"
            if "lift" in v:
                return "ACTIVITY", "Mechanical Lifting"
            if "workover" in v:
                return "ACTIVITY", "Well Workover"
            if "maintenance" in v:
                return "ACTIVITY", "Preventive Maintenance"
            return "ACTIVITY", ent_val.title()

        return None

    def add_report_entities(
        self,
        report_id: str,
        entities: list[dict],
        lsr_rules: list[dict] = None,
        sif_label: str = "LOW",
        timestamp: str = None,
    ):
        """
        Update graph with canonical entities using Bow-Tie Causal Chains:
        Location <-> Equipment <-> Barrier Failure <-> LSR Rule <-> Energy Source.
        """
        locations = []
        equipments = []
        barriers = []
        energies = []
        activities = []
        lsr_nodes = []

        # 1. Process & Normalize Entity Nodes
        for ent in entities:
            norm = self.normalize_entity(ent.get("type", "UNKNOWN"), ent.get("value", ""))
            if not norm:
                continue

            canon_type, canon_label = norm
            node_id = f"{canon_type}:{canon_label}"

            if not self.graph.has_node(node_id):
                self.graph.add_node(
                    node_id,
                    label=canon_label,
                    type=canon_type,
                    report_count=0,
                    last_seen=timestamp or datetime.utcnow().isoformat(),
                    severity=sif_label,
                )

            self.graph.nodes[node_id]["report_count"] += 1
            self.graph.nodes[node_id]["last_seen"] = timestamp or datetime.utcnow().isoformat()

            # Escalate severity if higher
            severity_rank = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
            current = self.graph.nodes[node_id].get("severity", "LOW")
            if severity_rank.get(sif_label, 0) > severity_rank.get(current, 0):
                self.graph.nodes[node_id]["severity"] = sif_label

            if canon_type == "LOCATION":
                locations.append(node_id)
            elif canon_type == "EQUIPMENT":
                equipments.append(node_id)
            elif canon_type == "BARRIER_FAILURE":
                barriers.append(node_id)
            elif canon_type == "ENERGY_SOURCE":
                energies.append(node_id)
            elif canon_type == "ACTIVITY":
                activities.append(node_id)

        # 2. Process LSR Rules
        if lsr_rules:
            for rule in lsr_rules:
                r_name = rule.get("rule_name", "").strip()
                if not r_name:
                    continue
                rule_id = f"LSR:{r_name}"
                if not self.graph.has_node(rule_id):
                    self.graph.add_node(
                        rule_id,
                        label=r_name,
                        type="LSR_VIOLATION",
                        report_count=0,
                        last_seen=timestamp or datetime.utcnow().isoformat(),
                        severity=sif_label,
                    )
                self.graph.nodes[rule_id]["report_count"] += 1
                lsr_nodes.append(rule_id)

        # 3. 🔗 Bow-Tie Structured Causal Edges (No random dense hairball!)
        # Step A: Location <-> Equipment
        for loc in locations:
            for eq in equipments:
                self._add_edge(loc, eq, "deployed_at", report_id)

        # Step B: Activity <-> Equipment
        for act in activities:
            for eq in equipments:
                self._add_edge(act, eq, "operates_on", report_id)
            if not equipments:
                for loc in locations:
                    self._add_edge(act, loc, "conducted_at", report_id)

        # Step C: Equipment <-> Barrier Failure
        for eq in equipments:
            for bar in barriers:
                self._add_edge(eq, bar, "barrier_degradation", report_id)

        # Step D: Barrier Failure <-> LSR Violation
        for bar in barriers:
            for lsr in lsr_nodes:
                self._add_edge(bar, lsr, "violates_rule", report_id)

        # Step E: Equipment / Barrier <-> Energy Source
        for en in energies:
            for eq in equipments:
                self._add_edge(eq, en, "energy_containment_threat", report_id)
            for bar in barriers:
                self._add_edge(bar, en, "failed_energy_barrier", report_id)

        # Fallback: If no barrier or equipment, connect Location <-> LSR
        if not equipments and not barriers:
            for loc in locations:
                for lsr in lsr_nodes:
                    self._add_edge(loc, lsr, "site_rule_violation", report_id)

        all_touched = locations + equipments + barriers + energies + activities + lsr_nodes
        self._report_registry[report_id] = all_touched

    def _add_edge(self, source: str, target: str, edge_type: str, report_id: str):
        """Add or increment a structured causal edge between two nodes."""
        if source == target:
            return
        if self.graph.has_edge(source, target):
            self.graph[source][target]["weight"] += 1
            report_ids = self.graph[source][target].get("report_ids", [])
            if report_id not in report_ids:
                report_ids.append(report_id)
            self.graph[source][target]["report_ids"] = report_ids
        else:
            self.graph.add_edge(
                source, target,
                edge_type=edge_type,
                weight=1,
                report_ids=[report_id],
            )

    def get_neighbors(self, node_id: str, max_depth: int = 1) -> list[dict]:
        """Get neighboring nodes with edge info."""
        if not self.graph.has_node(node_id):
            return []

        neighbors = []
        for neighbor in self.graph.neighbors(node_id):
            edge_data = self.graph[node_id][neighbor]
            neighbors.append({
                "node_id": neighbor,
                "label": self.graph.nodes[neighbor].get("label", ""),
                "type": self.graph.nodes[neighbor].get("type", ""),
                "weight": edge_data.get("weight", 1),
                "edge_type": edge_data.get("edge_type", "causal_link"),
            })

        return sorted(neighbors, key=lambda x: x["weight"], reverse=True)

    def get_node_report_count(self, node_id: str) -> int:
        """Count reports touching a specific node."""
        if not self.graph.has_node(node_id):
            return 0
        return self.graph.nodes[node_id].get("report_count", 0)

    def to_cytoscape_json(self, max_nodes: int = 120) -> dict:
        """Serialize graph to Cytoscape.js-compatible JSON format with clean degree sorting."""
        nodes = []
        for node_id, data in list(self.graph.nodes(data=True))[:max_nodes]:
            nodes.append({
                "data": {
                    "id": node_id,
                    "label": data.get("label", node_id),
                    "type": data.get("type", "UNKNOWN"),
                    "report_count": data.get("report_count", 0),
                    "severity": data.get("severity", "LOW"),
                },
            })

        node_ids_set = {n["data"]["id"] for n in nodes}
        edges = []
        for source, target, data in self.graph.edges(data=True):
            if source in node_ids_set and target in node_ids_set:
                edges.append({
                    "data": {
                        "id": f"{source}___{target}",
                        "source": source,
                        "target": target,
                        "weight": data.get("weight", 1),
                        "edge_type": data.get("edge_type", "causal_link"),
                    },
                })

        return {"nodes": nodes, "edges": edges}

    def clear(self):
        """Reset graph store."""
        self.graph.clear()
        self._report_registry.clear()

    @property
    def node_count(self) -> int:
        return self.graph.number_of_nodes()

    @property
    def edge_count(self) -> int:
        return self.graph.number_of_edges()


# Singleton
graph_store = GraphStore()
