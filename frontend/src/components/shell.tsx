'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Boxes, Upload, ListChecks, WandSparkles, ScanLine, GitCompareArrows, ClipboardCheck, Fingerprint, ShieldCheck, ChartNoAxesCombined, FlaskConical, History, SlidersHorizontal, Users, Settings, LogOut, ChevronRight, Menu, Network, BookOpen, FolderTree, ShieldAlert, Wand2 } from 'lucide-react';
import { api, post } from '@/services/api';
import type { User } from '@/types';
import { Loading } from './shared';
import { label } from '@/lib/utils';
import { Concierge } from './concierge';
const UserContext = createContext<User|null>(null);
export function useUser() { return useContext(UserContext)!; }
const groups = [
  { title: 'WORKSPACE', links: [['/dashboard','Overview',LayoutDashboard],['/materials','Material explorer',Boxes],['/classification-tree','Classification tree',FolderTree]] },
  { title: 'INTELLIGENCE PIPELINE', links: [['/ingestion','Data ingestion',Upload],['/validation','Validation',ListChecks],['/normalization','Normalization',WandSparkles],['/harmonization','AI Harmonization',Wand2],['/extraction','Attribute extraction',ScanLine],['/enrichment','Enrichment',BookOpen],['/candidates','Candidate center',GitCompareArrows],['/review','Review queue',ClipboardCheck]] },
  { title: 'MATERIAL GOVERNANCE', links: [['/common-identities','Common identities',Fingerprint],['/duplicate-prevention','Duplicate prevention',ShieldCheck],['/do-not-merge','Do Not Merge engine',ShieldAlert],['/analytics','Analytics & reports',ChartNoAxesCombined],['/proof-board','Proof Board',FlaskConical],['/audit','Audit & versioning',History]] },
  { title: 'ADMINISTRATION', links: [['/rules','Engineering rules',SlidersHorizontal],['/users','Users & access',Users],['/settings','Settings',Settings]] }
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname(), router = useRouter(); const [mobile, setMobile] = useState(false);
  const { data: user, isPending, error } = useQuery({ queryKey: ['me'], queryFn: () => api<User>('/auth/me') });
  useEffect(() => { if (error) router.replace('/login'); }, [error, router]);
  if (isPending || !user) return <Loading/>;
  const title = groups.flatMap(g => [...g.links]).find(l => path.startsWith(l[0]))?.[1] || 'Workspace';
  return <UserContext.Provider value={user}><div className="app-layout"><aside className={`sidebar ${mobile ? 'open' : ''}`}><Link href="/dashboard" className="brand"><div className="brand-icon"><Network size={25}/></div><div><strong>NMIP<span>●</span></strong><small>NATIONAL MATERIAL INTELLIGENCE</small></div></Link><div className="workspace-label"><span className="workspace-icon">IN</span><div>National workspace<small>Multi-organization catalog</small></div></div><nav>{groups.map(g => <div className="nav-group" key={g.title}><div className="nav-label">{g.title}</div>{g.links.filter(l => l[0] !== '/users' || user.role === 'ADMIN').map(([href, name, Icon]) => <Link key={href} href={href} className={path.startsWith(href) ? 'nav-item active' : 'nav-item'} onClick={() => setMobile(false)}><Icon size={17}/>{name}{path.startsWith(href) && <span className="active-marker"/>}</Link>)}</div>)}</nav><div className="sidebar-footer"><ShieldCheck size={18}/><div>Engineering first.<small>No blind merges.</small></div></div></aside><div className="main-column"><header className="topbar"><div className="breadcrumbs"><button className="mobile-toggle" aria-label="Toggle navigation" onClick={() => setMobile(!mobile)}><Menu/></button><span>Workspace</span><ChevronRight size={14}/><strong>{title}</strong></div><div className="topbar-right"><span className="demo-label">SYNTHETIC DEMO</span><div className="user-avatar">{user.name.slice(0,1)}</div><div className="user-info"><strong>{user.name.split(' ·')[0]}</strong><small>{label(user.role)}</small></div><button title="Sign out" aria-label="Sign out" className="icon-button" onClick={async () => { await post('/auth/logout'); window.location.href='/login'; }}><LogOut size={17}/></button></div></header><main><div key={path} className="page-transition">{children}</div></main><footer className="main-footer"><span>NMIP · National Material Intelligence Platform</span><span>Different Codes. Verified Identities. No Blind Merges.</span></footer></div><Concierge user={user}/></div></UserContext.Provider>;
}
