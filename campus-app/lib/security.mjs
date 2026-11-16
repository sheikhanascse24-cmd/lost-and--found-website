import crypto from 'node:crypto';
import {promisify} from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import {localDir, query} from './db.mjs';
const scrypt = promisify(crypto.scrypt);
export const id = () => crypto.randomUUID();
export const hash = value => crypto.createHash('sha256').update(value).digest('hex');
export class AppError extends Error {constructor(message,status=400) {super(message);this.status=status;}}
export function ensure(condition,message,status=400) {if(!condition) throw new AppError(message,status);}
export function field(value,name,max=300,min=1) {
 ensure(typeof value==='string' && value.trim().length>=min,`${name} is required.`);
 ensure(value.trim().length<=max,`${name} must be ${max} characters or fewer.`);
 return value.trim();
}
export const normalizeId = v => String(v||'').normalize('NFKC').replace(/[\s-]/g,'').toUpperCase();
async function secretKey() {
 if (!globalThis.__lostFoundKey) globalThis.__lostFoundKey = (async()=> {
  let value=process.env.APP_SECRET;
  if (!value) {
   ensure(!process.env.VERCEL,'APP_SECRET must be set before deployment.',503);
   await fs.mkdir(localDir(),{recursive:true});
   const file=path.join(localDir(),'encryption-key');
   try {value=await fs.readFile(file,'utf8');} catch {
    const candidate=crypto.randomBytes(48).toString('hex');
    try {await fs.writeFile(file,candidate,{flag:'wx',mode:0o600});value=candidate;}
    catch {value=await fs.readFile(file,'utf8');}
   }
  }
  ensure(value.length>=32,'APP_SECRET must contain at least 32 characters.',503);
  return crypto.createHash('sha256').update(value).digest();
 })();
 return globalThis.__lostFoundKey;
}
export async function encrypt(value) {
 const iv=crypto.randomBytes(12), cipher=crypto.createCipheriv('aes-256-gcm',await secretKey(),iv);
 const data=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);
 return Buffer.concat([iv,cipher.getAuthTag(),data]).toString('base64');
}
export async function decrypt(value) {
 const data=Buffer.from(value,'base64'), decipher=crypto.createDecipheriv('aes-256-gcm',await secretKey(),data.subarray(0,12));
 decipher.setAuthTag(data.subarray(12,28));
 return JSON.parse(Buffer.concat([decipher.update(data.subarray(28)),decipher.final()]).toString());
}
export async function passwordHash(password) {
 ensure(typeof password==='string' && password.length>=10 && password.length<=128,'Use a password between 10 and 128 characters.');
 const salt=crypto.randomBytes(16).toString('hex');
 return `${salt}:${Buffer.from(await scrypt(password,salt,64)).toString('hex')}`;
}
export async function passwordMatches(password,stored) {
 if(typeof password!=='string'||password.length>128) return false;
 const [salt,key]=stored.split(':');
 const actual=Buffer.from(await scrypt(password,salt,64));
 return crypto.timingSafeEqual(actual,Buffer.from(key,'hex'));
}
export async function currentUser(request) {
 const token=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('lf_session='))?.slice(11);
 if(!token) return null;
 const [user]=await query(`SELECT u.id,u.name,u.email,u.department,u.semester,u.section,u.campus_id,u.phone,u.avatar_id,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=$1 AND s.expires_at>NOW()`,[hash(token)]);
 return user||null;
}
export const publicUser = u => ({id:u.id,name:u.name,department:u.department,semester:u.semester,section:u.section,avatar_id:u.avatar_id,role:u.role});
export function requireUser(user) {ensure(user,'Please sign in to continue.',401);return user;}
export function sameOrigin(request) {
 const origin=request.headers.get('origin');
 const requestURL=new URL(request.url);
 let matchesHost=false;
 try {
  const originURL=new URL(origin);
  const protocol=process.env.VERCEL?'https:':requestURL.protocol;
  matchesHost=originURL.host===request.headers.get('host') && originURL.protocol===protocol;
 }catch{}
 ensure(origin===requestURL.origin || matchesHost || (process.env.APP_URL && origin===new URL(process.env.APP_URL).origin),'This request did not come from this website.',403);
}
export async function limit(key,max=20,seconds=900) {
 const [row]=await query(`INSERT INTO rate_limits(key,hits,expires_at) VALUES($1,1,NOW()+($2*INTERVAL '1 second')) ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN rate_limits.expires_at<NOW() THEN 1 ELSE rate_limits.hits+1 END, expires_at=CASE WHEN rate_limits.expires_at<NOW() THEN EXCLUDED.expires_at ELSE rate_limits.expires_at END RETURNING hits`,[key,seconds]);
 ensure(row.hits<=max,'Too many attempts. Please try again later.',429);
}
export function sessionCookie(token,maxAge=60*60*24*7) {
 return `lf_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.VERCEL||process.env.APP_URL?.startsWith('https:')?'; Secure':''}`;
}
