# SANKET · AI — Mentor Feedback & Industrial Reality Specifications

**Project**: SANKET · AI (SIH26165 · Oil India Limited)  
**Date**: August 2026  
**Status**: APPROVED & INTEGRATED INTO CORE ARCHITECTURE  
**Target Domain**: Upstream Oil & Gas / Refining Hazardous Environments (OISD / DGMS / ATEX Compliant)

---

## 📑 Table of Contents
1. [Executive Overview of Mentor Feedback](#1-executive-overview-of-mentor-feedback)
2. [Challenge 1: Mobile Phone Ban in Hazardous Process Areas (ATEX / OISD-STD-149)](#2-challenge-1-mobile-phone-ban-in-hazardous-process-areas-atex--oisd-std-149)
3. [Challenge 2: Management Latency & The Critical "Time-Lag" Hazard](#3-challenge-2-management-latency--the-critical-time-lag-hazard)
4. [Challenge 3: Zero-Network Outskirts, Deep Jungle & Desert Remote Well-Pads](#4-challenge-3-zero-network-outskirts-deep-jungle--desert-remote-well-pads)
5. [The 6-Channel Multimodal Ingestion Matrix (High-Tech to Low-Tech)](#5-the-6-channel-multimodal-ingestion-matrix-high-tech-to-low-tech)
6. [Manager Emergency Action Playbook & One-Touch Contact Protocol](#6-manager-emergency-action-playbook--one-touch-contact-protocol)
7. [SIH Judge Q&A Defense Script (Mentor Questions)](#7-sih-judge-qa-defense-script-mentor-questions)

---

## 1. Executive Overview of Mentor Feedback

During technical review with domain mentorship, three critical process-safety realities were identified:

| # | Mentor Observation / Challenge | Real-World Constraint | SANKET · AI Technical Solution |
|---|---|---|---|
| **1** | **Mobile Phones are Prohibited / Flammable** | Under OISD-STD-149 & DGMS, consumer smartphones are potential ignition sources in Zone 0/1 process areas. Personal phones are deposited at security lockers. | **3 Industrial Ingestion Channels**: Standard ATEX VHF/UHF Walkie-Talkies (Radio-over-IP on Channel 9), Fixed Flameproof Doghouse Kiosks, and Intrinsically Safe (IS) Android terminals. |
| **2** | **Management Latency Gap (Time Difference)** | If a worker logs a critical hazard (e.g. gas kick, BOP valve leak) and the manager only sees it hours later during shift review, a catastrophe can occur in between. | **Zero-Delay Emergency Reflex ($<500\text{ms}$)**: Immediate 2-way audio warning to worker earpiece, 24/7 Control Room screen override & siren, and automated e-PTW hot-work permit lockout. |
| **3** | **Zero Internet in Remote Geographies (Outskirts)** | Remote well pads in Upper Assam rainforests, riverbed flood zones (Baghjan, Moran, Digboi), and Rajasthan desert well pads have zero 4G/fiber connectivity. | **Store-and-Forward Doghouse Edge Architecture**: AI runs 100% locally on the Doghouse edge computer (0 KB/s out). Local rig sirens fire offline immediately; reports sync to HQ when link resumes. |

---

## 2. Challenge 1: Mobile Phone Ban in Hazardous Process Areas (ATEX / OISD-STD-149)

### 2.1 The Hazardous Area Reality
Refineries and drilling rigs are classified under strict explosive atmosphere zones:
* **Zone 0**: Explosive gas atmosphere continuously present ($>1000\text{ hrs/year}$).
* **Zone 1**: Explosive gas atmosphere likely to occur in normal operation ($10\text{--}1000\text{ hrs/year}$, e.g. rig floor, wellheads, crude manifolds).
* **Zone 2**: Explosive gas atmosphere not likely to occur, but if it occurs will persist only for a short time ($<10\text{ hrs/year}$).

Consumer smartphones contain uncertified lithium-ion batteries and non-encapsulated RF circuitry capable of producing micro-arcs or thermal runaway. Therefore, they are legally prohibited in Zone 0 and Zone 1.

### 2.2 SANKET Ingestion Architecture for Hazardous Zones

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│              SANKET · AI — 3 FIELD INGESTION CHANNELS (EXPLOSION-PROOF)           │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  [ Channel 1: VHF/UHF Walkie-Talkie Audio Bridge (RoIP) ] ⭐ PRIMARY RIG CHANNEL │
│  • Every worker on the rig floor carries an ATEX-certified walkie-talkie         │
│    (e.g., Motorola MOTOTRBO DP4801 Ex).                                          │
│  • Worker switches to Channel 9 ("Safety Voice PTT"), presses Push-to-Talk,      │
│    and speaks in Assamese / Hindi / English.                                     │
│  • Central Radio-over-IP (RoIP) Gateway feeds the base-station audio stream       │
│    directly into SANKET's Whisper + E5 SIF engine!                               │
│                                                                                  │
│  [ Channel 2: ATEX / IECEx Zone 1 Intrinsically Safe (IS) Handhelds ]            │
│  • Spark-proof enterprise smart terminals officially issued by HSE departments  │
│    (e.g., i.safe MOBILE IS530.1 / Pepperl+Fuchs Ecom Smart-Ex 02).              │
│  • Ruggedized, flame-proof Android running SANKET Field Reporter with PTT mic.   │
│                                                                                  │
│  [ Channel 3: Flame-Proof Doghouse & Muster Point Voice Kiosks ]                 │
│  • Wall-mounted stainless-steel push-button intercom kiosks placed at:           │
│    - Drill Floor Doghouse Cabin                                                  │
│    - Permit-to-Work (e-PTW) Cabin                                                │
│    - Compressor Manifold & Shift Muster Shelters                                 │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Challenge 2: Management Latency & The Critical "Time-Lag" Hazard

### 3.1 The Fatal Flaw of Traditional Safety Software (SAP EHS / Enablon / Excel)
In legacy systems, an observation is saved to a database table. An HSE officer logs in hours later or reads it the next morning. If the hazard was an active barrier failure (e.g. *BOP seal micro-fissure under 1800 PSI*), the blowout occurs before any human manager opens the email.

### 3.2 SANKET's Solution: The "Zero-Delay Emergency Reflex" (`< 500ms`)

```
                 [ Worker Speaks Hazard via Walkie / IS Device ]
                                       │
                                       ▼ (<500ms Edge Scoring)
                       ┌───────────────────────────────┐
                       │  SANKET Edge SIF Precursor AI │
                       │    SIF Score >= 0.85 Detected │
                       └───────────────┬───────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         │                             │                             │
         ▼                             ▼                             ▼
[ 1. Instant Earpiece Voice ]  [ 2. Control Room DCS Pop-Up ]  [ 3. e-PTW Hard Interlock ]
Walkie earpiece speaks back    Central DCS console sounds      Automatically FREEZES all
instantly in worker's native   acoustic alarm & overrides      active Hot Work / Welding
language: "⚠️ Critical SIF     screen with emergency           permits within 100m radius
Logged. Clear area 50m."       precursor protocol card.        of the reported hazard!
```

1. **Instant Voice Feedback to Worker ($<1.5\text{s}$)**: SANKET speaks directly back into the worker's earpiece in Hindi/Assamese/English with immediate life-saving instructions (e.g. *"Evacuate 50m upwind"*).
2. **24/7 Control Room Screen Override**: Sounds an audible chime on the central DCS console, displaying the exact well pad, barrier failure, and suggested containment.
3. **Automated e-PTW (Permit-to-Work) Hard Lockout**: Sends an automated digital hold signal to freeze all active welding/grinding permits within a 100-meter radius.
4. **Automated IVR / SMS Emergency Dispatch**: Automatically dials the on-duty Site Safety Officer within 3 seconds.

---

## 4. Challenge 3: Zero-Network Outskirts, Deep Jungle & Desert Remote Well-Pads

### 4.1 The Geographic Reality of Oil India Limited Operations
Oil India's operational assets are frequently located in extreme, remote terrains where cellular towers (4G/5G) do not reach:
* **Upper Assam Rainforests & Riverbeds**: Well pads in Baghjan, Moran, Digboi, and Kumchai situated in dense jungle reserves, floodplains, or across the Brahmaputra river where optic fiber is severed during annual monsoons.
* **Rajasthan Thar Desert (Jaisalmer / Baghewala)**: Deep desert heavy oil fields located 40–80 km from the nearest cellular base station.
* **Atmospheric Rain-Fade**: Microwave and VSAT satellite links regularly suffer dropouts during tropical monsoon storms.

### 4.2 The "Store-and-Forward" Local Edge Architecture

To guarantee 100% uptime in zero-network environments, SANKET implements a **Local Edge Doghouse Node** installed on the ruggedized computer inside the site container office:

```
[ Worker on Remote Rig Floor (Zero Mobile Signal) ] 
        │
        │ 1. Worker speaks into Walkie-Talkie / Fixed Mic: "BOP valve leaking at 1800 PSI"
        ▼
[ Local Radio Frequency / Direct Copper Cable (30 meters) ] ──► (NO INTERNET NEEDED!)
        │
        ▼
[ Local Industrial Edge PC in the Site Doghouse Cabin ]
        │
        │ 2. SANKET AI executes 100% locally on CPU:
        │    • Local Whisper STT Engine (Quantized 75MB model)
        │    • Local multilingual-e5-small Embeddings (130MB model)
        │    • SIF Precursor Classification (<50ms inference)
        │    • 0 KB/s Internet Bandwidth Required!
        ▼
[ 🚨 INSTANT LOCAL RIG SAFETY REFLEX (OFFLINE) ] 
• Doghouse PC triggers the rig floor warning strobe & acoustic siren immediately!
• Worker earpiece receives instant localized voice warning.
        │
        │ 3. Report encrypted and saved to Local SQLite / IndexedDB Queue.
        │    (Cryptographic SHA-256 timestamping ensures zero tampering or loss).
        ▼
[ 4. Automated Opportunistic Synchronization to HQ ]
• Mode A: Automated sync as soon as intermittent satellite/VHF burst connects for 30 seconds.
• Mode B: Physical sync when the shift supervisor's vehicle returns to the base camp / Duliajan HQ.
• Central HQ receives batch reports with zero duplicate records and zero data loss!
```

### 4.3 Why This Guarantees Worker Safety:
1. **No Cloud Dependency**: If the internet wire is cut, worker safety is **not compromised**. The local siren, local earpiece warning, and local hazard logging work uninterrupted.
2. **Deterministic Cryptographic Queue**: Every offline report is hashed with SHA-256 and stored in an immutable local database table. Even if power cuts, the report is preserved on solid-state disk.
3. **Bandwidth Sovereign**: Conforms to Ministry of Petroleum guidelines for Critical Information Infrastructure (CII) and air-gapped sovereign deployment.

---

## 5. The 6-Channel Multimodal Ingestion Matrix (High-Tech to Low-Tech)

| Channel # | Ingestion Channel | Target User Group | Real-World Operational Mechanism |
|---|---|---|---|
| **1** | **VHF/UHF Walkie-Talkie Bridge (RoIP)** | Rig floor workers, derrickmen, pump operators | Worker presses PTT on Channel 9 of their standard ATEX radio. Central Radio-over-IP gateway feeds audio stream to Whisper AI. |
| **2** | **Fixed Flameproof Call Pillars (Kiosks)** | Workers in noisy compressor/manifold areas | Wall-mounted explosion-proof pillars (Gai-Tronics/Eaton). Worker taps RFID badge, holds yellow button, and speaks for 10 seconds. |
| **3** | **Company-Issued Zone 1 IS Handhelds** | Maintenance engineers, electrical leads | Rugged spark-proof Android terminals (i.safe MOBILE / Ecom) with voice recording and camera for valve/crack photos. |
| **4** | **Plant Landline Extension (IVR "555")** | Control room operators, substation techs | Worker dials extension `555` on any internal desk phone, speaks observation after the tone, and hangs up. |
| **5** | **Physical Safety Cards + OCR Scanner** | Traditional contract workers / laborers | Worker writes observation in pen on yellow paper card and drops in muster box. At shift end, 30 cards are scanned via optical OCR in 10s. |
| **6** | **Safe-Zone Handover Touchscreens** | All workers during shift debrief | Wall-mounted tablets in cafeteria, locker rooms, or shift cabins where workers review or log shift observations. |

---

## 6. Manager Emergency Action Playbook & One-Touch Contact Protocol

When a critical SIF precursor ($\ge 0.85$) appears on the manager's dashboard, SANKET provides an instant **4-Step Emergency Action Playbook**:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   🚨 SANKET EMERGENCY ACTION PLAYBOOK (ON-SCREEN)                │
├──────────────────────────────────────────────────────────────────────────────────┤
│  Hazard: Well Kick & 1800 PSI Annular Pressure Jump · Location: Well Pad 7        │
│  SIF Potential: 0.94 (CATASTROPHIC) · Rule: IOGP Well Control & Energy Isolation │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  [ STEP 1: 🛑 1-CLICK STOP WORK AUTHORITY (SWA) ]                                │
│  • Red Action Button: [ 🛑 INITIATE IMMEDIATE EMERGENCY STOP WORK ]               │
│  • Dispatches instant electronic shutdown alert to rig Toolpusher.               │
│                                                                                  │
│  [ STEP 2: 📞 1-TOUCH EMERGENCY CONTACT DIRECTORY ]                              │
│  • 👷 On-Site Toolpusher (Well Pad 7): 📞 +91 94350-XXXXX [Call Now]             │
│  • 🚒 Duliajan Fire & Blowout Emergency Team: 📞 102 / +91 374-XXXXX [Dispatch]  │
│  • 🏥 OIL Hospital Emergency Ambulance: 📞 108 / +91 374-XXXXX [Alert ER]       │
│  • 👔 Area HSE In-Charge (Moran/Duliajan): 📞 +91 98540-XXXXX [Connect]          │
│  • 🎛️ Central DCS Control Room Superintendent: 📞 Ext. 2201 [Direct Line]      │
│                                                                                  │
│  [ STEP 3: 📋 IMMEDIATE CONTAINMENT CHECKLIST (SOP) ]                            │
│  ☑ Step 1: Evacuate all non-essential personnel 100m upwind.                    │
│  ☑ Step 2: Confirm blowout preventer (BOP) accumulator pressure > 3000 PSI.      │
│  ☑ Step 3: Verify all open Hot Work (welding) permits within 100m are frozen.    │
│  ☑ Step 4: Dispatch continuous gas monitoring team with calibrated Dräger tubes. │
│                                                                                  │
│  [ STEP 4: 📝 IMMUTABLE AUDIT TRAIL ]                                            │
│  Every action taken is timestamped to the second for statutory compliance.       │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. SIH Judge Q&A Defense Script (Mentor Questions)

### Q1: *"Smartphones are banned in refineries due to fire hazards. How can workers report via voice?"*
> **Answer**:  
> *"Judges, we strictly adhere to OISD-STD-149 and DGMS regulations. SANKET does not require consumer smartphones. In production, workers report through their existing ATEX-certified walkie-talkies (e.g. Motorola DP4801 Ex) via a Radio-over-IP bridge on Channel 9, or through fixed explosion-proof intercom kiosks on the rig floor. For maintenance leads, company-issued Zone 1 intrinsically safe handhelds are supported."*

### Q2: *"If a worker reports something critical, and there is a time lag before the manager checks hours later, won't a disaster happen in between?"*
> **Answer**:  
> *"That is the fatal flaw of legacy systems like SAP EHS, which we solve with our **$<500\text{ms}$ Zero-Delay Emergency Reflex**. When a critical SIF precursor ($\ge 0.85$) is detected, SANKET does not wait for a human manager. It immediately speaks life-saving instructions back into the worker's earpiece, sounds an audible alert on the 24/7 Control Room console, and automatically freezes open hot-work permits within 100m of that well pad."*

### Q3: *"What if the well pad is in deep jungle/outskirts with zero internet?"*
> **Answer**:  
> *"SANKET is 100% sovereign and air-gapped with 0 KB/s egress. In remote Upper Assam or desert pads, our lightweight models run locally on the Doghouse edge PC inside the rig cabin. The AI analyzes hazards and triggers local rig sirens completely offline. Reports are stored in an encrypted local queue and sync automatically to HQ whenever satellite or shift transport reconnects."*
