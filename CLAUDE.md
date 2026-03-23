# CLAUDE.md – CORE Prototype

## Project Overview
CORE is a dealflow infrastructure and screening platform for VC funds in the DACH region.
The codebase is currently a single-file HTML prototype being refactored into a clean multi-file structure.

---

## Skills

Skills are located in `claude/skills/`. You MUST read and follow the relevant skill before starting any task.

### When to use which skill

| Situation | Skill to use |
|---|---|
| Starting any new feature or component | `claude/skills/brainstorming` |
| Before writing any code | `claude/skills/writing-plans` |
| Executing an implementation plan | `claude/skills/executing-plans` |
| Building UI / frontend components | `claude/skills/frontend-design` |
| Fixing a bug or unexpected behavior | `claude/skills/systematic-debugging` |
| About to finish / merge work | `claude/skills/finishing-a-development-branch` |
| Requesting a code review | `claude/skills/requesting-code-review` |
| Receiving code review feedback | `claude/skills/receiving-code-review` |
| Running parallel tasks | `claude/skills/dispatching-parallel-agents` |
| Working with git worktrees | `claude/skills/using-git-worktrees` |
| Writing tests | `claude/skills/test-driven-development` |
| Before completing a task | `claude/skills/verification-before-completion` |
| Creating or editing skills | `claude/skills/writing-skills` |
| Starting any conversation | `claude/skills/using-superpowers` |

### Rule
If there is even a 1% chance a skill applies — read it first. Never skip this step.

---

## Tech Stack
- Frontend: HTML, CSS, JavaScript (single-file prototype → being refactored)
- Backend/DB: Supabase
- Hosting: TBD

---

## Key Principles
- Always read `CLAUDE.md` at the start of every session
- Always check for a relevant skill before taking action
- Never write code without a plan (`writing-plans` first)
- Never start a feature without brainstorming (`brainstorming` first)
