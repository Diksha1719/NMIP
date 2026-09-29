'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, FileSpreadsheet, ArrowRight, Download, Trash2 } from 'lucide-react';
import { api, post, put, del } from '@/services/api';
import { PageHeading, Notice, Table, Field, Badge, Empty, Loading } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { useAction } from '@/hooks/use-action';
import { useUser } from '@/components/shell';
import type { Row, Material } from '@/types';
import { SourcePreview } from './source-preview';

const datasetColumns = ['legacy_material_code', 'original_description', 'category', 'unit', 'manufacturer', 'specification', 'standard'];

export function Ingestion({ validationOnly = false }: { validationOnly?: boolean }) {
  const queryClient = useQueryClient();
  const { data: orgs = [] } = useQuery({ queryKey: ['orgs'], queryFn: () => api<Row[]>('/organizations') });
  const { data: datasets = [], isPending, error } = useQuery({ queryKey: ['datasets'], queryFn: () => api<Row[]>('/datasets') });
  const [selected, setSelected] = useState<any>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [report, setReport] = useState<any>(null);
  const action = useAction();
  const user = useUser();
  const canEdit = ['ADMIN', 'DATA_STEWARD'].includes(user.role);

  function defaultMapping(columns: string[], existing: Record<string, string> = {}) {
    return {
      ...Object.fromEntries(datasetColumns.filter(key => columns.includes(key)).map(key => [key, key])),
      ...existing,
    };
  }

  function selectDataset(d: any) {
    setSelected(d);
    setMapping(defaultMapping(d.columns, d.column_mapping));
    setReport(d.validation_report?.length ? { rows: d.validation_report, valid_rows: d.valid_rows, invalid_rows: d.invalid_rows } : null);
  }

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = await action.run(() => api('/datasets/upload', { method: 'POST', body: new FormData(e.currentTarget) }), 'File uploaded. Map source columns to continue.');
    if (data) {
      selectDataset(data);
      setMapping(defaultMapping(data.columns));
    }
  }

  async function deleteDataset(d: Row) {
    if (!confirm(`Are you sure you want to delete dataset "${d.filename}"?`)) return;
    const res = await action.run(() => del(`/datasets/${d.id}`), `Dataset "${d.filename}" deleted successfully.`);
    if (!res) return;

    queryClient.setQueryData<Row[]>(['datasets'], old => old?.filter(dataset => dataset.id !== d.id) ?? []);
    queryClient.invalidateQueries({ queryKey: ['datasets'] });
    if (selected?.id === d.id) setSelected(null);
  }

  return (
    <>
      <PageHeading eyebrow="PIPELINE / 01–02" title={validationOnly ? 'Data validation' : 'Data ingestion'} description="Bring source records into the catalog without losing their original meaning." />
      <div className="step-strip">
        {['Select organization', 'Upload & preview', 'Map columns', 'Validate rows', 'Import'].map((s, i) => (
          <span key={s}><b>{i + 1}</b>{s}{i < 4 && <ArrowRight size={14} />}</span>
        ))}
      </div>
      <Notice {...action} />
      <Notice error={error?.message} />
      {!canEdit && <div className="notice">Your role can inspect datasets. Sign in as a Data Steward or Admin to upload and import.</div>}

      {!validationOnly && canEdit && (
        <section className="panel">
          <h2>Upload a source dataset</h2>
          <form onSubmit={upload}>
            <div className="upload-grid">
              <Field title="Source organization">
                <select name="organization_id" required>
                  <option value="">Select organization</option>
                  {orgs.map(o => <option value={o.id} key={o.id}>{o.code} · Synthetic</option>)}
                </select>
              </Field>
              <Field title="Source file · CSV, XLSX, text PDF or TXT · Up to 10 MB">
                <input name="file" type="file" accept=".csv,.xlsx,.pdf,.txt" required />
              </Field>
              <Button disabled={action.busy}><Upload size={16} />{action.busy ? 'Uploading…' : 'Upload & preview'}</Button>
            </div>
          </form>
          <p className="muted small">For PDF/TXT, text is extracted by line. Annotate missing material codes and categories in the source preview; each correction is audited.</p>
        </section>
      )}

      <section className="panel">
        <div className="section-heading">
          <h2>Source datasets</h2>
          <span className="muted">{datasets.length} datasets</span>
        </div>
        {isPending ? <Loading /> : datasets.length ? (
          <Table headers={['Dataset', 'Source', 'Rows', 'Valid / invalid', 'Status', 'Actions']}>
            {datasets.map(d => (
              <tr key={d.id}>
                <td><FileSpreadsheet size={15} className="inline-icon" />{d.filename}</td>
                <td>{d.source_type}</td>
                <td>{d.row_count}</td>
                <td>{d.valid_rows} / {d.invalid_rows}</td>
                <td><Badge value={d.status} /></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Button variant="outline" size="sm" onClick={async () => {
                      const detail = await action.run(() => api(`/datasets/${d.id}`), 'Dataset opened.');
                      if (detail) selectDataset(detail);
                    }}>Inspect</Button>
                    {canEdit && (
                      <Button variant="destructive" size="sm" disabled={action.busy} onClick={() => deleteDataset(d)}>
                        <Trash2 size={14} /> Delete
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        ) : <Empty title="No datasets uploaded" text="Use samples/synthetic_import.csv for the end-to-end demonstration." />}
      </section>

      {selected && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>{selected.filename}</h2>
              <p>Preview of the first {selected.preview.length} source rows</p>
            </div>
            <Badge value={selected.status} />
          </div>
          <SourcePreview key={selected.id} dataset={selected} editable={canEdit && selected.status !== 'IMPORTED'} onSaved={selectDataset} />
          {canEdit && selected.status !== 'IMPORTED' && (
            <>
              <h3 className="spaced">Column mapping</h3>
              <div className="form-grid">
                {datasetColumns.map((key, i) => (
                  <Field title={`${key.replaceAll('_', ' ')}${i < 3 ? ' *' : ''}`} key={key}>
                    <select value={mapping[key] || ''} onChange={e => setMapping({ ...mapping, [key]: e.target.value })}>
                      <option value="">Select source column</option>
                      {selected.columns.map((c: string) => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                ))}
              </div>
              <Button disabled={action.busy} onClick={async () => {
                const data = await action.run(() => post(`/datasets/${selected.id}/validate`, Object.fromEntries(Object.entries(mapping).filter(([, v]) => v))), 'Row validation completed.');
                if (data) {
                  setReport(data);
                  setSelected({ ...selected, status: 'VALIDATED' });
                }
              }}>Validate mapping & rows</Button>
            </>
          )}
          {report && (
            <>
              <div className="section-heading spaced">
                <h3>{report.valid_rows} valid · {report.invalid_rows} invalid</h3>
                <a className="text-link" href={`/api/datasets/${selected.id}/validation.csv`}><Download size={15} />Download report</a>
              </div>
              <Table headers={['Source row', 'Material code', 'Validation']}>
                {report.rows.map((r: any) => (
                  <tr key={r.row}>
                    <td>{r.row}</td>
                    <td>{r.values.legacy_material_code || '—'}</td>
                    <td>{r.errors.length ? <span className="conflict-text">{r.errors.join(' · ')}</span> : <Badge value="VALID" />}</td>
                  </tr>
                ))}
              </Table>
              {canEdit && selected.status !== 'IMPORTED' && (
                <Button disabled={action.busy || !report.valid_rows} onClick={async () => {
                  const result = await action.run(() => post(`/datasets/${selected.id}/import`), 'Validated rows imported. Continue to normalization.');
                  if (result) setSelected({ ...selected, status: 'IMPORTED' });
                }}>Import {report.valid_rows} valid rows<ArrowRight size={16} /></Button>
              )}
              <Link className="text-link spaced" href="/normalization">Continue to normalization <ArrowRight size={14} /></Link>
            </>
          )}
        </section>
      )}
    </>
  );
}

export function PipelineStage({ stage }: { stage: 'normalization' | 'extraction' | 'enrichment' }) {
  const { data = [], isPending, error } = useQuery({ queryKey: ['materials'], queryFn: () => api<Material[]>('/materials') });
  const action = useAction();
  const user = useUser();
  const config = {
    normalization: ['03', 'Data normalization', 'Normalize units, abbreviations and terminology. Keep every raw source value.', 'normalize'],
    extraction: ['04', 'Attribute extraction', 'Extract structured engineering values with source-linked evidence. Missing values stay missing.', 'extract'],
    enrichment: ['05', 'Engineering enrichment', 'Apply the configured terminology dictionary and category rules. No inferred grade equivalence.', 'enrich'],
  }[stage];

  return (
    <>
      <PageHeading eyebrow={`PIPELINE / ${config[0]}`} title={config[1]} description={config[2]}>
        {['ADMIN', 'DATA_STEWARD'].includes(user.role) && (
          <Button disabled={action.busy} onClick={() => action.run(() => post(`/pipeline/${config[3]}`), `${config[1]} completed for unverified records.`)}>
            {action.busy ? 'Processing…' : `Run ${stage}`}
          </Button>
        )}
      </PageHeading>
      <Notice {...action} />
      <Notice error={error?.message} />
      <div className="notice">Deterministic rule provider · No external AI inference · Verified identity members are protected from bulk edits.</div>
      <section className="panel">
        {isPending ? <Loading /> : (
          <Table headers={['Material code', 'Raw description', 'Normalized description', 'Completeness', 'Status', 'Evidence']}>
            {data.map(m => (
              <tr key={m.id}>
                <td className="mono">{m.legacy_material_code}</td>
                <td>{m.original_description}</td>
                <td>{m.normalized_description || 'Not processed'}</td>
                <td>{m.data_quality_score}%</td>
                <td><Badge value={m.status} /></td>
                <td><Link className="text-link" href={`/materials/${m.id}`}>Inspect<ArrowRight size={14} /></Link></td>
              </tr>
            ))}
          </Table>
        )}
      </section>
      <Button asChild variant="outline">
        <Link href={stage === 'normalization' ? '/extraction' : stage === 'extraction' ? '/enrichment' : '/candidates'}>Next pipeline stage<ArrowRight size={16} /></Link>
      </Button>
    </>
  );
}
