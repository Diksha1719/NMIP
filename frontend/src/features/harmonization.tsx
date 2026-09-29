'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, post } from '@/services/api';
import { useAction } from '@/hooks/use-action';
import { PageHeading, Notice, Loading, Badge, Table, Field, categories } from '@/components/shared';
import { Button } from '@/components/ui/button';
import type { HarmonizationResult, Material } from '@/types';

export function HarmonizationStudio() {
  const [tab, setTab] = useState<'sandbox' | 'catalog'>('sandbox');
  const [text, setText] = useState('Gate V/V 2" CS CL150 NPT Threaded');
  const [category, setCategory] = useState('Valves');
  const [result, setResult] = useState<HarmonizationResult | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const action = useAction();
  const queryClient = useQueryClient();

  const { data: materials = [], isLoading: materialsLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: () => api<Material[]>('/materials'),
    enabled: tab === 'catalog',
  });

  const harmonizeMutation = useMutation({
    mutationFn: (payload: { text: string; category?: string }) =>
      post<HarmonizationResult>('/ai/harmonize', payload),
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const handleRunHarmonize = () => {
    if (!text.trim()) return;
    harmonizeMutation.mutate({ text, category });
  };

  const handleSelectMaterial = (m: Material) => {
    setSelectedMaterial(m);
    setText(m.original_description);
    setCategory(m.category);
    harmonizeMutation.mutate({ text: m.original_description, category: m.category });
  };

  return (
    <>
      <PageHeading
        eyebrow="INTELLIGENCE PIPELINE"
        title="AI Harmonization studio"
        description="Standardize raw unverified material descriptions into canonical specifications with AI attribute extraction and unit normalization."
      />
      <Notice {...action} />

      <div className="decision-tabs">
        <button
          className={tab === 'sandbox' ? 'selected' : ''}
          onClick={() => setTab('sandbox')}
        >
          Instant Sandbox <b>AI</b>
        </button>
        <button
          className={tab === 'catalog' ? 'selected' : ''}
          onClick={() => setTab('catalog')}
        >
          Catalog Harmonizer <b>BATCH</b>
        </button>
      </div>

      {tab === 'sandbox' ? (
        <div className="detail-grid">
          {/* Input Form Panel */}
          <section className="panel">
            <h2>Raw material specification input</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunHarmonize();
              }}
            >
              <Field title="Category scope">
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="General">General / Auto-Detect</option>
                </select>
              </Field>

              <Field title="Raw material description">
                <textarea
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Gate V/V 2 in CS CL150 NPT..."
                  required
                />
              </Field>

              <div className="button-row">
                <Button disabled={harmonizeMutation.isPending}>
                  {harmonizeMutation.isPending ? 'Running AI engine…' : 'Run AI Harmonization'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setText('Gate V/V 2" CS CL150 NPT Threaded');
                    setCategory('Valves');
                  }}
                >
                  Valve Preset
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setText('Hex Bolt M12 x 50 S.S. 304 galv plain');
                    setCategory('Fasteners');
                  }}
                >
                  Bolt Preset
                </Button>
              </div>
            </form>
          </section>

          {/* Result Display Panel */}
          <section className="panel">
            <h2>Harmonized canonical output</h2>
            {harmonizeMutation.isPending ? (
              <Loading />
            ) : result ? (
              <>
                <div className="source-normalized" style={{ marginBottom: 20 }}>
                  <div className="eyebrow" style={{ marginBottom: 4 }}>
                    CANONICAL HARMONIZED TITLE
                  </div>
                  <strong style={{ fontSize: 16, display: 'block', marginBottom: 8, color: 'var(--ink)' }}>
                    {result.harmonized_title}
                  </strong>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Badge value={result.harmonized_category} />
                    <Badge value={`${(result.confidence_score * 100).toFixed(0)}% Confidence`} />
                    {result.taxonomy_node_code && <Badge value={result.taxonomy_node_code} />}
                  </div>
                </div>

                <h3>Extracted normalized specifications</h3>
                <Table headers={['Attribute', 'Raw spec', 'Harmonized value', 'Unit', 'Confidence']}>
                  {Object.keys(result.extracted_attributes).length > 0 ? (
                    Object.entries(result.extracted_attributes).map(([attr, val]) => (
                      <tr key={attr}>
                        <td className="mono">{attr}</td>
                        <td className="muted">{val.raw}</td>
                        <td>
                          <strong>{val.normalized}</strong>
                        </td>
                        <td>{val.unit || '—'}</td>
                        <td>{(val.confidence * 100).toFixed(0)}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 20 }}>
                        No explicit attributes extracted.
                      </td>
                    </tr>
                  )}
                </Table>

                <div style={{ marginTop: 20 }}>
                  <h3>Harmonization enhancements applied</h3>
                  <ul style={{ paddingLeft: 18, color: 'var(--muted)', fontSize: 13 }}>
                    {result.improvements.map((imp, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <p className="muted">Enter raw material specifications and click &quot;Run AI Harmonization&quot; to preview canonical standard titles.</p>
            )}
          </section>
        </div>
      ) : (
        /* Catalog Harmonizer Tab */
        <div className="detail-grid">
          <section className="panel">
            <h2>Select material from catalog</h2>
            {materialsLoading ? (
              <Loading />
            ) : (
              <Table headers={['Code', 'Category', 'Original description', '']}>
                {materials.map((m) => (
                  <tr key={m.id}>
                    <td className="code-link">{m.legacy_material_code}</td>
                    <td>{m.category}</td>
                    <td className="cell-description">{m.original_description}</td>
                    <td>
                      <Button
                        size="sm"
                        variant={selectedMaterial?.id === m.id ? 'default' : 'outline'}
                        onClick={() => handleSelectMaterial(m)}
                      >
                        {selectedMaterial?.id === m.id ? 'Selected' : 'Select'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </section>

          <section className="panel">
            <h2>Harmonization preview & catalog apply</h2>
            {selectedMaterial && result ? (
              <>
                <div className="source-card">
                  <div className="mono">Code: {selectedMaterial.legacy_material_code}</div>
                  <div className="source-normalized" style={{ background: '#fdf0f1', borderColor: '#f0dce0', color: '#b45c69' }}>
                    <div className="eyebrow" style={{ color: '#b45c69' }}>
                      ORIGINAL UNHARMONIZED
                    </div>
                    <strong>{selectedMaterial.original_description}</strong>
                  </div>
                  <div className="source-normalized" style={{ background: '#edf7f2', borderColor: '#d9eee5', color: '#34846e' }}>
                    <div className="eyebrow" style={{ color: '#34846e' }}>
                      PROPOSED CANONICAL HARMONIZED
                    </div>
                    <strong>{result.harmonized_title}</strong>
                  </div>
                </div>

                <div className="button-row">
                  <Button
                    disabled={action.busy}
                    onClick={() =>
                      action.run(
                        () =>
                          post('/ai/harmonize/apply', {
                            material_id: selectedMaterial.id,
                            harmonized_title: result.harmonized_title,
                            harmonized_category: result.harmonized_category,
                            taxonomy_node_code: result.taxonomy_node_code,
                            attributes: Object.fromEntries(
                              Object.entries(result.extracted_attributes).map(([k, v]) => [k, v.normalized])
                            ),
                          }),
                        'Applied AI Harmonization to material record in catalog.'
                      ).then(() => queryClient.invalidateQueries({ queryKey: ['materials'] }))
                    }
                  >
                    Apply Harmonization to Record
                  </Button>
                </div>
              </>
            ) : (
              <p className="muted">Select a material record from the catalog list to preview and apply AI harmonization.</p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
