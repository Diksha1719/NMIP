from collections import Counter
from fastapi import HTTPException
from app.ai import embedding_provider, extraction_provider
from app.matching import scores, category_rules
from app.rules import compare, decide
from app.models import DictionaryEntry
from app.repositories import rows

LABELS = {"IDENTITY_MATCH", "POTENTIAL_SUBSTITUTE", "DO_NOT_MERGE", "INSUFFICIENT_INFORMATION"}
LABEL_ALIASES = {
    "IDENTITY_MATCH": "IDENTITY_MATCH",
    "MATCH": "IDENTITY_MATCH",
    "SAME": "IDENTITY_MATCH",
    "DUPLICATE": "IDENTITY_MATCH",
    "TRUE": "IDENTITY_MATCH",
    "YES": "IDENTITY_MATCH",
    "DO_NOT_MERGE": "DO_NOT_MERGE",
    "DO NOT MERGE": "DO_NOT_MERGE",
    "NO_MATCH": "DO_NOT_MERGE",
    "NON_MATCH": "DO_NOT_MERGE",
    "NOT_MATCH": "DO_NOT_MERGE",
    "DIFFERENT": "DO_NOT_MERGE",
    "CONFLICT": "DO_NOT_MERGE",
    "FALSE": "DO_NOT_MERGE",
    "NO": "DO_NOT_MERGE",
    "POTENTIAL_SUBSTITUTE": "POTENTIAL_SUBSTITUTE",
    "POTENTIAL SUBSTITUTE": "POTENTIAL_SUBSTITUTE",
    "SUBSTITUTE": "POTENTIAL_SUBSTITUTE",
    "INSUFFICIENT_INFORMATION": "INSUFFICIENT_INFORMATION",
    "INSUFFICIENT INFORMATION": "INSUFFICIENT_INFORMATION",
    "INSUFFICIENT": "INSUFFICIENT_INFORMATION",
    "UNKNOWN": "INSUFFICIENT_INFORMATION",
    "UNCERTAIN": "INSUFFICIENT_INFORMATION",
    "NEEDS_INFO": "INSUFFICIENT_INFORMATION",
    "NEEDS INFO": "INSUFFICIENT_INFORMATION",
}
REQUIRED_COLUMNS = ("description_a", "description_b", "category", "label")


def normalize_key(value):
    return str(value or "").strip().lower().replace("-", "_").replace(" ", "_")


def normalize_label(value):
    normalized = str(value or "").strip().upper().replace("-", "_")
    return LABEL_ALIASES.get(normalized) or LABEL_ALIASES.get(normalized.replace("_", " "))


def normalize_rows(data):
    normalized_rows, errors = [], []
    for index, raw in enumerate(data, 2):
        row = {normalize_key(key): str(value or "").strip() for key, value in raw.items() if key is not None}
        if not any(row.values()):
            continue
        missing = [key for key in REQUIRED_COLUMNS if not row.get(key)]
        label = normalize_label(row.get("label"))
        row_errors = []
        if missing:
            row_errors.append("missing " + ", ".join(missing))
        if row.get("label") and not label:
            row_errors.append(f"invalid label '{row['label']}'")
        if row_errors:
            errors.append(f"row {index}: " + "; ".join(row_errors))
            continue
        row["label"] = label
        normalized_rows.append({key: row[key] for key in REQUIRED_COLUMNS})
    if errors:
        raise HTTPException(422, "Benchmark requires description_a, description_b, category and a valid label on every row. " + " ".join(errors[:5]))
    if not normalized_rows:
        raise HTTPException(422, "Benchmark requires at least one labeled row.")
    return normalized_rows


def run_benchmark(db, data):
    data = normalize_rows(data)
    dictionary = rows(db, DictionaryEntry)
    predictions = {"Fuzzy matching": [], "Embedding similarity": [], "NMIP hybrid + rules": []}
    vectors, texts, attribute_pairs = [], [], []
    for row in data:
        na, aa = extraction_provider.extract_attributes(row["description_a"], row["category"], dictionary)
        nb, ab = extraction_provider.extract_attributes(row["description_b"], row["category"], dictionary)
        va, vb = embedding_provider.embed_text(na), embedding_provider.embed_text(nb)
        semantic, fuzzy = scores(na, nb, va, vb)
        predictions["Fuzzy matching"].append("IDENTITY_MATCH" if fuzzy >= 85 else "INSUFFICIENT_INFORMATION")
        predictions["Embedding similarity"].append("IDENTITY_MATCH" if semantic >= 85 else "INSUFFICIENT_INFORMATION")
        rules = category_rules(db, row["category"])
        predictions["NMIP hybrid + rules"].append(decide(compare({k: v["value"] for k, v in aa.items()}, {k: v["value"] for k, v in ab.items()}, rules), bool(rules))["decision_type"])
        texts.append((na, nb))
        vectors.append((va, vb))
        attribute_pairs.append(({k:v["value"] for k,v in aa.items()}, {k:v["value"] for k,v in ab.items()}))
    metrics = {}
    for name, predicted in predictions.items():
        tp = sum(p == "IDENTITY_MATCH" and row["label"] == p for p, row in zip(predicted, data))
        fp = sum(p == "IDENTITY_MATCH" and row["label"] != p for p, row in zip(predicted, data))
        fn = sum(p != "IDENTITY_MATCH" and row["label"] == "IDENTITY_MATCH" for p, row in zip(predicted, data))
        negatives = sum(row["label"] != "IDENTITY_MATCH" for row in data)
        conflicts = sum(row["label"] == "DO_NOT_MERGE" for row in data)
        precision = tp / (tp + fp) if tp + fp else None
        recall = tp / (tp + fn) if tp + fn else None
        f1 = 2 * tp / (2 * tp + fp + fn) if 2 * tp + fp + fn else None
        hits, queries = 0, 0
        for i, row in enumerate(data):
            if row["label"] != "IDENTITY_MATCH":
                continue
            ranking = []
            for j, other in enumerate(data):
                if other["category"] != row["category"]:
                    continue
                sem, fuzz = scores(texts[i][0], texts[j][1], vectors[i][0], vectors[j][1])
                aa, bb = attribute_pairs[i][0], attribute_pairs[j][1]
                shared = set(aa) | set(bb)
                attr = 100 * sum(k in aa and k in bb and aa[k] == bb[k] for k in shared) / max(1, len(shared))
                ranking.append((fuzz if name == "Fuzzy matching" else sem if name == "Embedding similarity" else .35 * sem + .25 * fuzz + .4 * attr, j))
            top = sorted(ranking, reverse=True)[:5]
            hits += any(texts[j][1] == texts[i][1] for _, j in top)
            queries += 1
        metrics[name] = {"precision": precision, "recall": recall, "f1": f1, "top_k_retrieval": hits / queries if queries else None, "false_merge_rate": fp / negatives if negatives else None, "do_not_merge_accuracy": sum(p == "DO_NOT_MERGE" and row["label"] == p for p, row in zip(predicted, data)) / conflicts if conflicts else None, "abstention_rate": predicted.count("INSUFFICIENT_INFORMATION") / len(data), "confusion": dict(Counter(row["label"] + " → " + p for row, p in zip(data, predicted)))}
    return {"models": metrics, "provider": embedding_provider.name, "threshold": 85, "top_k": 5, "scope": "Uploaded labeled pairs only. Identity is the positive class. False merge rate = false identity predictions / non-identity pairs. Top-K uses labeled B descriptions of the same category as the retrieval corpus; duplicate descriptions count as relevant. Not a production accuracy claim."}
