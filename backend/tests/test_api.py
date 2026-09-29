import uuid
from sqlalchemy import select
from app.models import Material, MaterialAttribute, LegacyMapping, CommonIdentity, Review, AuditLog


def test_auth_rbac_and_csrf(client,login):
    assert client.get('/api/materials').status_code==401
    assert client.post('/api/auth/login',json={'email':'engineer@nmip.local','password':'wrong'}).status_code==401
    login('viewer')
    assert client.get('/api/materials').status_code==200
    assert client.post('/api/candidates/retrieve',json={}).status_code==403
    assert client.post('/api/rules',json={'category':'X','attribute_name':'x'}).status_code==403
    assert client.post('/api/duplicate-check',json={'description':'Gate valve','category':'Valves'},headers={'origin':'https://attacker.example'}).status_code==403
    login('engineer')
    assert client.post('/api/datasets/upload').status_code in (403,422)


def test_seed_integrity_and_four_outcomes(client,login,database):
    login()
    stats=client.get('/api/analytics/overview').json()
    assert stats['total_materials']>=60
    assert stats['organizations']==3
    candidates=client.get('/api/candidates').json()
    assert {c['decision']['decision_type'] for c in candidates}=={'IDENTITY_MATCH','POTENTIAL_SUBSTITUTE','DO_NOT_MERGE','INSUFFICIENT_INFORMATION'}
    with database() as db:
        for attr in db.scalars(select(MaterialAttribute)):
            assert attr.normalized_value is None or attr.source_evidence_id is not None


def test_ingestion_processing_evidence_and_uniqueness(client,login):
    login('steward')
    org=client.get('/api/organizations').json()[0]['id']
    code='UPLOAD-'+uuid.uuid4().hex[:8]
    content=f'code,description,category,unit\n{code},Gate Valve 2 inch CS CL150,Valves,ea\n,Missing code,Valves,ea\n{code},Duplicate,Valves,ea\nBAD,Invalid unit,Valves,invalid\n'
    result=client.post('/api/datasets/upload',data={'organization_id':org},files={'file':('synthetic.csv',content,'text/csv')})
    assert result.status_code==201,result.text
    id=result.json()['id']
    mapping={'legacy_material_code':'code','original_description':'description','category':'category','unit':'unit'}
    report=client.post(f'/api/datasets/{id}/validate',json=mapping)
    assert report.json()['valid_rows']==1
    assert report.json()['invalid_rows']==3
    assert client.get(f'/api/datasets/{id}/validation.csv').status_code==200
    assert client.post(f'/api/datasets/{id}/import').json()['imported']==1
    assert client.post(f'/api/datasets/{id}/import').status_code==409
    material=client.get('/api/materials',params={'q':code}).json()[0]
    mid=material['id']
    assert client.post(f'/api/materials/{mid}/normalize').status_code==200
    assert client.post(f'/api/materials/{mid}/extract').status_code==200
    detail=client.get(f'/api/materials/{mid}').json()
    assert '50.8 mm' in detail['normalized_description']
    assert any(e['source_file']=='synthetic.csv' and e['row_number']==2 for e in detail['evidence'])
    assert client.post('/api/candidates/retrieve',json={'material_id':mid}).status_code==200
    assert client.get(f'/api/materials/{mid}/candidates').json()


def test_review_identity_mapping_and_duplicate_prevention(client,login):
    login('engineer')
    candidates=client.get('/api/candidates').json()
    c=next(c for c in candidates if c['decision']['decision_type']=='IDENTITY_MATCH' and c['material_a']['category']=='Valves' and c['status']=='PENDING')
    result=client.post('/api/reviews',json={'decision_id':c['decision']['id'],'action':'APPROVE','comment':'Source evidence and critical attributes checked.'})
    assert result.status_code==200,result.text
    identity=result.json()['common_identity_id']
    assert identity
    detail=client.get(f'/api/common-identities/{identity}').json()
    assert len(detail['mappings'])==2
    assert detail['nmip_code'].startswith('NMC-VLV-')
    assert client.post('/api/reviews',json={'decision_id':c['decision']['id'],'action':'APPROVE','comment':'Repeated approval'}).status_code==409
    assert client.post(f'/api/common-identities/{identity}/publish').json()['status']=='PUBLISHED'
    matches=client.post('/api/duplicate-check',json={'description':'Gate Valve 2 inch CS CL150','category':'Valves'}).json()
    assert any(m['decision']['decision_type']=='IDENTITY_MATCH' for m in matches)
    login('steward')
    payload={'organization_id':client.get('/api/organizations').json()[0]['id'],'legacy_material_code':'DUP-'+uuid.uuid4().hex[:8],'original_description':c['material_a']['original_description'],'category':'Valves'}
    assert client.post('/api/materials',json=payload).status_code==409
    payload['override_reason']='Separate traceable source record required for testing.'
    assert client.post('/api/materials',json=payload).status_code==201
    assert client.put('/api/materials/'+c['material_a']['id'],json={'original_description':'Changed material','reason':'Testing locked identity'}).status_code==409
    events=client.get('/api/audit').json()
    assert any(e['action']=='DUPLICATE_OVERRIDE' for e in events)
    assert any(e['action']=='COMMON_ID_CREATED' for e in events)


def test_substitute_approval_cannot_generate_identity(client,login):
    login('engineer')
    c=next(c for c in client.get('/api/candidates').json() if c['decision']['decision_type']=='POTENTIAL_SUBSTITUTE' and c['status']=='PENDING')
    result=client.post('/api/reviews',json={'decision_id':c['decision']['id'],'action':'APPROVE','comment':'Acknowledged as substitute only.'})
    assert result.status_code==200,result.text
    assert result.json()['common_identity_id'] is None
    assert client.post('/api/common-identities',json={'decision_id':c['decision']['id']}).status_code==409


def test_conflict_cannot_be_identity_even_after_approval(client,login):
    login('engineer')
    c=next(c for c in client.get('/api/candidates').json() if c['decision']['decision_type']=='DO_NOT_MERGE' and c['status']=='PENDING')
    detail=client.get(f"/api/candidates/{c['id']}/comparison").json()
    assert detail['critical_conflicts']>0
    r=client.post('/api/reviews',json={'decision_id':c['decision']['id'],'action':'APPROVE','comment':'Conflict acknowledged. Keep codes separate.'})
    assert r.status_code==200 and r.json()['common_identity_id'] is None


def test_rule_version_stales_review(client,login):
    login()
    c=next(c for c in client.get('/api/candidates').json() if c['status']=='PENDING' and c['material_a']['category']=='Bearings')
    rule=next(r for r in client.get('/api/rules').json() if r['category']=='Bearings')
    rule['rule_definition']={'tolerance':0}
    assert client.put('/api/rules/'+rule['id'],json=rule).status_code==200
    login('engineer')
    assert client.post('/api/reviews',json={'decision_id':c['decision']['id'],'action':'APPROVE','comment':'This stale decision should be blocked.'}).status_code==409
    assert client.post(f"/api/candidates/{c['id']}/decision").status_code==200


def test_information_request_reject_and_correction(client,login):
    login('engineer')
    c=next(c for c in client.get('/api/candidates').json() if c['status']=='PENDING' and c['decision']['decision_type']=='INSUFFICIENT_INFORMATION')
    r=client.post('/api/reviews',json={'decision_id':c['decision']['id'],'action':'REQUEST_INFORMATION','comment':'Please supply model and rated pressure.'})
    assert r.status_code==200
    mid=c['material_a']['id']
    r=client.post(f'/api/materials/{mid}/attributes',json={'attribute_name':'pressure','value':'16','source_text':'Rated pressure 16 bar','source_file':'engineering-test.txt','reason':'Engineer supplied missing rating'})
    assert r.status_code==200,r.text
    assert client.get(f"/api/candidates/{c['id']}/comparison").json()['decision']['id']!=c['decision']['id']
    current=client.get(f"/api/candidates/{c['id']}/comparison").json()['decision']
    assert client.post('/api/reviews',json={'decision_id':current['id'],'action':'REJECT','comment':'Remaining specifications cannot be verified.'}).status_code==200


def test_proof_board_metrics_computed(client,login):
    login('engineer')
    assert client.get('/api/proof-board').json()['status']=='Awaiting benchmark dataset'
    content='description_a,description_b,category,label\nBearing 6205-2RS,Bearing 6205-2Z,Bearings,DO_NOT_MERGE\nGate Valve 2 inch CS CL150,Gate Valve 50.8mm Carbon Steel Class 150,Valves,IDENTITY_MATCH\n'
    result=client.post('/api/proof-board/benchmark',files={'file':('test.csv',content,'text/csv')})
    assert result.status_code==200,result.text
    metrics=result.json()['metrics']['models']['NMIP hybrid + rules']
    assert metrics['false_merge_rate']==0
    assert metrics['recall']==1
    assert metrics['do_not_merge_accuracy']==1


def test_openapi_and_secure_errors(client,login):
    login()
    schema=client.get('/openapi.json').json()
    assert '/api/reviews' in schema['paths']
    assert client.get('/api/materials/'+str(uuid.uuid4())).status_code==404
    assert client.get('/api/materials/not-a-uuid').status_code==422


def test_text_document_can_be_annotated_validated_and_imported(client,login):
    login('steward')
    org=client.get('/api/organizations').json()[0]['id']
    response=client.post('/api/datasets/upload',data={'organization_id':org},files={'file':('source.txt','Bearing 6205-2RS','text/plain')})
    assert response.status_code==201
    id=response.json()['id']
    mapping={k:k for k in ('legacy_material_code','original_description','category')}
    assert client.post(f'/api/datasets/{id}/validate',json=mapping).json()['invalid_rows']==1
    correction={'row_index':0,'values':{'legacy_material_code':'DOC-'+uuid.uuid4().hex[:8],'category':'Bearings'},'reason':'Steward manually annotated source document identifiers.'}
    assert client.put(f'/api/datasets/{id}/rows',json=correction).status_code==200
    assert client.get(f'/api/datasets/{id}/validation').json()['rows']==[]
    assert client.post(f'/api/datasets/{id}/validate',json=mapping).json()['valid_rows']==1
    assert client.post(f'/api/datasets/{id}/import').json()['imported']==1
    assert client.put(f'/api/datasets/{id}/rows',json=correction).status_code==409
    assert any(a['action']=='DATASET_ROW_CORRECTED' for a in client.get('/api/audit').json())
