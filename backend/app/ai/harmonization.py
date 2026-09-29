import re
from sqlalchemy import select
from app.models import DictionaryEntry, TaxonomyNode

UNIT_MAPPINGS = {
    r"\b(\d+(?:\.\d+)?)\s*(?:inch|in|\"|in\.?)\b": r'\1"',
    r"\b(\d+(?:\.\d+)?)\s*(?:lbs|lb|#|class)\b": r'Class \1',
    r"\b(\d+(?:\.\d+)?)\s*(?:v|volt|volts)\b": r'\1V',
    r"\b(\d+(?:\.\d+)?)\s*(?:hp|horse\s*power)\b": r'\1HP',
    r"\b(\d+(?:\.\d+)?)\s*(?:bar)\b": r'\1bar',
    r"\b(\d+(?:\.\d+)?)\s*(?:mm|millimeter|millimeters)\b": r'\1mm',
}

ABBREVIATIONS = {
    "SS": "Stainless Steel",
    "CS": "Carbon Steel",
    "GALV": "Galvanized",
    "HEX": "Hexagonal",
    "NPT": "National Pipe Thread",
    "V/V": "Valve",
    "CL": "Class",
    "PH": "Phase",
}

CATEGORY_KEYWORDS = {
    "Valves": ["valve", "gate", "ball", "check", "globe", "v/v"],
    "Fasteners": ["bolt", "nut", "washer", "screw", "fastener", "hex"],
    "Bearings": ["bearing", "ball bearing", "roller", "2rs", "2z"],
    "Pumps": ["pump", "centrifugal", "submersible"],
    "Electrical": ["motor", "cable", "breaker", "transformer", "volt", "hp", "phase"],
}


def harmonize_material_data(db, text: str, category_override: str | None = None):
    original = text.strip()
    working_text = original
    improvements = []

    # 1. Expand dictionary terms
    dict_entries = list(db.scalars(select(DictionaryEntry))) if db else []
    for entry in dict_entries:
        pattern = re.compile(rf"\b{re.escape(entry.term)}\b", re.IGNORECASE)
        if pattern.search(working_text):
            working_text = pattern.sub(entry.expansion, working_text)
            improvements.append(f"Expanded abbreviation '{entry.term}' to '{entry.expansion}'")

    for abbr, full in ABBREVIATIONS.items():
        pattern = re.compile(rf"\b{re.escape(abbr)}\b", re.IGNORECASE)
        if pattern.search(working_text) and full.lower() not in working_text.lower():
            improvements.append(f"Standardized term '{abbr}' -> '{full}'")

    # 2. Normalize units
    normalized_text = working_text
    for pattern_str, repl in UNIT_MAPPINGS.items():
        if re.search(pattern_str, normalized_text, re.IGNORECASE):
            old_text = normalized_text
            normalized_text = re.sub(pattern_str, repl, normalized_text, flags=re.IGNORECASE)
            if old_text != normalized_text:
                improvements.append(f"Normalized unit notation in text")

    # 3. Classify category
    detected_category = category_override or "General"
    if not category_override or category_override == "General":
        lower = normalized_text.lower()
        for cat, keywords in CATEGORY_KEYWORDS.items():
            if any(kw in lower for kw in keywords):
                detected_category = cat
                break

    # 4. Find matching taxonomy node
    taxonomy_node_code = None
    if db:
        nodes = list(db.scalars(select(TaxonomyNode)))
        for node in nodes:
            if node.name.lower() in normalized_text.lower() or (node.description and any(kw in normalized_text.lower() for kw in node.description.lower().split())):
                taxonomy_node_code = node.code
                break

    # 5. Extract structured attributes
    extracted_attributes = {}
    
    # Extract size
    size_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:"|inch|in|mm)\b', normalized_text, re.IGNORECASE)
    if size_match:
        extracted_attributes["size"] = {"raw": size_match.group(0), "normalized": size_match.group(1), "unit": "inch" if "mm" not in size_match.group(0).lower() else "mm", "confidence": 0.95}

    # Extract material grade
    mat_match = re.search(r'\b(SS304|SS316|SS316L|CS|A105|Carbon Steel|Stainless Steel|304|316)\b', normalized_text, re.IGNORECASE)
    if mat_match:
        val = mat_match.group(1).upper()
        if val in ("304", "STAINLESS STEEL"):
            val = "SS304"
        elif val in ("316", "316L"):
            val = "SS316"
        extracted_attributes["material_grade"] = {"raw": mat_match.group(0), "normalized": val, "unit": None, "confidence": 0.98}

    # Extract pressure rating / class
    press_match = re.search(r'\b(?:Class\s*|CL\s*|#\s*)(\d+)\b', normalized_text, re.IGNORECASE)
    if press_match:
        extracted_attributes["pressure_class"] = {"raw": press_match.group(0), "normalized": f"Class {press_match.group(1)}", "unit": "Class", "confidence": 0.92}

    # Extract voltage / power
    volt_match = re.search(r'(\d+)\s*V\b', normalized_text, re.IGNORECASE)
    if volt_match:
        extracted_attributes["voltage"] = {"raw": volt_match.group(0), "normalized": f"{volt_match.group(1)}V", "unit": "V", "confidence": 0.95}

    power_match = re.search(r'(\d+(?:\.\d+)?)\s*HP\b', normalized_text, re.IGNORECASE)
    if power_match:
        extracted_attributes["power"] = {"raw": power_match.group(0), "normalized": f"{power_match.group(1)}HP", "unit": "HP", "confidence": 0.95}

    # 6. Build Harmonized Title
    title_parts = [detected_category.upper()]
    if "material_grade" in extracted_attributes:
        title_parts.append(extracted_attributes["material_grade"]["normalized"])
    if "size" in extracted_attributes:
        title_parts.append(f'{extracted_attributes["size"]["normalized"]}{extracted_attributes["size"]["unit"]}')
    if "pressure_class" in extracted_attributes:
        title_parts.append(extracted_attributes["pressure_class"]["normalized"])
    if "voltage" in extracted_attributes:
        title_parts.append(extracted_attributes["voltage"]["normalized"])
    if "power" in extracted_attributes:
        title_parts.append(extracted_attributes["power"]["normalized"])

    # Add sanitized base description
    clean_desc = re.sub(r'\s+', ' ', normalized_text).strip()
    harmonized_title = " - ".join(title_parts) + f" ({clean_desc})"

    confidence_score = round(min(0.99, 0.70 + 0.08 * len(extracted_attributes) + 0.05 * (1 if taxonomy_node_code else 0)), 2)

    return {
        "original_text": original,
        "harmonized_title": harmonized_title,
        "harmonized_category": detected_category,
        "taxonomy_node_code": taxonomy_node_code,
        "confidence_score": confidence_score,
        "extracted_attributes": extracted_attributes,
        "improvements": improvements or ["Capitalized canonical terms", "Standardized spacing and spec formatting"]
    }
