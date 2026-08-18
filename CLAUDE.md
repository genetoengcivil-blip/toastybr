# Toasty OS Project Rules

* Use `toasty-documentation` para documentação.
* Use `toasty-architecture` para decisões arquiteturais.
* Use `toasty-database` para schema e migrations.
* Use `toasty-ai` para agentes e inteligência.
* Use `toasty-security` para segurança.
* Use `toasty-ui` para UI/UX.
* Use `toasty-qa` para qualidade.
* Use `toasty-restaurant-ops` para validação operacional.

## Mandatory File Tool Policy

For file operations, follow these rules strictly:

1. READ:
   Always use the native Read tool when available.
   Never use bash, PowerShell, cmd, cat, Get-Content, type, sed, awk, or shell commands to read files.

2. CREATE:
   Always use the native Write/Create tool when available.
   Never use shell redirection, echo, Set-Content, Out-File, or PowerShell to create files.

3. EDIT:
   Always use the native Edit tool when available.
   Never use PowerShell, sed, perl, Python scripts, or shell commands to modify files when Edit is available.

4. VERIFY:
   After every file creation or edit, use the native Read tool to verify the resulting file.

5. TERMINAL:
   Use terminal/bash only for commands that do not have an equivalent native tool, such as:
   - npm
   - pnpm
   - git
   - tests
   - builds
   - database CLI
   - process execution

6. If a native file tool is available, using terminal for the same filesystem operation is considered an error.

## Mandatory File Tool Policy

- Always use native Read for reading files.
- Always use native Write/Create for creating files.
- Always use native Edit for modifying files.
- Never use bash, PowerShell, cmd, Get-Content, Set-Content, Out-File, shell redirection, Python scripts, sed, awk, or similar commands for file operations when a native filesystem tool is available.
- Always read a file before editing it.
- After every creation or edit, use native Read to verify the result.
- Use terminal only for operations without a native equivalent, such as npm, pnpm, git, tests, builds, database CLI, and process execution.
- If a native filesystem tool exists, using terminal for the equivalent file operation is considered an error.

## Agent Governance

For multi-domain or production-readiness work, use ToastySupervisor and follow TOASTY_AGENT_ORCHESTRATION.md.
Human approval gates cannot be bypassed.