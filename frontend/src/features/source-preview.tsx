'use client';
import { useState } from 'react';
import { api, put } from '@/services/api';
import { useAction } from '@/hooks/use-action';
import { Table, Field, Notice } from '@/components/shared';
import { Button } from '@/components/ui/button';
export function SourcePreview({ dataset, editable, onSaved }: { dataset: any; editable: boolean; onSaved: (data:any) => void }) {
  const [drafts,setDrafts]=useState<Record<number,Record<string,string>>>({}),[reason,setReason]=useState('');
  const action=useAction(),offset=dataset.offset||0;
  async function page(next:number){const result=await action.run(()=>api(`/datasets/${dataset.id}?offset=${next}`),'Source page loaded.');if(result){setDrafts({});onSaved(result);}}
  return <><Notice {...action}/><Table headers={[...dataset.columns,...(editable?['Correction']:[])]}>{dataset.preview.map((row:any,i:number)=><tr key={offset+i}>{dataset.columns.map((column:string)=><td key={column}>{editable&&column!=='page_number'?<input aria-label={`Row ${offset+i+2} ${column}`} value={drafts[i]?.[column]??String(row[column]??'')} onChange={e=>setDrafts({...drafts,[i]:{...drafts[i],[column]:e.target.value}})} style={{minWidth:150}}/>:String(row[column]??'')}</td>)}{editable&&<td><Button size="sm" variant="outline" disabled={action.busy||!drafts[i]||reason.trim().length<5} onClick={async()=>{const saved=await action.run(()=>put(`/datasets/${dataset.id}/rows`,{row_index:offset+i,values:drafts[i],reason}),'Source correction recorded. Revalidate before import.');if(saved){const detail=await api(`/datasets/${dataset.id}?offset=${offset}`);setDrafts({});onSaved(detail);}}}>Save row</Button></td>}</tr>)}</Table>{editable&&<Field title="Reason for source correction or manual document annotation"><input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Required before saving a corrected row (5+ characters)"/></Field>}<div className="button-row"><Button size="sm" variant="outline" disabled={!offset||action.busy} onClick={()=>page(Math.max(0,offset-10))}>Previous rows</Button><span className="muted small">Rows {offset+1}–{Math.min(offset+10,dataset.row_count)} of {dataset.row_count}</span><Button size="sm" variant="outline" disabled={offset+10>=dataset.row_count||action.busy} onClick={()=>page(offset+10)}>Next rows</Button></div></>;
}
