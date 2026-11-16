import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'campus-workflow-'));
process.env.LOCAL_DATA_DIR=temporary;
process.env.APP_SECRET=crypto.randomBytes(40).toString('hex');
delete process.env.DATABASE_URL;
const {handle}=await import('../lib/service.mjs');
const {query,database}=await import('../lib/db.mjs');
const {matchReports}=await import('../lib/matching.mjs');
const origin='http://localhost:3100';
async function request(url,{cookie='',method='GET',body,originHeader=origin}={}){
 const response=await handle(new Request(origin+'/api/'+url,{method,headers:{Origin:originHeader,Cookie:cookie,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}),url.split('?')[0].split('/'));
 const type=response.headers.get('content-type')||'';
 const data=type.includes('json')?await response.json():await response.arrayBuffer();
 return {status:response.status,data,cookie:response.headers.get('set-cookie')?.split(';')[0],headers:response.headers};
}
async function register(email){const r=await request('auth/register',{method:'POST',body:{email,password:'a-long-test-password!',name:email.split('@')[0],department:'Test Department',campus_id:'TEST-'+email.split('@')[0],role:'staff'}});assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data.user.role,'member');return {id:r.data.user.id,cookie:r.cookie};}
const occurrence=new Date(Date.now()-86400000).toISOString();
const report=(type,category='Bottles & tiffins')=>({type,category,title:'Green steel bottle',description:'Green bottle misplaced near the library entrance.',location:'Library entrance',occurred_at:occurrence,answer1:'Two initials on underside',answer2:'Small dent under the handle',serial:'SECRET-UNIQUE-2048'});
let finder,owner,stranger,staff;
test('private claims, custody and confirmed returns',async t=>{
 finder=await register('finder@example.test');owner=await register('owner@example.test');stranger=await register('stranger@example.test');staff=await register('reception@example.test');
 await query(`UPDATE users SET role='staff' WHERE id=$1`,[staff.id]);
 let found,lost,cid;
 await t.test('authentication is server checked and cross-origin writes fail',async()=>{
  assert.equal((await request('reports',{method:'POST',body:report('found')})).status,401);
  assert.equal((await request('reports',{method:'POST',cookie:finder.cookie,originHeader:'https://attacker.invalid',body:report('found')})).status,403);
  assert.equal((await request('auth/login',{method:'POST',body:{email:'finder@example.test',password:'wrong'}})).status,401);
  assert.equal((await request('auth/login',{method:'POST',body:{email:'unknown@example.test',password:'wrong'}})).status,401);
 });
 await t.test('reports persist and matching generates private notifications',async()=>{
  let r=await request('reports',{method:'POST',cookie:owner.cookie,body:report('lost')});assert.equal(r.status,201,JSON.stringify(r.data));lost=r.data.id;
  r=await request('reports',{method:'POST',cookie:finder.cookie,body:report('found')});assert.equal(r.status,201,JSON.stringify(r.data));found=r.data.id;assert.equal(r.data.matches,1);
  const list=await request('reports');assert.equal(list.data.total,2);assert.ok(!JSON.stringify(list.data).includes('SECRET-UNIQUE'));
  const publicItem=await request('reports/'+found);assert.ok(!publicItem.data.report.private_details);
  const privateItem=await request('reports/'+found,{cookie:finder.cookie});assert.ok(privateItem.data.report.private_details.serial);
  const notifications=await request('notifications',{cookie:owner.cookie});assert.ok(notifications.data.notifications.some(n=>n.title==='A possible match'));
  const filtered=await request('reports?type=found&q=steel');assert.equal(filtered.data.total,1);
 });
 await t.test('validated image evidence stays private and encrypted',async()=>{
  const png=await sharp({create:{width:3,height:3,channels:3,background:'#abcdab'}}).png().toBuffer();
  const claim=await request('claims',{method:'POST',cookie:owner.cookie,body:{report_id:found,lost_report_id:lost,serial:'secret unique 2048',answer1:'Two initials on underside',explanation:'I lost this bottle at the library and can describe the underside.',image:'data:image/png;base64,'+png.toString('base64')}});
  assert.equal(claim.status,201,JSON.stringify(claim.data));cid=claim.data.id;
  assert.equal((await request('claims/'+cid,{cookie:stranger.cookie})).status,403);
  const detail=await request('claims/'+cid,{cookie:owner.cookie});assert.equal(detail.status,200);assert.equal(detail.data.private_details,null);assert.equal(detail.data.serial_match,null);
  const review=await request('claims/'+cid,{cookie:finder.cookie});assert.equal(review.data.serial_match,true);
  const evidenceId=detail.data.claim.evidence_id;
  assert.equal((await request('files/'+evidenceId)).status,401);assert.equal((await request('files/'+evidenceId,{cookie:stranger.cookie})).status,403);
  assert.equal((await request('files/'+evidenceId,{cookie:finder.cookie})).status,200);
  const [dbClaim]=await query(`SELECT secret FROM claims WHERE id=$1`,[cid]);assert.ok(!dbClaim.secret.includes('library'));
  const bad=await request('reports',{method:'POST',cookie:finder.cookie,body:{...report('found'),image:'data:image/png;base64,YmFk'}});assert.equal(bad.status,400);
 });
 await t.test('private messaging cannot be accessed by an unrelated account',async()=>{
  const m=await request(`claims/${cid}/messages`,{method:'POST',cookie:owner.cookie,body:{message:'I am available after class.'}});assert.equal(m.status,201);
  assert.equal((await request(`claims/${cid}/messages`,{method:'POST',cookie:stranger.cookie,body:{message:'Let me in'}})).status,403);
 });
 await t.test('approval is separate from handover and confirmed receipt',async()=>{
  const decision={action:'approve',verification_method:'private_details',identity_checked:true,evidence_checked:true,checks:'Compared the private underside marking and checked campus identity.',note:'Meet at the agreed collection point.'};
  assert.equal((await request(`claims/${cid}/action`,{method:'POST',cookie:owner.cookie,body:decision})).status,403);
  assert.equal((await request(`claims/${cid}/action`,{method:'POST',cookie:finder.cookie,body:{...decision,identity_checked:false}})).status,400);
  assert.equal((await request(`claims/${cid}/action`,{method:'POST',cookie:finder.cookie,body:decision})).status,200);
  let detail=(await request('claims/'+cid,{cookie:owner.cookie})).data;assert.equal(detail.claim.status,'approved');assert.equal(detail.report.status,'reserved');assert.ok(detail.claim.collection_code);
  assert.equal((await request(`claims/${cid}/action`,{method:'POST',cookie:owner.cookie,body:{action:'receipt'}})).status,403);
  assert.equal((await request(`claims/${cid}/action`,{method:'POST',cookie:finder.cookie,body:{action:'handover',code:'WRONG',identity_checked:true,identity_method:'Campus ID checked',collection_place:'Reception'}})).status,400);
  assert.equal((await request(`claims/${cid}/action`,{method:'POST',cookie:finder.cookie,body:{action:'handover',code:detail.claim.collection_code,identity_checked:true,identity_method:'Campus ID checked',collection_place:'Reception'}})).status,200);
  assert.equal((await request('reports/'+found)).data.report.status,'reserved');
  assert.equal((await request(`claims/${cid}/action`,{method:'POST',cookie:finder.cookie,body:{action:'receipt'}})).status,403);
  assert.equal((await request(`claims/${cid}/action`,{method:'POST',cookie:owner.cookie,body:{action:'receipt'}})).status,200);
  assert.equal((await request('reports')).data.total,0);
  assert.equal((await request('reports/'+found)).status,200); const resolved=(await request('reports?status=returned')).data; assert.equal(resolved.total,1); assert.equal(resolved.reports[0].recipient_name,null);
  assert.equal((await request(`claims/${cid}/action`,{method:'POST',cookie:owner.cookie,body:{action:'receipt'}})).status,403);
 });
 await t.test('collection photos need no separate consent checkbox and remain private after return',async()=>{
  const created=await request('reports',{method:'POST',cookie:finder.cookie,body:{...report('found'),title:'Private collection photo fixture'}});const rid=created.data.id;
  const claim=await request('claims',{method:'POST',cookie:owner.cookie,body:{report_id:rid,explanation:'My bottle has a hidden mark under the base.'}});const claimId=claim.data.id;
  const approval={action:'approve',verification_method:'private_details',identity_checked:true,evidence_checked:true,checks:'Checked hidden markings and college identity in person.'};
  assert.equal((await request(`claims/${claimId}/action`,{method:'POST',cookie:finder.cookie,body:approval})).status,200);
  const collectionCode=(await request('claims/'+claimId,{cookie:owner.cookie})).data.claim.collection_code;
  const image='data:image/png;base64,'+(await sharp({create:{width:3,height:3,channels:3,background:'#ddefaa'}}).png().toBuffer()).toString('base64');
  const body={action:'handover',identity_checked:true,code:collectionCode,identity_method:'College ID checked',collection_place:'Main reception',handover_image:image};
  assert.equal((await request(`claims/${claimId}/action`,{method:'POST',cookie:finder.cookie,body})).status,200);
  const detail=(await request('claims/'+claimId,{cookie:owner.cookie})).data;assert.equal(detail.claim.collector_record.name,'owner');assert.equal(detail.claim.collector_record.photo_attached,true);assert.ok(!('photo_consent' in detail.claim.collector_record));
  const photo=detail.claim.handover_photo_id;assert.ok(photo);
  assert.equal((await request('files/'+photo)).status,401);assert.equal((await request('files/'+photo,{cookie:stranger.cookie})).status,403);
  assert.equal((await request(`claims/${claimId}/action`,{method:'POST',cookie:owner.cookie,body:{action:'receipt',public_name_consent:true}})).status,200);
  const publicItem=(await request('reports/'+rid)).data.report;assert.equal(publicItem.recipient_name,'owner');assert.ok(!('collector_record' in publicItem));assert.ok(!('handover_photo_id' in publicItem));
  assert.equal((await request('files/'+photo,{cookie:owner.cookie})).status,200);
 });
 await t.test('finder can reopen a declined mouse claim and document an alternative ownership check',async()=>{
  const created=await request('reports',{method:'POST',cookie:finder.cookie,body:{...report('found','Electronics'),title:'Ordinary wireless mouse',answer1:'Scratch in bottom',answer2:'No further details',serial:''}});const rid=created.data.id;
  const claim=await request('claims',{method:'POST',cookie:owner.cookie,body:{report_id:rid,answer1:'Letter A below the mouse',explanation:'I have the original receiver and can demonstrate it operating the mouse.'}});const claimId=claim.data.id;
  const approval={action:'approve',verification_method:'device_check',identity_checked:true,evidence_checked:true,checks:'Observed the original receiver operating this mouse and inspected the hidden A mark.'};
  assert.equal((await request(`claims/${claimId}/action`,{method:'POST',cookie:finder.cookie,body:approval})).status,403);
  await request(`claims/${claimId}/action`,{method:'POST',cookie:finder.cookie,body:{action:'reject',note:'Need to inspect the original receiver in person.'}});
  const reopening={action:'reopen',note:'Claimant offered an original receiver demonstration and a hidden mark.'};
  const reviewRequest={action:'request_review',note:'I can demonstrate the original dongle operating this mouse and show the hidden A mark.'};
  assert.equal((await request(`claims/${claimId}/action`,{method:'POST',cookie:finder.cookie,body:reviewRequest})).status,403);
  assert.equal((await request(`claims/${claimId}/action`,{method:'POST',cookie:owner.cookie,body:reviewRequest})).status,200);
  const requested=(await request('claims/'+claimId,{cookie:finder.cookie})).data;assert.equal(requested.claim.status,'rejected');assert.ok(requested.messages.some(m=>m.body.includes('original dongle')));
  assert.equal((await request(`claims/${claimId}/action`,{method:'POST',cookie:owner.cookie,body:reopening})).status,403);
  assert.equal((await request(`claims/${claimId}/action`,{method:'POST',cookie:finder.cookie,body:reopening})).status,200);
  const classification={action:'routine_accessory',accessory_type:'Mouse',routine_confirmed:true,reason:'An ordinary low-value computer mouse; no sensitive data or valuable device is involved.'};
  assert.equal((await request(`reports/${rid}/action`,{method:'POST',cookie:owner.cookie,body:classification})).status,403);
  assert.equal((await request(`reports/${rid}/action`,{method:'POST',cookie:finder.cookie,body:{...classification,accessory_type:'Laptop'}})).status,400);
  assert.equal((await request(`reports/${rid}/action`,{method:'POST',cookie:finder.cookie,body:classification})).status,200);
  let detail=(await request('claims/'+claimId,{cookie:finder.cookie})).data;assert.equal(detail.report.category,'Computer accessories');assert.equal(detail.claim.status,'pending');assert.equal(detail.report.sensitive,false);
  assert.equal((await request(`claims/${claimId}/action`,{method:'POST',cookie:finder.cookie,body:approval})).status,200);
  const code=(await request('claims/'+claimId,{cookie:owner.cookie})).data.claim.collection_code;
  const collection={action:'handover',code,identity_checked:true,identity_method:'College ID checked in person',collection_place:'Lab reception',recipient_name:'Owner Student',department:'Computer Science',campus_id:'CSE-2048'};
  assert.equal((await request(`claims/${claimId}/action`,{method:'POST',cookie:finder.cookie,body:collection})).status,200);
  detail=(await request('claims/'+claimId,{cookie:finder.cookie})).data;assert.equal(detail.claim.collector_record.name,'Owner Student');assert.equal(detail.claim.collector_record.campus_id,'CSE-2048');assert.ok(detail.logs.some(l=>l.action==='Declined claim reopened'));
  assert.equal((await request(`claims/${claimId}/action`,{method:'POST',cookie:owner.cookie,body:{action:'receipt'}})).status,200);
 });
 await t.test('mismatched serials require a documented independent staff check',async()=>{
  const created=await request('reports',{method:'POST',cookie:finder.cookie,body:{...report('found','Electronics'),title:'Headphones with serial conflict'}});const rid=created.data.id;
  const claim=await request('claims',{method:'POST',cookie:owner.cookie,body:{report_id:rid,serial:'DIFFERENT-991',explanation:'I think these are mine but I may have read the wrong serial.'}});const claimId=claim.data.id;
  const body={action:'approve',verification_method:'device_check',identity_checked:true,evidence_checked:true,checks:'Examined the prior device association and unique private physical marks.'};
  assert.equal((await request(`claims/${claimId}/action`,{method:'POST',cookie:staff.cookie,body})).status,400);
  assert.equal((await request(`claims/${claimId}/action`,{method:'POST',cookie:staff.cookie,body:{...body,verification_method:'unique_identifier',discrepancy_resolved:true,discrepancy_note:'I checked another association in front of the claimant.'}})).status,400);
  assert.equal((await request(`claims/${claimId}/action`,{method:'POST',cookie:staff.cookie,body:{...body,discrepancy_resolved:true,discrepancy_note:'Claimant supplied a packaging code first. We checked a prior account association and a distinctive repair in person.'}})).status,200);
  assert.equal((await request(`claims/${claimId}/assist`,{method:'POST',cookie:owner.cookie,body:{}})).status,403);
 });
 await t.test('walk-in returns require staff checks and publish no private identity details',async()=>{
  const created=await request('reports',{method:'POST',cookie:finder.cookie,body:{...report('found'),title:'Walk-in test bottle'}});const rid=created.data.id;
  const body={recipient_name:'Walk-in Tester',department:'Engineering',campus_id:'TEST-CAMPUS-2',identity_method:'College ID checked in person',collection_place:'Reception',checks:'Compared an unpublished mark and a distinctive repair with the claimant’s independent description.',identity_checked:true,recipient_acknowledged:true,public_name_consent:true};
  assert.equal((await request(`reports/${rid}/walk-in`,{method:'POST',cookie:finder.cookie,body})).status,403);
  const recorded=await request(`reports/${rid}/walk-in`,{method:'POST',cookie:staff.cookie,body});assert.equal(recorded.status,201,JSON.stringify(recorded.data));
  const detail=(await request('claims/'+recorded.data.id,{cookie:staff.cookie})).data;assert.equal(detail.claim.verification_method,'walk_in');assert.equal(detail.claim.collector_record.campus_id,'TEST-CAMPUS-2');
  const item=(await request('reports/'+rid)).data.report;assert.equal(item.recipient_name,'Walk-in Tester');assert.equal(item.return_method,'walk_in');assert.ok(!JSON.stringify(item).includes('TEST-CAMPUS-2'));
  assert.equal((await request(`reports/${rid}/walk-in`,{method:'POST',cookie:staff.cookie,body})).status,409);
 });
 await t.test('walk-in collection cannot bypass an existing claim',async()=>{
  const created=await request('reports',{method:'POST',cookie:finder.cookie,body:{...report('found'),title:'Already claimed bottle'}});const rid=created.data.id;
  await request('claims',{method:'POST',cookie:owner.cookie,body:{report_id:rid,explanation:'I submitted an independent claim before someone walked in.'}});
  const body={recipient_name:'Another Tester',department:'Engineering',campus_id:'TEST-3',identity_method:'College ID checked in person',collection_place:'Reception',checks:'A staff member must not release an item with an existing unresolved claim.',identity_checked:true,recipient_acknowledged:true};
  assert.equal((await request(`reports/${rid}/walk-in`,{method:'POST',cookie:staff.cookie,body})).status,409);
 });
 await t.test('reception accepts physical custody and sensitive keys require staff',async()=>{
  const key=await request('reports',{method:'POST',cookie:finder.cookie,body:{...report('found','Keys'),title:'Vehicle keys',custody:'request'}});assert.equal(key.status,201);const rid=key.data.id;
  assert.equal((await request('reports/'+rid)).data.report.custody,'request');
  assert.equal((await request(`reports/${rid}/action`,{method:'POST',cookie:finder.cookie,body:{action:'receive',storage:'B14'}})).status,403);
  assert.equal((await request(`reports/${rid}/action`,{method:'POST',cookie:staff.cookie,body:{action:'receive',storage:'B14'}})).status,200);
  assert.equal((await request('reports/'+rid)).data.report.custody,'reception');
  const claim=await request('claims',{method:'POST',cookie:owner.cookie,body:{report_id:rid,explanation:'I can show authorization and demonstrate the matching vehicle.'}});const keyClaim=claim.data.id;
  const decision={action:'approve',verification_method:'private_details',identity_checked:true,evidence_checked:true,checks:'Guard checked vehicle registration, authorization and college identity.'};
  assert.equal((await request(`claims/${keyClaim}/action`,{method:'POST',cookie:finder.cookie,body:decision})).status,403);
  assert.equal((await request(`claims/${keyClaim}/action`,{method:'POST',cookie:staff.cookie,body:decision})).status,200);
 });
 await t.test('competing claims invalidate approval and prevent automatic collection',async()=>{
  const r=await request('reports',{method:'POST',cookie:finder.cookie,body:{...report('found'),title:'A second green bottle'}});const rid=r.data.id;
  const a=await request('claims',{method:'POST',cookie:owner.cookie,body:{report_id:rid,explanation:'This is my second bottle, with a mark under the base.'}});
  await request(`claims/${a.data.id}/action`,{method:'POST',cookie:finder.cookie,body:{action:'approve',verification_method:'private_details',identity_checked:true,evidence_checked:true,checks:'Original physical markings and claimant identity checked.'}});
  const b=await request('claims',{method:'POST',cookie:stranger.cookie,body:{report_id:rid,explanation:'I believe this could also be the bottle I lost yesterday.'}});assert.equal(b.status,201);
  const detail=(await request('claims/'+a.data.id,{cookie:owner.cookie})).data;assert.equal(detail.claim.status,'hold');assert.equal(detail.report.status,'hold');assert.equal(detail.claim.collection_code,null);
  assert.equal((await request(`claims/${a.data.id}/action`,{method:'POST',cookie:finder.cookie,body:{action:'approve',verification_method:'private_details',identity_checked:true,evidence_checked:true,checks:'Previously recorded checks repeated.'}})).status,403);
  assert.equal((await request(`claims/${b.data.id}/action`,{method:'POST',cookie:staff.cookie,body:{action:'reject',note:'The submitted private details do not describe this particular item.'}})).status,200);
  assert.equal((await request(`claims/${a.data.id}/action`,{method:'POST',cookie:staff.cookie,body:{action:'approve',verification_method:'private_details',identity_checked:true,evidence_checked:true,checks:'Reviewed both claims and checked unique physical markings.'}})).status,200);
 });
 await t.test('two claim submissions trigger cooldown and do not reveal answers',async()=>{
  const r=await request('reports',{method:'POST',cookie:finder.cookie,body:{...report('found'),title:'Another bottle'}});const rid=r.data.id;
  for(let i=0;i<2;i++){
   const c=await request('claims',{method:'POST',cookie:owner.cookie,body:{report_id:rid,explanation:'I have no receipt and need an alternative check.',no_proof:true}});assert.equal(c.status,201);
   await request(`claims/${c.data.id}/action`,{method:'POST',cookie:owner.cookie,body:{action:'withdraw'}});
  }
  const third=await request('claims',{method:'POST',cookie:owner.cookie,body:{report_id:rid,explanation:'Third attempt to submit this particular claim.'}});assert.equal(third.status,429);assert.ok(!JSON.stringify(third.data).includes('SECRET'));
 });
 await t.test('closed reports retain private history for involved claimants only',async()=>{
  const created=await request('reports',{method:'POST',cookie:finder.cookie,body:{...report('found'),title:'Closed report history fixture'}});const rid=created.data.id;
  const claim=await request('claims',{method:'POST',cookie:owner.cookie,body:{report_id:rid,explanation:'I submitted identifying details before the report was closed.'}});const cid=claim.data.id;
  await request(`claims/${cid}/action`,{method:'POST',cookie:owner.cookie,body:{action:'withdraw'}});
  assert.equal((await request(`reports/${rid}/action`,{method:'POST',cookie:finder.cookie,body:{action:'close'}})).status,200);
  const detail=await request('reports/'+rid,{cookie:owner.cookie});assert.equal(detail.status,200);assert.equal(detail.data.report.status,'closed');assert.equal(detail.data.related_claims[0].id,cid);assert.ok(!detail.data.report.private_details);
  assert.equal((await request('reports/'+rid)).status,404);assert.equal((await request('reports/'+rid,{cookie:stranger.cookie})).status,404);
  await query(`INSERT INTO notifications(id,user_id,title,body,report_id) VALUES($1,$2,'A possible match','A possible related item',$3)`,[crypto.randomUUID(),stranger.id,rid]);
  const expired=(await request('notifications',{cookie:stranger.cookie})).data.notifications.find(n=>n.report_id===rid&&n.title==='A possible match');assert.equal(expired.target_unavailable,true);assert.equal(expired.report_status,'closed');
  const liveClaimNotice=(await request('notifications',{cookie:finder.cookie})).data.notifications.find(n=>n.claim_id===cid);assert.equal(liveClaimNotice.target_unavailable,false);
  assert.equal((await request('claims',{method:'POST',cookie:owner.cookie,body:{report_id:rid,explanation:'A closed item must not accept a new claim.'}})).status,409);
 });
 await t.test('logout revokes session and public profiles omit private details',async()=>{
  const p=(await request('users/'+finder.id,{cookie:owner.cookie})).data.user;assert.ok(!('email' in p));assert.ok(!('phone' in p));assert.ok(!('campus_id' in p));
  const logout=await request('auth/logout',{method:'POST',cookie:stranger.cookie,body:{}});assert.equal(logout.status,200);
  assert.equal((await request('dashboard',{cookie:stranger.cookie})).status,401);
 });
});
test('matching never equates similarity with ownership',()=>{
 const a={...report('lost'),user_id:'one',status:'open'},b={...report('found'),user_id:'two',status:'open'};
 assert.ok(matchReports(a,b).reasons.includes('Same category'));assert.equal(matchReports(a,{...b,type:'lost'}),null);assert.equal(matchReports(a,{...b,category:'Keys'}),null);assert.equal(matchReports(a,{...b,user_id:'one'}),null);
});
after(async()=>{const db=await database();await db.close();await fs.rm(temporary,{recursive:true,force:true});});
