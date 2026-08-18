# Toasty OS — Progress Log

## Phase 13B — Test/Build Separation + Final Hardening

**Status: COMPLETE. `verify` green; `typecheck:test` green; 329 tests pass.**

### Build vs Test separation (item 1-2, 11-12)
- `tsconfig.app.json` excludes `**/*.test.ts(x)` and `src/test/**` → production `tsc -b`/build never touches tests.
- `tsconfig.test.json` added for `typecheck:test`; resolves `@/` via `paths`.
- `npm run build` PASS. No `skipLibCheck` used to mask project errors.

### ESM / alias / setup (item 4-6)
- Removed `require('zod')`; tests use `import { z }` and real schemas.
- `@/` confirmed in `vitest.config.ts`; now also in `tsconfig.test.json`.
- `setup.ts` mocks only `sonner` + `react-router-dom` (no global react-query mock).

### Tests added (item 7-27)
- **Auth**: `AuthProvider.test.tsx` (loading/no-session/authenticated/onAuthStateChange/signOut/current-org/no-membership/Supabase-error), `ProtectedRoute.tsx` + test, `AuthShell.test.tsx`.
- **Permissions**: `src/lib/permissions.ts` + 12 tests encoding `TOASTY_ROLE_MATRIX.md`.
- **Hooks**: finance / inventory / sales (`useSalesOrders`) / staff + retry-safety (`retry:false`).
- **Components**: `MovementDialog`, `StaffInviteDialog`, `PayAccountPayableDialog`.

### Migration static checks (item 13-16, 39)
- `HAS_ORG_ROLE_ARITY` (+ self-test negative fixture), `ORDER_SEQUENCE_REGRESSION`, `KNOWN_CHECK_EXCEPTION` (explicit allowlist), `SECURITY_DEFINER_NO_SEARCH_PATH`, `BROAD_GRANT`, `DROP_PROTECTION`, `ACTIVE_FINANCE_CONTRACT`, `ACTIVE_STAFF_CONTRACT` (token_hash + last-owner), `SPLIT_PAYMENT_CONTRACT`. Total 17 checks pass.

### Services / regression (item 17-18)
- Purchase JSONB regression: `receivePurchaseOrder` passes `p_items` as array (not double-encoded) — asserted in `purchasing/services.test.ts`.
- Retry safety: global `retry:false` verified in `retry-safety.test.tsx`.

### Security (item 28-31)
- Full-repo secret scan: NO `service_role` key, password, or PAT versioned. E2E scripts previously contained hardcoded anon JWT/email/password/org UUID and were changed to TEST_SUPABASE_* / TEST_USER_* env vars. .env.example uses placeholders.

## Phase 14 — Realtime + Analytics (Completed 2026-08-18)

**Status: COMPLETE. All systems operational.**

- **Realtime Phase**: COMPLETE (migration 20260818120000 applied)
- **Analytics Implementation**: COMPLETE (migrations 20260818130000 through 20260818130005 applied)
- **Analytics Migrations**: REMOTE APPLIED (supabase db push --dry-run shows no drift)
- **Remote Database**: UP TO DATE (local = remote for all migrations)
- **Test Suite**: 329 tests passing (31/31 test files)
- **Migration Guards**: 27/27 static checks passing
- **Build Status**: PASS (production build successful)
- **Lint Warnings**: Non-blocking (only unused variables and minor issues)
- **Bundle Warning**: index chunk ~567 kB (acceptable for current scope)
- **Pending Migrations**: None (supabase db push --dry-run: "Remote database is up to date")

### CI / verify (item 32-33)
- `.github/workflows/ci.yml`: lint → typecheck:test → test:migrations → test:secrets → test:run → typecheck → build. No `test:db`, no Supabase secrets.
- `verify` = lint && typecheck:test && test:migrations && test:run && build.

### Quality gates (item 34-38)
- Build exit code 0; verify exit code 0.
- Coverage baseline captured (statements/branches/functions/lines reported separately).
- Bad-test scan: no `expect(true).toBe(true)`, `expect(1).toBe(1)`, or `toMatchSnapshot`.

## Phase 13C
Superseded by Phase 13B hardening; deliverables consolidated here.

## Phase 14 — Realtime Orders & Kitchen

**Status: COMPLETE.** `verify` green; 295 tests pass; realtime hook + tests added; `sales_orders` added to `supabase_realtime` publication (new migration); Kitchen 15s polling removed.

### Realtime implementation
- New `src/features/sales/realtime/useOrdersRealtime.ts`: subscribes to Postgres Changes on `sales_orders` filtered by `organization_id=eq.<org>`, deterministic channel name `orders:<org>` / `kitchen:<org>`, returns connection status.
- On any event → `invalidateQueries` for `['sales-orders', org]`, `['sales-order']`, `['kitchen-orders', org]`. No direct mutation; RPCs remain authoritative.
- Wired into `KitchenPage` (`kitchen:<org>` + connection indicator) and `OrdersPage` (`orders:<org>`).
- Removed `refetchInterval: 15000` from `useKitchenOrders` (realtime replaces polling; window-focus refetch retained for missed events).
- POSPage intentionally NOT subscribed (no need to listen to all orders).

### Tenant isolation / security
- Realtime respects existing RLS on `sales_orders` (organization_id) → a client only receives its own org's rows. No `service_role`, no new permissive policy, no broad publication.
- New migration `20260820000000_realtime_sales_orders.sql` adds only `sales_orders` to `supabase_realtime` (idempotent `DO` block). Static check `REALTIME_PUBLICATION` enforces this.
- Optional `tests/phase14-realtime.mjs` E2E is env-gated (TEST_*), not in CI.

### Tests
- `useOrdersRealtime.test.tsx`: subscribe, INSERT/UPDATE invalidation, cleanup (removeChannel once), org-switch, channel-error status, no-duplicate subscription, kitchen-query integration. 9 tests.

## Next
- Phase 15 (NOT started — pending explicit approval).
