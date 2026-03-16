# Restart Handover — Read This First

## What you are doing
Implementing the MEGA-OX network multiplayer platform. Everything has been planned and designed. You are starting the implementation.

## Before you type anything in Claude Code

1. **Create a new Supabase account** at supabase.com using a new email address
2. **Create a new Supabase project** — note the Project URL and anon public key (Project Settings → API)
3. **Get your Supabase access token** at supabase.com → Account → Access Tokens

## First message to send Claude Code

Paste this exactly:

> I've restarted. I have a new Supabase project ready with my URL, anon key, and access token. Please read `docs/plans/RESTART-HANDOVER.md`, `docs/plans/2026-03-16-handover.md`, and `docs/plans/2026-03-16-implementation-plan.md`, then begin executing the implementation plan from Task 1 using the `superpowers:executing-plans` skill.

Then when Claude asks for your Supabase credentials, provide:
- Project URL
- Anon public key
- Access token

## Where everything lives

| Document | What it is |
|---|---|
| `docs/plans/2026-03-16-implementation-plan.md` | Step-by-step build instructions — 22 tasks |
| `docs/plans/2026-03-16-network-multiplayer-design.md` | Full system design and all DB tables |
| `docs/plans/2026-03-16-handover.md` | Full context on every decision made |
| `docs/design-log.md` | Running log of major design decisions |

## Current state of the codebase

Nothing has been built yet — only planning documents. The app still runs as a local-only game. Implementation starts from Task 1.

## MCP plugins enabled (active after restart)

- Supabase — will need your access token to connect
- Vercel — will need your Vercel account connected
- GitHub — already authenticated
