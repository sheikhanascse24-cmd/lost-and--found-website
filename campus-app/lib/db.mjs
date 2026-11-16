import fs from 'node:fs/promises';
import path from 'node:path';

export const schema = `
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
 department TEXT NOT NULL DEFAULT '', semester TEXT NOT NULL DEFAULT '', section TEXT NOT NULL DEFAULT '',
 campus_id TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', avatar_id TEXT,
 role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member','staff')), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS sessions (
 token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS reports (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), type TEXT NOT NULL CHECK(type IN ('lost','found')),
 title TEXT NOT NULL, category TEXT NOT NULL, description TEXT NOT NULL, location TEXT NOT NULL,
 occurred_at TIMESTAMPTZ NOT NULL, image_id TEXT, secret TEXT NOT NULL,
 sensitive BOOLEAN NOT NULL DEFAULT FALSE, custody TEXT NOT NULL DEFAULT 'finder', custodian_id TEXT REFERENCES users(id),
 availability TEXT NOT NULL DEFAULT '', storage TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'open',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS claims (
 id TEXT PRIMARY KEY, report_id TEXT NOT NULL REFERENCES reports(id), claimant_id TEXT NOT NULL REFERENCES users(id),
 lost_report_id TEXT REFERENCES reports(id), secret TEXT NOT NULL, evidence_id TEXT,
 status TEXT NOT NULL DEFAULT 'pending', review_note TEXT NOT NULL DEFAULT '', checks TEXT NOT NULL DEFAULT '',
 code_hash TEXT, code_secret TEXT, code_expires TIMESTAMPTZ, handover_by TEXT REFERENCES users(id),
 handover_at TIMESTAMPTZ, receipt_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS files (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), kind TEXT NOT NULL, content TEXT NOT NULL,
 mime TEXT NOT NULL DEFAULT 'image/webp', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS messages (
 id TEXT PRIMARY KEY, claim_id TEXT NOT NULL REFERENCES claims(id), sender_id TEXT NOT NULL REFERENCES users(id),
 body TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS notifications (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), title TEXT NOT NULL, body TEXT NOT NULL,
 report_id TEXT, claim_id TEXT, dedupe TEXT UNIQUE, read_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS audit (
 id TEXT PRIMARY KEY, report_id TEXT NOT NULL REFERENCES reports(id), actor_id TEXT NOT NULL REFERENCES users(id),
 action TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS rate_limits (
 key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS reports_category ON reports(category, status, type);
CREATE INDEX IF NOT EXISTS claims_report ON claims(report_id, claimant_id);
CREATE INDEX IF NOT EXISTS notifications_user ON notifications(user_id, created_at);
CREATE INDEX IF NOT EXISTS messages_claim ON messages(claim_id, created_at);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
ALTER TABLE claims ADD COLUMN IF NOT EXISTS handover_photo_id TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS collector_record TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS public_name_consent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS verification_method TEXT NOT NULL DEFAULT '';
ALTER TABLE claims ADD COLUMN IF NOT EXISTS discrepancy_note TEXT NOT NULL DEFAULT '';
ALTER TABLE claims ADD COLUMN IF NOT EXISTS recipient_display_name TEXT NOT NULL DEFAULT '';
`;

const localDir = () => process.env.LOCAL_DATA_DIR || path.join(process.cwd(), '.data');
export { localDir };
export async function database() {
 if (!globalThis.__lostFoundDb) {
  globalThis.__lostFoundDb = (async () => {
   let adapter;
   if (process.env.DATABASE_URL) {
    const { Pool } = await import('pg');
    const pool = new Pool({connectionString: process.env.DATABASE_URL, max: 5});
    adapter = {
     query: (sql, params=[]) => pool.query(sql, params),
     transaction: async fn => {
      const client = await pool.connect();
      try { await client.query('BEGIN'); const result = await fn(client); await client.query('COMMIT'); return result; }
      catch(e) { await client.query('ROLLBACK'); throw e; } finally {client.release();}
     }, close: () => pool.end()
    };
   } else {
    if (process.env.VERCEL) throw new Error('Set DATABASE_URL to a persistent PostgreSQL database before deployment.');
    await fs.mkdir(localDir(), {recursive:true});
    const {PGlite} = await import('@electric-sql/pglite');
    const db = new PGlite(path.join(localDir(),'postgres'));
    await db.waitReady;
    adapter = {query:(s,p=[])=>db.query(s,p), transaction:fn=>db.transaction(tx=>fn(tx)), close:()=>db.close(), exec:s=>db.exec(s)};
   }
   if (adapter.exec) await adapter.exec(schema);
   else await adapter.query(schema);
   return adapter;
  })().catch(e=>{globalThis.__lostFoundDb=undefined; throw e;});
 }
 return globalThis.__lostFoundDb;
}
export async function query(sql, params=[]) {return (await (await database()).query(sql, params)).rows;}
export async function transaction(fn) {return (await database()).transaction(fn);}
