# Toasty OS Deployment Documentation

## Table of Contents
1. [Hosting Options](#hosting-options)
2. [Environment Variables](#environment-variables)
3. [Supabase Configuration](#supabase-configuration)
4. [Build Process](#build-process)
5. [Deployment Steps](#deployment-steps)
6. [Rollback Procedure](#rollback-procedure)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)

## Hosting Options
Toasty OS is a static frontend (React + Vite) that can be deployed to any static hosting service that supports SPA routing (fallback to index.html).

### Recommended: Vercel
- Supports SPA routing out of the box with `vercel.json`
- Preview deployments for PRs
- Custom domains and HTTPS

### Alternative: Netlify
- Supports SPA routing with `_redirects` file
- Preview deployments
- Custom domains and HTTPS

### Alternative: Cloudflare Pages
- Supports SPA routing with `_worker.js` or `pages` function
- Preview deployments
- Custom domains and HTTPS

## Environment Variables
The frontend only requires two public environment variables:

- `VITE_SUPABASE_URL`: The Supabase project URL (e.g., https://xyz.supabase.co)
- `VITE_SUPABASE_ANON_KEY`: The Supabase anon key for public access

These are injected at build time by the hosting platform.

**Never** expose:
- service_role key
- database password
- personal access tokens (PAT)
- admin JWT

## Supabase Configuration
Before deploying, ensure your Supabase project is configured correctly:

### Authentication Settings
- Site URL: Set to your production domain
- Redirect URLs: 
  - `https://your-domain.com/login/callback`
  - `https://your-domain.com/*` (for password reset, email change, etc.)
- Email confirmation: Enable if using email sign-in
- Password reset: Enable and set redirect to your domain

### Realtime Publication
Ensure the `sales_orders` table is added to the `supabase_realtime` publication (handled by migration `20260818120000`).

### Row Level Security (RLS)
Verify that RLS is enabled on all tables and that policies are correctly restricting access to the current organization.

### API Exposure
The Supabase REST and Realtime APIs are exposed publicly via the anon key. RLS ensures data security.

## Build Process
Toasty OS uses Vite for building the frontend.

### Local Build
```bash
npm run build
```
Outputs to `/dist` directory.

### Production Build
The same command is used for production. Ensure environment variables are set correctly before building.

## Deployment Steps
1. **Pre-flight Checks**
   - Run `npm run verify` to ensure lint, typecheck, tests, and build pass.
   - Run `npm run test:secrets` to ensure no secrets are leaked.
   - Confirm local and remote Supabase schema are in sync with `npx supabase db push --dry-run`.

2. **Build the Application**
   ```bash
   npm run build
   ```

3. **Upload to Hosting Provider**
   - Vercel: Push to GitHub, Vercel will auto-deploy.
   - Netlify: Push to GitHub, Netlify will auto-deploy.
   - Cloudflare Pages: Push to GitHub, Cloudflare Pages will auto-deploy.

4. **Post-Deployment Verification**
   - Visit the deployed site and check:
     - Login flow works
     - Dashboard loads
     - Realtime updates function (if applicable)
     - No console errors
   - Run smoke tests (see release checklist).

## Rollback Procedure
Since the frontend is static, rolling back is a matter of redeploying a previous build.

### Vercel/Netlify/Cloudflare Pages
1. In the hosting provider's dashboard, select the previous deployment.
2. Trigger a redeploy of that version.
3. Verify the rollback.

### Database Rollback
Supabase migrations are forward-only. To rollback a migration:
1. Create a new migration that reverts the changes.
2. Apply the new migration using `supabase db push`.
3. Never edit an existing migration file.

## Verification
After deployment, run the following checks:
- `npm run lint` (if you have access to the source)
- `npm run typecheck:test`
- `npm run test:migrations`
- `npm run test:run`
- `npm run build` (to ensure no regressions)

## Troubleshooting
### Blank Page
- Check browser console for errors.
- Ensure the SPA routing fallback is correctly configured (all routes to index.html).

### Login Failures
- Verify Supabase Auth settings (Site URL, Redirect URLs).
- Check that the anon key and URL are correct in environment variables.

### Missing Data
- Verify RLS policies are not too restrictive.
- Check that the user belongs to an organization and has the correct role.

### Realtime Not Working
- Confirm the `sales_orders` table is in the `supabase_realtime` publication.
- Check that the Supabase Realtime client is connecting (look for WebSocket errors in console).

## Security Headers
When deploying to a static host, you can often set headers via the platform configuration.

### Recommended Headers
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

### Content Security Policy (CSP)
If implementing CSP, ensure it allows:
- `https://*.supabase.co`
- `wss://*.supabase.co`
- `https://*.cloudflare.com` (if using Cloudflare for analytics or similar)

Avoid overly restrictive CSP that breaks Supabase Realtime.

## Health Check
A simple health check can be implemented by verifying:
- The application loads (HTTP 200 on index.html)
- The Supabase client initializes without error (can be checked via console or a simple endpoint if you have a backend, but Toasty OS does not).

Since there is no custom backend, the health check is implicit in the frontend loading.

## Versioning
The application version can be sourced from:
- `package.json` version
- Git commit SHA (if available in build environment)
- Build date

Display the version in the Settings/About page or via a diagnostics endpoint (if you add one).

## Cache Strategy
- Vite filenames are hashed, allowing long-term caching.
- `index.html` should be served with `Cache-Control: no-cache` to ensure users get the latest version after deploy.

## Local Storage Audit
Toasty OS uses the Supabase client's built-in session storage (localStorage) for auth tokens. No sensitive data is stored elsewhere.

## Dependency Audit
Run `npm outdated` and `npm audit` to check for updates and vulnerabilities. Do not automatically update; review each update.

## CI/CD
The existing CI workflow (`.github/workflows/ci.yml`) runs:
- `npm ci`
- `npm run lint`
- `npm run typecheck:test`
- `npm run test:migrations`
- `npm run test:secrets`
- `npm run test:run`
- `npm run build`

It does not perform any remote database mutations.

For deployment, you can use the hosting platform's built-in CI (Vercel, Netlify, Cloudflare Pages) or add a separate workflow for preview deployments.

## Release Checklist
See `TOASTY_RELEASE_CHECKLIST.md` for a detailed pre-release and post-release checklist.