"""
SANKET · AI — Knowledge Graph Store
In-memory NetworkX graph singleton for safety signal connections.
"""

import networkx as nx
import json
from datetime import datetime


class GraphStore:
    """
    Process-wide NetworkX graph instance.
    Nodes = Equipment, Location, Barrier Failures, Energy Sources, LSR Rules.
    Edges = Co-occurrence weight.
    """

    def __init__(self):
        self.graph = nx.Graph()
        self._report_registry: dict[str, list[str]] = {}  # report_id -> [node_ids]

    def add_report_entities(
        self,
        report_id: str,
        entities: list[dict],
        lsr_rules: list[dict] = None,
        sif_label: str = "LOW",
        timestamp: str = None,
    ):
        """
        Update graph with entities from a processed report.
        Creates nodes and co-occurrence edges between all entity pairs.
        """
        node_ids = []

        # Add entity nodes
        for ent in entities:
            node_id = f"{ent['type']}:{ent['value']}"
            if not self.graph.has_node(node_id):
                self.graph.add_node(
                    node_id,
                    label=ent["value"],
                    type=ent["type"],
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

            node_ids.append(node_id)

        # Add LSR rule nodes
        if lsr_rules:
            for rule in lsr_rules:
                rule_id = f"LSR:{rule['rule_name']}"
                if not self.graph.has_node(rule_id):
                    self.graph.add_node(
                        rule_id,
                        label=rule["rule_name"],
                        type="LSR_VIOLATION",
                        report_count=0,
                        last_seen=timestamp or datetime.utcnow().isoformat(),
                    )
                self.graph.nodes[rule_id]["report_count"] += 1
                node_ids.append(rule_id)

                # Connect entities to LSR violations
                for entity_node_id in node_ids:
                    if entity_node_id != rule_id:
                        self._add_edge(entity_node_id, rule_id, "violates_rule", report_id)

        # Create co-occurrence edges between all entity pairs
        for i in range(len(node_ids)):
            for j in range(i + 1, len(node_ids)):
                if node_ids[i] != node_ids[j]:
                    self._add_edge(node_ids[i], node_ids[j], "co_occurred_with", report_id)

        # Track which nodes this report touched
        self._report_registry[report_id] = node_ids

    def _add_edge(self, source: str, target: str, edge_type: str, report_id: str):
        """Add or increment an edge between two nodes."""
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
                "edge_type": edge_data.get("edge_type", "co_occurred_with"),
            })

        return sorted(neighbors, key=lambda x: x["weight"], reverse=True)

    def get_node_report_count(self, node_id: str) -> int:
        """Count reports touching a specific node."""
        if not self.graph.has_node(node_id):
            return 0
        return self.graph.nodes[node_id].get("report_count", 0)

    def to_cytoscape_json(self, max_nodes: int = 200) -> dict:
        """
        Serialize graph to Cytoscape.js-compatible JSON format.
        """
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
                        "edge_type": data.get("edge_type", "co_occurred_with"),
                    },
                })

        return {"nodes": nodes, "edges": edges}

    @property
    def node_count(self) -> int:
        return self.graph.number_of_nodes()

    @property
    def edge_count(self) -> int:
        return self.graph.number_of_edges()


# Singleton
graph_store = GraphStore()
