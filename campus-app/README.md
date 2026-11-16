# Campus Lost N Found

A campus lost-and-found application with public discovery, private ownership claims, an AI text-comparison aid, reception custody, and recorded returns.

## Run locally

Use Node.js 24 and pnpm.

```sh
pnpm install --ignore-scripts
pnpm dev
```

Open `http://127.0.0.1:3100`.

Local data persists in `.data/postgres`. An automatically generated local encryption key stays in `.data/encryption-key`. Back up both together. Do not delete the key while retaining encrypted evidence. Neither belongs in a public repository.

The original PHP/XAMPP application remains in the parent folder. This directory contains the new Vercel-compatible application. Existing MySQL accounts and uploads are not imported automatically.

## Implemented workflows

- Register, sign in, sign out, update a profile and profile photograph.
- Post lost and found reports with category, time, location/route, optional public image and separate encrypted identification details.
- Search and filter the noticeboard, including an independent Resolved section.
- Match opposite report types using category, description, place and date. Show explanations and deduplicate in-app notifications.
- Submit private claims with category-specific questions, free text, an optional supporting image and an optional linked lost report.
- Limit claim submissions to two per account/item in 30 minutes without revealing correct answers.
- Private claim conversations, reviewer evidence comparisons, alternate checks and staff-supervised handling of valuable categories.
- AI comparison of private descriptions using a server-side MiniLM embedding model. It produces review suggestions, never ownership decisions or automatic releases.
- Reject the ordinary approval path when serial numbers conflict. Authorized staff must document a separate check and the discrepancy resolution.
- Receive a physical deposit at reception, with a staff acknowledgement and storage reference.
- Approve collection, generate an expiring single-use collection code, record handover, then obtain recipient confirmation.
- Reopen a declined claim to review additional evidence. The finder can explicitly reclassify a routine low-value mouse, keyboard, receiver, cable or adapter from Electronics into Computer accessories, with an audited explanation. Valuable electronics, serial conflicts and disputes retain staff controls.
- Claimants can privately request another review and describe additional evidence. The request notifies reviewers and preserves the earlier decision until a reviewer reopens it. A four-stage tracker explains review, approval, handover and receipt.
- At collection, capture a current photo through the browser camera or upload an existing photo. Record the recipient’s name, department and campus identifier privately before handover.
- Record an optional private collection photo, recipient identity snapshot, department, campus identifier, place and time. Evidence images stay private and encrypted.
- Staff-authorized walk-in returns with identity checks, recorded reasons for release and recipient acknowledgement. Active or competing claims block this shortcut.
- Publish the returned item and, only with agreement, the recipient's display name on the Resolved board. Photo and identity details remain private.

## Staff access

Create an ordinary account first. With the application server stopped in local PGlite mode, an operator can promote that registered account:

```sh
node --env-file-if-exists=.env.local scripts/staff.mjs reception@example.com
```

Restart the app and refresh the session. Public registration cannot select a staff role. For a hosted database, run the same script with that database's connection configured securely. Do not place database credentials in Git or share them in chat.

## AI model

The server runs `Xenova/all-MiniLM-L6-v2` with Transformers.js, pinned to model revision `08a308f628bc9d6774b7922f319eb1b65afa1a82`. First use downloads public model files from Hugging Face and caches them locally, or under the function's temporary directory on Vercel. Private evidence stays on the application server and is not sent to a hosted inference API. A cold start may take longer and model downloads require outbound network access.

The model compares meaning, not ownership. A related sentence, an exact serial match, a registered account, a photograph or a Bluetooth connection can each be insufficient on its own. Reviewers must assess appropriate independent evidence. Generic, identical items may remain unverified.

Model source and license: https://huggingface.co/Xenova/all-MiniLM-L6-v2 (Apache-2.0). Transformers.js: https://github.com/huggingface/transformers.js (Apache-2.0). The model retains its upstream license. No unrelated lost-and-found repository code has been copied.

## Deploy to Vercel

Deploy this directory (`campus-app`) as the Vercel project root using the Next.js framework preset and Node.js 24. The live deployment is https://campus-lost-n-found-gamma.vercel.app. Keep deployment secrets in Vercel's environment settings.

Set these environment variables before deploying:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Persistent PostgreSQL connection string, for example a Neon pooled URL with TLS |
| `APP_SECRET` | A random secret of at least 32 characters, kept stable across deployments |
| `APP_URL` | The final HTTPS origin after deployment |
| `COLLEGE_EMAIL_DOMAIN` | Optional restriction, for example `college.ac.in` |

Generate a secret with:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Use encrypted Vercel environment variables. Never use `NEXT_PUBLIC_` for these values. The app refuses to initialize the database on Vercel without persistent `DATABASE_URL` configuration. Private fields and evidence use AES-256-GCM. Changing `APP_SECRET` without re-encryption makes historical encrypted records unreadable.

The database schema initializes automatically. For larger installations, manage schema changes through a dedicated migration stage and separate runtime/database permissions. Uploaded images persist in PostgreSQL in this first release. A later storage adapter can move them into private object storage with equivalent access controls.

## Verification

```sh
pnpm test
pnpm build
```

Tests cover server authentication, cross-origin write rejection, matching, private evidence authorization, messaging, multi-stage return transitions, private photo capture, immutable collector snapshots, serial-conflict gates, reception custody, competing claims, walk-in returns, rate limits and session revocation. Use separate member and staff accounts to test an actual return end to end.

## Deployment and campus-rollout limits

- Registration is open for testing. Mailbox ownership and college membership are not verified. An email-domain restriction does not constitute verification. Connect institutional sign-in before claiming that accounts are verified.
- Notifications are in-app. Refresh the dashboard or notification page to check updates. There is no background email/SMS delivery.
- The AI assistant compares text only. It does not authenticate photographs, receipts or identity documents. OCR and visual similarity are not implemented.
- Reception and valuable-item flows need designated staff accounts. A collection photo creates accountability and does not prove ownership.
- Public report photos must not expose sensitive identifying details. Evidence files receive actual image decoding, dimension limits and metadata removal before storage.
- Before campus-wide rollout, establish staff responsibilities, dispute procedures, backup/recovery, and an evidence-retention/deletion policy. This release does not automatically purge evidence or user accounts.
- Rate limits persist in PostgreSQL. Public registration is vulnerable to determined multi-account abuse until institutional identity verification is in place.

No author names or developer credits appear in the application.
