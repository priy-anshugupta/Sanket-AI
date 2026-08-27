"""
SANKET · AI — Stage 3: Entity Extractor
Zero-shot NER using spaCy with custom industrial entity types.
"""

import re
from typing import Optional


class EntityExtractor:
    """
    Stage 3 of the NLP pipeline.
    Extracts 8 industrial entity types from report text.
    Uses pattern matching + keyword matching as primary approach.
    GLiNER can be added as optional enhancement.

    Entity Types: EQUIPMENT, LOCATION, SHIFT_TIME, WEATHER_CONDITION,
                  PPE_STATUS, BARRIER_FAILURE, ENERGY_SOURCE, BODY_PART
    """

    def __init__(self):
        self._initialized = False

        # Equipment patterns
        self.equipment_patterns = [
            r'\b(pump|compressor|valve|pipe|pipeline|wellhead|BOP|blowout preventer|'
            r'crane|forklift|scaffold|scaffolding|tank|vessel|separator|'
            r'generator|motor|turbine|drill|derrick|kelly|'
            r'hose|flange|gasket|bearing|gear|winch|sling|rigging|'
            r'transformer|switchgear|panel|cable|wire|conductor|'
            r'exchanger|heater|boiler|furnace|reactor|column|tower)\b'
            r'(?:\s*[-#]?\s*\d+[-A-Z]*)?',
        ]

        # Location patterns (Oil India specific)
        self.location_patterns = [
            r'\b(Well Pad|Pad|OCS|Moran|Digboi|Baghjan|Duliajan|Naharkatia|'
            r'Tengakhat|Lakwa|Geleki|Rudrasagar|Jorhat|Nazira|'
            r'rig floor|cellar pit|monkey board|loading bay|control room|'
            r'tank farm|pipe yard|workshop|warehouse|substation|'
            r'platform|deck|derrick floor|mud pit|shaker room)\b'
            r'(?:\s*[-#]?\s*\d+[-A-Z]*)?',
        ]

        # Barrier failures
        self.barrier_keywords = {
            "BARRIER_FAILURE": [
                "bypass", "bypassed", "disabled", "overridden", "override",
                "failed", "failure", "malfunction", "missing", "absent",
                "broken", "damaged", "cracked", "corroded", "worn",
                "expired", "not installed", "removed", "inadequate",
                "no guard", "unguarded", "no harness", "without harness",
                "no permit", "without permit", "no lockout", "without LOTO",
                "safety valve bypassed", "interlock disabled", "alarm silenced",
                "gasket leak", "seal failure", "weld defect",
            ],
        }

        # Energy sources (EEI 10-Energy Wheel)
        self.energy_keywords = {
            "ENERGY_SOURCE": [
                "gravity", "fall", "height", "dropped", "collapsed",
                "motion", "vehicle", "moving", "struck by", "hit by",
                "mechanical", "rotating", "caught between", "pinch point",
                "electrical", "voltage", "arc flash", "electrocution", "shock",
                "pressure", "high pressure", "PSI", "rupture", "burst", "blowout",
                "chemical", "H2S", "toxic", "flammable", "hydrocarbon", "gas leak",
                "thermal", "fire", "burn", "hot work", "welding", "steam",
                "radiation", "radioactive",
                "sound", "noise", "decibel",
                "biological", "exposure",
            ],
        }

        # Shift/time patterns
        self.shift_patterns = [
            r'\b(day shift|night shift|morning shift|evening shift|'
            r'shift [A-D]|first shift|second shift|third shift|'
            r'\d{1,2}:\d{2}\s*(?:AM|PM|am|pm|hrs|hours?))\b',
        ]

        # Weather
        self.weather_keywords = [
            "rain", "raining", "monsoon", "storm", "thunder", "lightning",
            "fog", "foggy", "mist", "wind", "windy", "cyclone",
            "heat", "hot", "cold", "freezing", "snow", "ice", "icy",
            "humid", "visibility", "dark", "dusty",
        ]

        # PPE Status
        self.ppe_keywords = [
            "helmet", "hard hat", "safety glasses", "goggles", "gloves",
            "boots", "safety shoes", "harness", "respirator", "mask",
            "ear plugs", "ear muffs", "face shield", "coverall",
            "fire retardant", "FR clothing", "life jacket", "PPE",
            "not wearing", "without", "missing", "absent",
        ]

        # Body parts
        self.body_keywords = [
            "hand", "finger", "arm", "leg", "foot", "head", "eye",
            "back", "shoulder", "knee", "ankle", "chest", "neck",
            "face", "wrist", "elbow", "toe", "hip", "skull",
        ]

    def extract(self, text: str) -> list[dict]:
        """
        Extract entities from preprocessed report text.

        Returns:
            List of {type, value, confidence}
        """
        entities = []
        text_lower = text.lower()

        # Equipment
        for pattern in self.equipment_patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                value = self._normalize(match.group().strip())
                if value and len(value) > 1:
                    entities.append({
                        "type": "EQUIPMENT",
                        "value": value,
                        "confidence": 0.85,
                    })

        # Locations
        for pattern in self.location_patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                value = self._normalize(match.group().strip())
                if value and len(value) > 1:
                    entities.append({
                        "type": "LOCATION",
                        "value": value,
                        "confidence": 0.85,
                    })

        # Barrier failures
        for keyword in self.barrier_keywords["BARRIER_FAILURE"]:
            if keyword.lower() in text_lower:
                entities.append({
                    "type": "BARRIER_FAILURE",
                    "value": keyword.title(),
                    "confidence": 0.75,
                })

        # Energy sources
        for keyword in self.energy_keywords["ENERGY_SOURCE"]:
            if keyword.lower() in text_lower:
                entities.append({
                    "type": "ENERGY_SOURCE",
                    "value": keyword.title(),
                    "confidence": 0.80,
                })

        # Shift/time
        for pattern in self.shift_patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                entities.append({
                    "type": "SHIFT_TIME",
                    "value": match.group().strip(),
                    "confidence": 0.90,
                })

        # Weather
        for keyword in self.weather_keywords:
            if keyword.lower() in text_lower:
                entities.append({
                    "type": "WEATHER_CONDITION",
                    "value": keyword.title(),
                    "confidence": 0.80,
                })

        # PPE
        for keyword in self.ppe_keywords:
            if keyword.lower() in text_lower:
                entities.append({
                    "type": "PPE_STATUS",
                    "value": keyword.title(),
                    "confidence": 0.75,
                })

        # Body parts
        for keyword in self.body_keywords:
            if re.search(r'\b' + re.escape(keyword) + r'\b', text_lower):
                entities.append({
                    "type": "BODY_PART",
                    "value": keyword.title(),
                    "confidence": 0.80,
                })

        # Deduplicate by (type, normalized_value)
        seen = set()
        unique_entities = []
        for ent in entities:
            key = (ent["type"], ent["value"].lower())
            if key not in seen:
                seen.add(key)
                unique_entities.append(ent)

        return unique_entities

    def _normalize(self, value: str) -> str:
        """Normalize entity values: trim, title-case, common alias mapping."""
        value = value.strip()
        # Common normalizations
        aliases = {
            "pump 4": "Pump-04",
            "pump-4": "Pump-04",
            "pump 04": "Pump-04",
            "bop": "BOP",
            "blowout preventer": "BOP",
            "ocs": "OCS",
        }
        return aliases.get(value.lower(), value.title())


# Singleton
entity_extractor = EntityExtractor()
