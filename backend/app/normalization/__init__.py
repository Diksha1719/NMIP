import re


def normalize(text: str, category: str, dictionary=()):
    value = text.lower().strip().replace("\u00d7", " x ")
    value = re.sub(r"\b(?:gate v/v)\b", "gate valve", value)
    for entry in sorted(dictionary, key=lambda x: len(x.term), reverse=True):
        if entry.category in ("*", category):
            value = re.sub(r"(?<!\w)" + re.escape(entry.term.lower()) + r"(?!\w)", entry.expansion.lower(), value)
    value = re.sub(r'(\d+(?:\.\d+)?)\s*(?:inches\b|inch\b|in\b|")', lambda m: f"{float(m[1]) * 25.4:g} mm", value)
    value = re.sub(r"(\d+(?:\.\d+)?)\s*mm\b", r"\1 mm", value)
    if category == "Valves":
        value = re.sub(r"\b(?:cl|class)\s*(\d+)|\b(\d+)#", lambda m: "class " + (m[1] or m[2]), value)
    value = re.sub(r"\b(\d+(?:\.\d+)?)\s*(hp|v|ph)\b", r"\1 \2", value)
    return re.sub(r"\s+", " ", re.sub(r"[,;]", " ", value)).strip()
