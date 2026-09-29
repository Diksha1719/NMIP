import { notFound } from 'next/navigation';
import { Dashboard } from '@/features/dashboard';
import { Materials, MaterialDetail } from '@/features/materials';
import { Ingestion, PipelineStage } from '@/features/ingestion';
import { Candidates, CandidateDetail } from '@/features/candidates';
import { Identities, DuplicatePrevention, Audit, ProofBoard } from '@/features/governance';
import { Rules, Users, Settings } from '@/features/admin';
import { HarmonizationStudio } from '@/features/harmonization';
import { DoNotMergeEngine } from '@/features/do-not-merge';
import { ClassificationTreeViewer } from '@/features/classification-tree';

export default async function WorkspacePage({params}:{params:Promise<{route:string[]}>}){
  const{route}=await params;const[page,id]=route;
  if(route.length>2)notFound();
  if(id&&!['materials','candidates','common-identities'].includes(page))notFound();
  switch(page){
    case 'dashboard':return <Dashboard/>;
    case 'analytics':return <Dashboard analytics/>;
    case 'materials':return id?<MaterialDetail id={id}/>:<Materials/>;
    case 'ingestion':return <Ingestion/>;
    case 'validation':return <Ingestion validationOnly/>;
    case 'normalization':case 'extraction':case 'enrichment':return <PipelineStage stage={page}/>;
    case 'harmonization':return <HarmonizationStudio/>;
    case 'do-not-merge':return <DoNotMergeEngine/>;
    case 'classification-tree':return <ClassificationTreeViewer/>;
    case 'candidates':return id?<CandidateDetail id={id}/>:<Candidates/>;
    case 'review':return <Candidates reviewOnly/>;
    case 'common-identities':return <Identities id={id}/>;
    case 'duplicate-prevention':return <DuplicatePrevention/>;
    case 'audit':return <Audit/>;
    case 'proof-board':return <ProofBoard/>;
    case 'rules':return <Rules/>;
    case 'users':return <Users/>;
    case 'settings':return <Settings/>;
    default:notFound();
  }
}

