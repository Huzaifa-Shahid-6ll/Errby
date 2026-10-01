# Errby — hackathon implementation blueprint

> **Current scope — 1 October 2026:** This is the historical discovery blueprint. The active product is student-only chat: no teacher dashboard, class joining, publication or approval workflow. [Chat-first decisions](../implementation/CHAT_FIRST_PLAN.md), [25-pattern UX plan](../implementation/UX_PATTERN_PLAN_2026-10-01.md), [learning audit](../implementation/LEARNING_AUDIT_2026-10-01.md), and [setup status](../SETUP_STATUS.md) supersede conflicting passages below. Preserve the original learn-by-teaching, Supervisor, valid-evidence and uncertainty rules. Supervisor corrections reach the learner through Errby in the quiet workspace. Current upload storage is described in [storage and caching](../implementation/STORAGE_AND_CACHING.md).

Version 1.0 · 16 September 2026 · Status: specification, not an implemented application.

Errby is a responsive English web app where learners explain school topics to an intentionally confused robot. It begins with a genuine open question, asks follow-ups containing bounded misconceptions, and uses a visibly distinct supervisor to correct errors or surface uncertainty after the learner submits a response.

## Read first
1. PRODUCT_BRIEF.md and DECISIONS.md: agreed direction and implementation assumptions.
2. MVP_SCOPE.md and LEARNING_DESIGN.md: exactly what must work.
3. TEAM_AND_SCHEDULE.md: ownership, dependencies and 14-day delivery.
4. USER_FLOWS.md, SCREEN_INVENTORY.md and DESIGN_SYSTEM.md: experience and visual direction.
5. ARCHITECTURE.md, DATA_MODEL.md, API_CONTRACTS.md and AI_SPEC.md: implementation contracts.
6. SOURCE_INGESTION.md, ANALYTICS.md and PRIVACY_AND_SAFETY.md: correctness and boundaries.
7. TESTING.md, IMPLEMENTATION_TASKS.md and LAUNCH_AND_DEMO.md: evidence of completion.
8. COST_AND_OPERATIONS.md, SOURCES.md and OPEN_ITEMS.md: costs, evidence and remaining gates.
9. AGENT_HANDOFF.md: instructions to a future coding agent. This document pack does not itself authorise starting implementation in this conversation.

## Decisive recommendations
- Build one application with two roles: learner and teacher. Three AI responsibilities are preparation, learner evaluation/supervision, and Errby's conversation; they do not need three always-running agents.
- Ship a real teacher upload → reviewed lesson → class join → teaching session → progress summary flow.
- Support broad topic input but validate a small, named set of lessons deeply. Do not market universal subject accuracy.
- Put lesson creation in the home screen's main composer. Keep school lessons and resume actions nearby.
- Match the supplied Lovable references with a minimal charcoal shell and soft blue/lilac halo. Give the supervisor amber accents, an icon and an explicit role label.
- Finish only when every required learning objective has evidence of a correct explanation. Paused, interrupted and unresolved sessions remain incomplete.
- Publish a working judge demo only after source, access, correctness and reliability checks. Real younger-student trials have additional provider/privacy gates.

## What's included
Twenty-four focused Markdown specifications plus the earlier discovery record, and an example lesson in structured JSON. Visual concept images are delivered separately in chat; they are design proposals, not screenshots of a working app. Written behaviour and accessibility requirements take precedence over image-generation inaccuracies.

The task list is deliberately ordered. The beginner teammate can build presentational components against frozen interfaces while the lead owns database access, AI correctness and integration. The third teammate has substantive content, QA, school and presentation responsibilities.

## Status honesty
No application, accounts, deployment, public repository, school trial, model benchmark or measured learning benefit has been created by this pack. Budget figures and daily effort are planning assumptions. User-confirmed requirements are separated from recommendations in DECISIONS.md. No paid service has been purchased.
