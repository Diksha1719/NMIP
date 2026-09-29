'use client';
import { AlertCircle, CheckCircle2, Inbox } from 'lucide-react';
import { label } from '@/lib/utils';
export function Badge({ value }: { value: string }) { return <span className={`badge badge-${value.toLowerCase()}`}>{label(value)}</span>; }
export function Notice({ error, message }: { error?: string; message?: string }) { return error ? <div className="notice error" role="alert"><AlertCircle size={18}/>{error}</div> : message ? <div className="notice success" role="status"><CheckCircle2 size={18}/>{message}</div> : null; }
export function Empty({ title = 'No records yet', text = 'Records will appear here when the workflow produces them.' }: { title?: string; text?: string }) { return <div className="empty"><Inbox size={30}/><h3>{title}</h3><p>{text}</p></div>; }
export function Loading() { return <div className="loading" role="status">Loading workspace data…</div>; }
export function PageHeading({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: React.ReactNode }) { return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><div className="heading-actions">{children}</div></div>; }
export function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) { return <div className="table-scroll"><table><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>; }
export function Field({ title, children }: { title: string; children: React.ReactNode }) { return <label className="field"><span>{title}</span>{children}</label>; }
export const categories = ['Valves', 'Bearings', 'Pumps', 'Fasteners', 'Electrical'];
export const outcomes = ['IDENTITY_MATCH', 'POTENTIAL_SUBSTITUTE', 'DO_NOT_MERGE', 'INSUFFICIENT_INFORMATION'];
