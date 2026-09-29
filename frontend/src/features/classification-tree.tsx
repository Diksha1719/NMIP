'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, post, put, del } from '@/services/api';
import { useAction } from '@/hooks/use-action';
import { useUser } from '@/components/shell';
import { PageHeading, Notice, Loading, Badge, Table, Field } from '@/components/shared';
import { Button } from '@/components/ui/button';
import type { TaxonomyNode } from '@/types';

function TreeNodeItem({
  node,
  selectedNode,
  onSelect,
  expandedNodes,
  toggleExpand,
}: {
  node: TaxonomyNode;
  selectedNode: TaxonomyNode | null;
  onSelect: (n: TaxonomyNode) => void;
  expandedNodes: Record<string, boolean>;
  toggleExpand: (id: string) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes[node.id];
  const isSelected = selectedNode?.id === node.id;

  return (
    <div>
      <div
        onClick={() => onSelect(node)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          paddingLeft: `${node.level * 18 + 12}px`,
          borderRadius: 5,
          cursor: 'pointer',
          background: isSelected ? '#edf3fb' : 'transparent',
          color: isSelected ? 'var(--blue)' : 'var(--ink)',
          fontWeight: isSelected ? 600 : 400,
          fontSize: 13,
          marginBottom: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', color: 'var(--muted)', fontSize: 11 }}
            >
              {isExpanded ? '▼' : '►'}
            </button>
          ) : (
            <span style={{ width: 10 }} />
          )}

          <span>{node.name}</span>
          <span className="mono" style={{ color: 'var(--muted)' }}>
            ({node.code})
          </span>
        </div>

        <Badge value={`${node.total_material_count || 0}`} />
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              selectedNode={selectedNode}
              onSelect={onSelect}
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ClassificationTreeViewer() {
  const [selectedNode, setSelectedNode] = useState<TaxonomyNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showNodeModal, setShowNodeModal] = useState(false);

  // Auto-classify tester state
  const [classifyText, setClassifyText] = useState('Centrifugal Pump 15HP SS304 16bar');
  const [classifyResult, setClassifyResult] = useState<any>(null);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const user = useUser();
  const action = useAction();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['taxonomy-tree'],
    queryFn: () => api<{ tree: TaxonomyNode[]; total_nodes: number }>('/taxonomy/tree'),
  });

  const classifyMutation = useMutation({
    mutationFn: (payload: any) => post('/taxonomy/classify', payload),
    onSuccess: (res) => {
      setClassifyResult(res);
    },
  });

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) return <Loading />;

  const tree = data?.tree || [];

  return (
    <>
      <PageHeading
        eyebrow="WORKSPACE"
        title="Classification tree & taxonomy"
        description="Browse and govern national material taxonomy nodes, canonical attribute schemas, and auto-classification rules."
      >
        {user.role === 'ADMIN' || user.role === 'DATA_STEWARD' ? (
          <Button onClick={() => setShowNodeModal(!showNodeModal)}>
            {showNodeModal ? 'Close form' : 'Add taxonomy node'}
          </Button>
        ) : null}
      </PageHeading>

      <Notice {...action} />
      <Notice error={error?.message} />

      {/* Add Node Form Panel */}
      {showNodeModal && (
        <section className="panel">
          <h2>Create taxonomy node</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await action.run(
                () =>
                  post('/taxonomy/nodes', {
                    code,
                    name,
                    parent_id: selectedNode?.id || null,
                    description,
                    attribute_schema: [],
                  }),
                'Taxonomy node created.'
              );
              if (r) {
                setShowNodeModal(false);
                setCode('');
                setName('');
                setDescription('');
                queryClient.invalidateQueries({ queryKey: ['taxonomy-tree'] });
              }
            }}
          >
            <div className="form-grid">
              <Field title="Parent category">
                <input
                  readOnly
                  value={selectedNode ? `${selectedNode.name} (${selectedNode.code})` : 'Root Level Node'}
                />
              </Field>
              <Field title="Node code">
                <input
                  required
                  placeholder="VALVE-BALL"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </Field>
              <Field title="Node name">
                <input
                  required
                  placeholder="Ball Valves"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
            </div>
            <Field title="Description">
              <textarea
                rows={2}
                placeholder="Category node description and spec scope..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <div className="button-row">
              <Button disabled={action.busy}>Create Node</Button>
              <Button type="button" variant="outline" onClick={() => setShowNodeModal(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* Main Grid: Tree Navigator vs Node Detail */}
      <div className="detail-grid">
        {/* Left Tree Navigator */}
        <section className="panel">
          <div className="section-heading">
            <h2>Taxonomy navigator ({data?.total_nodes || 0} Nodes)</h2>
            <p>Select a node to inspect its classification schema and material counts.</p>
          </div>

          <div className="filters" style={{ marginBottom: 15 }}>
            <div className="search-field">
              <input
                type="text"
                placeholder="Search category nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div style={{ maxHeight: 500, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 5, padding: 8 }}>
            {tree.map((node) => (
              <TreeNodeItem
                key={node.id}
                node={node}
                selectedNode={selectedNode}
                onSelect={setSelectedNode}
                expandedNodes={expandedNodes}
                toggleExpand={toggleExpand}
              />
            ))}
          </div>
        </section>

        {/* Right Node Details Panel */}
        <div>
          <section className="panel">
            <h2>Category node details</h2>
            {selectedNode ? (
              <div>
                <dl style={{ marginTop: 0 }}>
                  <dt>Node code</dt>
                  <dd className="mono">{selectedNode.code}</dd>

                  <dt>Node name</dt>
                  <dd>
                    <strong>{selectedNode.name}</strong>
                  </dd>

                  <dt>Taxonomy level</dt>
                  <dd>Level {selectedNode.level}</dd>

                  <dt>Material count</dt>
                  <dd>
                    <Badge value={`${selectedNode.total_material_count || 0} Materials`} />
                  </dd>

                  <dt>Description</dt>
                  <dd>{selectedNode.description || 'No detailed description.'}</dd>

                  <dt>Canonical attribute schema</dt>
                  <dd>
                    {selectedNode.attribute_schema && selectedNode.attribute_schema.length > 0 ? (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        {selectedNode.attribute_schema.map((attr, idx) => (
                          <Badge key={idx} value={`${attr.name} (${attr.type || 'string'})`} />
                        ))}
                      </div>
                    ) : (
                      <span className="muted">Standard category schema.</span>
                    )}
                  </dd>
                </dl>
              </div>
            ) : (
              <p className="muted">Click any node in the tree navigator on the left to view category metadata and spec rules.</p>
            )}
          </section>

          {/* Classification Sandbox Panel */}
          <section className="panel">
            <h2>AI material classifier sandbox</h2>
            <p className="muted">Test automatic classification of unstructured text descriptions into tree nodes.</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                classifyMutation.mutate({ text: classifyText });
              }}
            >
              <Field title="Material text description">
                <input
                  required
                  value={classifyText}
                  onChange={(e) => setClassifyText(e.target.value)}
                  placeholder="Enter description text..."
                />
              </Field>

              <div className="button-row">
                <Button disabled={classifyMutation.isPending}>
                  {classifyMutation.isPending ? 'Classifying…' : 'Classify Description'}
                </Button>
              </div>
            </form>

            {classifyResult && (
              <div className="source-normalized" style={{ marginTop: 15 }}>
                <div className="eyebrow">CLASSIFICATION RESULT</div>
                <div>
                  Detected Category: <strong>{classifyResult.category}</strong>
                </div>
                {classifyResult.taxonomy_node && (
                  <div style={{ marginTop: 4 }}>
                    Matched Node: <span className="mono">[{classifyResult.taxonomy_node.code}] {classifyResult.taxonomy_node.name}</span>
                  </div>
                )}
                <div style={{ marginTop: 4, fontSize: 12 }} className="muted">
                  Confidence score: {(classifyResult.confidence * 100).toFixed(0)}%
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
