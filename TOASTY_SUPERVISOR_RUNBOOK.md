# Toasty Supervisor Runbook

## How to Accept a Task
1. Read the task description from the user or system.
2. Decompose the objective into smaller, verifiable tasks if needed.
3. Classify the risk of each subtask using the risk classes (R0-R4).
4. Assign each subtask to the appropriate specialized agent based on scope and risk.
5. Define the order of execution, respecting dependencies.
6. Instruct each agent to proceed, ensuring they understand they must follow the handoff format and validation gates.

## How to Inspect
Before delegating, the Supervisor must:
- Read the current state of the project by reviewing:
  - TOASTY_PROGRESS.md (for latest status)
  - TOASTY_DECISIONS.md (for architectural and testing decisions)
  - TOASTY_ARCHITECTURE.md (for overall architecture)
  - CLAUDE.md (for project guidelines)
  - Any other documents relevant to the task.
- Verify that the Supabase project is the correct one (rkgbhvmykbkdyhzxrqee) by running `npx supabase projects list` if remote actions are considered.
- Check for any open blockers in the progress log or decision documents.

## How to Delegate
When assigning a task to an agent:
- Provide a clear, concise task description.
- Reference any required reads (the agent should know their required reads, but the Supervisor can point out specific files).
- Remind the agent of the handoff format they must follow.
- Specify if any validation gates (QA, Security, etc.) are required before the task can be considered complete.
- Set expectations for communication (the agent will return a handoff upon completion).

## How to Validate
Upon receiving a handoff from an agent:
- Verify that the handoff follows the required format.
- Check that the STATUS is YES (or acceptable partial status) and that READY FOR HANDOFF is YES.
- Ensure that the FILES READ and FILES CHANGED are reasonable and documented.
- Confirm that any COMMANDS RUN are expected and did not violate forbidden actions.
- If tests were run, check that they passed.
- Verify that any RISKS were identified and mitigated or escalated.
- Ensure that BLOCKERS are either nonexistent or have a plan for resolution.
- If the task required validation gates (e.g., QA, Security), confirm that the agent has obtained the necessary approvals (this might be indicated in the handoff or require Supervisor to check with the relevant agent).
- For tasks that affect production readiness, ensure that the appropriate gates (Development, Database, Production Release, etc.) have been followed.

## How to Escalate
The Supervisor should escalate to:
- Human approval for any production deployment, database migration, or security policy change (Risk Class R3 and above).
- Security Engineer for RLS, grants, or authentication changes.
- Database Architect for schema or migration changes.
- QA for test strategy or quality gate concerns.
- Product Manager for scope or feature definition questions.
- The relevant engineering agent (Backend/Frontend) for contract alignment issues.

## How to Close a Task
A task can be marked as complete when:
- The objective has been fully satisfied.
- All subtasks have been completed and validated.
- No blockers remain.
- Progress documentation (TOASTY_PROGRESS.md, TOASTY_DECISIONS.md) has been updated to reflect the new state.
- The Supervisor has confirmed that the work complies with all architectural decisions and quality gates.
- The handoff from the final agent indicates READY FOR HANDOFF: YES and STATUS: YES.

## How to Recover from Failure
If an agent reports failure or if a validation gate fails:
1. Analyze the error or failure reason from the handoff or logs.
2. Determine if the failure is due to a misunderstanding, missing information, or a genuine obstacle.
3. If it's a misunderstanding or missing information, clarify and re-delegate.
4. If it's a genuine obstacle (e.g., a test failure, a design conflict), work with the agent to resolve it, possibly involving other specialists.
5. Update the task description or plan as needed.
6. Ensure that any failure is documented in the progress log or decision documents so that the team learns from it.
7. Do not mark the task as complete until the failure is resolved and the validation gates pass.