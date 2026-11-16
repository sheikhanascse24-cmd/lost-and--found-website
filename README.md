# Campus Lost N Found

A campus noticeboard for lost and found belongings, private ownership claims, and recorded returns.

**Live website:** https://campus-lost-n-found-gamma.vercel.app

## Current application

The current Next.js application is in [campus-app](campus-app). Its [full documentation](campus-app/README.md) covers configuration, verification, AI assistance and staff access.

- Lost and found reports with photos, category, date and location.
- Search, possible matches and notifications that recognize expired listings.
- Private claims, supporting evidence and conversations.
- Finder approval, declined-claim review requests and clear validation feedback.
- Staff review for sensitive items, serial conflicts and competing claims.
- Collection codes, recipient details, optional private collection photos and receipt confirmation.
- A public Resolved board with private handover records.
- A server-side AI text-comparison aid that suggests related details; ownership decisions remain with reviewers.

## Run locally

Install Node.js 24 and pnpm, then run:

```sh
cd campus-app
pnpm install --frozen-lockfile --ignore-scripts
pnpm dev
```

Open http://127.0.0.1:3100. Local data is stored under campus-app/.data and is excluded from Git.

## Deploy to Vercel

Use **campus-app** as the project root and the **Next.js** framework preset. Set DATABASE_URL, APP_SECRET and APP_URL in Vercel's environment settings. See [the environment template](campus-app/.env.example) for variable names; it contains no credentials.

## Verify

```sh
cd campus-app
pnpm test
pnpm build
```

## Original prototype

The original PHP/MySQL/XAMPP prototype remains in the repository root. Its setup guide is preserved in [LEGACY_README.md](LEGACY_README.md). Existing MySQL accounts and uploaded files are not automatically imported into the new application.

## Data and access

Registration is open for testing. Campus membership verification and designated reception accounts must be configured before institutional rollout. Private evidence and account data are not included in this repository. AI similarity and a registered account do not prove ownership.
