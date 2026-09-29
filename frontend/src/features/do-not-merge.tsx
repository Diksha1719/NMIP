'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, post, put, del } from '@/services/api';
import { useAction } from '@/hooks/use-action';
import { useUser } from '@/components/shell';
import { PageHeading, Notice, Loading, Badge, Table, Field, categories } from '@/components/shared';
import { Button } from '@/components/ui/button';
import type { DoNotMergeRule } from '@/types';

export function DoNotMergeEngine() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [testCategory, setTestCategory] = useState('Valves');
  const [testAttrA, setTestAttrA] = useState('SS304');
  const [testAttrB, setTestAttrB] = useState('SS316');
  const [testResult, setTestResult] = useState<any>(null);

  const user = useUser();
  const action = useAction();
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading, error } = useQuery({
    queryKey: ['do-not-merge-rules'],
    queryFn: () => api<DoNotMergeRule[]>('/do-not-merge/rules'),
  });

  const handleTest = async () => {
    const res = await post('/do-not-merge/test', {
      category: testCategory,
      aa: { material_grade: testAttrA, pressure_class: 'Class 150' },
      ab: { material_grade: testAttrB, pressure_class: 'Class 150' },
    });
    setTestResult(res);
  };

  if (isLoading) return <Loading />;

  return (
    <>
      <PageHeading
        eyebrow="MATERIAL GOVERNANCE"
        title="Do Not Merge engine"
        description="Explicit engineering block rules and constraints that prevent blind mergers of incompatible material grades, pressure classes, and distinct specifications."
      >
        {user.role === 'ADMIN' || user.role === 'ENGINEER' ? (
          <Button onClick={() => setShowAddModal(!showAddModal)}>
            {showAddModal ? 'Close form' : 'Create Do Not Merge rule'}
          </Button>
        ) : null}
      </PageHeading>

      <Notice {...action} />
      <Notice error={error?.message} />

      {/* Metrics Overview Grid */}
      <div className="metrics-grid" style={{ marginBottom: 22 }}>
        <div className="metric-card">
          <div className="metric-title">Total configured rules</div>
          <div className="metric-value">{rules.length}</div>
          <div className="metric-caption">Engine constraint definitions</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Enforced active</div>
          <div className="metric-value">{rules.filter((r) => r.is_active).length}</div>
          <div className="metric-caption">Currently active block policies</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Governed categories</div>
          <div className="metric-value">{new Set(rules.map((r) => r.category)).size}</div>
          <div className="metric-caption">Categories with active rules</div>
        </div>
      </div>

      {/* Rule Creation Panel */}
      {showAddModal && (
        <section className="panel">
          <h2>Create Do Not Merge rule</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget));
              const r = await action.run(
                () =>
                  post('/do-not-merge/rules', {
                    name: f.name,
                    category: f.category,
                    attribute_a: f.attribute_a,
                    attribute_b: f.attribute_b,
                    condition: f.condition,
                    severity: f.severity,
                    reason: f.reason,
                    is_active: f.is_active === 'on',
                  }),
                'Do Not Merge rule created.'
              );
              if (r) {
                setShowAddModal(false);
                queryClient.invalidateQueries({ queryKey: ['do-not-merge-rules'] });
              }
            }}
          >
            <div className="form-grid">
              <Field title="Rule name">
                <input name="name" required placeholder="Material Grade Incompatibility" />
              </Field>
              <Field title="Category scope">
                <select name="category">
                  <option value="*">All categories (*)</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field title="Target Attribute A">
                <input name="attribute_a" required defaultValue="material_grade" />
              </Field>
              <Field title="Target Attribute B">
                <input name="attribute_b" required defaultValue="material_grade" />
              </Field>
              <Field title="Condition">
                <select name="condition">
                  <option value="DIFFERENT">DIFFERENT</option>
                  <option value="VALUE_MISMATCH">VALUE_MISMATCH</option>
                  <option value="EXPLICIT_BLOCK">EXPLICIT_BLOCK</option>
                </select>
              </Field>
              <Field title="Severity">
                <select name="severity">
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="IMPORTANT">IMPORTANT</option>
                  <option value="BLOCK">BLOCK</option>
                </select>
              </Field>
            </div>
            <Field title="Governance Reason / Block Warning Message">
              <textarea
                name="reason"
                required
                rows={2}
                placeholder="Explain why these attribute values can never be merged into the same identity..."
              />
            </Field>

            <label className="checkbox" style={{ marginBottom: 15 }}>
              <input type="checkbox" name="is_active" defaultChecked /> Enforce Rule
            </label>

            <div className="button-row">
              <Button disabled={action.busy}>Save Policy Rule</Button>
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* Rules Table Panel */}
      <section className="panel">
        <div className="section-heading">
          <h2>Active Do Not Merge rules</h2>
          <p>Strict rules that prevent candidate merge operations when engineering specs differ.</p>
        </div>

        <Table headers={['Rule Name', 'Category', 'Target Attribute', 'Condition', 'Severity', 'Enforced', '']}>
          {rules.map((rule) => (
            <tr key={rule.id}>
              <td>
                <strong>{rule.name}</strong>
                <div className="muted cell-description">{rule.reason}</div>
              </td>
              <td>{rule.category}</td>
              <td className="mono">{rule.attribute_a}</td>
              <td>
                <Badge value={rule.condition} />
              </td>
              <td>
                <Badge value={rule.severity} />
              </td>
              <td>
                <span className={rule.is_active ? 'badge badge-active' : 'badge badge-disabled'}>
                  {rule.is_active ? 'Enforced' : 'Disabled'}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      action.run(
                        () => put(`/do-not-merge/rules/${rule.id}`, { ...rule, is_active: !rule.is_active }),
                        'Rule status toggled.'
                      ).then(() => queryClient.invalidateQueries({ queryKey: ['do-not-merge-rules'] }))
                    }
                  >
                    {rule.is_active ? 'Disable' : 'Enable'}
                  </Button>
                  {user.role === 'ADMIN' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        action.run(
                          () => del(`/do-not-merge/rules/${rule.id}`),
                          'Rule deleted.'
                        ).then(() => queryClient.invalidateQueries({ queryKey: ['do-not-merge-rules'] }))
                      }
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </section>

      {/* Rule Tester Sandbox Panel */}
      <section className="panel">
        <h2>Do Not Merge engine tester sandbox</h2>
        <p className="muted">Test material attributes against active Do Not Merge rules to verify policy blocks.</p>

        <div className="form-grid" style={{ marginTop: 15 }}>
          <Field title="Category">
            <select value={testCategory} onChange={(e) => setTestCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="*">All (*)</option>
            </select>
          </Field>
          <Field title="Material Side A spec value">
            <input value={testAttrA} onChange={(e) => setTestAttrA(e.target.value)} placeholder="SS304" />
          </Field>
          <Field title="Material Side B spec value">
            <input value={testAttrB} onChange={(e) => setTestAttrB(e.target.value)} placeholder="SS316" />
          </Field>
        </div>

        <div className="button-row">
          <Button onClick={handleTest}>Test Policy Evaluation</Button>
        </div>

        {testResult && (
          <div style={{ marginTop: 20 }}>
            {testResult.blocked ? (
              <div className="notice error">
                <strong>DO NOT MERGE CONSTRAINTS TRIGGERED:</strong>
                <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                  {testResult.violations?.map((v: any, i: number) => (
                    <li key={i}>{v.reason}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="notice success">
                <strong>NO DO-NOT-MERGE CONSTRAINTS TRIGGERED.</strong> Candidate pair permitted for standard identity evaluation.
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
