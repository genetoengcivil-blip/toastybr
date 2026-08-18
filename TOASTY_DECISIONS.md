# Toasty OS — Architecture & Test Decisions

## Phase 13B/13C — Test/Build Separation & Hardening

### Decision: Build must not typecheck or bundle tests
- `tsconfig.app.json` excludes `*.test.ts(x)` and `src/test/**`. Production `tsc -b` and `vite build` therefore never fail on test code and never ship test bundles.
- Rationale: tests legitimately use `vitest/globals`, `@testing-library`, and mock boundaries that are not part of the production graph.

### Decision: Separate `typecheck:test` config
- `tsconfig.test.json` extends `tsconfig.app.json`, sets `noEmit`, relaxes `verbatimModuleSyntax`/`erasableSyntaxOnly` (test-stylistic only), and adds `paths: { "@/*": ["./src/*"] }` so `tsc` resolves the same `@/` alias Vitest uses.
- Real type errors in test files are fixed, never masked with `skipLibCheck`, `any`, or `@ts-ignore`.

### Decision: Minimal global mocks
- `src/test/setup.ts` mocks only `sonner` and `react-router-dom`. `@tanstack/react-query` is NOT globally mocked; hooks are tested with a real `QueryClient` (`retry:false`) via `createTestQueryClient()`.
- Test-specific boundaries (Supabase client, schemas) are mocked per-file with `vi.mock`.

### Decision: E2E scripts are env-driven, never commit credentials
- `tests/*.mjs` read `TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `TEST_ORG_ID` and abort if missing. No hardcoded project URL, anon JWT, password, or org UUID remains versioned.
- `.env.example` holds only placeholders. `.env.test.example` documents required test vars.

### Decision: Destructive DB tests gated
- `npm run test:db` requires `TEST_DATABASE_CONFIRMATION=TOASTY_TEST_ONLY` and never falls back to the active/remote project. The guard hardcodes the known production project id only to detect accidental use.

### Decision: Migration static checks as a contract
- `src/test/scripts/migration-tests.mjs` enforces structural contracts (idempotency, security, tenant safety) for all migrations including analytics RPCs.

### Decision: Analytics RPCs follow established patterns
- All analytics RPCs (20260818130000 through 20260818130005) follow the established pattern: SECURITY DEFINER, SET search_path = public, tenant validation via is_member_of, and timezone-aware bucketing using organization timezone.
- Returns types are consistently jsonb for aggregations.
- Grants follow least-privilege model: REVOKE from PUBLIC/anon, GRANT to authenticated only.

### Decision: Realtime subscription follows supabase best practices
- Realtime migration 20260818120000 adds sales_orders table to supabase_realtime publication with appropriate filtering.
- Follows the pattern established by other realtime publications in the codebase.tent `has_org_role(org, role)`, `nextval(%L)` order sequence, finance/staff/split-payment invariants, CHECK-subquery allowlist, `SECURITY DEFINER` + `search_path`, broad-grant and DROP protection). A self-test fixture proves the `has_org_role` detector fires on the single-arg form.

### Decision: RHF `<select>` in jsdom portals
- Component tests assert rendering/validation/cancel rather than happy-path native-select submission, because react-hook-form does not reliably capture `<select>` value changes inside Radix portals under jsdom. The mutation happy-path is covered at the hook layer. This is a test-environment limitation, not a product defect.

### Decision: Realtime is notification-only (Phase 14)
- Supabase Realtime Postgres Changes on `sales_orders` (filtered by `organization_id`) drives cache invalidation via TanStack Query. Realtime never performs business mutations; `update_order_status` / `finalize_sales_order` RPCs remain authoritative, so finance/inventory effects stay server-side.
- One channel per view per org (`orders:<org>`, `kitchen:<org>`) with deterministic names — no UUID-per-render, no channel-per-order.
- Tenant isolation is delegated to the table's existing RLS; the `supabase_realtime` publication is extended with `sales_orders` only (idempotent), never `for all tables` and never finance/inventory tables.
- Kitchen's prior 15s polling is removed; window-focus refetch (TanStack default) covers events missed during tablet suspension.
