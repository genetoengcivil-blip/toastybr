# Toasty OS — Testing Guide (Phase 13B/13C)

## Commands

| Command | Purpose |
| --- | --- |
| `npm run test` | Vitest watch |
| `npm run test:run` | Single test pass (CI) |
| `npm run test:coverage` | Test pass + coverage report (`coverage/`) |
| `npm run test:migrations` | Static regression checks over `supabase/migrations` |
| `npm run test:secrets` | Fails if secrets committed to `src`/`supabase` |
| `npm run test:db` | Guarded destructive DB tests (isolated test project only) |
| `npm run typecheck` | `tsc -b --force` (production types) |
| `npm run typecheck:test` | `tsc -p tsconfig.test.json` (test files only) |
| `npm run verify` | `lint && typecheck:test && test:migrations && test:run && build` |

## Build vs Test separation (Phase 13B)

- `tsconfig.app.json` (production) **excludes** `**/*.test.ts(x)` and `src/test/**` so the production `tsc -b` build never typechecks tests, and `vite build` never bundles test code.
- `tsconfig.test.json` (test typecheck) extends it, sets `noEmit`, relaxes `verbatimModuleSyntax`/`erasableSyntaxOnly`, and adds `paths: { "@/*": ["./src/*"] }` so `tsc` resolves the `@/` alias that Vitest resolves via `vitest.config.ts`.
- Real project type errors in tests are fixed, not skipped (no `skipLibCheck` for project code, no `any`, no `@ts-ignore`).

## Test layering

1. **Unit** — `*.test.ts`: pure functions, Zod schemas, service builders, cost engine.
2. **Hooks** — `*.test.tsx`: TanStack Query hooks with a real `QueryClient` (`retry:false`).
3. **Components** — `*.test.tsx`: `@testing-library/react`; Radix portals render under `document.body` — query via `document.querySelector('form')`.
4. **Migration static checks** — `src/test/scripts/migration-tests.mjs`: duplicates, CHECK-subquery allowlist, `SECURITY DEFINER`/`search_path`, broad grants, DROP protection, `has_org_role` 2-arg arity (with self-test fixture), order-sequence, finance/staff/split-payment contracts.
5. **DB (isolated only)** — `src/test/scripts/test-db-guard.mjs` requires `TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY`, `TEST_DATABASE_CONFIRMATION=TOASTY_TEST_ONLY`.

## Conventions

- **ESM only** (`"type":"module"`). No `require()`; use `import` + `vi.hoisted`.
- `@/` alias is resolved by Vitest (`vitest.config.ts`) and now also by `tsconfig.test.json`. Tests use relative or `@/` imports consistently.
- `setup.ts` mocks `sonner` and `react-router-dom` only. No global `@tanstack/react-query` mock — hooks use a real `QueryClient`.
- Prefer `screen.getByRole` / `getByPlaceholderText`. Avoid `/senha/i` label regexes that also match toggle buttons (`aria-label="Mostrar senha"`).
- Use `createTestQueryClient()` from `src/test/test-utils.tsx` for hook tests.

## Known gotchas

- **react-hook-form + native `<select>`** does not reliably capture value changes in jsdom when the select is inside a Radix portal. Component tests assert rendering, validation wiring, and cancel; the mutation happy-path is covered by the hook `*.test.tsx`.
- Always `vi.clearAllMocks()` in `beforeEach`.
- Use `waitFor` around async mutations; never `await` a mocked `mutateAsync` directly.

## Realtime tests (Phase 14)

- `src/test/mocks/supabase.ts` exposes a memoized mock Realtime channel (`client.channel(name)`) with `_emit(type, table, payload)` and `_setStatus(status)` test helpers; `removeChannel` records call count.
- `useOrdersRealtime.test.tsx` covers: subscription + deterministic channel name, INSERT/UPDATE cache invalidation, single cleanup on unmount, channel switch on org change, `CHANNEL_ERROR` → `error` status, no-duplicate subscription on rerender, and a kitchen-query integration proving a new-order event refreshes the cache.

## Database & secret safety (Phase 13B)

- **E2E scripts** (`tests/*.mjs`) are **parameterized**: they read `TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `TEST_ORG_ID` from env and abort with a clear message if unset. No hardcoded URL / anon JWT / password / org UUID remains in versioned files.
- `.env.example` uses placeholder values (`YOUR_PROJECT` / `YOUR_ANON_KEY`).
- `npm run test:db` aborts unless `TEST_DATABASE_CONFIRMATION=TOASTY_TEST_ONLY` is set explicitly.
- `npm run test:secrets` scans `src`/`supabase` for leaked JWTs, service-role keys, and connection strings.
- No `service_role` key, user password, or PAT is committed anywhere in the repo.
