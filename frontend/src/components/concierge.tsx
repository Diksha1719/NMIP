'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, Check, ChevronRight, LoaderCircle, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { api, post, put } from '@/services/api';
import type { Material, User } from '@/types';

type Action = { label: string; href?: string; run?: () => Promise<void>; tone?: 'primary' | 'quiet' };
type Message = { id: number; role: 'assistant' | 'user'; text: string; actions?: Action[] };

const destinations = [
  { words: ['dashboard', 'overview', 'home'], label: 'Overview', href: '/dashboard' },
  { words: ['material explorer', 'materials', 'catalog'], label: 'Material explorer', href: '/materials' },
  { words: ['classification', 'taxonomy'], label: 'Classification tree', href: '/classification-tree' },
  { words: ['ingestion', 'upload', 'import'], label: 'Data ingestion', href: '/ingestion' },
  { words: ['validation', 'validate'], label: 'Validation', href: '/validation' },
  { words: ['normalization', 'normalize'], label: 'Normalization', href: '/normalization' },
  { words: ['harmonization', 'harmonize'], label: 'AI Harmonization', href: '/harmonization' },
  { words: ['extraction', 'extract'], label: 'Attribute extraction', href: '/extraction' },
  { words: ['enrichment', 'enrich'], label: 'Enrichment', href: '/enrichment' },
  { words: ['candidate'], label: 'Candidate center', href: '/candidates' },
  { words: ['review'], label: 'Review queue', href: '/review' },
  { words: ['identity', 'identities'], label: 'Common identities', href: '/common-identities' },
  { words: ['duplicate'], label: 'Duplicate prevention', href: '/duplicate-prevention' },
  { words: ['do not merge', 'conflict'], label: 'Do Not Merge engine', href: '/do-not-merge' },
  { words: ['analytics', 'report'], label: 'Analytics', href: '/analytics' },
  { words: ['proof', 'benchmark'], label: 'Proof Board', href: '/proof-board' },
  { words: ['audit', 'history'], label: 'Audit & versioning', href: '/audit' },
  { words: ['engineering rule', 'rules'], label: 'Engineering rules', href: '/rules' },
  { words: ['users', 'access'], label: 'Users & access', href: '/users' },
  { words: ['settings', 'dictionary'], label: 'Settings', href: '/settings' },
] as const;

const examples = ['Find material MAT-10060', 'Open the review queue', 'Show catalog summary'];

export function Concierge({ user }: { user: User }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const nextId = useRef(2);
  const endRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([{ id: 1, role: 'assistant', text: `Hi ${user.name.split(' ·')[0].split(' ')[0]}. I can find materials, open any workspace, and carry out supported catalog tasks using your ${user.role.replaceAll('_', ' ').toLowerCase()} permissions.` }]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy, open]);
  function say(text: string, actions?: Action[]) { setMessages(value => [...value, { id: nextId.current++, role: 'assistant', text, actions }]); }
  function navigate(href: string, label: string) { say(`Opening ${label}.`); router.push(href); }

  async function findMaterials(query: string) {
    const results = await api<Material[]>(`/materials?q=${encodeURIComponent(query)}`);
    if (!results.length) return say(`I couldn't find a material matching “${query}”. Try a source code, description, grade, or standard.`);
    const shown = results.slice(0, 5);
    say(results.length === 1 ? `I found ${shown[0].legacy_material_code}: ${shown[0].original_description}` : `I found ${results.length} matches. Here are the first five catalog records.`, shown.map(material => ({ label: `${material.legacy_material_code} · ${material.organization}`, href: `/materials/${material.id}` })));
  }

  async function resolveMaterial(code: string) {
    const matches = await api<Material[]>(`/materials?q=${encodeURIComponent(code)}`);
    return matches.find(item => item.legacy_material_code.toLowerCase() === code.toLowerCase()) || matches[0];
  }

  async function offerDescriptionUpdate(code: string, description: string) {
    const material = await resolveMaterial(code);
    if (!material) return say(`I couldn't find material “${code}”.`);
    if (!['ADMIN', 'DATA_STEWARD'].includes(user.role)) return say(`Your role can inspect this record, but source corrections require Data Steward or Admin access.`, [{ label: `Open ${material.legacy_material_code}`, href: `/materials/${material.id}` }]);
    const execute = async () => {
      setBusy(true);
      try {
        await put(`/materials/${material.id}`, { original_description: description, reason: 'Requested through NMIP Concierge' });
        say(`Done. I updated ${material.legacy_material_code} and verified that the API accepted the change.`, [{ label: 'View updated material', href: `/materials/${material.id}` }, { label: 'View audit trail', href: '/audit', tone: 'quiet' }]);
      } catch (error) { say(error instanceof Error ? error.message : 'The update could not be completed.'); }
      finally { setBusy(false); }
    };
    say(`Ready to update ${material.legacy_material_code}.\n\nCurrent: ${material.original_description}\nNew: ${description}\n\nThis will reprocess the record and create an audit entry.`, [{ label: 'Confirm update', run: execute }, { label: 'Open record first', href: `/materials/${material.id}`, tone: 'quiet' }]);
  }

  async function offerProcessing(code: string, action: 'normalize' | 'extract') {
    const material = await resolveMaterial(code);
    if (!material) return say(`I couldn't find material “${code}”.`);
    if (!['ADMIN', 'DATA_STEWARD'].includes(user.role)) return say('This action requires Data Steward or Admin access.', [{ label: `Inspect ${material.legacy_material_code}`, href: `/materials/${material.id}` }]);
    const execute = async () => {
      setBusy(true);
      try {
        await post(`/materials/${material.id}/${action}`);
        say(`${material.legacy_material_code} was ${action === 'normalize' ? 'normalized' : 'processed for attribute extraction'}.`, [{ label: 'Inspect result', href: `/materials/${material.id}` }]);
      } catch (error) { say(error instanceof Error ? error.message : 'The task could not be completed.'); }
      finally { setBusy(false); }
    };
    say(`I can ${action} ${material.legacy_material_code}. This changes the record and will be audited.`, [{ label: `Confirm ${action}`, run: execute }, { label: 'Inspect record', href: `/materials/${material.id}`, tone: 'quiet' }]);
  }

  async function handleRequest(raw: string) {
    const text = raw.trim(), lower = text.toLowerCase();
    const update = text.match(/(?:update|change|correct)\s+(?:material\s+)?([\w./-]+)(?:'s)?\s+(?:description|name)\s+(?:to|as)\s+[“\"]?(.+?)[”\"]?$/i);
    if (update) return offerDescriptionUpdate(update[1], update[2]);
    const process = text.match(/\b(normalize|extract)\s+(?:attributes?\s+(?:for|from)\s+)?(?:material\s+)?([\w./-]+)/i);
    if (process) return offerProcessing(process[2], process[1].toLowerCase() as 'normalize' | 'extract');
    const find = text.match(/(?:find|search(?: for)?|look up|open material|show material)\s+(.+)/i);
    if (find) return findMaterials(find[1].replace(/^material\s+/i, '').trim());
    if (/(summary|how many|catalog status)/i.test(text)) {
      const materials = await api<Material[]>('/materials');
      const verified = materials.filter(item => ['VERIFIED', 'PUBLISHED'].includes(item.status)).length;
      const unmapped = materials.filter(item => !item.common_identity_id).length;
      return say(`The catalog contains ${materials.length} materials. ${verified} are verified or published, and ${unmapped} are not yet mapped to a common identity.`, [{ label: 'Open analytics', href: '/analytics' }, { label: 'Browse materials', href: '/materials', tone: 'quiet' }]);
    }
    const destination = destinations.find(item => item.words.some(word => lower.includes(word)));
    if (destination && /\b(open|go|take|navigate|show|view)\b/i.test(text)) return navigate(destination.href, destination.label);
    if (/\b(help|what can you do|capabilities)\b/i.test(text)) return say('I can navigate the workspace, find materials, summarize the catalog, update source descriptions, and run normalization or extraction. I preview record-changing actions before executing them.');
    say('Try asking me to find a material, open a workspace, summarize the catalog, update a material description, normalize a material, or extract its attributes.', destinations.filter(item => item.words.some(word => lower.includes(word))).slice(0, 2).map(item => ({ label: `Open ${item.label}`, href: item.href })));
  }

  async function submit(value = input) {
    if (!value.trim() || busy) return;
    setMessages(items => [...items, { id: nextId.current++, role: 'user', text: value.trim() }]); setInput(''); setBusy(true);
    try { await handleRequest(value); } catch (error) { say(error instanceof Error ? error.message : 'I could not complete that request.'); } finally { setBusy(false); }
  }
  async function runAction(action: Action) { if (action.href) { setOpen(false); router.push(action.href); return; } await action.run?.(); }

  return <div className="concierge-root">
    {open && <section className="concierge-panel" aria-label="NMIP Concierge" aria-live="polite">
      <header className="concierge-header"><div className="concierge-mark"><Sparkles size={18}/></div><div><strong>NMIP Concierge</strong><span><i/> Ready to assist</span></div><button className="concierge-close" onClick={() => setOpen(false)} aria-label="Close concierge"><X size={19}/></button></header>
      <div className="concierge-context"><Bot size={14}/> Working with your {user.role.replaceAll('_', ' ').toLowerCase()} access</div>
      <div className="concierge-messages">{messages.map(message => <div key={message.id} className={`concierge-message ${message.role}`}><div className="concierge-bubble">{message.text.split('\n').map((line, index) => <span key={index}>{line || <br/>}</span>)}</div>{message.actions?.length ? <div className="concierge-actions">{message.actions.map((action, index) => <button key={`${action.label}-${index}`} className={action.tone === 'quiet' ? 'concierge-action quiet' : 'concierge-action'} onClick={() => runAction(action)} disabled={busy}>{action.run && <Check size={14}/>} {action.label}<ChevronRight size={14}/></button>)}</div> : null}</div>)}{busy && <div className="concierge-thinking"><LoaderCircle size={15}/> Working on your request…</div>}<div ref={endRef}/></div>
      {messages.length === 1 && <div className="concierge-suggestions">{examples.map(example => <button key={example} onClick={() => submit(example)}>{example}</button>)}</div>}
      <form className="concierge-composer" onSubmit={(event: FormEvent) => { event.preventDefault(); submit(); }}><textarea value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(); } }} placeholder="Ask me to find, navigate, or update…" rows={1} aria-label="Message NMIP Concierge"/><button type="submit" disabled={!input.trim() || busy} aria-label="Send message"><Send size={17}/></button></form>
      <footer className="concierge-footer">Actions follow your permissions and appear in the audit trail.</footer>
    </section>}
    <button className={`concierge-launcher ${open ? 'open' : ''}`} onClick={() => setOpen(value => !value)} aria-label={open ? 'Close NMIP Concierge' : 'Open NMIP Concierge'} aria-expanded={open}>{open ? <X size={23}/> : <><MessageCircle size={23}/><span>Ask NMIP</span></>}</button>
  </div>;
}
