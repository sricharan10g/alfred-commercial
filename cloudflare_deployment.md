# Cloudflare Deployment Guide

## Build Configuration
To ensure deterministic builds, we use a pinned version of `@cloudflare/next-on-pages` and a specific build script.

- **Build Command:** `npm run build:cf`
- **Output Directory:** `.vercel/output/static`
- **Root Directory:** `/` (or leave empty)

> [!IMPORTANT]
> Do NOT use `npx @cloudflare/next-on-pages` directly in the Cloudflare dashboard. Always use `npm run build:cf` to use the pinned version in `package.json`.

## Environment Variables
Ensure the following variables are set in Cloudflare Pages settings:
- `AI_PROVIDER_KEY`
- `APP_ENV` (production/staging)

## Deployment Locking
We have locked the build pipeline to `next-on-pages` v1.13.16 to prevent breaking changes from auto-updates.

---

## Planned: migrate next-on-pages → OpenNext

We plan to migrate from the standard `next-on-pages` adapter to `OpenNext` for better Next.js feature support.

### Acceptance Criteria
- [ ] Staging deploy is Green (successful build and deploy).
- [ ] Production deploy is Green.
- [ ] Homepage loads correctly and is interactive.
- [ ] `/api/ai/generate` endpoint functions correctly (streaming/generation works).
- [ ] No runtime errors in Cloudflare logs specific to the adapter.
