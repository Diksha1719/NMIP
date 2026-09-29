'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Fingerprint, ShieldCheck, ArrowRight, Download, Upload, Sparkles, RefreshCw } from 'lucide-react';
import { api, post } from '@/services/api';
import { useAction } from '@/hooks/use-action';
import { useUser } from '@/components/shell';
import { PageHeading, Notice, Loading, Badge, Empty, Table, Field, categories } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/dialog';
import { EvidenceList } from './materials';
import { date, label } from '@/lib/utils';
import type { Row, Candidate } from '@/types';

export function Identities({ id }: { id?: string }) {
  const queryClient = useQueryClient();
  const { data, isPending, error } = useQuery({
    queryKey: ['identities', id],
    queryFn: () => api<any>(id ? `/common-identities/${id}` : '/common-identities'),
  });

  const { data: candidatesData = [] } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => api<Candidate[]>('/candidates'),
    enabled: !id,
  });

  const action = useAction();
  const user = useUser();
  const [evidence, setEvidence] = useState(false);
  const [activeTab, setActiveTab] = useState<'verified' | 'discovered'>('verified');

  if (isPending) return <Loading />;
  if (error) return <Notice error={error.message} />;

  if (!id) {
    const candidateMatches = candidatesData.filter(
      (c) => c.decision?.decision_type === 'IDENTITY_MATCH' || c.final_score > 60
    );

    const handleFindCommonIdentities = async () => {
      const res = await action.run(
        () => post('/candidates/retrieve', { top_n: 5 }),
        'Cross-dataset identity search completed. Scanned existing catalog items and newly uploaded data.'
      );
      if (res) {
        queryClient.invalidateQueries({ queryKey: ['identities'] });
        queryClient.invalidateQueries({ queryKey: ['candidates'] });
        queryClient.invalidateQueries({ queryKey: ['materials'] });
      }
    };

    return (
      <>
        <PageHeading
          eyebrow="VERIFIED MATERIAL REGISTRY"
          title="Common material identities"
          description="Shared identities created by engineering approval across legacy and newly imported datasets. Every original code is preserved."
        >
          {['ADMIN', 'ENGINEER', 'DATA_STEWARD'].includes(user.role) && (
            <Button disabled={action.busy} onClick={handleFindCommonIdentities}>
              <Sparkles size={16} />
              {action.busy ? 'Scanning datasets…' : 'Find Common Identities (Old & New Data)'}
            </Button>
          )}
        </PageHeading>

        <Notice {...action} />

        <div
          className="panel accent-panel"
          style={{
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            background: 'var(--card-bg, #FBF8F2)',
            border: '1px solid var(--border-color, #E5D5C0)',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
          }}
        >
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div
              className="eyebrow"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#A65F3B',
                fontWeight: 600,
                letterSpacing: '0.05em',
              }}
            >
              <Sparkles size={15} /> CROSS-DATASET HARMONIZATION & IDENTITY MATCHING
            </div>
            <h3 style={{ margin: '0.35rem 0', fontSize: '1.15rem', fontWeight: 600 }}>
              Find Common Identities Across Old & New Data
            </h3>
            <p className="muted small" style={{ margin: 0, lineHeight: 1.4 }}>
              After uploading & normalizing a dataset, click below to run the AI matching engine across all existing catalog records (old data) and newly imported records (new data). High-confidence matches generate candidate recommendations for review.
            </p>
          </div>
          {['ADMIN', 'ENGINEER', 'DATA_STEWARD'].includes(user.role) && (
            <Button disabled={action.busy} onClick={handleFindCommonIdentities}>
              <RefreshCw size={15} className={action.busy ? 'spin' : ''} />
              {action.busy ? 'Running discovery…' : 'Run Identity Discovery'}
            </Button>
          )}
        </div>

        <div className="decision-tabs" style={{ marginBottom: '1.25rem' }}>
          <button
            className={activeTab === 'verified' ? 'selected' : ''}
            onClick={() => setActiveTab('verified')}
          >
            Verified Common Identities <b>{data.length}</b>
          </button>
          <button
            className={activeTab === 'discovered' ? 'selected' : ''}
            onClick={() => setActiveTab('discovered')}
          >
            Discovered Identity Matches (Old vs New) <b>{candidateMatches.length}</b>
          </button>
        </div>

        {activeTab === 'verified' && (
          <section className="panel">
            {data.length ? (
              <Table
                headers={[
                  'Common identity',
                  'Canonical name',
                  'Category',
                  'Source codes',
                  'Status',
                  '',
                ]}
              >
                {data.map((c: any) => (
                  <tr key={c.id}>
                    <td>
                      <Link className="code-link" href={`/common-identities/${c.id}`}>
                        {c.nmip_code}
                      </Link>
                    </td>
                    <td>{c.canonical_name}</td>
                    <td>{c.category}</td>
                    <td>
                      <Badge value={`${c.mapping_count} mapped codes`} />
                    </td>
                    <td>
                      <Badge value={c.status} />
                    </td>
                    <td>
                      <Link href={`/common-identities/${c.id}`}>
                        <ArrowRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </Table>
            ) : (
              <Empty
                title="No verified identities yet"
                text="Run 'Find Common Identities (Old & New Data)' above to evaluate uploaded datasets against existing catalog records."
              />
            )}
          </section>
        )}

        {activeTab === 'discovered' && (
          <section className="panel">
            <div className="section-heading">
              <h2>Cross-Dataset Identity Candidates</h2>
              <span className="muted">
                {candidateMatches.length} candidate pairs found between old & new datasets
              </span>
            </div>
            {candidateMatches.length ? (
              <Table
                headers={[
                  'Material A (Existing / Old)',
                  'Material B (Newly Imported)',
                  'Category',
                  'Similarity / Verdict',
                  'Status',
                  'Action',
                ]}
              >
                {candidateMatches.map((c: any) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.material_a.organization}</strong>
                      <div className="mono small">{c.material_a.legacy_material_code}</div>
                      <small className="muted">{c.material_a.original_description}</small>
                    </td>
                    <td>
                      <strong>{c.material_b.organization}</strong>
                      <div className="mono small">{c.material_b.legacy_material_code}</div>
                      <small className="muted">{c.material_b.original_description}</small>
                    </td>
                    <td>{c.material_a.category}</td>
                    <td>
                      <div>
                        <strong>{c.final_score}% Match</strong>
                      </div>
                      <Badge value={c.decision?.decision_type || 'PENDING'} />
                    </td>
                    <td>
                      <Badge value={c.status} />
                    </td>
                    <td>
                      <Link className="text-link" href="/candidates">
                        Review in queue <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </Table>
            ) : (
              <Empty
                title="No cross-dataset candidate matches"
                text="Click 'Find Common Identities (Old & New Data)' to run retrieval across newly imported data and existing catalog items."
              />
            )}
          </section>
        )}
      </>
    );
  }

  return (
    <>
      <PageHeading
        eyebrow="VERIFIED COMMON MATERIAL IDENTITY"
        title={data.nmip_code}
        description={data.canonical_name}
      >
        <Button variant="outline" onClick={() => setEvidence(true)}>
          Evidence
        </Button>
        <Button asChild variant="outline">
          <a
            href={`/api/common-identities/${id}/export`}
            download={`${data.nmip_code}.json`}
          >
            <Download size={15} />
            Export mappings
          </a>
        </Button>
        {['ADMIN', 'ENGINEER'].includes(user.role) && data.status !== 'PUBLISHED' && (
          <Button
            disabled={action.busy}
            onClick={() =>
              action.run(
                () => post(`/common-identities/${id}/publish`),
                'Identity published to the NMIP catalog.'
              )
            }
          >
            <Upload size={15} />
            Publish to catalog
          </Button>
        )}
      </PageHeading>

      <Notice {...action} />

      <div className="notice success">
        <ShieldCheck size={19} />
        Human-approved identity · Source codes preserved · <Badge value={data.status} />
      </div>

      <div className="detail-grid">
        <section className="panel">
          <h2>Verified engineering attributes</h2>
          <dl>
            {Object.entries(data.canonical_attributes || {}).map(([key, value]) => (
              <div key={key}>
                <dt>{label(key)}</dt>
                <dd>{String(value)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="panel">
          <h2>Legacy-code mapping</h2>
          <Table headers={['Organization', 'Original material code', 'Description']}>
            {data.mappings.map((m: any) => (
              <tr key={m.id}>
                <td>{m.organization}</td>
                <td>
                  <Link className="code-link" href={`/materials/${m.id}`}>
                    {m.legacy_material_code}
                  </Link>
                </td>
                <td>{m.original_description}</td>
              </tr>
            ))}
          </Table>
          <p className="muted small">
            Publication updates the shared catalog. JSON export is available for integration; no external ERP is configured.
          </p>
        </section>
      </div>

      <section className="panel">
        <h2>Approval history</h2>
        <Table headers={['Action', 'Reason', 'Timestamp']}>
          {data.reviews.map((r: any) => (
            <tr key={r.id}>
              <td>
                <Badge value={r.action} />
              </td>
              <td>{r.comment}</td>
              <td>{date(r.created_at)}</td>
            </tr>
          ))}
        </Table>
      </section>

      <Drawer open={evidence} onOpenChange={setEvidence} title="Identity evidence">
        <EvidenceList evidence={data.evidence} />
      </Drawer>
    </>
  );
}
export function DuplicatePrevention(){
  const [description,setDescription]=useState(''),[category,setCategory]=useState('Valves'),[results,setResults]=useState<any[]|null>(null),[created,setCreated]=useState<string|null>(null);const action=useAction(),user=useUser();
  const {data:orgs=[]}=useQuery({queryKey:['orgs'],queryFn:()=>api<Row[]>('/organizations')});
  return <><PageHeading eyebrow="PRE-CREATION GOVERNANCE" title="Prevent the next duplicate" description="Check engineering identity before a new source code enters the catalog."/><Notice {...action}/>{created&&<div className="notice success">Material created.<Link className="text-link" href={`/materials/${created}`}>Open source record<ArrowRight size={14}/></Link></div>}<section className="panel"><h2>Describe the proposed material</h2><form onSubmit={async e=>{e.preventDefault();const r=await action.run(()=>post('/duplicate-check',{description,category}),'Engineering check completed.');if(r)setResults(r);}}><div className="form-grid"><Field title="Engineering description / attributes"><textarea value={description} onChange={e=>{setDescription(e.target.value);setResults(null);}} placeholder={'e.g. Gate Valve 2" CS CL150'} required minLength={3}/></Field><Field title="Material category"><select value={category} onChange={e=>{setCategory(e.target.value);setResults(null);}}>{categories.map(c=><option key={c}>{c}</option>)}</select></Field></div><Button disabled={action.busy}><ShieldCheck size={17}/>Check existing identities</Button></form></section>{results!==null&&<><section className="panel"><div className="section-heading"><h2>{results.some(r=>r.decision.decision_type==='IDENTITY_MATCH')?'Potential existing material identity':'Engineering candidate results'}</h2><span className="muted">{results.length} candidates</span></div>{results.length?results.map(r=><div className="duplicate-result" key={r.material_id}><div><Link className="code-link" href={`/materials/${r.material_id}`}>{r.legacy_material_code}</Link><h3>{r.description}</h3><p className="muted">{r.decision.reason}</p>{r.common_identity&&<Link className="text-link" href={`/common-identities/${r.common_identity_id}`}><Fingerprint size={15}/>{r.common_identity}</Link>}</div><div><strong>{r.similarity}% retrieval similarity</strong><Badge value={r.decision.decision_type}/></div><details><summary>Engineering comparison</summary><Table headers={['Attribute','Proposed','Existing','Result']}>{r.comparisons.map((c:any)=><tr key={c.attribute_name}><td>{label(c.attribute_name)}</td><td>{c.value_a||'Missing'}</td><td>{c.value_b||'Missing'}</td><td><Badge value={c.comparison_result}/></td></tr>)}</Table></details></div>):<Empty title="No candidate found" text="No similar record was retrieved in this category. This is not proof that the material is unique."/>}</section>{['ADMIN','DATA_STEWARD'].includes(user.role)&&<section className="panel"><h2>Continue as a new source material</h2><p className="muted">The backend repeats the duplicate check at creation time. Identity matches require a recorded override reason.</p><form onSubmit={async e=>{e.preventDefault();const r=await action.run(()=>post('/materials',{...Object.fromEntries(new FormData(e.currentTarget)),original_description:description,category}),'Material saved.');if(r)setCreated(r.id);}}><div className="form-grid"><Field title="Organization"><select name="organization_id" required>{orgs.map(o=><option value={o.id} key={o.id}>{o.code}</option>)}</select></Field><Field title="New legacy code"><input name="legacy_material_code" required maxLength={120}/></Field></div><Field title="Reason for creating a separate record"><textarea name="override_reason" minLength={10} required placeholder="Explain why a new source record is necessary despite any existing identity…"/></Field><Button disabled={action.busy} variant="outline">Create material & record reason</Button></form></section>}</>}</>;
}
export function Audit(){
  const {data=[],isPending,error}=useQuery({queryKey:['audit'],queryFn:()=>api<Row[]>('/audit')});const[q,setQ]=useState('');
  return <><PageHeading eyebrow="ACCOUNTABILITY" title="Audit & versioning" description="Who changed what, when, and why. Source records and prior decision snapshots remain traceable."/><section className="panel"><div className="filters"><input aria-label="Search audit" placeholder="Filter action, person, entity or reason…" value={q} onChange={e=>setQ(e.target.value)}/><span className="muted">Latest {data.length} events</span></div><Notice error={error?.message}/>{isPending?<Loading/>:<Table headers={['Timestamp','Who','Action / entity','Why','Change record']}>{data.filter(a=>JSON.stringify(a).toLowerCase().includes(q.toLowerCase())).map(a=><tr key={a.id}><td className="small">{date(a.created_at)}</td><td>{a.user_name}</td><td><strong>{label(a.action)}</strong><small className="block muted">{a.entity_type} · {a.entity_id.slice(0,8)}</small></td><td>{a.reason}</td><td><details><summary>View change</summary><div className="audit-diff"><strong>Previous</strong><pre>{JSON.stringify(a.previous_value,null,2)}</pre><strong>New</strong><pre>{JSON.stringify(a.new_value,null,2)}</pre></div></details></td></tr>)}</Table>}</section></>;
}
export function ProofBoard(){
  const queryClient = useQueryClient();
  const {data,isPending,error}=useQuery({queryKey:['proof'],queryFn:()=>api('/proof-board')});const action=useAction(),user=useUser();
  if(isPending)return <Loading/>;if(error)return <Notice error={error.message}/>;
  const run=data.runs[0];const columns=['precision','recall','f1','top_k_retrieval','false_merge_rate','do_not_merge_accuracy','abstention_rate'];
  async function runBenchmark(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = await action.run(()=>api('/proof-board/benchmark',{method:'POST',body:new FormData(e.currentTarget)}),'Benchmark completed; metrics are now recorded.');
    if (result) queryClient.invalidateQueries({queryKey:['proof']});
  }
  return <><PageHeading eyebrow="TECHNICAL VALIDATION" title="Proof Board" description="Measure the difference between text similarity and engineering-governed identity."/><Notice {...action}/><div className="notice"><ShieldCheck size={18}/>Metrics are computed from uploaded labels. Synthetic test results do not establish production accuracy.</div><div className="proof-methods">{['Fuzzy matching','Embedding similarity','NMIP hybrid + rules'].map((name,i)=><div className={`panel ${i===2?'accent-panel':''}`} key={name}><div className="eyebrow">{i===2?'ENGINEERING-GOVERNED':'BASELINE '+(i+1)}</div><h2>{name}</h2><p className="muted">{i===0?'Token-based fuzzy score at the recorded threshold.':i===1?data.provider:'Critical conflicts override similarity. Missing evidence produces abstention.'}</p></div>)}</div>{['ADMIN','ENGINEER'].includes(user.role)&&<section className="panel"><h2>Run a labeled benchmark</h2><p className="muted">Upload CSV or XLSX with description_a, description_b, category, label. Labels can use canonical NMIP values or common forms like match, no_match, substitute, or insufficient.</p><form className="upload-grid" onSubmit={runBenchmark}><input name="file" aria-label="Labeled benchmark file" type="file" accept=".csv,.xlsx" required/><Button disabled={action.busy}>{action.busy?'Evaluating…':'Run benchmark'}</Button></form></section>}<section className="panel"><div className="section-heading"><h2>{run?'Latest benchmark results':'Awaiting benchmark dataset'}</h2>{run&&<span className="muted">{run.row_count} labeled pairs · {date(run.created_at)}</span>}</div>{run?<><Table headers={['Method',...columns.map(label)]}>{Object.entries(run.metrics.models).map(([name,m]:[string,any])=><tr key={name}><td><strong>{name}</strong></td>{columns.map(k=><td key={k}>{m[k]===null?'N/A':`${(m[k]*100).toFixed(1)}%`}</td>)}</tr>)}</Table><p className="muted small">{run.metrics.scope}</p><p className="muted small">Provider: {run.metrics.provider} · Baseline threshold: {run.metrics.threshold}% · Top-K: {run.metrics.top_k}</p><details><summary>Confusion counts</summary><pre>{JSON.stringify(Object.fromEntries(Object.entries(run.metrics.models).map(([k,v]:[string,any])=>[k,v.confusion])),null,2)}</pre></details></>:<Empty title="Evidence before claims" text="Upload labeled engineering pairs to calculate precision, recall, F1, retrieval, false merges and abstention. No metrics have been assumed."/>}</section>{data.runs.length>1&&<section className="panel"><h2>Benchmark history</h2><Table headers={['Dataset','Pairs','Run time']}>{data.runs.map((r:any)=><tr key={r.id}><td>{r.filename}</td><td>{r.row_count}</td><td>{date(r.created_at)}</td></tr>)}</Table></section>}</>;
}
