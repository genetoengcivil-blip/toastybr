# Toasty OS Release Checklist

## Pre-Release (Local)

### Code Quality
- [ ] Run `npm run lint` and fix any errors (warnings are acceptable if non-blocking)
- [ ] Run `npm run typecheck:test` and ensure no new type errors
- [ ] Run `npm run test:migrations` and ensure all migration static checks pass
- [ ] Run `npm run test:secrets` and ensure no secrets are leaked
- [ ] Run `npm run test:run` and ensure all tests pass
- [ ] Run `npm run build` and ensure production build succeeds
- [ ] Run `npm run verify` to confirm all checks pass

### Environment
- [ ] Verify `.env.example` contains only placeholders for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Ensure no `.env` or `.env.local` files are committed (they should be in `.gitignore`)
- [ ] Confirm that the frontend only uses `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`

### Supabase
- [ ] Run `npx supabase projects list` and confirm the linked project is `rkgbhvmykbkdyhzxrqee` (Toast)
- [ ] Run `npx supabase migration list` and ensure local and remote migrations are in sync
- [ ] Run `npx supabase db push --dry-run` and confirm "Remote database is up to date"

### Build Output
- [ ] Check bundle sizes (optional but recommended)
- [ ] Ensure the build output is in the `/dist` directory
- [ ] Verify that the build does not contain any development-only code (e.g., `process.env.NODE_ENV !== 'production'` checks that should be stripped)

## Release Process

### Migrations (if any)
- [ ] If there are new migrations, review them for correctness and safety
- [ ] Run `npx supabase db push --dry-run` to preview the changes
- [ ] Apply migrations with `npx supabase db push`
- [ ] After applying, run `npx supabase migration list` to confirm they are applied
- [ ] Run `npx supabase db push --dry-run` again to confirm no drift

### Frontend Deployment
- [ ] Build the frontend: `npm run build`
- [ ] Deploy the `/dist` directory to your chosen hosting provider (Vercel, Netlify, Cloudflare Pages, etc.)
- [ ] Ensure the hosting provider is configured for SPA routing (all routes serve `/index.html`)

## Post-Release Verification

### Smoke Tests
- [ ] Visit the deployed site and verify:
  - [ ] The site loads without console errors
  - [ ] Login flow works (with test credentials)
  - [ ] Dashboard loads and shows expected data
  - [ ] Realtime updates function (if applicable and configured)
  - [ ] Navigation to all major pages works (direct URL refresh)
  - [ ] Error boundaries work (trigger an error and verify fallback UI)
  - [ ] Version number is visible in Settings/About (if implemented)

### Supabase Verification
- [ ] Confirm that the Supabase project is still `rkgbhvmykbkdyhzxrqee`
- [ ] Run `npx supabase db push --dry-run` to ensure no drift after deployment
- [ ] Check that Realtime publication includes `sales_orders` (if using realtime features)

### Monitoring
- [ ] Check error logs (if using an error monitoring service)
- [ ] Monitor performance metrics (if applicable)

## Rollback Procedure

### Frontend
- [ ] Redeploy the previous build from your hosting provider's dashboard
- [ ] Verify the rollback with smoke tests

### Database (if a problematic migration was applied)
- [ ] Create a new migration that reverts the changes
- [ ] Apply the new migration with `npx supabase db push`
- [ ] Verify the rollback with smoke tests and migration checks

## Notes
- This checklist is designed for a release that may include both frontend and database changes.
- If there are no database changes, skip the migration steps.
- Always ensure that the Supabase project linked is the correct one (Toast, ref: rkgbhvmykbkdyhzxrqee).
- Never run destructive database tests (`npm run test:db`) against the production project.