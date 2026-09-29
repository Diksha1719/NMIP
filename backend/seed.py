"""Idempotent synthetic demo bootstrap. Password must be supplied in the environment."""
from sqlalchemy import select
from app.db import SessionLocal
from app.config import settings
from app.models import Organization, User, EngineeringRule, DictionaryEntry, TaxonomyNode, DoNotMergeRule
from app.auth import password_hash


def seed(db, password):
    if db.scalar(select(User)):
        return
    if len(password) < 12:
        raise ValueError("Set DEMO_PASSWORD to the documented demo password or a unique password of at least 12 characters")
    orgs = [Organization(name=f"CPSE-{letter} · Synthetic", code=f"CPSE-{letter}") for letter in "ABC"]
    db.add_all(orgs)
    db.flush()
    users = []
    for name, role in [("admin", "ADMIN"), ("engineer", "ENGINEER"), ("steward", "DATA_STEWARD"), ("viewer", "VIEWER")]:
        user = User(name=name.title() + " · Demo", email=f"{name}@nmip.local", role=role, organization_id=orgs[0].id, password_hash=password_hash.hash(password))
        db.add(user)
        users.append(user)
    db.flush()

    # Seed Taxonomy Tree Nodes
    root = TaxonomyNode(code="CAT-ROOT", name="All Material Catalog", level=0, description="Root Material Catalog Hierarchy", attribute_schema=[])
    db.add(root)
    db.flush()

    cat_mech = TaxonomyNode(code="CAT-MECH", name="Mechanical Equipment", parent_id=root.id, level=1, description="Pumps, Bearings, Compressors", attribute_schema=[{"name": "model", "type": "string"}])
    cat_pipe = TaxonomyNode(code="CAT-PIPE", name="Piping & Valves", parent_id=root.id, level=1, description="Valves, Flanges, Pipe Fittings", attribute_schema=[{"name": "size", "type": "string"}, {"name": "pressure_class", "type": "string"}])
    cat_elec = TaxonomyNode(code="CAT-ELEC", name="Electrical Equipment", parent_id=root.id, level=1, description="Motors, Cables, Switchgear", attribute_schema=[{"name": "voltage", "type": "string"}, {"name": "power", "type": "string"}])
    cat_fast = TaxonomyNode(code="CAT-FAST", name="Fasteners & Hardware", parent_id=root.id, level=1, description="Bolts, Nuts, Washers", attribute_schema=[{"name": "diameter", "type": "string"}, {"name": "coating", "type": "string"}])
    db.add_all([cat_mech, cat_pipe, cat_elec, cat_fast])
    db.flush()

    sub_valves = TaxonomyNode(code="VALVE-GATE", name="Valves", parent_id=cat_pipe.id, level=2, description="Gate, Ball, Check Valves", attribute_schema=[{"name": "size", "type": "string"}, {"name": "material_grade", "type": "string"}, {"name": "pressure_class", "type": "string"}])
    sub_bearings = TaxonomyNode(code="BEARING-BALL", name="Bearings", parent_id=cat_mech.id, level=2, description="Ball & Roller Bearings", attribute_schema=[{"name": "model", "type": "string"}, {"name": "seal_type", "type": "string"}])
    sub_pumps = TaxonomyNode(code="PUMP-CENT", name="Pumps", parent_id=cat_mech.id, level=2, description="Centrifugal Pumps", attribute_schema=[{"name": "power", "type": "string"}, {"name": "material_grade", "type": "string"}])
    sub_bolts = TaxonomyNode(code="FAST-BOLT", name="Fasteners", parent_id=cat_fast.id, level=2, description="Hex Bolts & Screws", attribute_schema=[{"name": "size", "type": "string"}, {"name": "material_grade", "type": "string"}, {"name": "coating", "type": "string"}])
    sub_motors = TaxonomyNode(code="ELEC-MOTOR", name="Electrical", parent_id=cat_elec.id, level=2, description="Electric Motors & Drives", attribute_schema=[{"name": "power", "type": "string"}, {"name": "voltage", "type": "string"}])
    db.add_all([sub_valves, sub_bearings, sub_pumps, sub_bolts, sub_motors])
    db.flush()

    # Seed Do Not Merge Rules
    dnm_rules = [
        DoNotMergeRule(name="Material Grade Incompatibility", category="*", attribute_a="material_grade", attribute_b="material_grade", condition="DIFFERENT", severity="CRITICAL", reason="Material grades SS304, SS316, and CS have distinct chemical/corrosion profiles and cannot be merged.", is_active=True, created_by=users[0].id),
        DoNotMergeRule(name="Pressure Class Rating Mismatch", category="Valves", attribute_a="pressure_class", attribute_b="pressure_class", condition="DIFFERENT", severity="CRITICAL", reason="Different pressure class ratings (e.g., Class 150 vs Class 300) represent non-interchangeable pressure limits.", is_active=True, created_by=users[0].id),
        DoNotMergeRule(name="Voltage Rating Mismatch", category="Electrical", attribute_a="voltage", attribute_b="voltage", condition="DIFFERENT", severity="CRITICAL", reason="Voltage ratings (e.g., 230V vs 415V) represent distinct electrical operating specifications.", is_active=True, created_by=users[0].id),
    ]
    db.add_all(dnm_rules)
    db.flush()


    dictionary = [("CS", "Carbon Steel"), ("SS304", "SS304"), ("Gate V/V", "Gate Valve"), ("S.S.", "Stainless Steel")]
    db.add_all(DictionaryEntry(term=a, expansion=b) for a, b in dictionary)
    critical = {"Valves": ["valve_type", "size", "material", "pressure_class"], "Bearings": ["model", "seal_type"], "Pumps": ["power", "material_grade", "configuration", "model", "pressure"], "Fasteners": ["diameter", "length", "material_grade", "configuration"], "Electrical": ["power", "voltage", "phases"]}
    for category, attrs in critical.items():
        for attribute in attrs:
            db.add(EngineeringRule(category=category, attribute_name=attribute, severity="CRITICAL", rule_definition={"tolerance": 0}))
    db.add(EngineeringRule(category="Fasteners", attribute_name="coating", severity="IMPORTANT", rule_definition={"tolerance": 0}))
    db.flush()

    db.commit()


if __name__ == "__main__":
    with SessionLocal() as db:
        seed(db, settings.demo_password)
    print("Synthetic NMIP dataset is ready.")
