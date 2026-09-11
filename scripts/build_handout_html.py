import base64
import os
import subprocess

with open('frontend/public/oil_sanket_qr.png', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('ascii')

html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SANKET · AI — Jury Executive Brief</title>
<style>
  @page {{ 
    size: A4 portrait; 
    margin: 8mm 11mm 7mm 11mm; 
  }}
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    font-size: 8.7pt;
    line-height: 1.4;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}

  /* ── HEADER ── */
  .header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 3.5px solid #0A5C36;
    padding-bottom: 6px;
    margin-bottom: 7px;
  }}
  .header-left h1 {{
    font-size: 23.5pt;
    font-weight: 900;
    color: #0F172A;
    letter-spacing: -0.6px;
    line-height: 1;
  }}
  .header-left h1 span {{ color: #0A5C36; }}
  .header-left .tagline {{
    font-size: 8.9pt;
    color: #475569;
    font-weight: 600;
    margin-top: 2.5px;
  }}
  .header-right {{
    text-align: right;
    font-size: 7.9pt;
    color: #475569;
    line-height: 1.38;
  }}
  .header-right .ps-code {{
    font-size: 12.5pt;
    font-weight: 900;
    color: #0A5C36;
  }}

  /* ── PROBLEM BOX ── */
  .problem-box {{
    background: linear-gradient(135deg, #fef2f2, #fff7ed);
    border: 1px solid #fecaca;
    border-left: 4.5px solid #dc2626;
    border-radius: 6px;
    padding: 6.5px 10.5px;
    margin-bottom: 7px;
  }}
  .problem-box .title {{
    font-size: 7.9pt;
    font-weight: 800;
    color: #dc2626;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 1.5px;
  }}
  .problem-box p {{
    font-size: 8.3pt;
    color: #7f1d1d;
    line-height: 1.33;
  }}
  .problem-box strong {{ color: #991b1b; }}

  /* ── SECTION TITLE ── */
  .section-title {{
    font-size: 8.3pt;
    font-weight: 800;
    color: #0A5C36;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    border-bottom: 1.5px solid #d1fae5;
    padding-bottom: 2px;
    margin: 7px 0 4.5px 0;
  }}

  /* ── METRICS ROW ── */
  .metrics-row {{
    display: flex;
    gap: 5.5px;
    margin-bottom: 7px;
  }}
  .metric {{
    flex: 1;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 6px;
    padding: 4px 4.5px;
    text-align: center;
  }}
  .metric .val {{
    font-size: 13.5pt;
    font-weight: 900;
    color: #0A5C36;
    line-height: 1.1;
  }}
  .metric .lbl {{
    font-size: 6.1pt;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    font-weight: 700;
    margin-top: 1px;
  }}

  /* ── FEATURE GRID (11 MODULES) ── */
  .feature-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 12px;
  }}
  .feature-item {{
    display: flex;
    align-items: flex-start;
    gap: 5.5px;
  }}
  .feature-item.full-width {{
    grid-column: span 2;
  }}
  .feature-item .num {{
    flex-shrink: 0;
    width: 15px;
    height: 15px;
    background: #0A5C36;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 7.2pt;
    font-weight: 800;
    margin-top: 1px;
  }}
  .feature-item .text {{
    font-size: 8pt;
    line-height: 1.3;
  }}
  .feature-item .text strong {{ color: #0F172A; font-size: 8.2pt; }}

  /* ── AGENT PIPELINE (STRICT 2-ROW GRID) ── */
  .agent-pipeline {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 5.5px 7.5px;
    margin: 5.5px 0 7px 0;
  }}
  .pipeline-row {{
    display: grid;
    grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
    align-items: center;
    gap: 4.5px;
  }}
  .agent-card {{
    background: #ffffff;
    border: 1px solid #bbf7d0;
    border-radius: 5px;
    padding: 3.5px 5px;
    text-align: center;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  }}
  .agent-badge {{
    font-size: 5.5pt;
    font-weight: 800;
    text-transform: uppercase;
    color: #047857;
    background: #d1fae5;
    border-radius: 3px;
    padding: 1px 3.5px;
    display: inline-block;
    margin-bottom: 1px;
    letter-spacing: 0.3px;
  }}
  .agent-title {{
    font-size: 7.5pt;
    font-weight: 800;
    color: #065f46;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }}
  .agent-desc {{
    font-size: 6.4pt;
    color: #475569;
    white-space: nowrap;
    line-height: 1.15;
  }}
  .pipeline-arrow {{
    color: #0A5C36;
    font-size: 9pt;
    font-weight: 900;
    user-select: none;
    padding: 0 1px;
  }}
  /* Card variations */
  .agent-card.critic {{
    border-color: #fca5a5;
    background: #fffafa;
  }}
  .agent-card.critic .agent-badge {{
    color: #b91c1c;
    background: #fee2e2;
  }}
  .agent-card.critic .agent-title {{ color: #991b1b; }}
  
  .agent-card.action {{
    border-color: #bfdbfe;
    background: #f8faff;
  }}
  .agent-card.action .agent-badge {{
    color: #1d4ed8;
    background: #dbeafe;
  }}
  .agent-card.action .agent-title {{ color: #1e40af; }}

  .pipeline-connector {{
    text-align: center;
    font-size: 6pt;
    font-weight: 700;
    color: #0A5C36;
    letter-spacing: 0.7px;
    text-transform: uppercase;
    margin: 3.5px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
  }}
  .pipeline-connector::before, .pipeline-connector::after {{
    content: '';
    flex: 1;
    height: 1px;
    background: #cbd5e1;
  }}

  /* ── TWO COLUMN BOTTOM ── */
  .two-col {{
    display: flex;
    gap: 11px;
    margin-top: 3.5px;
  }}
  .col-60 {{ flex: 1.23; }}
  .col-40 {{ flex: 0.77; }}

  /* ── COMPARISON TABLE ── */
  .comp-table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 7.5pt;
    margin-top: 2.5px;
  }}
  .comp-table th {{
    background: #0A5C36;
    color: white;
    padding: 3.8px 5.5px;
    text-align: left;
    font-weight: 700;
    font-size: 7.1pt;
  }}
  .comp-table td {{
    padding: 3.2px 5.5px;
    border-bottom: 1px solid #e2e8f0;
  }}
  .comp-table tr:nth-child(even) {{ background: #f8fafc; }}
  .ck {{ color: #16a34a; font-weight: 800; font-size: 8.3pt; }}
  .cx {{ color: #dc2626; font-weight: 800; font-size: 8.3pt; }}

  /* ── TECH TAGS ── */
  .tech-tags {{
    display: flex;
    flex-wrap: wrap;
    gap: 2.5px;
    margin-top: 2.5px;
  }}
  .tag {{
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 3px;
    padding: 1.3px 5.8px;
    font-size: 6.7pt;
    font-weight: 600;
    color: #334155;
  }}

  /* ── REGULATORY ── */
  .reg {{
    font-size: 6.5pt;
    color: #64748b;
    margin-top: 4.5px;
    padding: 3.8px 5.5px;
    background: #f8fafc;
    border-radius: 3px;
    border: 1px solid #e2e8f0;
    line-height: 1.28;
  }}
  .reg strong {{ color: #475569; }}

  /* ── BOTTOM BAR WITH QR ── */
  .bottom-bar {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 7px;
    padding-top: 6px;
    border-top: 2px solid #0A5C36;
  }}
  .bottom-bar .team {{
    font-size: 7.3pt;
    color: #475569;
    line-height: 1.38;
  }}
  .bottom-bar .team strong {{ color: #0F172A; }}

  .qr-card {{
    display: flex;
    align-items: center;
    gap: 7px;
    background: #f8fafc;
    border: 1.5px solid #0A5C36;
    border-radius: 6px;
    padding: 3.5px 7px 3.5px 5px;
    box-shadow: 0 1px 3px rgba(10,92,54,0.08);
  }}
  .qr-card img {{
    width: 55px;
    height: 55px;
    display: block;
    background: white;
    border-radius: 3px;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }}
  .qr-info {{
    display: flex;
    flex-direction: column;
    text-align: left;
  }}
  .qr-badge {{
    font-size: 6pt;
    font-weight: 800;
    color: #ffffff;
    background: #0A5C36;
    padding: 1px 4px;
    border-radius: 3px;
    display: inline-block;
    width: fit-content;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-bottom: 1.5px;
  }}
  .qr-domain {{
    font-family: 'Consolas', monospace;
    font-size: 8.3pt;
    font-weight: 900;
    color: #0F172A;
    letter-spacing: -0.2px;
  }}
  .qr-sub {{
    font-size: 6pt;
    color: #64748b;
    margin-top: 0.5px;
  }}

  @media print {{
    body {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
  }}
</style>
</head>
<body>

<!-- ═══════ HEADER ═══════ -->
<div class="header">
  <div class="header-left">
    <h1>SANKET <span>· AI</span></h1>
    <div class="tagline">SIF Precursor Detection &amp; Predictive Safety Intelligence for Oil India Limited</div>
  </div>
  <div class="header-right">
    <div class="ps-code">SIH26165</div>
    <div>Smart India Hackathon 2026</div>
    <div>Ministry of Petroleum &amp; Natural Gas</div>
  </div>
</div>

<!-- ═══════ PROBLEM ═══════ -->
<div class="problem-box">
  <div class="title">⚠ The Problem — Why This Matters</div>
  <p><strong>27 May 2020, Baghjan Well #5:</strong> An uncontrolled gas blowout killed 3 people, displaced 8,000+ families, and burned for 172 days — because scattered precursor warning signs (abnormal pressure surges, mud weight loss, BOP weeping seals) were trapped in paper logbooks, never analyzed together. <strong>SANKET · AI ensures this never happens again.</strong></p>
</div>

<!-- ═══════ KEY METRICS ═══════ -->
<div class="metrics-row">
  <div class="metric"><div class="val">&lt;5s</div><div class="lbl">Voice → SIF Score</div></div>
  <div class="metric"><div class="val">8</div><div class="lbl">AI Agent Swarm</div></div>
  <div class="metric"><div class="val">7</div><div class="lbl">Pipeline Stages</div></div>
  <div class="metric"><div class="val">10</div><div class="lbl">OIL Asset Sites</div></div>
  <div class="metric"><div class="val">3</div><div class="lbl">Languages (HI/AS/EN)</div></div>
  <div class="metric"><div class="val">9</div><div class="lbl">IOGP Life-Saving Rules</div></div>
  <div class="metric"><div class="val">24/7</div><div class="lbl">Real-Time Cloud Monitor</div></div>
</div>

<!-- ═══════ COMPLETE FEATURE SET (11 MODULES) ═══════ -->
<div class="section-title">🔍 Complete Safety Intelligence Platform (11 Modules)</div>
<div class="feature-grid">
  <div class="feature-item">
    <div class="num">1</div>
    <div class="text"><strong>Voice-First Multilingual Reporting</strong> — Workers speak naturally in Hindi, Assamese, or English. OpenAI Whisper transcribes with industrial domain normalization in &lt;3s.</div>
  </div>
  <div class="feature-item">
    <div class="num">2</div>
    <div class="text"><strong>LangGraph 8-Agent Swarm</strong> — Orchestrated multi-agent architecture: Supervisor → Classifier → Entity Extractor → Rule Mapper → Verifier Arbiter → Graph Analyst → Explainer → Action Agent.</div>
  </div>
  <div class="feature-item">
    <div class="num">3</div>
    <div class="text"><strong>Dual-Layer SIF Risk Scoring</strong> — Layer 1: Physics boundary guardrails (pressure/temp). Layer 2: Multilingual E5 neural embeddings. Verifier synthesizes consensus confidence score.</div>
  </div>
  <div class="feature-item">
    <div class="num">4</div>
    <div class="text"><strong>IOGP 9 Life-Saving Rules Mapping</strong> — Auto-aligns observations to global safety standards (Bypassing Safety Controls, Confined Space, Line of Fire, Working at Heights, etc.).</div>
  </div>
  <div class="feature-item">
    <div class="num">5</div>
    <div class="text"><strong>8 Industrial Entity Types</strong> — Automatic extraction of Equipment, Location, Barrier Failure, Energy Source, Toxic Chemical, Personnel, Action, and Severity using specialized NLP.</div>
  </div>
  <div class="feature-item">
    <div class="num">6</div>
    <div class="text"><strong>Live GIS Satellite Heatmap</strong> — 10 real OIL asset coordinates with SIF density heat rings, live wind-directed gas plume dispersion simulation, trunk pipelines, and NASA FIRMS thermal spots.</div>
  </div>
  <div class="feature-item">
    <div class="num">7</div>
    <div class="text"><strong>Safety Knowledge Graph</strong> — Live signal graph connecting equipment, barriers, and failure modes across assets. Detects near-miss multiplier clusters before catastrophic escalation.</div>
  </div>
  <div class="feature-item">
    <div class="num">8</div>
    <div class="text"><strong>Baghjan Disaster Replay Simulation</strong> — 14-day interactive counterfactual replay: demonstrates day-by-day how SANKET would have intercepted the May 2020 blowout 11 days prior.</div>
  </div>
  <div class="feature-item">
    <div class="num">9</div>
    <div class="text"><strong>Centralized Control Room</strong> — Live WebSocket streaming telemetry, high-SIF audio alert horn, active permit tracking, 72-hour trend analytics, and instant supervisor triage dashboard.</div>
  </div>
  <div class="feature-item">
    <div class="num">10</div>
    <div class="text"><strong>Emergency Stop Work Authority (SWA)</strong> — One-click safety interlock: instantly broadcasts SMS/push alarm to all on-site personnel with GPS lockdown zone &amp; emergency muster route.</div>
  </div>
  <div class="feature-item full-width">
    <div class="num">11</div>
    <div class="text"><strong>Automated Shift Handover Dossier &amp; PDF</strong> — One-click generation of statutory shift handover dossiers containing SIF metrics, top hazard clusters, pending CAPA corrective actions, and toolpusher sign-off for compliance.</div>
  </div>
</div>

<!-- ═══════ LANGGRAPH 8-AGENT ORCHESTRATION PIPELINE ═══════ -->
<div class="section-title">🤖 LangGraph 8-Agent Orchestration Pipeline</div>
<div class="agent-pipeline">
  <!-- Phase 1: Ingestion & Perception -->
  <div class="pipeline-row">
    <div class="agent-card">
      <div class="agent-badge">Agent 1</div>
      <div class="agent-title">🎯 Supervisor</div>
      <div class="agent-desc">Normalize &amp; Lang Detect</div>
    </div>
    <div class="pipeline-arrow">➔</div>
    <div class="agent-card">
      <div class="agent-badge">Agent 2</div>
      <div class="agent-title">📊 Classifier</div>
      <div class="agent-desc">Multilingual E5 SIF Score</div>
    </div>
    <div class="pipeline-arrow">➔</div>
    <div class="agent-card">
      <div class="agent-badge">Agent 3</div>
      <div class="agent-title">🔬 Entity Extractor</div>
      <div class="agent-desc">8 Industrial Entity Types</div>
    </div>
    <div class="pipeline-arrow">➔</div>
    <div class="agent-card">
      <div class="agent-badge">Agent 4</div>
      <div class="agent-title">📋 Rule Mapper</div>
      <div class="agent-desc">IOGP 9 Life-Saving Rules</div>
    </div>
  </div>

  <!-- Connector Bar -->
  <div class="pipeline-connector">
    <span>▼ Defense-in-Depth Consensus &amp; Knowledge Graph Dispatch ▼</span>
  </div>

  <!-- Phase 2: Verification & Action -->
  <div class="pipeline-row">
    <div class="agent-card critic">
      <div class="agent-badge">Agent 5 · Critic</div>
      <div class="agent-title">⚖️ Verifier Arbiter</div>
      <div class="agent-desc">Physics Guardrails vs Neural</div>
    </div>
    <div class="pipeline-arrow">➔</div>
    <div class="agent-card">
      <div class="agent-badge">Agent 6</div>
      <div class="agent-title">🕸️ Graph Analyst</div>
      <div class="agent-desc">Safety Knowledge Graph</div>
    </div>
    <div class="pipeline-arrow">➔</div>
    <div class="agent-card">
      <div class="agent-badge">Agent 7</div>
      <div class="agent-title">💡 Explainer</div>
      <div class="agent-desc">Plain-English Risk Rationale</div>
    </div>
    <div class="pipeline-arrow">➔</div>
    <div class="agent-card action">
      <div class="agent-badge">Agent 8</div>
      <div class="agent-title">🔧 Action Agent</div>
      <div class="agent-desc">CAPA Work Orders &amp; SLA</div>
    </div>
  </div>
</div>

<!-- ═══════ BOTTOM: COMPARISON & TECH STACK ═══════ -->
<div class="two-col">
  <div class="col-60">
    <div class="section-title">📊 Why We're Different</div>
    <table class="comp-table">
      <tr>
        <th>Capability</th>
        <th>Paper / Manual</th>
        <th>Basic Digital</th>
        <th style="background:#065f46">SANKET · AI</th>
      </tr>
      <tr><td>Voice-first multilingual hazard input</td><td class="cx">✗</td><td class="cx">✗</td><td class="ck">✓</td></tr>
      <tr><td>Multi-agent AI orchestration (8 agents)</td><td class="cx">✗</td><td class="cx">✗</td><td class="ck">✓</td></tr>
      <tr><td>Dual-layer SIF scoring + adversarial verification</td><td class="cx">✗</td><td class="cx">✗</td><td class="ck">✓</td></tr>
      <tr><td>Real-time GIS heatmap + gas plume simulation</td><td class="cx">✗</td><td class="cx">✗</td><td class="ck">✓</td></tr>
      <tr><td>Knowledge Graph + near-miss cluster detection</td><td class="cx">✗</td><td class="cx">✗</td><td class="ck">✓</td></tr>
      <tr><td>Baghjan disaster counterfactual simulation</td><td class="cx">✗</td><td class="cx">✗</td><td class="ck">✓</td></tr>
      <tr><td>Report-to-dashboard latency</td><td>24–72 hrs</td><td>1–4 hrs</td><td class="ck">&lt; 5 sec</td></tr>
    </table>
  </div>
  <div class="col-40">
    <div class="section-title">🛠 Technology Stack</div>
    <div class="tech-tags">
      <span class="tag">Python / FastAPI</span>
      <span class="tag">Next.js 15</span>
      <span class="tag">LangGraph (Multi-Agent)</span>
      <span class="tag">OpenAI Whisper</span>
      <span class="tag">GPT-4o-mini</span>
      <span class="tag">Multilingual E5 Embeddings</span>
      <span class="tag">Supabase (PostgreSQL)</span>
      <span class="tag">WebSocket (Real-time)</span>
      <span class="tag">Leaflet.js (GIS/Satellite)</span>
      <span class="tag">ReportLab (PDF Engine)</span>
      <span class="tag">TailwindCSS</span>
      <span class="tag">Docker</span>
      <span class="tag">Railway (Cloud)</span>
      <span class="tag">HuggingFace</span>
      <span class="tag">Pydantic</span>
      <span class="tag">SQLAlchemy</span>
    </div>

    <div class="reg">
      <strong>Regulatory Compliance:</strong> OISD-GDN-206 (Safety Mgmt) · IS 15656 (Hazard ID) · IOGP 9 Life-Saving Rules · PNGRB Upstream Safety · OIL HSE Policy · OSHA PSM 1910.119
    </div>
  </div>
</div>

<!-- ═══════ BOTTOM BAR WITH SCANNABLE QR CODE ═══════ -->
<div class="bottom-bar">
  <div class="team">
    <strong>Team SANKET</strong> · Smart India Hackathon 2026 · Problem Statement: <strong>SIH26165</strong><br>
    Developed for <strong>Oil India Limited (OIL)</strong> · Ministry of Petroleum &amp; Natural Gas<br>
    <span style="font-size:6.6pt; color:#64748b; font-style:italic;">"Every precursor detected is a disaster prevented — Protecting lives through predictive intelligence."</span>
  </div>

  <div class="qr-card">
    <img src="data:image/png;base64,{b64}" alt="Scan for Live Cloud Demo" />
    <div class="qr-info">
      <div class="qr-badge">📱 Live Cloud Demo</div>
      <div class="qr-domain">oil-sanket.up.railway.app</div>
      <div class="qr-sub">Scan with phone camera for instant demo</div>
      <div class="qr-sub" style="color:#0A5C36; font-weight:800;">Worker Mobile Terminal: /worker</div>
    </div>
  </div>
</div>

</body>
</html>'''

with open('frontend/public/SANKET_AI_JURY_HANDOUT.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("[SUCCESS] Updated SANKET_AI_JURY_HANDOUT.html with 11 modules!")
