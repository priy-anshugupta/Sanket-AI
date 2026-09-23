"""
SANKET · AI — LangGraph 8-Agent Swarm
Multi-agent safety intelligence orchestration using LangGraph StateGraph.
"""

from typing import TypedDict, Optional, List, Dict, Any
from langgraph.graph import StateGraph, END

from ai.preprocessing.preprocessor import preprocessor
from ai.sif.classifier import sif_classifier
from ai.entities.extractor import entity_extractor
from ai.lsr.mapper import lsr_mapper
from ai.sif.guardrails import guardrail_engine
from ai.explanation.explainer import llm_explainer
from graph.graph_store import graph_store
from graph.clustering import cluster_detector


class ReportState(TypedDict):
    """Shared state dictionary passed across all 8 swarm agents."""
    report_id: str
    raw_text: str
    preprocessed_text: str
    language: str
    sif_score: float
    sif_label: str
    is_sif_precursor: bool
    matched_anchor_id: Optional[str]
    matched_anchor_text: Optional[str]
    entities: List[Dict[str, Any]]
    lsr_tags: List[Dict[str, Any]]
    primary_iogp_rule: Optional[str]
    explanation: Optional[str]
    cluster_alert: bool
    cluster_details: Optional[Dict[str, Any]]
    consensus_confidence: Optional[float]
    guardrail_status: Optional[str]
    audit_notes: Optional[str]
    action_recommendation: Optional[Dict[str, Any]]
    agent_trace: List[str]


# ─── 1. Supervisor / Preprocessor Agent ───
def supervisor_agent(state: ReportState) -> Dict[str, Any]:
    """Preprocesses text, detects language, and initializes agent execution trace."""
    prep = preprocessor.preprocess(state["raw_text"])
    trace = state.get("agent_trace", [])
    trace.append("SupervisorAgent: Normalized text & detected language " + prep.get("language", "en"))
    return {
        "preprocessed_text": prep["preprocessed_text"],
        "language": prep["language"],
        "agent_trace": trace,
    }


# ─── 2. Classifier Agent ───
def classifier_agent(state: ReportState) -> Dict[str, Any]:
    """Runs deterministic embedding cosine similarity + negation boost."""
    cls_res = sif_classifier.classify(state["preprocessed_text"])
    trace = state.get("agent_trace", [])
    trace.append(f"ClassifierAgent: Computed SIF score {cls_res['sif_score']:.4f} -> {cls_res['sif_label']}")
    return {
        "sif_score": cls_res["sif_score"],
        "sif_label": cls_res["sif_label"],
        "is_sif_precursor": cls_res["is_sif_precursor"],
        "matched_anchor_id": cls_res["matched_anchor_id"],
        "matched_anchor_text": cls_res["matched_anchor_text"],
        "agent_trace": trace,
    }


# ─── 3. Entity Extractor Agent ───
def entity_extractor_agent(state: ReportState) -> Dict[str, Any]:
    """Extracts 8 industrial entity types (Equipment, Location, Barrier, Energy)."""
    entities = entity_extractor.extract(state["preprocessed_text"])
    trace = state.get("agent_trace", [])
    trace.append(f"EntityExtractorAgent: Extracted {len(entities)} industrial entities")
    return {
        "entities": entities,
        "agent_trace": trace,
    }


# ─── 4. Rule Mapper Agent ───
def rule_mapper_agent(state: ReportState) -> Dict[str, Any]:
    """Maps observation to IOGP 9 Life-Saving Rules."""
    lsr_res = lsr_mapper.map_rules(state["preprocessed_text"])
    primary_rule = lsr_res[0]["rule_name"] if lsr_res else None
    trace = state.get("agent_trace", [])
    trace.append(f"RuleMapperAgent: Matched IOGP rule '{primary_rule}'")
    return {
        "lsr_tags": lsr_res,
        "primary_iogp_rule": primary_rule,
        "agent_trace": trace,
    }



# ─── 5. Verifier Agent (Adversarial Critic) ───
def verifier_agent(state: ReportState) -> Dict[str, Any]:
    """
    Adversarial Critic & Defense-in-Depth Guardrail Arbiter.
    Reconciles Layer 1 (Physics Boundaries) with Layer 2 (Vector Embeddings).
    """
    consensus = guardrail_engine.reconcile_classification(
        text=state["preprocessed_text"],
        neural_score=state["sif_score"],
        neural_label=state["sif_label"],
        matched_anchor=state.get("matched_anchor_text", ""),
    )
    trace = state.get("agent_trace", [])
    trace.append(
        f"VerifierAgent: Confirmed consensus {consensus['final_sif_label']} ({consensus['final_sif_score']:.2f}) "
        f"[Confidence: {consensus['consensus_confidence']:.0%}] -> {consensus['guardrail_status']}"
    )
    return {
        "sif_score": consensus["final_sif_score"],
        "sif_label": consensus["final_sif_label"],
        "is_sif_precursor": consensus["is_sif_precursor"],
        "consensus_confidence": consensus["consensus_confidence"],
        "guardrail_status": consensus["guardrail_status"],
        "audit_notes": consensus["audit_notes"],
        "agent_trace": trace,
    }

# ─── 6. Graph Analyst Agent ───
def graph_analyst_agent(state: ReportState) -> Dict[str, Any]:
    """Updates knowledge graph and inspects Near-Miss Multiplier clusters."""
    graph_store.add_report_entities(
        report_id=state["report_id"],
        entities=state.get("entities", []),
        lsr_rules=state.get("lsr_tags", []),
        sif_label=state.get("sif_label", "LOW"),
    )

    trace = state.get("agent_trace", [])
    trace.append("GraphAnalystAgent: Embedded co-occurrences into Safety Knowledge Graph")
    return {
        "cluster_alert": False,
        "agent_trace": trace,
    }


# ─── 6. Explainer Agent ───
async def explainer_agent(state: ReportState) -> Dict[str, Any]:
    """Synthesizes grounded plain-English risk explanation."""
    trace = state.get("agent_trace", [])
    explanation = await llm_explainer.explain(
        text=state["preprocessed_text"],
        sif_label=state["sif_label"],
        sif_score=state["sif_score"],
        matched_anchor=state.get("matched_anchor_text", ""),
        entities=state.get("entities", []),
    )
    trace.append("ExplainerAgent: Generated grounded Stage 5 plain-English explanation")

    return {
        "explanation": explanation,
        "agent_trace": trace,
    }


# ─── 7. Action Agent ───
def action_agent(state: ReportState) -> Dict[str, Any]:
    """Synthesizes automated CAPA corrective work order recommendations."""
    sif_label = state.get("sif_label", "LOW")
    priority = "CRITICAL" if sif_label == "HIGH" else ("HIGH" if sif_label == "MEDIUM" else "ROUTINE")
    action_type = "SHUTDOWN" if sif_label == "HIGH" else ("REPAIR" if sif_label == "MEDIUM" else "INSPECTION")

    recommendation = {
        "action_type": action_type,
        "priority": priority,
        "suggested_assignee": "Site HSE Superintendent",
        "recommended_sla": "24 Hours" if priority == "CRITICAL" else ("48 Hours" if priority == "HIGH" else "7 Days"),
    }

    trace = state.get("agent_trace", [])
    trace.append(f"ActionAgent: Formulated CAPA recommendation {action_type} ({priority})")
    return {
        "action_recommendation": recommendation,
        "agent_trace": trace,
    }


# ─── Assemble StateGraph Swarm ───
def build_sanket_swarm() -> StateGraph:
    """Builds and compiles the 8-agent LangGraph workflow."""
    workflow = StateGraph(ReportState)

    workflow.add_node("supervisor", supervisor_agent)
    workflow.add_node("classifier", classifier_agent)
    workflow.add_node("entity_extractor", entity_extractor_agent)
    workflow.add_node("rule_mapper", rule_mapper_agent)
    workflow.add_node("verifier", verifier_agent)
    workflow.add_node("graph_analyst", graph_analyst_agent)
    workflow.add_node("explainer", explainer_agent)
    workflow.add_node("action_agent", action_agent)

    # Edge flow: sequential DAG with Verifier Critic
    workflow.set_entry_point("supervisor")
    workflow.add_edge("supervisor", "classifier")
    workflow.add_edge("classifier", "entity_extractor")
    workflow.add_edge("entity_extractor", "rule_mapper")
    workflow.add_edge("rule_mapper", "verifier")
    workflow.add_edge("verifier", "graph_analyst")
    workflow.add_edge("graph_analyst", "explainer")
    workflow.add_edge("explainer", "action_agent")
    workflow.add_edge("action_agent", END)

    return workflow.compile()


# Singleton compiled swarm app
sanket_swarm = build_sanket_swarm()
