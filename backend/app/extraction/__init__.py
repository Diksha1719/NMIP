import re
from app.normalization import normalize


def extract(text, category, dictionary=()):
    normalized = normalize(text, category, dictionary)
    result = {}
    patterns = {
        "material": r"\b(carbon steel|stainless steel|cs|ss304|ss316|ss 304|ss 316)\b",
        "material_grade": r"\b(ss\s*304|ss\s*316|a105|a216\s*wcb|8\.8|10\.9)\b",
        "standard": r"\b((?:asme|astm|iso|din|is)\s*[a-z]?\s*\d+(?:\.\d+)?)\b",
        "coating": r"\b(galvanized|zinc|plain|black oxide)\b",
        "model": r"\bmodel\s+([\w-]+)",
        "configuration": r"\b(centrifugal|submersible|vertical|horizontal)\b",
        "pressure": r"\b(\d+(?:\.\d+)?)\s*bar\b",
    }
    if category == "Valves":
        patterns.update(size=r"\b(\d+(?:\.\d+)?)\s*mm\b", pressure_class=r"\b((?:class|pn)\s*\d+)\b", connection=r"\b(rf|rtj|npt|flanged)\b", valve_type=r"\b(gate|globe|ball|check|butterfly)\b", trim=r"\b(ss\d+)\s+trim\b")
    if category == "Bearings":
        patterns.update(model=r"\b(\d{4})[-\s]", seal_type=r"\b(2rs|2z|zz|open)\b")
    if category in ("Pumps", "Electrical"):
        patterns.update(power=r"\b(\d+(?:\.\d+)?)\s*hp\b", voltage=r"\b(\d+)\s*v\b", phases=r"\b([123])\s*ph\b")
    if category == "Fasteners":
        patterns.update(diameter=r"\b(?:m(\d+(?:\.\d+)?)\s*x|(?<!\w)(\d+(?:\.\d+)?)\s*mm\s*x)", length=r"\bx\s*(\d+(?:\.\d+)?)", configuration=r"\b(hex|socket|stud)\b")
    for name, pattern in patterns.items():
        match = re.search(pattern, normalized)
        if match:
            value = next((g for g in match.groups() if g is not None), match[0])
            if name == "material_grade":
                value = value.replace(" ", "")
            if name == "material":
                value = "carbon steel" if value == "cs" else "stainless steel" if value.startswith("ss") else value
            if name == "seal_type" and value == "zz":
                value = "2z"
            # If normalization changed the token, retain the full original expression
            # rather than present transformed text as an original source value.
            raw_match = re.search(re.escape(match[0]), text, re.IGNORECASE)
            raw = raw_match[0] if raw_match else text
            result[name] = {"value": value, "raw": raw, "confidence": 1.0, "method": "RULE", "unit": "mm" if name in ("size", "diameter", "length") else "HP" if name == "power" else "V" if name == "voltage" else None}
    return normalized, result
