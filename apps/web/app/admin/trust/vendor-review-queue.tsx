'use client';
import { useEffect, useState } from 'react';
import { ensureSession, request } from '../../lib/onboarding-api';

type Submission={id:string;name:string;slug:string;status:string;submittedAt:string|null;baseCity:{name:string}|null;categories:{category:{name:string}}[]};
export default function VendorReviewQueue(){
 const [items,setItems]=useState<Submission[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState('');
 useEffect(()=>{void ensureSession().then(()=>request<Submission[]>('/admin/vendor-submissions')).then(setItems).catch(e=>setError(e instanceof Error?e.message:'Unable to load submissions'));},[]);
 async function decide(id:string,decision:'APPROVED'|'REJECTED'|'CHANGES_REQUESTED'){const reason=decision==='APPROVED'?null:window.prompt('Reason for this decision:');if(decision!=='APPROVED'&&!reason)return;setBusy(id);try{await request('/admin/vendor-submissions/'+id+'/decision','POST',{decision,reason});setItems(items.filter(x=>x.id!==id));}catch(e){setError(e instanceof Error?e.message:'Decision failed');}finally{setBusy('');}}
 return <section className="admin-vendor-queue"><h2>Vendor registrations awaiting review</h2><p>Review submitted profiles before they become visible to couples.</p>{error&&<p role="alert">{error}</p>}{items.length?items.map(item=><article key={item.id}><div><strong>{item.name}</strong><span>{item.baseCity?.name??'No base city'} · {item.categories[0]?.category.name??'No category'}</span><small>{item.submittedAt?new Date(item.submittedAt).toLocaleString('en-IN'):'Submitted'}</small></div><div><button disabled={busy===item.id} onClick={()=>void decide(item.id,'CHANGES_REQUESTED')}>Request changes</button><button disabled={busy===item.id} onClick={()=>void decide(item.id,'REJECTED')}>Reject</button><button className="approve" disabled={busy===item.id} onClick={()=>void decide(item.id,'APPROVED')}>Approve</button></div></article>):<div className="review-empty"><h3>No vendor submissions awaiting review</h3><p>New submissions will appear here automatically.</p></div>}</section>;
}
