# SANKET AI - Field Reporter
## Radio, RoIP and Voice Ingestion Product & Implementation Specification

**Project:** SANKET AI - SIH26165  
**Component:** F13 Field Reporter / Field Safety Ingestion  
**Document type:** Product specification, architecture specification, implementation plan and AI coding brief  
**Status:** Proposed improvement specification  
**Primary goal:** Turn field speech and approved radio communications into truthful, reviewable and structured safety intelligence without requiring a consumer smartphone in hazardous field areas.

---

# 1. Executive Summary

The Field Reporter is intended to solve a specific industrial problem:

Workers may operate in hazardous process areas where consumer smartphones are prohibited or operationally inappropriate. At the same time, those workers still need a fast way to report hazards, abnormal conditions, near misses and safety observations.

The solution is not to put the SANKET application directly on a worker's ordinary phone.

Instead, SANKET should integrate with approved field communication infrastructure:

```text
WORKER
  |
  v
APPROVED PTT RADIO
  |
  v
SITE RADIO SYSTEM
  |
  v
RoIP / RADIO-IP GATEWAY
  |
  v
SITE NETWORK
  |
  v
SANKET EDGE INGESTION
  |
  v
AUDIO EVENT
  |
  v
SPEECH-TO-TEXT
  |
  v
FIELD OBSERVATION
  |
  v
SANKET REPORT PIPELINE
  |
  +--> SIF CLASSIFICATION
  +--> ENTITY EXTRACTION
  +--> LSR MAPPING
  +--> EXPLANATION
  |
  v
SYSTEMIC SAFETY INTELLIGENCE
  |
  +--> SIGNAL GRAPH
  +--> TEMPORAL CLUSTERS
  +--> SYSTEMIC ALERTS
  |
  v
HSE INVESTIGATION / CAPA
```

The architecture is technically implementable.

However, there is no universal "walkie-talkie API." Conventional VHF/UHF and other land-mobile-radio systems require an appropriate radio interface, RoIP gateway, dispatch platform, SIP/RTP bridge, or vendor-specific integration.

Commercial products already exist for this purpose. Cubic's Vocality RoIP connects PTT/LMR radios with IP infrastructure and other communications systems. JPS's RSP-Z2 provides radio-to-IP interoperability including SIP, RTP and RoIP resources. Asterisk provides a separate, useful path for SIP/telephone/cabin integrations. Official documentation confirms these capabilities.

The most important architectural decision is to keep the radio layer separate from the SANKET intelligence layer.

SANKET should not contain vendor-specific radio logic.

---

# 2. Document Purpose

This document has two simultaneous audiences.

## 2.1 Human audience

A developer, architect, mentor, HSE professional or project reviewer should be able to understand:

- why the Field Reporter exists;
- how the current implementation works;
- what is currently broken or simulated;
- how radio and RoIP integration works;
- what hardware and software boundaries are required;
- what should be implemented for SIH;
- what belongs to a future production deployment;
- what security, reliability and safety limitations exist.

## 2.2 AI implementation audience

A coding agent such as Codex, Claude Code or Gemini CLI should be able to use this document as an implementation brief.

The AI must be able to determine:

- what the component is supposed to do;
- what already exists;
- what must be fixed;
- what must not be rewritten;
- what APIs are required;
- what data contracts should exist;
- how to implement a simulator first;
- how a future real RoIP adapter fits into the architecture;
- what tests are required;
- what behavior is unsafe or unacceptable.

---

# 3. Source Basis and Method

This document is based on the following project materials:

- `SANKET_PRD.md`
- `SANKET_TECHNICAL_APPLICATION_SPECIFICATION_FINAL.md`
- `SANKET_COMPONENT_DEEP_ANALYSIS.md`
- `mentor feedback.md`
- `task.md`
- the existing Field Reporter and voice-ingestion implementation

The repository deep analysis explicitly distinguishes verified repository facts from specification requirements and inference. That distinction is preserved here.

Important source-derived facts include:

- the Field Reporter page is currently a simulator rather than a real recorder;
- the current browser page does not use `MediaRecorder`;
- the page submits `raw_text` while the report schema expects `text`;
- the separate backend Whisper path exists but is not connected to the visible Field Reporter;
- the Whisper service currently attempts a local model and contains a fabricated fallback;
- the existing report pipeline persists reports and processes SIF, entities and LSR information;
- graph/systemic processing is currently disconnected from the normal report worker;
- offline field capability is a project requirement but is not currently implemented as a complete field queue/sync system.

These findings are documented in the repository deep analysis and should be treated as the current implementation baseline.

---

# 4. Product Definition

The Field Reporter is not fundamentally a voice recorder.

It is:

> A communication-infrastructure bridge that converts field speech into structured safety observations and feeds those observations into SANKET's safety-intelligence pipeline.

The worker experience should remain extremely simple:

```text
PRESS
  |
  v
SPEAK
  |
  v
RELEASE
```

Everything difficult happens behind the scenes:

```text
RADIO
  |
  v
RoIP
  |
  v
EDGE
  |
  v
AUDIO
  |
  v
ASR
  |
  v
TRANSCRIPT
  |
  v
FIELD OBSERVATION
  |
  v
SANKET INTELLIGENCE
```

---

# 5. Product Problem

The current Field Reporter UI visually suggests a real industrial voice-ingestion system, but the implementation is primarily a demonstration layer.

The current page provides:

- hardware selection;
- preset scenarios;
- simulated recording;
- editable text;
- report submission;
- simulated result presentation.

It does not currently provide a complete real-world flow of:

```text
real audio capture
  ->
real transcription
  ->
candidate transcript
  ->
human confirmation
  ->
canonical report ingestion
  ->
systemic intelligence
```

This creates a trust problem.

A safety system must never tell an operator that an observation was successfully processed when it was actually rejected, unavailable, simulated or fabricated.

The first goal is therefore not advanced radio integration.

The first goal is:

> Make the existing Field Reporter truthful and make one complete field-observation pipeline real.

---

# 6. Operational Scenario

A worker is operating on a remote rig or industrial site.

The worker notices:

> "Pump four is vibrating heavily near the separator."

The worker already has an approved radio.

They:

```text
Press PTT
  |
Speak observation
  |
Release PTT
```

The radio transmission is received by the site's radio infrastructure.

A base/donor radio or supported radio interface exposes the received communication to a RoIP gateway.

The gateway exposes the audio to the local SANKET edge computer.

SANKET then:

```text
captures audio
  ->
stores/queues audio
  ->
transcribes audio
  ->
presents candidate transcript where review is required
  ->
creates FieldObservation
  ->
ingests canonical report
  ->
runs SIF/entity/LSR processing
  ->
updates systemic intelligence
```

The worker does not need to understand any of these internal steps.

---

# 7. Why Radio Integration Is Needed

In the target industrial scenario, consumer smartphones may not be permitted or appropriate in hazardous process zones.

The communication device is therefore assumed to be an approved site radio or another site-governed communication device.

This creates an important architecture constraint:

```text
SANKET cannot assume:
"worker has a browser and microphone"
```

Instead:

```text
SANKET must accept:
"site communication infrastructure can expose an audio event"
```

That abstraction allows multiple physical implementations.

---

# 8. Supported Field Ingestion Sources

The long-term Field Reporter should support multiple transport types while presenting one internal data model.

```text
                 FIELD SOURCES
                       |
       +---------------+---------------+
       |               |               |
       v               v               v
     RADIO          LANDLINE          KIOSK
       |               |               |
      RoIP            SIP             HTTP
       |               |               |
       +---------------+---------------+
                       |
                       v
             FIELD INGESTION ADAPTER
                       |
                       v
                FIELD OBSERVATION
                       |
                       v
                 SANKET PIPELINE
```

Possible adapters:

- `RadioRoIPAdapter`
- `SIPAudioAdapter`
- `KioskAudioAdapter`
- `BrowserVoiceAdapter`
- `SimulatorRadioAdapter`
- `TextObservationAdapter`

The intelligence pipeline should not care which adapter produced the observation.

---

# 9. Core Architectural Boundary

The most important software boundary is:

```text
COMMUNICATION INFRASTRUCTURE
----------------------------

Radio
RoIP
SIP
Kiosk
Browser
Landline
Gateway
Audio transport

             |
             v

FIELD OBSERVATION CONTRACT

             |
             v

SANKET INTELLIGENCE
-------------------

ASR
SIF
Entities
LSR
Explanation
Graph
Clusters
Alerts
CAPA
```

Everything above `FieldObservation` is transport-specific.

Everything below it is SANKET-specific.

This prevents the core application from becoming dependent on one radio manufacturer or gateway.

---

# 10. Current Repository Architecture

The repository deep analysis identifies the current Field Reporter architecture as approximately:

```text
CURRENT BROWSER PAGE

Hardware selector
      +
Preset / simulated microphone
      +
Editable textarea
      |
      v
POST /api/reports/ingest
      |
      +-- sends raw_text
      |
      v
Report schema expects text
      |
      v
HTTP 422
      |
      v
UI catches error
      |
      v
Fabricated offline HIGH result
```

Separately:

```text
CURRENT BACKEND VOICE PATH

multipart audio
      |
      v
voice_routes.py
      |
      v
VoiceTranscriber
      |
      v
local Whisper
      |
      v
Report created
      |
      v
normal report worker
      |
      +--> preprocessing
      +--> SIF
      +--> entities
      +--> LSR
      +--> explanation
```

The second path exists, but the visible Field Reporter does not use it.

---

# 11. Current Frontend Defects

The repository audit identifies the following issues.

## 11.1 No real browser recording

The page does not currently use:

- `navigator.mediaDevices`;
- `getUserMedia`;
- `MediaRecorder`;
- `AudioContext`;
- audio Blob handling;
- MIME negotiation;
- microphone permission flow;
- waveform capture;
- real audio upload.

The current recording control is a simulation.

## 11.2 Invalid report payload

The page submits:

```json
{
  "raw_text": "..."
}
```

while the report schema expects:

```json
{
  "text": "..."
}
```

This produces a validation failure.

## 11.3 Fabricated result on failure

The page displays a hard-coded HIGH-SIF/offline result when submission fails.

This must be removed.

## 11.4 Missing truthful state model

The UI needs explicit states such as:

```text
IDLE
RECORDING
TRANSCRIBING
REVIEW
SUBMITTING
QUEUED
COMPLETED
FAILED
```

It should never collapse these into one generic "success" state.

---

# 12. Current Backend Voice Defects

The repository deep analysis identifies the current backend voice implementation as a synchronous multipart transcription-to-ingestion path.

Important limitations include:

- the visible frontend does not call it;
- it reads the uploaded audio into memory;
- it does not provide a separate transcript-review stage;
- it commits the report before a human can edit the transcript;
- it does not retain a durable audio reference;
- it lacks robust upload-size and MIME validation;
- it lacks a strict duration limit;
- it lacks complete provenance metadata;
- it lacks strict ingestion idempotency;
- the current Whisper implementation has a fabricated fallback when the model is unavailable.

The last point is particularly important.

A failed speech-recognition system must produce:

```text
TRANSCRIPTION FAILED
```

not:

```text
TRANSCRIPTION SUCCESS
```

with invented text.

---

# 13. P0 Repository Fixes

These are required before adding sophisticated radio integration.

## P0.1 Fix the text contract

Change the frontend payload to use:

```json
{
  "text": "..."
}
```

or explicitly implement a validated alias if backward compatibility is required.

Do not maintain two ambiguous field names indefinitely.

## P0.2 Remove fabricated frontend results

If the backend returns an error:

```text
show error
```

If transcription is unavailable:

```text
show transcription unavailable
```

If the report is queued:

```text
show queued
```

Never fabricate a safety result.

## P0.3 Remove fabricated Whisper output

If Whisper is unavailable:

```text
FAILED
```

or:

```text
MANUAL TEXT FALLBACK
```

Do not generate an invented safety observation.

## P0.4 Create one canonical observation contract

Browser voice, simulated radio, future RoIP and kiosk input must eventually produce the same internal observation type.

## P0.5 Establish idempotency

Every field observation needs a unique client-generated ID or equivalent deterministic identifier.

---

# 14. Candidate Transcript Review

For browser and kiosk workflows, the preferred flow is:

```text
RECORD
  |
  v
TRANSCRIBE
  |
  v
CANDIDATE TRANSCRIPT
  |
  v
USER REVIEWS / CORRECTS
  |
  v
CONFIRM
  |
  v
REPORT INGESTION
```

This is especially valuable when:

- audio quality is poor;
- industrial noise affects ASR;
- technical names are misrecognized;
- workers use code-switching;
- equipment identifiers are important.

However, the radio path should not automatically assume that every operational deployment can pause for human review.

Production policy should define whether a radio transmission is:

```text
immediately ingested
```

or:

```text
queued for HSE/officer review
```

or:

```text
immediately ingested as preliminary evidence and later reviewed
```

The software architecture should support all three.

---

# 15. Field Observation Contract

The central data contract should contain enough information to preserve provenance.

Example:

```json
{
  "observation_id": "FO-001823",
  "source_type": "RADIO",
  "source_version": "1",

  "site_id": "WP7",
  "channel_id": "SAFETY-9",
  "device_id": "RADIO-17",

  "captured_at": "2026-08-28T08:41:23Z",

  "audio": {
    "reference": "edge://audio/FO-001823.wav",
    "format": "wav",
    "duration_ms": 7800,
    "sha256": "..."
  },

  "transcription": {
    "status": "PENDING",
    "language": null,
    "text": null,
    "confidence": null
  },

  "review": {
    "required": true,
    "status": "PENDING",
    "corrected_text": null
  },

  "delivery": {
    "status": "QUEUED",
    "attempts": 0
  }
}
```

The exact implementation can be smaller for SIH.

The important requirement is that source, identity, audio and processing state are not lost.

---

# 16. PTT Transmission as an Event

Where the radio/gateway exposes transmission state, model a PTT event:

```text
PTT ON
  |
  v
TRANSMISSION START
  |
  v
AUDIO CAPTURE
  |
  v
PTT OFF
  |
  v
TRANSMISSION END
```

Example:

```json
{
  "observation_id": "RAD-01823",
  "source_type": "RADIO",
  "channel_id": "SAFETY-9",
  "device_id": "RADIO-17",
  "started_at": "2026-08-28T08:41:22.103Z",
  "ended_at": "2026-08-28T08:41:28.902Z",
  "audio_reference": "edge://audio/RAD-01823.wav"
}
```

Do not assume that every analog radio exposes:

- digital radio ID;
- PTT metadata;
- channel metadata;
- COR/COS;
- exact transmission timestamps.

These depend on the radio and gateway.

---

# 17. What RoIP Means

RoIP means Radio over IP.

Its purpose is to connect radio communication infrastructure with IP-based systems.

Conceptually:

```text
RADIO DOMAIN
-------------------

Radio
Repeater
Base station
Donor radio
PTT
RX/TX audio
Radio signalling

        |
        v

RoIP GATEWAY

        |
        v

IP DOMAIN
-------------------

Ethernet
RTP
SIP
Vendor RoIP
Dispatch system
SANKET Edge
```

The gateway is therefore an interoperability boundary.

It is not simply "a device that gives a walkie-talkie Internet."

---

# 18. Physical Radio-to-Gateway Flow

A realistic installation may look like:

```text
Worker Radio
      |
      | RF
      v
Site Radio Infrastructure
      |
      v
Base / Donor Radio
      |
      | audio + signalling
      v
RoIP Gateway
      |
      | Ethernet
      v
Industrial Edge PC
      |
      v
SANKET
```

The exact physical interface varies by radio and gateway.

A production integrator must determine:

- radio model;
- radio technology;
- frequency;
- analog/digital mode;
- repeater architecture;
- audio interface;
- PTT interface;
- COR/COS availability;
- radio identity;
- channel identity;
- vendor dispatch platform.

---

# 19. RoIP Gateway Responsibilities

A gateway can potentially provide:

## Radio-to-IP audio

```text
Radio RX audio
  |
  v
Gateway
  |
  v
IP audio
```

## IP-to-radio audio

```text
IP audio
  |
  v
Gateway
  |
  v
Radio TX
```

## PTT signalling

Depending on hardware:

```text
PTT
  |
  v
Gateway
```

or:

```text
Gateway
  |
  v
PTT command
  |
  v
Radio
```

## Radio status/signalling

Depending on the system:

```text
COR/COS
channel
radio ID
other signalling
```

SANKET should initially use the gateway primarily as a one-way field-audio source.

---

# 20. Why SANKET Should Initially Be One-Way

The safest initial architecture is:

```text
RADIO
  |
  v
RoIP
  |
  v
SANKET
```

not:

```text
SANKET
  |
  v
RoIP
  |
  v
RADIO
```

The first is observation and intelligence ingestion.

The second allows SANKET to become an active voice authority on an operational radio network.

That introduces significantly higher safety, authorization and governance requirements.

Automated AI-generated radio announcements should therefore be considered a future capability, not a core SIH implementation.

---

# 21. Dedicated Safety Channel

The project concept should preferably use a dedicated safety reporting channel.

Example:

```text
Channel 1 - Operations
Channel 2 - Maintenance
Channel 3 - Logistics
Channel 4 - Security
Channel 9 - SANKET Safety
```

Worker flow:

```text
Select Safety Channel
  |
  v
Press PTT
  |
  v
Speak observation
  |
  v
Release PTT
```

Advantages:

- less irrelevant audio;
- lower storage requirements;
- lower ASR load;
- reduced privacy exposure;
- fewer false positives;
- clearer operator workflow.

The mentor feedback explicitly proposes a dedicated safety-channel concept and a local edge computer in the site communication/doghouse environment.

---

# 22. SANKET Edge Gateway

The local edge system is the most important component between RoIP and the cloud/backend.

Recommended architecture:

```text
              SANKET EDGE
----------------------------------

RoIP / SIP / Audio input
          |
          v
Radio Ingestion Agent
          |
          +--> metadata
          |
          +--> audio
          |
          v
Local Audio Buffer
          |
          v
Durable Queue
          |
          +--> Local ASR
          |
          +--> Backend Sync
          |
          v
Field Observation
          |
          v
SANKET API
```

The edge computer should be able to continue capturing observations even if the backend or WAN connection temporarily fails.

---

# 23. Store-and-Forward

Remote sites may have unreliable or absent Internet connectivity.

Therefore:

```text
Radio
  |
  v
Edge PC
  |
  v
Local Queue
```

must work without Internet access.

If the backend is unavailable:

```text
FO-001 -> QUEUED
FO-002 -> QUEUED
FO-003 -> QUEUED
```

When connectivity returns:

```text
retry
  |
  v
server acknowledgement
  |
  v
mark delivered
```

The mentor feedback explicitly proposes a local edge/doghouse architecture and store-and-forward behavior.

---

# 24. Durable Delivery States

Recommended states:

```text
CAPTURED
QUEUED
UPLOADING
UPLOADED
TRANSCRIBING
TRANSCRIBED
REVIEW_REQUIRED
SUBMITTED
PROCESSING
COMPLETED
FAILED
```

The state should represent the real system state.

Examples:

```text
backend unavailable
    -> QUEUED

Whisper failed
    -> FAILED or TRANSCRIPTION_FAILED

transcript available but awaiting review
    -> REVIEW_REQUIRED

report accepted but NLP still running
    -> PROCESSING
```

Do not show `COMPLETED` until the relevant operation actually completed.

---

# 25. Idempotency

Radio and edge networks can retry requests.

Without idempotency:

```text
one radio transmission
      |
      +--> upload attempt 1
      |
      +--> upload attempt 2
```

can become:

```text
two reports
```

and incorrectly influence systemic-risk detection.

Every observation should therefore have a unique identifier.

Recommended:

```text
observation_id = UUID
```

and optionally:

```text
audio_sha256
```

The backend should enforce uniqueness at the database/service layer.

A strict unique constraint is preferable to relying only on an in-memory cache.

---

# 26. Audio Integrity

For retained audio:

```text
audio
  |
  v
SHA-256
  |
  v
audio_hash
```

Store:

- hash;
- capture timestamp;
- source;
- device/channel where available;
- duration;
- format;
- retention state.

This supports:

- duplicate detection;
- provenance;
- troubleshooting;
- auditability.

---

# 27. Speech-to-Text Strategy

The project should support two conceptual modes.

## Offline / air-gapped mode

Use the existing local Whisper service after correcting its current behavior.

```text
Audio
  |
  v
Local Whisper
  |
  v
Transcript
```

This is the preferred production direction for sites where external network access is unavailable or undesirable.

## Online demo mode

A hosted speech-to-text provider can be used when Internet connectivity is available.

Groq currently exposes an OpenAI-compatible transcription endpoint and documents `whisper-large-v3` and `whisper-large-v3-turbo`. The API accepts common audio formats including WAV and WebM.

For SIH, this can be useful for demonstrating low-latency online transcription.

However:

```text
ONLINE MODE != OFFLINE MODE
```

The product should not claim that a cloud provider is available in a true air-gapped deployment.

---

# 28. Recommended Provider Strategy

For SIH:

```text
ONLINE DEMO
    |
    v
Groq Whisper API
    |
    v
fast transcription

OFFLINE DEMO
    |
    v
Local Whisper
    |
    v
no external network
```

For production:

```text
PRIMARY
Local / edge ASR

OPTIONAL
Governed cloud ASR when policy permits

FAILURE
Queue audio and retry
```

Do not make the safety pipeline depend on a cloud provider being reachable.

---

# 29. Local Whisper Requirements

The current repository uses `openai-whisper`.

The current service attempts to load a local model and uses CPU-compatible transcription settings.

The repository analysis notes that:

- the implementation currently defaults to Whisper `base`;
- the project specification discusses `whisper-small`;
- language support has not been adequately evaluated;
- model packaging/preloading is not guaranteed;
- the current failure path can return fabricated text.

The implementation should therefore:

1. choose the intended model explicitly;
2. package/preload it for offline deployments;
3. fail truthfully;
4. expose language information;
5. record model/version metadata;
6. benchmark industrial audio;
7. test Hindi, English and any claimed additional languages;
8. avoid claiming multilingual accuracy without evaluation.

---

# 30. Audio Quality

Industrial audio is difficult.

Potential conditions include:

- engines;
- drilling equipment;
- wind;
- radio compression;
- interference;
- overlapping speech;
- accents;
- code-switching.

The pipeline should eventually support:

```text
Audio
  |
  v
Voice Activity Detection
  |
  v
Optional noise handling
  |
  v
ASR
  |
  v
Confidence / quality
```

The UI should eventually expose a useful state such as:

```text
Audio Quality: GOOD
```

or:

```text
Audio Quality: POOR - RETRY RECOMMENDED
```

---

# 31. Multilingual Handling

The project requirements mention multilingual field reporting.

The architecture should therefore preserve:

```text
language
```

as metadata.

Recommended flow:

```text
Audio
  |
  v
Language Detection / Selection
  |
  v
ASR
  |
  v
Candidate Transcript
  |
  v
SANKET NLP
```

The system should not advertise a language as production-supported until it has been tested against the relevant industrial vocabulary and acoustic conditions.

---

# 32. Landline / Communication Cabin Integration

A communication cabin may have:

- landline;
- SIP phone;
- computer;
- radio base station;
- network switch;
- local edge PC.

A SIP/PBX path can therefore be added:

```text
Landline / SIP
      |
      v
Asterisk / PBX
      |
      v
RTP / External Media
      |
      v
SANKET Edge
      |
      v
ASR
```

Asterisk's ARI and External Media APIs are suitable for this kind of media integration.

Asterisk documents `/channels/externalMedia` as a way for an application to direct bridge media to an external media server. RTP is supported for the documented External Media path, and newer Asterisk releases also provide WebSocket media capabilities.

This makes Asterisk a useful option for the communication-cabin path, but it is not required for the primary RoIP design.

---

# 33. Asterisk Interfaces Relevant to SANKET

Useful capabilities include:

## ARI

Asterisk REST Interface.

Useful for:

- channel control;
- bridge control;
- media events;
- recordings;
- application integration.

## External Media

Conceptually:

```text
Asterisk Bridge
      |
      v
External Media
      |
      v
RTP / WebSocket
      |
      v
SANKET Media Service
```

## Recording

Asterisk can record channel or bridge media.

This can be used when the cabin/telephone path is a supported ingestion source.

For new deployments, use the current PJSIP architecture rather than relying on the older `chan_sip` driver.

---

# 34. RoIP Gateway Candidates

The following are integration candidates, not commitments to purchase a specific product.

## 34.1 Cubic Vocality RoIP

Cubic describes Vocality RoIP as a radio-over-IP gateway for connecting PTT/LMR radios with IP networks and other voice systems.

Current official product information lists:

- support for multiple radio devices;
- multiple frequencies/manufacturers;
- wired, Wi-Fi and cellular connectivity options;
- radio bridging;
- integration with dispatch/PTT systems.

This makes it a strong candidate for a production-style architecture.

## 34.2 JPS RSP-Z2

JPS describes the RSP-Z2 as an analog/VoIP interoperability gateway.

Official product information lists support for:

- local radio;
- JPS RoIP;
- SIP devices;
- RTP;
- Push-to-Talk over Cellular;
- radio interoperability.

This is another strong candidate for an integration lab or production evaluation.

## 34.3 Existing Site Vendor Platform

If a target site already has a radio dispatch/PTT platform, integrating with that existing platform may be better than installing a new gateway.

The correct gateway depends on the actual radio infrastructure.

---

# 35. Gateway Selection Procedure

Never choose a RoIP gateway only because it supports "VHF" or "UHF."

Before selecting hardware, collect:

```text
Radio manufacturer
Radio model
Radio technology
Frequency
Analog / digital
Repeater configuration
Base-station configuration
Audio interface
PTT interface
COR/COS
Radio ID
Channel ID
Dispatch platform
Available IP interfaces
Network topology
Hazardous-area location
```

Then determine:

```text
RX Audio
TX Audio
PTT
COR/COS
Device identity
Channel identity
Timing
IP transport
```

Only then select the gateway.

---

# 36. Production Hardware Boundary

The SANKET software should not claim that a generic gateway or PC is intrinsically safe.

The architecture should instead be:

```text
HAZARDOUS AREA
----------------

Approved radio
Approved field equipment

        |
        | communication link
        v

CONTROLLED / SAFE AREA
----------------------

RoIP Gateway
Edge PC
Network
SANKET
```

Exact placement and certification are deployment-specific.

Any ATEX/IECEx, OISD, DGMS or other site certification claim must be verified against the actual hardware, installation and operating procedure.

This document defines the software architecture; it does not certify the resulting installation.

---

# 37. Emergency Safety Boundary

SANKET may:

```text
record
transcribe
classify
correlate
notify
recommend
log
```

It should not automatically become:

```text
physical emergency interlock
DCS shutdown authority
certified safety instrumented function
```

An AI classification should never be presented as a certified physical safety control merely because the UI labels it "automated."

Any actual control integration requires separate:

- hazard analysis;
- authorization;
- fail-safe design;
- OT integration;
- testing;
- certification/governance.

---

# 38. Control Plane and Media Plane

Separate metadata from audio transport.

## Control plane

```text
observation_id
site
channel
device
timestamp
status
authentication
delivery state
```

## Media plane

```text
audio bytes
RTP
recording
media stream
```

Conceptually:

```text
CONTROL
Edge --------------------> SANKET API

MEDIA
Edge --------------------> Media / ASR service
```

This keeps the system flexible.

A future RoIP gateway can change without requiring changes to the SIF/entity/LSR intelligence layer.

---

# 39. Recommended API Boundary

SANKET should expose a canonical internal field-observation interface.

For example:

```http
POST /api/field-observations
```

Conceptual request:

```json
{
  "observation_id": "FO-001823",
  "source_type": "RADIO",
  "site_id": "WP7",
  "channel_id": "SAFETY-9",
  "device_id": "RADIO-17",
  "captured_at": "2026-08-28T08:41:23Z",
  "audio_reference": "edge://audio/FO-001823.wav"
}
```

The exact endpoint can be implemented as a service rather than a new public route if the existing API architecture makes that cleaner.

The important requirement is the contract, not the URL name.

---

# 40. Existing SANKET API Relationship

The current project specification already defines a common report ingestion endpoint:

```http
POST /api/reports/ingest
```

and a voice transcription endpoint:

```http
POST /api/voice/transcribe
```

The repository audit found that the actual implementation differs from the specification in important ways.

The desired architecture should therefore be:

```text
FIELD OBSERVATION
      |
      v
TRANSCRIPTION
      |
      v
REVIEW / CONFIRM
      |
      v
POST /api/reports/ingest
      |
      v
EXISTING NLP PIPELINE
```

Do not create a parallel intelligence pipeline specifically for radio.

---

# 41. Field Observation to Report Transformation

Example:

```text
Raw audio:
"Pump four is vibrating heavily near the separator."
```

becomes:

```json
{
  "observation_id": "FO-001823",
  "source": "radio",
  "location": "Well Pad 7",
  "activity_type": "drilling",
  "text": "Pump four is vibrating heavily near the separator."
}
```

Then:

```text
POST /api/reports/ingest
      |
      v
Report
      |
      +--> SIF
      +--> Entity
      +--> LSR
      +--> Explanation
```

The same report can then contribute to:

```text
Signal Graph
Near-Miss Multiplier
Systemic Alert
Incident Inspector
CAPA
```

This is the desired cross-component integration.

---

# 42. Field Reporter to Signal Graph

The Field Reporter should not directly manipulate the graph.

Instead:

```text
Field Reporter
      |
      v
Field Observation
      |
      v
Report Ingestion
      |
      v
NLP
      |
      v
Canonical Entities
      |
      v
Graph Projection
      |
      v
Systemic Risk
```

This keeps the graph grounded in the same canonical report data as all other ingestion channels.

The repository deep analysis currently identifies this connection as missing.

---

# 43. Why Idempotency Matters to the Signal Graph

Consider:

```text
Worker says:
"BOP valve leaking."
```

The edge uploads it.

Network fails after the server receives it.

The edge retries.

Without idempotency:

```text
Report 1
Report 2
```

The Signal Graph and systemic cluster detector may incorrectly interpret this as repeated independent evidence.

With idempotency:

```text
FO-001823
already exists
```

The retry becomes harmless.

Therefore Field Reporter idempotency is not merely a backend reliability feature.

It directly affects systemic safety intelligence.

---

# 44. Audio Storage Strategy

There should be three distinct artifacts.

## Raw evidence

Original audio.

## Transcript

Speech-to-text output.

## Structured report

The normalized safety observation.

Recommended relationship:

```text
Audio
  |
  +--> Transcript
          |
          +--> corrected transcript
                  |
                  +--> Report
```

The original audio should not be silently replaced by corrected text.

Retention should be governed by the deploying organization.

---

# 45. Privacy and Data Governance

Radio transmissions may contain:

- worker voices;
- names;
- locations;
- operational information;
- unrelated conversation.

The system should therefore avoid recording everything indiscriminately.

Preferred model:

```text
Dedicated Safety Channel
        |
        v
Only relevant safety transmissions
        |
        v
SANKET ingestion
```

Production deployment should define:

- retention duration;
- who can replay audio;
- who can view transcripts;
- whether worker identity is stored;
- whether audio is encrypted;
- when audio is deleted;
- audit requirements.

---

# 46. Security Requirements

Production architecture should provide:

```text
Gateway
  |
  v
Device Identity / Certificate
  |
  v
Authenticated Edge Agent
  |
  v
SANKET
```

Required controls include:

- gateway authentication;
- source/channel authorization;
- upload size limits;
- audio duration limits;
- MIME/content validation;
- rate limiting;
- encryption in transit;
- protected local storage;
- RBAC on reports and audio;
- audit logging;
- retry protection;
- idempotency.

The repository audit notes that authentication is currently not enforced consistently across the report, voice and graph routes.

This should be corrected before production deployment.

---

# 47. Offline Architecture

The desired production architecture is:

```text
FIELD
  |
  v
RADIO
  |
  v
RoIP
  |
  v
EDGE PC
  |
  +--> Local audio storage
  +--> Local queue
  +--> Local ASR
  +--> Local SIF/entity/LSR processing where feasible
  |
  v
Sync when connectivity returns
  |
  v
CENTRAL SANKET
```

This is stronger than simply saying "the app works offline."

Offline capability must include:

- local capture;
- local persistence;
- local processing where required;
- retry;
- ordering;
- deduplication;
- synchronization;
- recovery after edge restart.

The current repository does not yet implement this complete field-offline architecture.

---

# 48. SIH Prototype Strategy

Do not attempt to deploy a certified industrial radio system as part of the SIH software prototype.

Instead implement:

```text
USB Microphone
      |
      v
Simulated PTT
      |
      v
SimulatorRadioAdapter
      |
      v
FieldObservation
      |
      v
Local Whisper / Online STT
      |
      v
Review
      |
      v
Report Ingestion
      |
      v
SIF / Entities / LSR
      |
      v
Signal Graph / Systemic Risk
```

The simulator should behave as closely as possible to the future production adapter.

---

# 49. Simulator Requirements

The simulator should expose the same conceptual events as the real gateway:

```text
transmission_started
audio_chunk
transmission_ended
```

Example:

```python
class SimulatorRadioAdapter:
    async def start_transmission(self, metadata):
        ...

    async def ingest_audio(self, chunk):
        ...

    async def end_transmission(self):
        ...
```

The future adapter becomes:

```python
class RadioRoIPAdapter:
    async def start_transmission(self, metadata):
        ...

    async def ingest_audio(self, chunk):
        ...

    async def end_transmission(self):
        ...
```

The rest of SANKET remains unchanged.

---

# 50. Recommended Repository Architecture

Adapt this to the existing repository rather than blindly creating duplicate modules.

```text
backend/
|
+-- api/
|   +-- voice_routes.py
|   +-- report_routes.py
|   +-- field_observation_routes.py
|
+-- services/
|   +-- field_ingestion_service.py
|   +-- transcription_service.py
|   +-- observation_service.py
|   +-- idempotency_service.py
|
+-- models/
|   +-- field_observation.py
|   +-- report.py
|
+-- workers/
|   +-- pipeline_worker.py
|
edge/
|
+-- adapters/
|   +-- radio_roip.py
|   +-- simulator_radio.py
|   +-- sip.py
|   +-- browser.py
|
+-- audio/
|   +-- capture.py
|   +-- buffer.py
|   +-- quality.py
|
+-- queue/
|   +-- store_and_forward.py
|
+-- agent.py
|
ai/
|
+-- voice/
    +-- whisper_service.py
```

Do not duplicate an existing service simply because this structure is shown.

First inspect the repository.

---

# 51. Recommended Implementation Phases

## Phase 0 - Correctness

Fix:

1. `raw_text` vs `text`;
2. fabricated frontend result;
3. fabricated Whisper fallback;
4. truthful processing states;
5. upload validation;
6. authentication;
7. minimum/maximum text and audio validation.

This should happen first.

## Phase 1 - Real browser voice

Implement:

```text
MediaRecorder
  |
  v
audio upload
  |
  v
transcription
  |
  v
editable transcript
  |
  v
confirm
  |
  v
report ingestion
```

## Phase 2 - FieldObservation abstraction

Create a transport-independent observation model.

Sources:

```text
TEXT
VOICE_BROWSER
RADIO
KIOSK
LANDLINE
```

## Phase 3 - Simulator radio

Implement:

```text
SimulatorRadioAdapter
```

and demonstrate:

```text
PTT
  |
  v
audio event
  |
  v
FieldObservation
```

## Phase 4 - Edge queue

Implement:

- durable queue;
- retries;
- backoff;
- idempotency;
- offline status;
- restart recovery.

## Phase 5 - Real gateway integration

Only after the target radio system is identified.

Implement:

```text
RadioRoIPAdapter
```

for the chosen gateway/vendor interface.

## Phase 6 - Production hardening

Add:

- device certificates;
- encrypted storage;
- retention;
- gateway health monitoring;
- channel authorization;
- audit logs;
- failure recovery;
- deployment packaging.

---

# 52. SIH Online vs Offline Demonstration

## Online demonstration

```text
PTT simulation
  |
  v
Audio
  |
  v
Groq Whisper
  |
  v
Transcript
  |
  v
SANKET
```

This is useful for demonstrating fast speech recognition.

## Offline demonstration

```text
PTT simulation
  |
  v
Audio
  |
  v
Local Whisper
  |
  v
SANKET
```

Disable the network and demonstrate that the local path continues to work.

The project should explicitly label which mode is being demonstrated.

---

# 53. Testing Strategy

## 53.1 Unit tests

Test:

- PTT start;
- PTT end;
- audio buffering;
- metadata validation;
- observation creation;
- idempotency;
- hash generation;
- queue persistence;
- transcript failure;
- state transitions.

## 53.2 API tests

Test:

- valid audio;
- invalid audio;
- empty audio;
- oversized audio;
- unsupported MIME;
- unauthorized gateway;
- duplicate observation;
- retry;
- report ingestion.

## 53.3 Offline tests

Test:

```text
backend unavailable
  |
  v
queue locally
  |
  v
restart edge
  |
  v
recover queue
  |
  v
network returns
  |
  v
upload
  |
  v
deduplicate
```

## 53.4 End-to-end test

The most important test should be:

```text
Radio simulator
  |
  v
FieldObservation
  |
  v
ASR
  |
  v
Report
  |
  v
SIF
  |
  v
Entity
  |
  v
LSR
  |
  v
Graph
  |
  v
Three related reports
  |
  v
Systemic signal
```

This proves that the Field Reporter is actually connected to the rest of SANKET.

---

# 54. Monitoring and Health

The edge system should expose:

```text
EDGE STATUS
CONNECTED

RADIO CHANNEL
SAFETY-9

LAST TRANSMISSION
08:41:23

TODAY'S OBSERVATIONS
143

QUEUED
2

FAILED
1

ASR
READY

STORAGE
82%

NETWORK
ONLINE
```

The system should also monitor:

- last gateway heartbeat;
- last successful audio event;
- queue depth;
- ASR availability;
- local disk;
- network state;
- synchronization failures.

A silent ingestion failure is unacceptable.

---

# 55. Gateway Health Model

Use:

```text
CONNECTED
DEGRADED
DISCONNECTED
```

with:

```text
last_seen
last_transmission
queue_depth
error_count
```

The command center should be able to distinguish:

```text
"No safety observations today."
```

from:

```text
"Radio gateway has been offline for six hours."
```

These are operationally very different situations.

---

# 56. Latency

The UI currently suggests a sub-500ms edge triage capability.

This should not be presented as a proven end-to-end guarantee until measured.

The actual path is:

```text
PTT
  |
  v
Radio
  |
  v
Gateway
  |
  v
Network
  |
  v
Audio buffer
  |
  v
ASR
  |
  v
NLP
  |
  v
Alert
```

Measure each component:

```text
radio -> gateway
gateway -> edge
capture/buffer
ASR
NLP
alert emission
```

Then calculate actual end-to-end latency.

For SIH, present the value as a measured prototype result rather than a production guarantee.

---

# 57. Failure Handling

## Gateway offline

```text
Gateway offline
  |
  v
EDGE = DEGRADED
```

## Backend offline

```text
Edge
  |
  v
Local queue
```

## ASR unavailable

```text
Audio retained
  |
  v
TRANSCRIPTION_PENDING / FAILED
```

## Poor audio

```text
LOW QUALITY
  |
  v
RETRY / REVIEW
```

## Duplicate observation

```text
same observation_id
  |
  v
DEDUPLICATE
```

## Unknown source/channel

```text
QUARANTINE / REJECT
```

## Unauthorized gateway

```text
REJECT
AUDIT
```

---

# 58. Security and Safety Rules for AI Implementers

An AI coding agent must not:

1. fabricate a transcript;
2. fabricate a successful ingestion result;
3. invent a radio gateway API;
4. assume every radio exposes PTT metadata;
5. hard-code a specific radio vendor into core SANKET logic;
6. claim ATEX/IECEx/OISD/DGMS certification for software;
7. claim a gateway is intrinsically safe without evidence;
8. create an autonomous physical safety interlock;
9. silently drop queued observations;
10. duplicate observations during retries;
11. overwrite original audio evidence with edited transcript;
12. bypass authentication because the system is "internal";
13. claim offline capability when the implementation requires a network;
14. claim a latency target without measurement;
15. create a second intelligence pipeline for radio observations.

---

# 59. AI Implementation Rules

If this document is supplied to Codex, Claude Code, Gemini CLI or another coding agent:

## Rule 1 - Inspect before modifying

Read:

- `SANKET_COMPONENT_DEEP_ANALYSIS.md`;
- `SANKET_PRD.md`;
- `SANKET_TECHNICAL_APPLICATION_SPECIFICATION_FINAL.md`;
- the current voice page;
- voice routes;
- report schema;
- report worker;
- Whisper service;
- authentication code.

## Rule 2 - Preserve the existing pipeline

Do not replace:

```text
Report
  ->
SIF
  ->
Entities
  ->
LSR
  ->
Explanation
```

unless there is a specific defect requiring change.

## Rule 3 - Make the observation contract explicit

All ingestion sources should converge on the same conceptual object.

## Rule 4 - Keep transport-specific code behind adapters

Radio code belongs in:

```text
RadioRoIPAdapter
```

not throughout the report pipeline.

## Rule 5 - Make failure truthful

No fake success.

No fake transcript.

No fake SIF result.

## Rule 6 - Preserve provenance

Keep:

- observation ID;
- source;
- timestamp;
- channel/device when available;
- audio reference;
- transcript;
- model/provider;
- review/correction state.

## Rule 7 - Make retries safe

Use idempotency.

## Rule 8 - Do not overengineer SIH

For the prototype:

```text
Simulator
  ->
FieldObservation
  ->
ASR
  ->
Report
```

is more valuable than an unfinished industrial-radio integration.

## Rule 9 - Do not add a graph-specific radio path

The Field Reporter should feed the canonical report pipeline.

## Rule 10 - Separate AI from physical safety control

Classification and recommendation are not equivalent to a certified safety interlock.

---

# 60. Recommended AI Implementation Sequence

```text
STEP 1
Inspect existing Field Reporter

        |
        v

STEP 2
Fix text contract

        |
        v

STEP 3
Remove fabricated outcomes

        |
        v

STEP 4
Fix Whisper failure behavior

        |
        v

STEP 5
Implement real MediaRecorder path

        |
        v

STEP 6
Add candidate transcript review

        |
        v

STEP 7
Define FieldObservation

        |
        v

STEP 8
Add idempotency

        |
        v

STEP 9
Implement SimulatorRadioAdapter

        |
        v

STEP 10
Add local queue/store-and-forward

        |
        v

STEP 11
Connect FieldObservation to report pipeline

        |
        v

STEP 12
Verify report -> graph/systemic pipeline

        |
        v

STEP 13
Only then implement real RoIP adapter
```

Do not reverse this order.

---

# 61. Definition of Done

The Field Reporter improvement is complete when:

## Core

- [ ] Text fallback works against the real report API.
- [ ] No fabricated success result exists.
- [ ] No fabricated transcript exists.
- [ ] Real browser recording works or is explicitly labelled as simulated.
- [ ] Transcript is available to the UI.
- [ ] Candidate transcript can be corrected where required.
- [ ] Confirmed observation enters the canonical report pipeline.

## Data

- [ ] Every observation has a unique ID.
- [ ] Source is persisted.
- [ ] Timestamp is persisted.
- [ ] Channel/device are persisted when available.
- [ ] Audio reference/hash can be persisted when retention is enabled.
- [ ] Transcript state is persisted.
- [ ] Review/correction state is persisted.

## Reliability

- [ ] Duplicate submissions are rejected/deduplicated.
- [ ] Offline queue exists for the intended offline mode.
- [ ] Retry works.
- [ ] Edge restart does not lose queued observations.
- [ ] Failure states are visible.

## Intelligence

- [ ] Field observation becomes a Report.
- [ ] SIF classification runs.
- [ ] Entities are extracted.
- [ ] LSR tags are generated.
- [ ] Signal Graph can consume the resulting report.
- [ ] Systemic cluster detection can consume the resulting report.

## Radio architecture

- [ ] SimulatorRadioAdapter works.
- [ ] RadioRoIPAdapter interface is defined.
- [ ] Exact production gateway is selected only after target radio discovery.
- [ ] Gateway authentication is defined for production.
- [ ] Hazardous-area hardware responsibility is clearly separated from SANKET software.

## Testing

- [ ] Unit tests exist.
- [ ] API tests exist.
- [ ] Idempotency test exists.
- [ ] Offline/retry test exists.
- [ ] End-to-end field-observation test exists.

---

# 62. Production vs SIH

| Capability | SIH Prototype | Production |
|---|---|---|
| Field device | Simulated PTT / microphone | Approved site radio |
| Radio transport | Simulator | VHF/UHF/DMR/TETRA/P25/vendor system |
| Gateway | Simulator adapter | Commercial/vendor RoIP gateway |
| ASR | Local Whisper and/or online demo provider | Edge/local ASR preferred |
| Network | Normal network | LAN/private WAN/intermittent WAN |
| Queue | Local prototype queue | Durable encrypted store-and-forward |
| Device identity | Basic | Certificate/device identity |
| Audio retention | Demo | Formal retention policy |
| Safety channel | Simulated Channel 9 | Site-governed channel |
| Certification | Not claimed | Hardware/site-specific verification |
| Emergency controls | Simulation only | Separately engineered and governed |
| Latency | Measured demo | Production benchmark |
| OT/DCS | Not connected | Separate validated integration |

---

# 63. Recommended Product Language

Use:

> "SANKET integrates with approved site radio infrastructure through RoIP, vendor-supported dispatch interfaces, or other governed IP communication gateways."

Avoid:

> "SANKET directly connects to walkie-talkies."

Use:

> "Safety-channel radio transmissions are bridged into SANKET's edge ingestion layer."

Avoid:

> "Every walkie-talkie sends audio directly to SANKET."

Use:

> "SANKET converts field communications into safety intelligence for rapid HSE response."

Avoid:

> "AI controls the rig."

---

# 64. Open Questions Before Real Hardware Integration

These questions must be answered before implementing a real gateway adapter.

1. Which exact radio manufacturer and model will the target site use?
2. Is the system analog, DMR, TETRA, P25 or another technology?
3. Is there already a repeater/base station/dispatch system?
4. Does the radio infrastructure expose an audio interface?
5. Does it expose PTT/COR/COS?
6. Is radio identity available?
7. Is channel identity available?
8. What IP integration is already available?
9. Is there an existing SIP/PBX system?
10. Where can the gateway physically be installed?
11. What hazardous-area certification is required for each physical device?
12. What audio-retention policy applies?
13. Does the site permit recording of radio traffic?
14. Is the safety channel dedicated to SANKET?
15. Should radio observations be immediately ingested or reviewed first?
16. What is the expected maximum number of concurrent transmissions?
17. What network connectivity exists between the field, edge cabin and central SANKET?
18. What is the required offline duration?
19. What is the required recovery behavior after power loss?
20. Which languages must be supported and tested?

Until these questions are answered, the correct production design is an adapter boundary rather than a vendor-specific implementation.

---

# 65. Source Traceability

## Product Requirements

`SANKET_PRD.md`

Relevant concepts:

- F13 field/voice reporting;
- field-worker workflow;
- voice-to-report;
- SIF intelligence;
- systemic safety intelligence;
- air-gap capability.

## Technical Specification

`SANKET_TECHNICAL_APPLICATION_SPECIFICATION_FINAL.md`

Relevant concepts:

- voice ingestion;
- local Whisper;
- report ingestion;
- offline/air-gap mode;
- architecture layers;
- end-to-end report processing.

## Repository Deep Analysis

`SANKET_COMPONENT_DEEP_ANALYSIS.md`

Relevant findings:

- current Field Reporter is a simulator;
- `raw_text` / `text` contract mismatch;
- fabricated failure behavior;
- unused backend Whisper path;
- missing transcript review;
- missing idempotency;
- missing complete offline field queue;
- missing graph/cluster integration;
- recommended FieldObservation abstraction.

## Mentor Feedback

`mentor feedback.md`

Relevant concepts:

- approved field communication devices;
- VHF/UHF radio;
- dedicated safety-channel concept;
- local edge/doghouse architecture;
- local processing;
- store-and-forward;
- zero-network operation;
- separation of production industrial hardware from the software prototype.

---

# 66. External Technical Research

The following official sources were used to verify the external integration concepts.

## RoIP

**Cubic Vocality RoIP**

Official product documentation describes Vocality RoIP as a Radio-over-IP gateway connecting PTT/LMR radios with IP infrastructure and other voice systems, including radio bridging and multiple radio types/manufacturers.

**JPS RSP-Z2**

Official product documentation describes RSP-Z2 as an analog/VoIP communications gateway capable of patching local radio with IP-based resources including SIP, RTP and RoIP.

## SIP / PBX

**Asterisk Documentation**

Asterisk's official documentation describes ARI and the `/channels/externalMedia` interface for forwarding bridge media to an external media application. RTP is supported for the documented External Media interface. Newer Asterisk releases also provide WebSocket media support.

## Speech-to-Text

**Groq Documentation**

Groq currently documents OpenAI-compatible speech-to-text endpoints using `whisper-large-v3` and `whisper-large-v3-turbo`.

**Local Whisper**

The SANKET repository already contains a local Whisper implementation. The repository implementation should be corrected and evaluated rather than replaced unnecessarily.

---

# 67. Final Reference Architecture

```text
                         +----------------------+
                         |        WORKER        |
                         |                      |
                         | Approved PTT Radio   |
                         +----------+-----------+
                                    |
                                    | RF
                                    v
                         +----------------------+
                         |   SITE RADIO SYSTEM  |
                         |                      |
                         | Base / Repeater /    |
                         | Dispatch             |
                         +----------+-----------+
                                    |
                                    | Audio + signalling
                                    v
                         +----------------------+
                         |     RoIP GATEWAY     |
                         |                      |
                         | Radio -> IP          |
                         | PTT/COR if exposed   |
                         | RTP/SIP/vendor RoIP  |
                         +----------+-----------+
                                    |
                                  Ethernet
                                    |
                                    v
                 +----------------------------------------+
                 |          SANKET EDGE GATEWAY            |
                 |                                        |
                 | Radio Ingestion Agent                   |
                 | Audio Buffer                            |
                 | Local Queue                             |
                 | Device/Channel Metadata                |
                 | Local ASR                               |
                 | Store-and-Forward                       |
                 +-------------------+--------------------+
                                     |
                                     v
                           +---------------------+
                           | FIELD OBSERVATION   |
                           +----------+----------+
                                      |
                                      v
                           +---------------------+
                           | TRANSCRIPTION       |
                           |                     |
                           | Local Whisper       |
                           | or online provider  |
                           +----------+----------+
                                      |
                                      v
                           +---------------------+
                           | REVIEW / CONFIRM    |
                           +----------+----------+
                                      |
                                      v
                           +---------------------+
                           | SANKET REPORT       |
                           | INGESTION           |
                           +----------+----------+
                                      |
                                      v
                           +---------------------+
                           | NLP PIPELINE        |
                           |                     |
                           | SIF                 |
                           | Entities            |
                           | LSR                 |
                           | Explanation         |
                           +----------+----------+
                                      |
                                      v
                    +------------------------------------+
                    | SYSTEMIC SAFETY INTELLIGENCE       |
                    |                                    |
                    | Signal Graph                       |
                    | Temporal Clusters                  |
                    | Systemic Alerts                    |
                    +----------------+-------------------+
                                     |
                                     v
                           +---------------------+
                           | HSE COMMAND CENTER  |
                           |                     |
                           | Investigation       |
                           | Evidence            |
                           | CAPA                |
                           +---------------------+
```

---

# 68. Final Product Principle

The Field Reporter should make the worker's interaction simple:

```text
PRESS
  |
  v
SPEAK
  |
  v
RELEASE
```

The system should transform that communication into:

```text
RADIO
  |
  v
RoIP
  |
  v
EDGE
  |
  v
AUDIO
  |
  v
ASR
  |
  v
FIELD OBSERVATION
  |
  v
REPORT
  |
  v
INDIVIDUAL INTELLIGENCE
  |
  v
SYSTEMIC INTELLIGENCE
  |
  v
ACTIONABLE INVESTIGATION
```

The radio is not the intelligence layer.

The RoIP gateway is not the intelligence layer.

The transcription model is not the intelligence layer.

They are ingestion mechanisms.

The actual SANKET value is created when the field observation becomes reliable, traceable and useful safety information inside the existing SANKET intelligence pipeline.

---

# 69. One-Sentence Definition

If the entire feature needs to be explained in one sentence:

> **The SANKET Field Reporter integrates approved field communication systems with an edge-based ingestion pipeline so that a worker's PTT voice observation can become a truthful, reviewable and provenance-backed safety report that feeds SIF detection, systemic-risk analysis, the Signal Graph and HSE action.**

---

# 70. Final Instruction to an AI Implementer

**Implement the Field Reporter as a transport-independent, evidence-preserving field-ingestion system, not merely as a voice recorder or radio demo.**

The implementation must:

1. inspect the current repository before changing code;
2. preserve the existing report/NLP pipeline;
3. fix the current `text`/`raw_text` contract;
4. remove fabricated success and fabricated transcripts;
5. implement truthful processing states;
6. implement real browser audio capture where required;
7. provide candidate transcript review for browser/kiosk workflows;
8. define a versioned `FieldObservation` contract;
9. support simulator, browser, SIP and future radio adapters behind one boundary;
10. preserve observation identity and provenance;
11. implement strict idempotency;
12. support audio hashing where audio is retained;
13. validate uploads;
14. support durable offline queueing where offline operation is claimed;
15. preserve queued observations across restart;
16. retry safely;
17. connect confirmed observations to `/api/reports/ingest` or the equivalent canonical report service;
18. ensure field reports can eventually reach the Signal Graph/systemic-risk pipeline;
19. keep radio-vendor logic outside the core intelligence pipeline;
20. do not invent a generic radio API;
21. do not assume radio metadata that the gateway does not expose;
22. do not claim ATEX/IECEx/OISD/DGMS certification for software;
23. do not implement autonomous physical safety interlocks;
24. do not claim sub-500ms latency without measurement;
25. implement the SIH simulator before requiring industrial hardware;
26. only implement a real RoIP adapter after the target radio system and gateway interface are known;
27. write unit, API, offline, idempotency and end-to-end tests;
28. document all production assumptions explicitly.

**Do not stop at making the Field Reporter look like it records voice. The objective is to make a field observation become real, traceable and useful safety intelligence.**
