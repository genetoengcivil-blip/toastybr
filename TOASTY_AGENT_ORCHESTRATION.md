# Toasty OS Agent Orchestration

## Architecture

The Toasty OS autonomous agent team follows a hierarchical structure:

```
USER / OWNER
      ↓
TOASTY SUPERVISOR
      ↓
SPECIALIZED AGENTS
      ↓
VALIDATION GATES
      ↓
HUMAN APPROVAL
      ↓
PRODUCTION
```

- The **Supervisor** coordinates the team, delegates tasks, and ensures that all work follows defined gates and receives appropriate approvals.
- **Specialized Agents** (Architect, BackendEngineer, DatabaseArchitect, FrontendEngineer, SecurityEngineer, QA, DevOps, ProductManager, etc.) work within their scope and escalate when necessary.
- **Validation Gates** include QA, Security, Database, and other specialist reviews as dictated by the risk class of the action.
- **Human Approval** is required for production mutations (Risk Class R3 and above) and for certain high-risk actions even if they are reversible.
- **Production** is only reached after all gates are satisfied and human approval is obtained.

## Risk Model

Actions are classified into risk classes:

- **R0**: Read-only operations (e.g., reading files, running lint on a copy)
- **R1**: Local reversible operations (e.g., modifying test files, local configuration that can be easily reverted)
- **R2**: Remote non-destructive operations (e.g., creating a migration file, modifying code that will be built but not yet deployed)
- **R3**: Production mutation operations (e.g., executing a migration, deploying to production, changing RLS policies in production)
- **R4**: Destructive, financial, or permission-critical operations (e.g., dropping tables, executing financial reversals, changing ownership of critical resources)

The allowed risk class for each agent is defined in the Agent Registry (`.claude/AGENTS.md`).

## Handoffs

Every agent must complete their task by returning a handoff in the following format:

```
TASK: [brief description of the task]
STATUS: [YES/NO/partial - whether the task is complete]
FILES READ: [list of files read during the task]
FILES CHANGED: [list of files created or modified]
COMMANDS RUN: [list of significant commands executed]
TESTS: [test results or status]
RISKS: [any risks identified or mitigated]
BLOCKERS: [any remaining blockers]
NEXT RECOMMENDED AGENT: [suggested next agent for follow-up work]
READY FOR HANDOFF: YES/NO
```

The Supervisor uses this handoff to decide the next steps.

## Gates

### Development Gate
For common changes (code, tests, documentation that do not alter production infrastructure):
1. Implementation by the relevant agent (BackendEngineer, FrontendEngineer, etc.)
2. QA review (if tests are involved or if the agent is not QA)
3. Run `npm run verify` to ensure quality gates pass
4. Supervisor closeout

### Database Gate
For migrations and schema changes:
1. DatabaseArchitect prepares the migration and runs static checks locally
2. Security Engineer reviews RLS and grant changes
3. QA runs migration static tests (`npm run test:migrations`)
4. Human approval for production application
5. DatabaseArchitect applies migration with `supabase db push`
6. Verify with `supabase migration list` and `supabase db push --dry-run`
7. QA runs migration static tests again
8. Supervisor closeout

### Production Release Gate
For deploying a new version to production:
1. DevOps prepares the release (update release checklist, verify deployment configuration)
2. QA runs full test suite and verification (`npm run verify`)
3. Security Engineer reviews security headers, CSP, and production configuration
4. Supervisor compiles the release request
5. **Human approval** is required
6. DevOps executes the deployment (to the approved hosting platform)
7. Post-deployment smoke tests (can be manual or automated)
8. Supervisor closeout

### Financial Gate
For changes in financial transactions, AP/AR, sales_payment posting, refund/reversal:
1. Finance Agent (when available) analyzes the change
2. DatabaseArchitect reviews schema and migration aspects
3. Security Engineer reviews authentication and authorization
4. QA ensures tests cover financial logic
5. Human approval is required
6. Supervisor closeout

### Permission Gate
For changes in RLS, grants, organization_members, owner/admin permissions:
1. Security Engineer leads the review
2. DatabaseArchitect implements the changes (if they are schema/migration based)
3. QA tests the permission changes
4. Human approval is required (especially for remote changes)
5. Supervisor closeout

## Operational Agents

Operational agents (FinanceAgent, InventoryAgent, SalesAgent, CRMAgent, OperationsAgent, AnalyticsAgent) are currently at Level 1 (Recommend) and are intended to provide analysis and recommendations. They do not execute changes without escalation to the appropriate engineering agent and human approval.

## Future Toasty Brain

The future vision is to have an AI-assisted "Toasty Brain" that provides recommendations, alerts, and approved actions to operational users. This is not yet implemented.

## Production Controls

- No agent may execute a production deployment without human approval.
- No agent may modify the production database without human approval and the appropriate gates.
- The Supervisor must always verify that the project is linked to the correct Supabase project (`rkgbhvmykbkdyhzxrqee`) before allowing any remote database mutation.
- Secret safety: agents must never log or expose `service_role`, database passwords, PATs, or full JWTs.