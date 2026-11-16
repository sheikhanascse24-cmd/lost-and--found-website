import crypto from 'node:crypto';
import sharp from 'sharp';
import {query,transaction} from './db.mjs';
import {id,hash,encrypt,decrypt,field,ensure,AppError,normalizeId,passwordHash,passwordMatches,currentUser,requireUser,sameOrigin,limit,sessionCookie,publicUser} from './security.mjs';
import {categories,sensitiveCategories,matchReports} from './matching.mjs';

const publicColumns=`r.id,r.user_id,r.type,r.title,r.category,r.description,r.location,r.occurred_at,r.image_id,r.sensitive,r.custody,r.availability,r.status,r.created_at,u.name AS poster_name,u.department,u.avatar_id`;
const iso = v => new Date(v).toISOString();
const asObject = d => d && typeof d==='object'&&!Array.isArray(d);
const isStaff=u=>u?.role==='staff';
const canReview=(u,r)=>u&&(isStaff(u)||r.user_id===u.id||r.custodian_id===u.id);
export const json=(data,status=200,headers={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
async function audit(tx,report,user,action,detail='') {await tx.query(`INSERT INTO audit(id,report_id,actor_id,action,detail) VALUES($1,$2,$3,$4,$5)`,[id(),report,user,action,detail]);}
async function notice(tx,user,title,body,report=null,claim=null,dedupe=null) {
 await tx.query(`INSERT INTO notifications(id,user_id,title,body,report_id,claim_id,dedupe) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(dedupe) DO NOTHING`,[id(),user,title,body,report,claim,dedupe]);
}
async function notifyReviewers(tx,r,title,body,claim) {
 const people=new Set([r.user_id,r.custodian_id].filter(Boolean));
 if(r.sensitive||r.custody==='reception')for(const u of (await tx.query(`SELECT id FROM users WHERE role='staff'`)).rows)people.add(u.id);
 for(const uid of people)await notice(tx,uid,title,body,r.id,claim);
}
async function imageInput(data) {
 if(!data)return null;
 ensure(typeof data==='string' && data.length<2900000,'Choose an image smaller than 2 MB.');
 const m=data.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
 ensure(m,'Use a JPEG, PNG or WebP image.');
 const bytes=Buffer.from(m[2],'base64');
 ensure(bytes.length>0&&bytes.length<=2*1024*1024,'Choose an image smaller than 2 MB.');
 try {
  const output=await sharp(bytes,{limitInputPixels:16000000,animated:false}).rotate().resize(1400,1400,{fit:'inside',withoutEnlargement:true}).webp({quality:82}).toBuffer();
  return output.toString('base64');
 } catch {throw new AppError('This image could not be opened. Choose another JPEG, PNG or WebP.');}
}
async function saveImage(tx,image,owner,kind) {
 if(!image)return null;
 const fid=id();await tx.query(`INSERT INTO files(id,owner_id,kind,content) VALUES($1,$2,$3,$4)`,[fid,owner,kind,kind==='evidence'?await encrypt(image):image]);return fid;
}
async function getReport(rid) {const [r]=await query(`SELECT * FROM reports WHERE id=$1`,[rid]);ensure(r,'Report not found.',404);return r;}
async function getClaim(cid,u) {
 const [c]=await query(`SELECT c.*,r.user_id AS poster_id,r.custodian_id,r.custody,r.title,r.type,r.sensitive,r.status AS report_status,r.storage,r.availability FROM claims c JOIN reports r ON r.id=c.report_id WHERE c.id=$1`,[cid]);
 ensure(c,'Claim not found.',404);ensure(u&&(c.claimant_id===u.id||c.poster_id===u.id||c.custodian_id===u.id||isStaff(u)),'You do not have access to this claim.',403);return c;
}
async function matchesFor(r) {
 const rows=await query(`SELECT ${publicColumns} FROM reports r JOIN users u ON u.id=r.user_id WHERE r.category=$1 AND r.type<>$2 AND r.status='open' AND r.user_id<>$3 ORDER BY r.created_at DESC LIMIT 300`,[r.category,r.type,r.user_id]);
 return rows.map(other=>({report:other,match:matchReports(r,other)})).filter(v=>v.match).sort((a,b)=>b.match.score-a.match.score).slice(0,12);
}
async function newMatches(r) {
 const matches=await matchesFor(r);
 await transaction(async tx=>{
  for(const {report:other,match} of matches){
   await notice(tx,r.user_id,'A possible match',`${other.title}: ${match.reasons.join(', ')}. Ownership checks still apply.`,other.id,null,`match:${r.id}:${other.id}:${r.user_id}`);
   await notice(tx,other.user_id,'A possible match',`${r.title}: ${match.reasons.join(', ')}. Ownership checks still apply.`,r.id,null,`match:${r.id}:${other.id}:${other.user_id}`);
  }
 });return matches;
}
export async function handle(request,parts) {
 const method=request.method,route=parts.join('/'),url=new URL(request.url);
 let user;
 try {
  if(method!=='GET')sameOrigin(request);
  if(method!=='GET')ensure(Number(request.headers.get('content-length')||0)<3600000,'The upload is too large.',413);
  user=await currentUser(request);
  let body={};
  if(method!=='GET'){try{const text=await request.text();ensure(Buffer.byteLength(text)<3600000,'The upload is too large.',413);body=text?JSON.parse(text):{};ensure(asObject(body),'Invalid request.');}catch(e){if(e instanceof AppError)throw e;throw new AppError('Invalid request data.');}}
  if(route==='session'&&method==='GET')return json({user,categories,campusMode:process.env.COLLEGE_EMAIL_DOMAIN||null,emailVerified:false});
  if(['auth/register','auth/login'].includes(route)&&method==='POST') {
   const email=field(body.email,'Email',254).toLowerCase();ensure(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'Enter a valid email address.');
   const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'local';
   await limit(`auth-ip:${hash(ip)}`,50);await limit(`auth-email:${hash(email)}`,12);
   let account;
   if(route==='auth/register'){
    if(process.env.COLLEGE_EMAIL_DOMAIN)ensure(email.endsWith(`@${process.env.COLLEGE_EMAIL_DOMAIN.toLowerCase()}`),'Use your configured college email address.');
    const name=field(body.name,'Display name',70,2), department=field(body.department||'','Department',80,0);
    const pwd=await passwordHash(body.password);
    try{[account]=await query(`INSERT INTO users(id,name,email,password,department,semester,section,campus_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,name,email,department,semester,section,campus_id,phone,avatar_id,role`,[id(),name,email,pwd,department,field(body.semester||'','Semester',20,0),field(body.section||'','Section',20,0),field(body.campus_id||'','Campus identifier',60,0)]);}
    catch(e){if(e.code==='23505')throw new AppError('An account with this email already exists. Try signing in.',409);throw e;}
   }else{
    const [row]=await query(`SELECT * FROM users WHERE email=$1`,[email]);
    // Equal-cost verification also applies when the address is unknown.
    const dummy='0123456789abcdef0123456789abcdef:'+ '0'.repeat(128);
    const correct=await passwordMatches(body.password,row?.password||dummy);
    ensure(row&&correct,'Email or password is incorrect.',401);const {password,...rest}=row;account=rest;
   }
   const token=crypto.randomBytes(32).toString('hex');
   await query(`INSERT INTO sessions(token,user_id,expires_at) VALUES($1,$2,NOW()+INTERVAL '7 days')`,[hash(token),account.id]);
   return json({user:account},200,{'Set-Cookie':sessionCookie(token)});
  }
  if(route==='auth/logout'&&method==='POST'){
   const token=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('lf_session='))?.slice(11);
   if(token)await query(`DELETE FROM sessions WHERE token=$1`,[hash(token)]);
   return json({ok:true},200,{'Set-Cookie':sessionCookie('',0)});
  }
  if(route==='profile'&&method==='PATCH'){
   requireUser(user);
   const image=await imageInput(body.image);
   const updated=await transaction(async tx=>{
    const avatar=image?await saveImage(tx,image,user.id,'avatar'):user.avatar_id;
    const {rows}=await tx.query(`UPDATE users SET name=$1,department=$2,semester=$3,section=$4,campus_id=$5,phone=$6,avatar_id=$7 WHERE id=$8 RETURNING id,name,email,department,semester,section,campus_id,phone,avatar_id,role`,[field(body.name,'Display name',70,2),field(body.department||'','Department',80,0),field(body.semester||'','Semester',20,0),field(body.section||'','Section',20,0),field(body.campus_id||'','Campus identifier',60,0),field(body.phone||'','Phone',30,0),avatar,user.id]);return rows[0];
   });return json({user:updated});
  }
  if(parts[0]==='users'&&parts.length===2&&method==='GET'){
   requireUser(user);const [u]=await query(`SELECT id,name,department,semester,section,avatar_id,role FROM users WHERE id=$1`,[parts[1]]);ensure(u,'Profile not found.',404);return json({user:publicUser(u)});
  }
  if(route==='reports'&&method==='GET'){
   const resolved=url.searchParams.get('status')==='returned';
   const where=[resolved?`r.status='returned' AND r.type='found'`:`r.status IN ('open','hold','reserved')`],params=[];
   const add=(condition,value)=>{params.push(value);where.push(condition.replace('?',`$${params.length}`));};
   if(['lost','found'].includes(url.searchParams.get('type')))add('r.type=?',url.searchParams.get('type'));
   if(categories.includes(url.searchParams.get('category')))add('r.category=?',url.searchParams.get('category'));
   if(url.searchParams.get('q')){params.push(`%${url.searchParams.get('q').slice(0,120)}%`);where.push(`(r.title ILIKE $${params.length} OR r.description ILIKE $${params.length} OR r.location ILIKE $${params.length})`);}
   if(url.searchParams.get('date')){const d=new Date(url.searchParams.get('date'));ensure(!isNaN(d),'Invalid date.');add('r.occurred_at>=?',d.toISOString());}
   const page=Math.max(1,Math.min(1000,Number(url.searchParams.get('page'))||1));
   const [total]=await query(`SELECT COUNT(*) AS count FROM reports r WHERE ${where.join(' AND ')}`,params);
   const rows=await query(`SELECT ${publicColumns}${resolved?`,(SELECT CASE WHEN c.public_name_consent THEN c.recipient_display_name ELSE NULL END FROM claims c WHERE c.report_id=r.id AND c.status='returned' LIMIT 1) AS recipient_name,(SELECT c.receipt_at FROM claims c WHERE c.report_id=r.id AND c.status='returned' LIMIT 1) AS returned_at`:''} FROM reports r JOIN users u ON u.id=r.user_id WHERE ${where.join(' AND ')} ORDER BY r.updated_at DESC LIMIT 12 OFFSET ${Math.floor(page-1)*12}`,params);
   const counts=await query(`SELECT type,COUNT(*) AS count FROM reports WHERE status IN ('open','hold','reserved') GROUP BY type`);
   return json({reports:rows,total:Number(total.count),page,counts:Object.fromEntries(counts.map(c=>[c.type,Number(c.count)]))});
  }
  if(route==='reports'&&method==='POST'){
   requireUser(user);await limit(`post:${user.id}`,15,3600);
   const type=field(body.type,'Report type');ensure(['lost','found'].includes(type),'Choose Lost or Found.');
   const category=field(body.category,'Category');ensure(categories.includes(category),'Choose an available category.');
   const date=new Date(body.occurred_at);ensure(!isNaN(date)&&date.getTime()<=Date.now()+60000,'Choose a valid date in the past.');
   const secret={answer1:field(body.answer1||'','First private detail',300,0),answer2:field(body.answer2||'','Second private detail',500,0),serial:normalizeId(field(body.serial||'','Unique serial number',100,0))};
   ensure(secret.answer1||secret.answer2||secret.serial,'Add at least one private identifying detail, or explain that no distinguishing detail is available.');
   const image=await imageInput(body.image),rid=id();
   await transaction(async tx=>{
    const fid=await saveImage(tx,image,user.id,'report');
    await tx.query(`INSERT INTO reports(id,user_id,type,title,category,description,location,occurred_at,image_id,secret,sensitive,custody,availability) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,[rid,user.id,type,field(body.title,'Item name',100,3),category,field(body.description,'Public description',1200,10),field(body.location,'Location or route',160,2),date.toISOString(),fid,await encrypt(secret),!!body.sensitive||sensitiveCategories.includes(category),type==='found'&&body.custody==='request'?'request':'finder',field(body.availability||'','Collection availability',180,0)]);
    await audit(tx,rid,user.id,'Report created',`${type} report`);
    if(type==='found'&&body.custody==='request')for(const staff of (await tx.query(`SELECT id FROM users WHERE role='staff'`)).rows)await notice(tx,staff.id,'Reception deposit requested','Confirm physical receipt before accepting custody.',rid);
   });
   const r=await getReport(rid);const matches=await newMatches(r);return json({id:rid,matches:matches.length},201);
  }
  if(parts[0]==='reports'&&parts.length===2&&method==='GET'){
   const [r]=await query(`SELECT ${publicColumns},r.storage,r.custodian_id FROM reports r JOIN users u ON u.id=r.user_id WHERE r.id=$1`,[parts[1]]);ensure(r,'Report not found.',404);
   const relatedClaims=user?await query(`SELECT c.id,c.status FROM claims c JOIN reports f ON f.id=c.report_id WHERE (c.report_id=$1 OR c.lost_report_id=$1) AND (c.claimant_id=$2 OR f.user_id=$2 OR f.custodian_id=$2 OR c.handover_by=$2 ${isStaff(user)?'OR TRUE':''}) ORDER BY c.created_at DESC LIMIT 20`,[r.id,user.id]):[];
   if(r.status==='closed'||(r.status==='returned'&&r.type!=='found'))ensure(user&&(r.user_id===user.id||r.custodian_id===user.id||isStaff(user)||relatedClaims.length),'This report is no longer active. Open My space to find your own reports and claim history.',404);
   if(r.status==='returned'){
    const [receipt]=await query(`SELECT CASE WHEN public_name_consent THEN recipient_display_name ELSE NULL END AS recipient_name,receipt_at AS returned_at,verification_method AS return_method FROM claims WHERE report_id=$1 AND status='returned' LIMIT 1`,[r.id]);Object.assign(r,receipt);
   }
   if(user&&canReview(user,r))r.private_details=await decrypt((await getReport(r.id)).secret);
   let matches=[];if(user?.id===r.user_id)matches=await matchesFor(r);
   return json({report:r,matches,related_claims:relatedClaims});
  }
  if(parts[0]==='reports'&&parts.length===3&&parts[2]==='action'&&method==='POST'){
   requireUser(user);const rid=parts[1];
   await transaction(async tx=>{
    const {rows:[r]}=await tx.query(`SELECT * FROM reports WHERE id=$1 FOR UPDATE`,[rid]);ensure(r,'Report not found.',404);
    if(body.action==='routine_accessory'){
     ensure(r.user_id===user.id&&r.type==='found','Only the finder can classify this accessory.',403);
     ensure(r.category==='Electronics'&&r.status==='open'&&r.custody!=='reception','Only an open electronic item still with its finder can be reclassified.',409);
     ensure(body.routine_confirmed===true&&['Mouse','Keyboard','USB receiver','Cable','Adapter'].includes(body.accessory_type),'Confirm the routine accessory type. Valuable or sensitive electronics require staff review.');
     const reason=field(body.reason,'Reason for routine-accessory classification',500,20);
     const active=(await tx.query(`SELECT id FROM claims WHERE report_id=$1 AND status IN ('pending','hold','approved','handover')`,[r.id])).rows;
     ensure(active.length<=1,'Staff must resolve competing claims before reclassification.',409);
     await tx.query(`UPDATE reports SET category='Computer accessories',sensitive=FALSE,updated_at=NOW() WHERE id=$1`,[r.id]);
     await audit(tx,r.id,user.id,'Routine accessory classified',`${body.accessory_type}: ${reason}`);
    }else if(body.action==='deposit'){
     ensure(r.user_id===user.id&&r.type==='found'&&r.status==='open','Only the finder can request an open item deposit.',403);
     ensure(r.custody==='finder','A deposit is already requested or accepted.');
     await tx.query(`UPDATE reports SET custody='request',updated_at=NOW() WHERE id=$1`,[rid]);
     for(const staff of (await tx.query(`SELECT id FROM users WHERE role='staff'`)).rows)await notice(tx,staff.id,'Reception deposit requested',r.title,rid);
     await audit(tx,rid,user.id,'Deposit requested');
    }else if(body.action==='receive'){
     ensure(isStaff(user),'Only reception staff can accept custody.',403);ensure(r.type==='found'&&r.custody==='request','No pending deposit for this item.');
     const storage=field(body.storage,'Storage reference',70,2);
     await tx.query(`UPDATE reports SET custody='reception',custodian_id=$1,storage=$2,updated_at=NOW() WHERE id=$3`,[user.id,storage,rid]);
     await audit(tx,rid,user.id,'Reception received item',storage);await notice(tx,r.user_id,'Reception received your item',`Storage reference: ${storage}`,rid);
    }else if(body.action==='close'){
     ensure(r.user_id===user.id,'Only the poster can close this report.',403);ensure(r.status==='open','Resolve active claims before closing this report.');
     const active=(await tx.query(`SELECT id FROM claims WHERE report_id=$1 AND status NOT IN ('rejected','withdrawn','returned')`,[rid])).rows;
     ensure(active.length===0,'Resolve or withdraw active claims before closing this report.');
     await tx.query(`UPDATE reports SET status='closed',updated_at=NOW() WHERE id=$1`,[rid]);await audit(tx,rid,user.id,'Closed by poster','Recovered elsewhere or report no longer needed');
    }else throw new AppError('Unknown report action.');
   });return json({ok:true});
  }
  if(route==='claims'&&method==='POST'){
   requireUser(user);await limit(`claims:${user.id}:${body.report_id}`,2,1800);
   const r=await getReport(field(body.report_id,'Report'));ensure(r.type==='found','Claims apply to found items. Post what you found to respond to a lost report.');ensure(r.user_id!==user.id,'You cannot claim your own report.');
   ensure(['open','reserved','hold'].includes(r.status),'This item is no longer available.',409);
   const image=await imageInput(body.image);
   const answers={answer1:field(body.answer1||'','First identifying detail',400,0),answer2:field(body.answer2||'','Second identifying detail',600,0),serial:normalizeId(field(body.serial||'','Unique serial number',100,0)),explanation:field(body.explanation,'Ownership explanation',1800,15),no_proof:!!body.no_proof};
   const cid=id();
   await transaction(async tx=>{
    const locked=(await tx.query(`SELECT * FROM reports WHERE id=$1 FOR UPDATE`,[r.id])).rows[0];ensure(['open','reserved','hold'].includes(locked.status),'This item is no longer available.',409);
    ensure(!(await tx.query(`SELECT id FROM claims WHERE report_id=$1 AND status='handover'`,[r.id])).rows.length,'A handover is already awaiting recipient confirmation. Contact staff about a dispute.',409);
    ensure(!(await tx.query(`SELECT id FROM claims WHERE report_id=$1 AND claimant_id=$2 AND status NOT IN ('withdrawn','rejected')`,[r.id,user.id])).rows.length,'You already have an active claim for this item. Open it in your dashboard.',409);
    let lost=null;if(body.lost_report_id){const [l]=(await tx.query(`SELECT * FROM reports WHERE id=$1 AND user_id=$2 AND type='lost' AND status='open'`,[body.lost_report_id,user.id])).rows;ensure(l,'Select one of your open lost reports.');lost=l.id;}
    const fid=await saveImage(tx,image,user.id,'evidence');
    await tx.query(`INSERT INTO claims(id,report_id,claimant_id,lost_report_id,secret,evidence_id) VALUES($1,$2,$3,$4,$5,$6)`,[cid,r.id,user.id,lost,await encrypt(answers),fid]);
    const active=(await tx.query(`SELECT id FROM claims WHERE report_id=$1 AND status IN ('pending','approved','hold')`,[r.id])).rows;
    if(active.length>1){await tx.query(`UPDATE reports SET status='hold' WHERE id=$1`,[r.id]);await tx.query(`UPDATE claims SET status='hold',code_hash=NULL,code_secret=NULL WHERE report_id=$1 AND status IN ('pending','approved')`,[r.id]);}
    await notifyReviewers(tx,r,active.length>1?'Competing claims: collection on hold':'New private claim',r.title,cid);
    await audit(tx,r.id,user.id,'Claim submitted',active.length>1?'Competing claims require staff review':'Private evidence submitted');
   });return json({id:cid},201);
  }
  if(parts[0]==='reports'&&parts.length===3&&parts[2]==='walk-in'&&method==='POST'){
   requireUser(user);ensure(isStaff(user),'Only authorized staff can record a walk-in return.',403);
   await limit(`walk-in:${user.id}`,20,3600);
   const recipientName=field(body.recipient_name,'Recipient name',70,2),department=field(body.department,'Department',80,2),campusId=field(body.campus_id,'Campus identifier',60,2);
   const identityMethod=field(body.identity_method,'Identity check',120,5),place=field(body.collection_place,'Collection location',180,2),checks=field(body.checks,'Ownership checks and reason for release',1500,30);
   ensure(body.identity_checked===true&&body.recipient_acknowledged===true,'Check the recipient’s identity and obtain acknowledgement of physical receipt.');
   const image=await imageInput(body.image),cid=id(),guestId=id();
   const guestPassword=await passwordHash(crypto.randomBytes(40).toString('hex'));
   await transaction(async tx=>{
    const [r]=(await tx.query(`SELECT * FROM reports WHERE id=$1 FOR UPDATE`,[parts[1]])).rows;
    ensure(r&&r.type==='found','Found report not found.',404);ensure(r.status==='open','A walk-in return requires an open, undisputed item.',409);
    ensure(!(await tx.query(`SELECT id FROM claims WHERE report_id=$1 AND status IN ('pending','approved','hold','handover')`,[r.id])).rows.length,'Resolve existing claims before a walk-in return.',409);
    ensure(r.custody!=='request','Confirm reception receipt before recording a walk-in return.');
    await tx.query(`INSERT INTO users(id,name,email,password,department,campus_id) VALUES($1,$2,$3,$4,$5,$6)`,[guestId,recipientName,`walkin-${guestId}@guest.invalid`,guestPassword,department,campusId]);
    const photo=await saveImage(tx,image,user.id,'evidence');
    const collector={id:guestId,name:recipientName,department,campus_id:campusId,identity_method:identityMethod,collection_place:place,photo_attached:!!image,walk_in:true};
    await tx.query(`INSERT INTO claims(id,report_id,claimant_id,secret,status,review_note,checks,handover_by,handover_at,receipt_at,handover_photo_id,collector_record,public_name_consent,recipient_display_name,verification_method) VALUES($1,$2,$3,$4,'returned',$5,$6,$7,NOW(),NOW(),$8,$9,$10,$11,'walk_in')`,[cid,r.id,guestId,await encrypt({explanation:'Staff recorded an in-person claim. No online claimant account was used.',no_proof:true}), 'Staff-authorized walk-in return. Review the recorded checks and acknowledgement.',await encrypt(checks),user.id,photo,await encrypt(collector),body.public_name_consent===true,recipientName]);
    await tx.query(`UPDATE reports SET status='returned',updated_at=NOW() WHERE id=$1`,[r.id]);
    await audit(tx,r.id,user.id,'Staff recorded walk-in handover','Staff checked identity and recorded recipient acknowledgement.');
    await notice(tx,r.user_id,'Staff recorded a walk-in return',r.title,r.id,cid);
   });return json({id:cid},201);
  }
  if(parts[0]==='claims'&&parts.length===2&&method==='GET'){
   requireUser(user);const c=await getClaim(parts[1],user),r=await getReport(c.report_id);
   const answers=await decrypt(c.secret);const {secret,code_secret,code_hash,...safe}=c;
   safe.collector_record=c.collector_record?await decrypt(c.collector_record):null;
   safe.checks=c.checks?await decrypt(c.checks):'';
   const [claimant]=await query(`SELECT id,name,department,campus_id,role FROM users WHERE id=$1`,[c.claimant_id]);
   const [poster]=await query(`SELECT id,name,department,role FROM users WHERE id=$1`,[c.poster_id]);
   const reviewer=canReview(user,r);
   const details=reviewer?await decrypt(r.secret):null;
   const messages=await query(`SELECT m.id,m.sender_id,m.body,m.created_at,u.name FROM messages m JOIN users u ON u.id=m.sender_id WHERE claim_id=$1 ORDER BY m.created_at ASC LIMIT 300`,[c.id]);
   const logs=reviewer||c.claimant_id===user.id?await query(`SELECT a.action,a.detail,a.created_at,u.name AS actor FROM audit a JOIN users u ON u.id=a.actor_id WHERE report_id=$1 ORDER BY a.created_at DESC LIMIT 50`,[r.id]):[];
   const collection_code=c.claimant_id===user.id&&c.status==='approved'&&code_secret&&new Date(c.code_expires)>new Date()?await decrypt(code_secret):null;
   return json({claim:{...safe,answers,claimant:reviewer?claimant:publicUser(claimant),poster:publicUser(poster),collection_code},report:{id:r.id,title:r.title,category:r.category,custody:r.custody,sensitive:r.sensitive,status:r.status,storage:r.storage,availability:r.availability},private_details:details,serial_match:reviewer&&answers.serial&&details?.serial?normalizeId(answers.serial)===normalizeId(details.serial):null,messages,logs,reviewer});
  }
  if(parts[0]==='claims'&&parts.length===3&&parts[2]==='messages'&&method==='POST'){
   requireUser(user);const c=await getClaim(parts[1],user);await limit(`messages:${user.id}`,60,600);
   const message=field(body.message,'Message',1600);
   await transaction(async tx=>{await tx.query(`INSERT INTO messages(id,claim_id,sender_id,body) VALUES($1,$2,$3,$4)`,[id(),c.id,user.id,message]);
    const recipient=user.id===c.claimant_id?(c.custodian_id||c.poster_id):c.claimant_id;await notice(tx,recipient,'New private message',`${user.name} sent a message about ${c.title}.`,c.report_id,c.id);
   });return json({ok:true},201);
  }
  if(parts[0]==='claims'&&parts.length===3&&parts[2]==='assist'&&method==='POST'){
   requireUser(user);const c=await getClaim(parts[1],user),r=await getReport(c.report_id);
   ensure(canReview(user,r)&&user.id!==c.claimant_id,'Only the finder or authorized staff can compare private evidence.',403);
   await limit(`assistant:${user.id}`,15,3600);
   try{
    const {compareClaim}=await import('./claim-assistant.mjs');
    const result=await compareClaim(await decrypt(r.secret),await decrypt(c.secret));
    return json({assistant:result});
   }catch(e){console.error('Claim assistant unavailable:',e.message);throw new AppError('The local AI model could not load. You can still compare the original evidence and complete a supervised review.',503);}
  }
  if(parts[0]==='claims'&&parts.length===3&&parts[2]==='action'&&method==='POST'){
   requireUser(user);const accessible=await getClaim(parts[1],user);
   if(body.action==='handover')await limit(`code:${accessible.id}`,5,900);
   if(body.action==='request_review')await limit(`review-request:${user.id}:${accessible.id}`,2,1800);
   let handoverPhoto=null;
   if(body.action==='handover'&&body.handover_image){
    ensure(canReview(user,{user_id:accessible.poster_id,custodian_id:accessible.custodian_id})&&accessible.claimant_id!==user.id,'Only a custodian can attach a collection photograph.',403);
    handoverPhoto=await imageInput(body.handover_image);
   }
   const result=await transaction(async tx=>{
    // Lock the report before its claim so competing decisions serialize consistently.
    const r=(await tx.query(`SELECT * FROM reports WHERE id=$1 FOR UPDATE`,[accessible.report_id])).rows[0];
    const c=(await tx.query(`SELECT * FROM claims WHERE id=$1 FOR UPDATE`,[accessible.id])).rows[0];
    const reviewer=canReview(user,r),action=body.action;
    if(action==='request_review'){
     ensure(c.claimant_id===user.id,'Only the claimant can request another review.',403);
     ensure(c.status==='rejected'&&['open','hold'].includes(r.status),'Another review can be requested only for a declined claim on an available item.',409);
     const reason=field(body.note,'Additional evidence for review',1000,15);
     await tx.query(`INSERT INTO messages(id,claim_id,sender_id,body) VALUES($1,$2,$3,$4)`,[id(),c.id,user.id,`Request for another review: ${reason}`]);
     await notifyReviewers(tx,r,'Another claim review requested','The claimant has described additional evidence in the private conversation.',c.id);
     await audit(tx,r.id,user.id,'Another review requested','Additional evidence sent privately. The previous decision remains until a reviewer reopens the claim.');
    }else if(action==='reopen'){
     ensure(reviewer&&user.id!==c.claimant_id,'Only the finder or authorized staff can reopen a declined claim.',403);
     ensure(c.status==='rejected'&&['open','hold'].includes(r.status),'Only a declined claim on an available item can be reopened.',409);
     const reason=field(body.note,'Reason for reopening',1000,15);
     const others=(await tx.query(`SELECT id FROM claims WHERE report_id=$1 AND id<>$2 AND status IN ('pending','hold','approved','handover')`,[r.id,c.id])).rows;
     ensure(!others.length,'Staff must resolve other active claims before this claim can be reopened.',409);
     await tx.query(`UPDATE claims SET status=$1,review_note=$2,code_hash=NULL,code_secret=NULL,updated_at=NOW() WHERE id=$3`,[r.status==='hold'?'hold':'pending',reason,c.id]);
     await notice(tx,c.claimant_id,'Claim reopened for review','The reviewer will assess the additional evidence before deciding on collection.',r.id,c.id);
     await audit(tx,r.id,user.id,'Declined claim reopened',reason);
    }else if(action==='withdraw'){
     ensure(c.claimant_id===user.id&&['pending','hold'].includes(c.status),'This claim cannot be withdrawn.',403);
     await tx.query(`UPDATE claims SET status='withdrawn',updated_at=NOW() WHERE id=$1`,[c.id]);await audit(tx,r.id,user.id,'Claim withdrawn');
    }else if(['approve','reject','hold'].includes(action)){
     ensure(reviewer,'Only the finder or authorized staff can review this claim.',403);
     ensure(user.id!==c.claimant_id,'You cannot approve or review your own claim.',403);
     ensure(['pending','hold','approved'].includes(c.status),'This claim is no longer awaiting review.',409);
     if(action==='approve'){
      ensure(!r.sensitive||isStaff(user),'This item requires staff-supervised approval.',403);
      ensure(r.status!=='hold'||isStaff(user),'Staff must review a disputed item.',403);
      const others=(await tx.query(`SELECT id FROM claims WHERE report_id=$1 AND id<>$2 AND status IN ('pending','approved','hold','handover')`,[r.id,c.id])).rows;
      ensure(others.length===0,'Resolve competing claims before approving collection.',409);
      ensure(body.identity_checked===true&&body.evidence_checked===true,'Confirm both identity and ownership checks.');
      const checks=field(body.checks,'Checks completed',1200,15);
      const method=field(body.verification_method,'Verification method',60);
      ensure(['unique_identifier','private_details','device_check','documents','alternative'].includes(method),'Choose an available verification method.');
      const reportProof=await decrypt(r.secret),claimProof=await decrypt(c.secret);
      const serialConflict=!!(reportProof.serial&&claimProof.serial&&normalizeId(reportProof.serial)!==normalizeId(claimProof.serial));
      let discrepancy='';
      if(serialConflict){
       ensure(isStaff(user),'A conflicting serial number needs staff review.',403);
       ensure(body.discrepancy_resolved===true&&method!=='unique_identifier','Resolve the serial-number conflict with a separate supervised check before approval.');
       discrepancy=field(body.discrepancy_note,'How the serial discrepancy was resolved',1200,20);
      }
      const code=crypto.randomBytes(8).toString('hex').toUpperCase();
      await tx.query(`UPDATE claims SET status='approved',review_note=$1,checks=$2,code_hash=$3,code_secret=$4,code_expires=NOW()+INTERVAL '24 hours',verification_method=$5,discrepancy_note=$6,updated_at=NOW() WHERE id=$7`,[field(body.note||'Collection approved after review.','Review note',1000),await encrypt(checks),hash(code),await encrypt(code),method,discrepancy?await encrypt(discrepancy):'',c.id]);
      await tx.query(`UPDATE reports SET status='reserved',updated_at=NOW() WHERE id=$1`,[r.id]);
      await notice(tx,c.claimant_id,'Collection approved','Your private collection code is available for 24 hours. Check the collection location before travelling.',r.id,c.id);
      await audit(tx,r.id,user.id,'Collection approved','Identity and ownership checks recorded');
     }else if(action==='hold'){
      await tx.query(`UPDATE claims SET status='hold',code_hash=NULL,code_secret=NULL,review_note=$1,updated_at=NOW() WHERE report_id=$2 AND status IN ('pending','approved','hold')`,[field(body.note,'Reason for hold',1000,5),r.id]);
      await tx.query(`UPDATE reports SET status='hold',updated_at=NOW() WHERE id=$1`,[r.id]);
      await notifyReviewers(tx,r,'Collection placed on hold','Staff review is required.',c.id);
      await notice(tx,c.claimant_id,'Claim needs further review','Collection is on hold. Check the private claim thread.',r.id,c.id);await audit(tx,r.id,user.id,'Collection on hold');
     }else{
      await tx.query(`UPDATE claims SET status='rejected',code_hash=NULL,code_secret=NULL,review_note=$1,updated_at=NOW() WHERE id=$2`,[field(body.note,'Review explanation',1000,5),c.id]);
      await notice(tx,c.claimant_id,'Claim reviewed','Read the review note in your private claim.',r.id,c.id);await audit(tx,r.id,user.id,'Claim declined');
      const remaining=(await tx.query(`SELECT id FROM claims WHERE report_id=$1 AND status IN ('pending','hold','approved','handover')`,[r.id])).rows;
      if(!remaining.length)await tx.query(`UPDATE reports SET status='open',updated_at=NOW() WHERE id=$1`,[r.id]);
     }
    }else if(action==='handover'){
     ensure(reviewer&&c.claimant_id!==user.id,'Only the custodian or authorized staff can record a handover.',403);
     ensure(!r.sensitive||isStaff(user),'Staff must supervise this handover.',403);
     ensure(r.custody!=='reception'||isStaff(user),'Reception staff must record this handover.',403);
     ensure(c.status==='approved'&&r.status==='reserved','Collection is not approved or is on hold.',409);
     ensure(new Date(c.code_expires)>new Date(),'The collection code has expired. Review and approve again.');
     const supplied=hash(field(body.code,'Collection code',40).toUpperCase());
     ensure(c.code_hash&&crypto.timingSafeEqual(Buffer.from(supplied),Buffer.from(c.code_hash)),'Collection code is incorrect.');
     ensure(body.identity_checked===true,'Check the collector against the approved account before handover.');
     const collector=(await tx.query(`SELECT id,name,department,campus_id,role FROM users WHERE id=$1`,[c.claimant_id])).rows[0];
     const record={...collector,name:field(body.recipient_name||collector.name,'Recipient name',70,2),department:field(body.department||collector.department,'Recipient department',80,2),campus_id:field(body.campus_id||collector.campus_id,'Recipient campus identifier',60,2),identity_method:field(body.identity_method,'Identity document checked',120,3),collection_place:field(body.collection_place,'Handover location',180,2),photo_attached:!!handoverPhoto};
     const photoId=await saveImage(tx,handoverPhoto,user.id,'evidence');
     await tx.query(`UPDATE claims SET status='handover',handover_by=$1,handover_at=NOW(),code_hash=NULL,code_secret=NULL,handover_photo_id=$2,collector_record=$3,updated_at=NOW() WHERE id=$4`,[user.id,photoId,await encrypt(record),c.id]);
     await notice(tx,c.claimant_id,'Please confirm receipt','The custodian recorded the handover. Confirm only after you physically receive the item.',r.id,c.id);await audit(tx,r.id,user.id,'Handover recorded','Awaiting recipient confirmation');
    }else if(action==='receipt'){
     ensure(c.claimant_id===user.id&&c.status==='handover','Only the recipient can confirm this handover.',403);
     const collector=c.collector_record?await decrypt(c.collector_record):null;
     await tx.query(`UPDATE claims SET status='returned',receipt_at=NOW(),public_name_consent=$1,recipient_display_name=$2,updated_at=NOW() WHERE id=$3`,[body.public_name_consent===true,collector?.name||user.name,c.id]);
     await tx.query(`UPDATE reports SET status='returned',updated_at=NOW() WHERE id=$1`,[r.id]);
     if(c.lost_report_id)await tx.query(`UPDATE reports SET status='returned',updated_at=NOW() WHERE id=$1 AND user_id=$2 AND type='lost'`,[c.lost_report_id,c.claimant_id]);
     await audit(tx,r.id,user.id,'Recipient confirmed receipt');await notifyReviewers(tx,r,'Return complete',r.title,c.id);
    }else throw new AppError('Unknown claim action.');
    return {ok:true};
   });return json(result);
  }
  if(route==='dashboard'&&method==='GET'){
   requireUser(user);
   const reports=await query(`SELECT ${publicColumns},r.storage FROM reports r JOIN users u ON u.id=r.user_id WHERE r.user_id=$1 ORDER BY r.created_at DESC LIMIT 150`,[user.id]);
   const claims=await query(`SELECT c.id,c.report_id,c.claimant_id,c.status,c.created_at,r.title,r.category,r.sensitive,r.custody,u.name AS claimant_name FROM claims c JOIN reports r ON r.id=c.report_id JOIN users u ON u.id=c.claimant_id WHERE c.claimant_id=$1 OR r.user_id=$1 OR r.custodian_id=$1 OR c.handover_by=$1 ${isStaff(user)?"OR r.sensitive=TRUE OR r.custody IN ('request','reception') OR r.status='hold'":''} ORDER BY c.created_at DESC LIMIT 200`,[user.id]);
   const reception=isStaff(user)?await query(`SELECT ${publicColumns},r.storage FROM reports r JOIN users u ON u.id=r.user_id WHERE r.type='found' AND r.custody IN ('request','reception') AND r.status NOT IN ('closed','returned') ORDER BY r.created_at DESC LIMIT 100`):[];
   return json({reports,claims,reception});
  }
  if(route==='notifications'&&method==='GET'){
   requireUser(user);return json({notifications:await query(`SELECT n.*,r.status AS report_status,CASE WHEN n.claim_id IS NULL AND n.report_id IS NOT NULL AND (r.id IS NULL OR (n.title='A possible match' AND r.status IN ('closed','returned'))) THEN TRUE ELSE FALSE END AS target_unavailable FROM notifications n LEFT JOIN reports r ON r.id=n.report_id WHERE n.user_id=$1 ORDER BY n.created_at DESC LIMIT 100`,[user.id])});
  }
  if(route==='notifications/read'&&method==='POST'){
   requireUser(user);await query(`UPDATE notifications SET read_at=NOW() WHERE user_id=$1 AND read_at IS NULL`,[user.id]);return json({ok:true});
  }
  if(parts[0]==='files'&&parts.length===2&&method==='GET'){
   const [f]=await query(`SELECT * FROM files WHERE id=$1`,[parts[1]]);ensure(f,'Image not found.',404);
   let content=f.content;
   if(f.kind==='evidence'){
    requireUser(user);const [claim]=await query(`SELECT c.id FROM claims c JOIN reports r ON r.id=c.report_id WHERE (c.evidence_id=$1 OR c.handover_photo_id=$1) AND (c.claimant_id=$2 OR r.user_id=$2 OR r.custodian_id=$2 ${isStaff(user)?'OR TRUE':''})`,[f.id,user.id]);
    ensure(claim,'This evidence is private.',403);content=await decrypt(content);
   }
   return new Response(Buffer.from(content,'base64'),{headers:{'Content-Type':'image/webp','Cache-Control':f.kind==='evidence'?'private, no-store':'public, max-age=3600','X-Content-Type-Options':'nosniff','Content-Disposition':'inline; filename="image.webp"'}});
  }
  throw new AppError('This page could not be found.',404);
 }catch(e){
  if(e instanceof AppError)return json({error:e.message},e.status);
  console.error('Application request failed:',e?.message);
  return json({error:'Something went wrong. Please try again. If this continues, check the server configuration.'},500);
 }
}
