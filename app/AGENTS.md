# AGENTS.md

# Rental Tracker

**Version:** 2.0

Rental Tracker is a documentation-first, AI-first software project. This file is the operating manual for all AI agents and developers working in this repository.

---

# Mission

Build a lightweight, maintainable rental management application for a small residential property.

The application currently supports two rental units and focuses on making the monthly billing process fast, accurate, and repeatable.

---

# Core Philosophy

## Documentation First

Documentation is the single source of truth.

If documentation and code disagree, **documentation wins**.

## Simplicity First

Solve today's problem without introducing unnecessary complexity.

## Consistency First

Maintain consistent architecture, UI, naming, and coding conventions.

## AI First

Write code that another AI agent can immediately understand and continue.

---

# Required Reading Order

Before implementing any feature, read the documentation in this order:

1. docs/project/
2. docs/architecture/
3. docs/product/
4. docs/design/
5. docs/development/
6. docs/engineering/

Never skip this reading order.

---

# Repository Structure

docs/
- project/
- architecture/
- product/
- design/
- development/
- engineering/

ai/
Reusable AI workflows, prompts and templates.

app/
Next.js application.

---

# Engineering Documentation

The engineering folder contains institutional knowledge about how the project should be built.

Read these documents before making implementation decisions:

- Known Architectural Constraints
- Lessons Learned
- Preferred Implementation Patterns
- Common Pitfalls
- Project Glossary

These documents define *how* to engineer the system, not *what* the system does.

---

# Technology Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- Supabase Auth
- Resend
- Vercel
- jsPDF

---

# Business Rules

Business rules must never be modified unless the documentation is updated.

Electricity calculations:

Unit 1
(Current Reading − Previous Reading) × Electricity Rate

Unit 2
Mother Meter Bill − Unit 1 Electricity Cost

---

# Architecture Rules

- Business logic belongs in services.
- UI components should remain presentation-focused.
- Never duplicate calculations.
- Never hardcode configurable values.
- Never bypass documented workflows.

---

# Feature Workflow

1. Read documentation.
2. Explain implementation plan.
3. Identify impacted files.
4. Implement.
5. Test.
6. Self-review.
7. Wait for approval.

---

# Definition of Done

A feature is complete only when:

- TypeScript compiles
- Lint passes
- Matches documentation
- Business rules preserved
- Responsive
- Accessible
- No duplicated logic
- Documentation updated if necessary

---

# AI Behaviour

Never:

- Invent requirements
- Guess business rules
- Implement undocumented behaviour

If documentation is ambiguous:

STOP.

Explain the ambiguity.

Ask for clarification before coding.

---

# Git

Use Conventional Commits:

- feat:
- fix:
- refactor:
- docs:
- chore:
- test:

Keep commits focused and small.

---

# Final Principle

Read before implementing.

Think before coding.

Prefer maintainability over cleverness.

Leave the repository in a better state than you found it.
