"""
SANKET · AI — Synthetic Data Generator
Generates 500 realistic safety reports for Oil India demo data.
Includes 2 pre-seeded clusters for Near-Miss Multiplier demo.
"""

import json
import random
import uuid
from datetime import datetime, timedelta

# Oil India locations
LOCATIONS = [
    "Well Pad 7", "Moran OCS-3", "Digboi Pad 14", "Baghjan Well #5",
    "Duliajan Plant", "Naharkatia Field", "Tengakhat Station",
    "Lakwa Gathering", "Geleki Processing", "Rudrasagar Pad 2",
]

ACTIVITIES = ["Drilling", "Workover", "Wireline", "Pipeline", "Hot Work"]
SHIFTS = ["DAY", "NIGHT"]
EQUIPMENT = [
    "Pump-04", "Compressor C-02", "Wellhead-7", "BOP", "Crane-3",
    "Valve V-12", "Generator G-01", "Separator S-05", "Tank T-03",
    "Pipeline PL-08", "Scaffold-11", "Forklift FL-2", "Transformer TR-6",
]

# ─── HIGH severity reports (SIF Precursors) ──────────────────
HIGH_REPORTS = [
    "Worker fell from scaffolding at height of 6 meters without harness at {location} during {activity}",
    "H2S gas leak detected near wellhead at {location} with concentration above 10 ppm safe limit",
    "BOP control system malfunction during drilling at {location}. Annular pressure spiking to 3500 PSI",
    "Electrical arc flash incident at 440V switchgear in {location} with inadequate PPE",
    "Crane load dropped from 8 meters due to sling failure at {location} loading bay",
    "Confined space entry without gas testing or rescue standby at {location} tank T-03",
    "Unguarded rotating {equipment} caught worker glove and pulled hand towards pinch point",
    "High pressure pipeline rupture at {location} sending debris across work area during {activity}",
    "Hot work welding performed near open crude oil storage tank at {location} without fire watch permit",
    "Well kick detected with rapid annular pressure increase during tripping at {location}",
    "Blowout preventer failed pressure test at {location} but drilling continued without repair",
    "Worker found unconscious near {equipment} at {location} suspected toxic gas inhalation",
    "Scaffolding collapse at {location} trapping two workers underneath steel structure",
    "Forklift struck pedestrian in blind spot at {location} loading bay during {shift} shift",
    "Explosion in process vessel at {location} due to undetected hydrocarbon buildup",
    "Worker electrocuted while working on live 11KV panel at {location} without LOTO procedure",
    "Fire broke out in crude oil tank farm at {location} during lightning storm",
    "Suspended load swung out of control hitting worker on platform at {location}",
    "Excavation wall collapsed at {location} burying workers without trench box shoring",
    "Pressure safety valve bypassed at {location} to maintain production throughput",
    "Gas cutting operation at {location} near diesel storage without fire watch",
    "Derrickman working at monkey board at {location} without fall arrest system",
    "Steam line burst at {location} causing thermal burns to operator standing nearby",
    "Vehicle rollover on unpaved rig access road near {location} during monsoon conditions",
    "Temporary valve bypass utilized at {location} due to critical replacement part delay",
]

# ─── MEDIUM severity reports ──────────────────────────
MEDIUM_REPORTS = [
    "Annular pressure fluctuation of 80 PSI logged on BOP at {location} during {activity}",
    "Oil seepage detected near {equipment} flange at {location} but contained within bund wall",
    "Vibration alarm triggered on {equipment} at {location} above normal threshold",
    "Worker found at height without secondary lanyard during inspection at {location}",
    "Temporary electrical bypass installed at {location} without electrical isolation permit",
    "Gas bubble observed in cellar pit at {location} during drilling mud circulation",
    "Crane operating near overhead power lines at {location} without spotter guidance",
    "Small fire on welding sparks caught insulation material briefly at {location}",
    "Mud fluid loss observed during tripping operations at {location} well site",
    "Chemical drum leak in storage area at {location} without secondary containment berm",
    "Ground subsidence noticed near pipeline corridor at {location} after heavy rain",
    "Sling showing visible wear used for heavy lift at {location} without inspection tag",
    "Night shift crew reported unusual noise from process separator at {location}",
    "Vehicle overspeeding recorded on rig access road near {location} in wet conditions",
    "Corroded pipe section identified during routine inspection at {location} pipeline",
    "PPE non-compliance: worker welding without face shield at {location}",
    "Exhaust ventilation fan in {equipment} room at {location} found non-functional",
    "Gas detector calibration overdue by 3 months at {location} process area",
    "Emergency exit partially blocked by stored materials at {location} workshop",
    "Safety shower at {location} found to have low flow rate below standard",
    "Crane limit switch found bypassed at {location} during routine equipment audit",
    "Minor oil spill near {equipment} at {location} during maintenance activity",
    "Unauthorized hot work observed at {location} without valid work permit",
    "Fall protection anchor point at {location} found damaged during inspection",
    "Night shift handover incomplete — critical equipment status not communicated at {location}",
    "Partial scaffold board missing at platform level 3 at {location}",
    "Fire extinguisher at {equipment} area at {location} found with low pressure gauge",
    "Temporary lighting at {location} night worksite found inadequate for safe work",
    "Bolted connection on {equipment} at {location} found hand tight only",
    "Personnel observed crossing under suspended crane load at {location}",
]

# ─── LOW severity reports ──────────────────────────
LOW_REPORTS = [
    "Minor oil stain found on walkway near {equipment} at {location}",
    "Worker reported missing safety glasses during routine inspection at {location}",
    "Housekeeping issue with tools left on walkway near {location} office area",
    "First aid treatment for minor cut on hand during routine maintenance at {location}",
    "PPE non-compliance observed: worker not wearing hard hat in {location} yard",
    "Sign board faded and unreadable at remote pipeline marker near {location}",
    "Minor trip hazard reported from uneven floor tile in {location} control room",
    "Noise level slightly above comfort threshold in {location} generator room",
    "Safety shower test at {location} showed slow flow rate below standard",
    "Routine fire extinguisher found past inspection date at {location} warehouse",
    "Toolbox talk attendance low at {location} morning safety briefing",
    "Waste segregation bins overflowing at {location} workshop area",
    "Door closer on control room entrance at {location} found broken",
    "Paint markings on walkway at {location} faded and need refreshing",
    "Eye wash station found with empty water container at {location}",
    "Worker observed carrying load by hand instead of using trolley at {location}",
    "Safety bulletin board at {location} not updated for past 2 weeks",
    "Portable toilet at {location} field site needs cleaning and maintenance",
    "Visitor without helmet observed briefly in {location} parking area",
    "Office ergonomic assessment overdue for desk workstation at {location}",
    "Cafeteria food handling area at {location} needs deep cleaning",
    "Worker complaint about uncomfortable new safety boots at {location}",
    "Broken handrail on staircase at {location} admin building reported",
    "Mosquito net torn at {location} field camp quarters",
    "Water cooler at {location} workshop area found not functioning",
]


def generate_report(template: str, day_offset: int = 0) -> dict:
    """Generate a single report from a template."""
    location = random.choice(LOCATIONS)
    activity = random.choice(ACTIVITIES)
    shift = random.choice(SHIFTS)
    equipment = random.choice(EQUIPMENT)

    text = template.format(
        location=location,
        activity=activity,
        shift=shift,
        equipment=equipment,
    )

    base_date = datetime.utcnow() - timedelta(days=30)
    report_date = base_date + timedelta(days=day_offset, hours=random.randint(0, 23))

    return {
        "id": str(uuid.uuid4()),
        "text": text,
        "location": location,
        "activity_type": activity,
        "shift": shift,
        "created_at": report_date.isoformat(),
    }


def generate_cluster_reports() -> list[dict]:
    """
    Generate pre-seeded clusters for Near-Miss Multiplier demo.
    Cluster A: Well Pad 7, 3 oil-leak reports on Days 1/3/5
    Cluster B: Compressor C-02, 4 vibration/noise reports on Days 2/4/5/6
    """
    clusters = []

    # Cluster A — Well Pad 7 oil leaks (3 events, 5-day window)
    cluster_a = [
        {"text": "Oil seepage detected near Pump-04 flange at Well Pad 7 during Drilling. Small puddle forming under equipment.", "day": 1},
        {"text": "Oil stain spreading on walkway near Pump-04 at Well Pad 7. Second report this week. Gasket may be failing.", "day": 3},
        {"text": "Active oil drip from Pump-04 discharge line at Well Pad 7 during Workover. Bund containment at 40% capacity.", "day": 5},
    ]

    for item in cluster_a:
        clusters.append({
            "id": str(uuid.uuid4()),
            "text": item["text"],
            "location": "Well Pad 7",
            "activity_type": "Drilling",
            "shift": "DAY",
            "created_at": (datetime.utcnow() - timedelta(days=7 - item["day"])).isoformat(),
        })

    # Cluster B — Compressor C-02 vibration (4 events, 5-day window)
    cluster_b = [
        {"text": "Vibration alarm triggered on Compressor C-02 at Moran OCS-3 above normal threshold. Bearing temperature normal.", "day": 2},
        {"text": "Unusual noise from Compressor C-02 at Moran OCS-3 reported by night shift crew. Sounds like metal contact.", "day": 4},
        {"text": "Compressor C-02 at Moran OCS-3 vibration reading 12mm/s exceeding 8mm/s limit. Maintenance requested.", "day": 5},
        {"text": "Compressor C-02 at Moran OCS-3 auto-tripped on high vibration. Emergency shutdown activated successfully.", "day": 6},
    ]

    for item in cluster_b:
        clusters.append({
            "id": str(uuid.uuid4()),
            "text": item["text"],
            "location": "Moran OCS-3",
            "activity_type": "Pipeline",
            "shift": random.choice(SHIFTS),
            "created_at": (datetime.utcnow() - timedelta(days=7 - item["day"])).isoformat(),
        })

    return clusters


def generate_all(count: int = 500) -> list[dict]:
    """
    Generate the full synthetic dataset.
    Distribution: HIGH 20% / MEDIUM 30% / LOW 50%
    """
    reports = []

    # Calculate counts
    high_count = int(count * 0.20)   # 100
    medium_count = int(count * 0.30)  # 150
    low_count = count - high_count - medium_count  # 250

    # Generate reports
    for i in range(high_count):
        template = HIGH_REPORTS[i % len(HIGH_REPORTS)]
        reports.append(generate_report(template, random.randint(0, 30)))

    for i in range(medium_count):
        template = MEDIUM_REPORTS[i % len(MEDIUM_REPORTS)]
        reports.append(generate_report(template, random.randint(0, 30)))

    for i in range(low_count):
        template = LOW_REPORTS[i % len(LOW_REPORTS)]
        reports.append(generate_report(template, random.randint(0, 30)))

    # Add pre-seeded clusters
    clusters = generate_cluster_reports()
    reports.extend(clusters)

    # Shuffle
    random.shuffle(reports)

    return reports


if __name__ == "__main__":
    data = generate_all(500)
    output_path = "data/synthetic/synthetic_500.json"
    import os
    os.makedirs("data/synthetic", exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"[OK] Generated {len(data)} reports -> {output_path}")
    print(f"  Total: {len(data)}")
    print(f"  Cluster reports: 7 (3 + 4)")
