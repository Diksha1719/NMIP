from types import SimpleNamespace
import pytest
from app.extraction import extract
from app.normalization import normalize
from app.rules import compare, decide
from app.services.ingestion import parse_file


def rule(name, severity="CRITICAL"):
    return SimpleNamespace(attribute_name=name, severity=severity, is_active=True, rule_type="EXACT", rule_definition={}, version=1)


@pytest.mark.parametrize("left,right,category,required,expected", [
    ('Gate Valve 2" CS CL150', 'Gate V/V 50.8mm Carbon Steel Class 150', 'Valves', ['valve_type','size','material','pressure_class'], 'IDENTITY_MATCH'),
    ('Bearing 6205-2RS','Bearing 6205-2Z','Bearings',['model','seal_type'],'DO_NOT_MERGE'),
    ('Pump 5HP SS304','Pump 5 HP Stainless Steel','Pumps',['power','material_grade','model','configuration','pressure'],'INSUFFICIENT_INFORMATION'),
    ('Motor 5HP 415V 3PH','Motor 5HP 230V 3PH','Electrical',['power','voltage','phases'],'DO_NOT_MERGE'),
    ('Hex Bolt M10 x 50 SS304','Stainless Steel Hex Bolt 10mm x 50mm','Fasteners',['diameter','length','material_grade','configuration'],'INSUFFICIENT_INFORMATION'),
])
def test_engineering_examples(left,right,category,required,expected):
    a=extract(left,category)[1];b=extract(right,category)[1]
    comparisons=compare({k:v['value'] for k,v in a.items()},{k:v['value'] for k,v in b.items()},[rule(k) for k in required])
    assert decide(comparisons)['decision_type']==expected


def test_critical_conflict_always_blocks_even_with_missing_values():
    comparisons=compare({'seal_type':'2rs'}, {'seal_type':'2z'}, [rule('seal_type'),rule('model')])
    assert decide(comparisons, evidence_complete=False)['decision_type']=='DO_NOT_MERGE'


def test_potential_substitute_never_identity():
    comparisons=compare({'diameter':'10','coating':'plain'},{'diameter':'10','coating':'zinc'},[rule('diameter'),rule('coating','IMPORTANT')])
    assert decide(comparisons)['decision_type']=='POTENTIAL_SUBSTITUTE'


def test_unknown_category_abstains():
    assert decide(compare({'x':'a'},{'x':'a'},[]),False)['decision_type']=='INSUFFICIENT_INFORMATION'


def test_missing_evidence_abstains():
    assert decide(compare({'x':'a'},{'x':'a'},[rule('x')]),evidence_complete=False)['decision_type']=='INSUFFICIENT_INFORMATION'


def test_units_and_category_scoping():
    assert normalize('2 IN','Valves')==normalize('2 inch','Valves')==normalize('50.8 mm','Valves')
    assert normalize('150#','Valves')=='class 150'
    assert normalize('150#','Electrical')=='150#'


def test_csv_xlsx_txt_pdf_parsing():
    import io
    from openpyxl import Workbook
    assert parse_file('test.csv',b'code,description\nA,Bearing\n')[0]['code']=='A'
    wb=Workbook();wb.active.append(['code','description']);wb.active.append(['A','Bearing'])
    stream=io.BytesIO();wb.save(stream)
    assert parse_file('test.xlsx',stream.getvalue())[0]['code']=='A'
    assert parse_file('test.txt',b'Bearing 6205-2RS')[0]['original_description']=='Bearing 6205-2RS'
    with pytest.raises(Exception):parse_file('bad.exe',b'bad')
