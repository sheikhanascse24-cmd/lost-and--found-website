import {query,database} from '../lib/db.mjs';
const email=process.argv[2]?.trim().toLowerCase();
if(!email||!email.includes('@')){console.error('Usage: node --env-file-if-exists=.env.local scripts/staff.mjs account@example.com');process.exit(1);}
try{
 const rows=await query(`UPDATE users SET role='staff' WHERE email=$1 RETURNING id`,[email]);
 if(!rows.length){console.error('No account found. Register the staff account in the app first.');process.exitCode=1;}
 else console.log('Staff access granted to the registered account. Sign in again to refresh the interface.');
}finally{await(await database()).close();}
