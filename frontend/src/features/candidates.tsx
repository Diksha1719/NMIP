'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, GitCompareArrows, FileText, ShieldCheck, CheckCircle2, XCircle, HelpCircle, RotateCw } from 'lucide-react';
import { api, post } from '@/services/api';
import { useAction } from '@/hooks/use-action';
import { useUser } from '@/components/shell';
import { PageHeading, Notice, Loading, Badge, Empty, Table, Field, outcomes } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/dialog';
import { EvidenceList } from './materials';
import { label, date } from '@/lib/utils';
import type { Candidate } from '@/types';

export function Candidates({ reviewOnly = false }: { reviewOnly?: boolean }) {
  const queryClient = useQueryClient();
  const action = useAction();
  const user = useUser();
  const [filter, setFilter] = useState('');
  const [reviewId, setReviewId] = useState<string | null>(null);
  const canReview = ['ADMIN', 'ENGINEER'].includes(user.role);

  const { data = [], isPending, error } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => api<Candidate[]>('/candidates'),
  });

  const queued = data.filter((c) => !reviewOnly || ['PENDING', 'INFORMATION_REQUESTED'].includes(c.status));
  const records = queued.filter((c) => !filter || c.decision?.decision_type === filter);

  if (reviewOnly && reviewId) {
    return <>
      <Button variant="outline" onClick={() => setReviewId(null)}>Back to review queue</Button>
      <CandidateDetail key={reviewId} id={reviewId} />
    </>;
  }

  return (
    <>
      <PageHeading
        eyebrow={reviewOnly ? 'HUMAN GOVERNANCE / 08' : 'PIPELINE / 06–07'}
        title={reviewOnly ? 'Engineering review queue' : 'Candidate center'}
        description={
          reviewOnly
            ? 'Inspect the engineering evidence before approving any common material identity.'
            : 'Hybrid retrieval finds candidates. Engineering rules determine what they mean.'
        }
      >
        {['ADMIN', 'ENGINEER', 'DATA_STEWARD'].includes(user.role) && (
          <Button
            disabled={action.busy}
            onClick={async () => {
              const res = await action.run(
                () => post('/candidates/retrieve', { top_n: 3 }),
                'Candidates retrieved from the current catalog.'
              );
              if (res) {
                queryClient.invalidateQueries({ queryKey: ['candidates'] });
              }
            }}
          >
            <GitCompareArrows size={16} />
            {action.busy ? 'Retrieving…' : 'Retrieve candidates'}
          </Button>
        )}
      </PageHeading>

      <Notice {...action} />
      <Notice error={error?.message} />

      <div className="decision-tabs">
        <button className={!filter ? 'selected' : ''} onClick={() => setFilter('')}>
          All outcomes <b>{queued.length}</b>
        </button>
        {outcomes.map((o) => (
          <button
            key={o}
            className={filter === o ? 'selected' : ''}
            onClick={() => setFilter(o)}
          >
            {label(o)}
            <b>{queued.filter((c) => c.decision?.decision_type === o).length}</b>
          </button>
        ))}
      </div>

      <div className="notice">
        <ShieldCheck size={18} />
        A high similarity score never overrides a critical engineering conflict.
      </div>

      {isPending ? (
        <Loading />
      ) : records.length ? (
        <div className="candidate-grid">
          {records.map((c) => (
            <article className="panel candidate-card" key={c.id}>
              <div className="section-heading">
                <span className="eyebrow">{c.material_a.category}</span>
                <Badge value={c.decision?.decision_type || 'PENDING'} />
              </div>
              <div className="candidate-material">
                <small>
                  {c.material_a.organization} · <span className="mono">{c.material_a.legacy_material_code}</span>
                </small>
                <h3>{c.material_a.original_description}</h3>
              </div>
              <div className="compare-divider">
                <GitCompareArrows size={16} />
                <span>compared with</span>
              </div>
              <div className="candidate-material">
                <small>
                  {c.material_b.organization} · <span className="mono">{c.material_b.legacy_material_code}</span>
                </small>
                <h3>{c.material_b.original_description}</h3>
              </div>
              <div className="candidate-stats">
                <div>
                  <strong>{c.final_score.toFixed(1)}%</strong>
                  <span>Retrieval score</span>
                </div>
                <div>
                  <strong className={c.critical_conflicts ? 'conflict-text' : 'verified-text'}>
                    {c.critical_conflicts || 'None'}
                  </strong>
                  <span>Critical conflicts</span>
                </div>
                <div>
                  <strong>{c.missing_attributes}</strong>
                  <span>Missing values</span>
                </div>
                <div>
                  <strong>{c.evidence_count}</strong>
                  <span>Evidence links</span>
                </div>
              </div>
              <div className="candidate-footer">
                <Badge value={c.status} />
                <Button asChild variant="outline" size="sm">
                  <Link href={`/candidates/${c.id}`}>
                    Compare & review
                    <ArrowRight size={15} />
                  </Link>
                </Button>
              </div>
              {reviewOnly && canReview && (
                <div className="button-row">
                  <Button size="sm" onClick={() => setReviewId(c.id)}>Human review</Button>
                  <Button size="sm" variant="outline" disabled={action.busy} onClick={() => action.run(
                    () => post(`/candidates/${c.id}/decision`),
                    'Rule engine rerun. Recommendation updated.'
                  )}><RotateCw size={15} />Rerun engine</Button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="No candidates in this view"
          text="Retrieve candidates from processed materials or choose another outcome."
        />
      )}
    </>
  );
}

export function CandidateDetail({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const action = useAction();
  const user = useUser();

  const { data: c, isPending, error, refetch } = useQuery({
    queryKey: ['comparison', id],
    queryFn: () => api<any>(`/candidates/${id}/comparison`),
  });

  const [evidence, setEvidence] = useState(false);
  const [comment, setComment] = useState('');
  const [identity, setIdentity] = useState<string | null>(null);

  if (isPending) return <Loading />;
  if (error) return <Notice error={error.message} />;

  const canReview = ['ADMIN', 'ENGINEER'].includes(user.role);
  const closed = ['APPROVED', 'REJECTED'].includes(c.status);

  async function submit(type: string) {
    if (!c?.decision?.id) return;
    const result = await action.run(
      () => post('/reviews', { decision_id: c.decision.id, action: type, comment }),
      type === 'REQUEST_INFORMATION'
        ? 'Information request recorded. Add source-backed attributes on the material record.'
        : 'Review recorded.'
    );
    if (result?.common_identity_id) {
      setIdentity(result.common_identity_id);
    }
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['candidates'] });
    queryClient.invalidateQueries({ queryKey: ['comparison', id] });
  }

  const handleRerun = async () => {
    const updatedDecision = await action.run(
      () => post(`/candidates/${id}/decision`),
      'Decision recalculated against current material and rule versions.'
    );
    if (updatedDecision) {
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['comparison', id] });
    }
  };

  return (
    <>
      <PageHeading
        eyebrow="ENGINEERING COMPARISON"
        title="Similar descriptions. Verified differences."
        description="Compare critical attributes, inspect their sources, and record your engineering decision."
      >
        <Button variant="outline" onClick={() => setEvidence(true)}>
          <FileText size={16} />
          View evidence ({c.evidence_count})
        </Button>
        {canReview && c.status !== 'APPROVED' && (
          <Button disabled={action.busy} variant="outline" onClick={handleRerun}>
            <RotateCw size={15} />
            {action.busy ? 'Working…' : 'Rerun engine'}
          </Button>
        )}
      </PageHeading>

      <Notice {...action} />

      {!c.decision && <div className="notice">No rule engine recommendation is available yet. {canReview ? 'Use Rerun engine to generate one before recording a human review.' : 'An engineer must run the engine before this candidate can be reviewed.'}</div>}

      {identity && (
        <div className="notice success">
          <CheckCircle2 size={18} />
          Common identity created and legacy codes mapped.
          <Link className="text-link" href={`/common-identities/${identity}`}>
            Open identity
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <div className="comparison-source-grid">
        {[c.material_a, c.material_b].map((m: any, i: number) => (
          <section key={m.id} className="panel source-card">
            <div className="section-heading">
              <div className="eyebrow">
                MATERIAL {i ? 'B' : 'A'} · {m.organization}
              </div>
              <Badge value={m.status} />
            </div>
            <h2>{m.original_description}</h2>
            <p className="mono">{m.legacy_material_code}</p>
            <div className="source-normalized">{m.normalized_description}</div>
            <Link className="text-link" href={`/materials/${m.id}`}>
              Inspect source / add information
              <ArrowRight size={14} />
            </Link>
          </section>
        ))}
      </div>

      <div className="comparison-stats">
        <div>
          <strong>{c.semantic_score.toFixed(1)}%</strong>
          <span>Embedding similarity*</span>
        </div>
        <div>
          <strong>{c.attribute_score.toFixed(1)}%</strong>
          <span>Attribute alignment</span>
        </div>
        <div>
          <strong className="conflict-text">{c.critical_conflicts}</strong>
          <span>Critical conflicts</span>
        </div>
        <div>
          <strong>{c.missing_attributes}</strong>
          <span>Missing attributes</span>
        </div>
        <div>
          <strong>{c.evidence_count}</strong>
          <span>Evidence links</span>
        </div>
      </div>

      {c.decision && (
        <>
          <section className="panel">
            <div className="section-heading">
              <h2>Attribute-by-attribute comparison</h2>
              <span className="muted small">
                Recorded rule version · Source revisions {c.decision.snapshot?.a_revision ?? 0} /{' '}
                {c.decision.snapshot?.b_revision ?? 0}
              </span>
            </div>
            <Table headers={['Engineering attribute', 'Material A', 'Material B', 'Result', 'Criticality', 'Evidence']}>
              {c.comparisons.map((r: any) => (
                <tr key={r.id} className={r.comparison_result === 'CONFLICT' ? 'conflict-row' : ''}>
                  <td>
                    <strong>{label(r.attribute_name)}</strong>
                  </td>
                  <td>{r.value_a || 'Missing'}</td>
                  <td>{r.value_b || 'Missing'}</td>
                  <td>
                    <Badge value={r.comparison_result} />
                  </td>
                  <td>{label(r.criticality)}</td>
                  <td>
                    <button className="text-link" onClick={() => setEvidence(true)}>
                      <FileText size={14} />
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </Table>
          </section>

          <section className={`panel decision-panel decision-${c.decision.decision_type.toLowerCase()}`}>
            <div className="section-heading">
              <div>
                <div className="eyebrow">RULE ENGINE RECOMMENDATION</div>
                <h2>{label(c.decision.decision_type)}</h2>
              </div>
              <ShieldCheck size={27} />
            </div>
            <p>{c.decision.reason}</p>
            <div className="notice small">
              *The default embedding provider uses deterministic token hashing. Scores are retrieval aids, not calibrated
              probabilities of identity.
            </div>

            {canReview && !closed ? (
              <>
                <Field title="Review comment / What information is missing?">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    minLength={5}
                    placeholder="Record the evidence checked, reason for rejection, or the missing attributes…"
                  />
                </Field>
                <p className="small muted">Enter at least 5 characters to submit your human review.</p>
                <div className="button-row">
                  <Button
                    disabled={action.busy || comment.trim().length < 5}
                    onClick={() => submit('APPROVE')}
                  >
                    <CheckCircle2 size={16} />
                    {c.decision.decision_type === 'IDENTITY_MATCH'
                      ? 'Approve identity match'
                      : 'Acknowledge recommendation'}
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={action.busy || comment.trim().length < 5}
                    onClick={() => submit('REJECT')}
                  >
                    <XCircle size={16} />
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    disabled={action.busy || comment.trim().length < 5}
                    onClick={() => submit('REQUEST_INFORMATION')}
                  >
                    <HelpCircle size={16} />
                    Request information
                  </Button>
                </div>
                {c.decision.decision_type !== 'IDENTITY_MATCH' && (
                  <p className="small muted">
                    Acknowledging this outcome records a review only. It does not create a common identity.
                  </p>
                )}
              </>
            ) : (
              <Badge value={c.status} />
            )}
          </section>
        </>
      )}

      <section className="panel">
        <h2>Review history</h2>
        {c.reviews.length ? (
          <Table headers={['Action', 'Comment', 'Reviewer', 'Time']}>
            {c.reviews.map((r: any) => (
              <tr key={r.id}>
                <td>
                  <Badge value={r.action} />
                </td>
                <td>{r.comment}</td>
                <td className="mono small">{r.reviewer_id.slice(0, 8)}</td>
                <td>{date(r.created_at)}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <p className="muted">No human review has been recorded.</p>
        )}
      </section>

      <Drawer open={evidence} onOpenChange={setEvidence} title="Engineering source evidence">
        <EvidenceList evidence={c.evidence} />
      </Drawer>
    </>
  );
}
