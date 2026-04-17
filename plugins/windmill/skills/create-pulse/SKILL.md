---
name: create-pulse
description: Context and guidance for creating pulse surveys. Use when user wants to create a new pulse, gather feedback or sentiment from their team, or asks to "ask the team" about something.
---

# Creating Pulses

## When to Apply This Skill

Use this skill when:
- User wants to create a new pulse survey
- User asks to gather feedback/sentiment from their team
- User wants to "ask the team" about something

## Relevant Resources

- pulses_system_context.md
- managing_pulses_skill.md
- employees_system_context.md

## Vocabulary

- Pulse: AI-driven conversational survey where Windy chats with employees
- Motivation: What the creator wants to learn (drives AI topic generation)
- Discussion Guide: Topics that guide Windy's conversation with employees
- Run: A single round of a pulse. Windy reaches out to participants and covers the discussion topics.
- Participant: Employee who receives the pulse

## CRITICAL: How Pulse Creation Works

Creating a pulse can include schedule configuration in the same call.

The creation flow gathers and confirms:
1. Motivation
2. Discussion topics (can be AI-generated if needed)
3. Participants
4. Anonymity
5. Run updates preference (`runUpdatesEnabled` true/false)
6. Optional schedule preference (manual, one-time, recurring, or start-date anniversary)

The tool call also requires:
- `name` (generated from motivation/topics)
- `runUpdatesEnabled` (explicit boolean; do not omit)

The pulse is created in ACTIVE status. If no schedule fields are provided, it defaults to MANUAL.

After creation, the user can:
- Update configuration (via `pulse_update`)
- Update schedule (via `pulse_update`)
- Send it now (via `pulse_send_now`)

## Workflow: Create Pulse

### Step 1: Gather Motivation
Determine what the user wants to learn from the pulse. Effectively, this is the purpose of the pulse.

Examples:
- "I want to understand how the team feels about our remote work policy"
- "I need to identify what's slowing down the engineering team"

### Step 2: Determine Discussion Topics

Propose a few topics based on the motivation, then confirm with the user. Adjust based on user input.

Guidelines for good topics:
- Open-ended questions work best
- Satisfy the motivation in the fewest number of topics possible
- Each should directly relate to motivation, and seek to cover a single aspect of the motivation
- Aim for 2-4 topics typically

These topics will be used by Windy when conducting the pulse. Each topic will be covered with the user.

### Step 3: Select Participants

Determine who should receive this pulse.

Construct an employee filter based on the user's input, and confirm the total count with the user after testing and validating your filter construction.

Prefer `preset` when the requested scope is relative to the current authenticated user:
- `preset: "me"`
- `preset: "my-direct-reports"`
- `preset: "my-subtree"`

Use explicit `employeeIds`, `managerIds`, or `ancestorManagerIds` when targeting named employees or another manager's tree.

Permission Model for Employee Selection:
WHO the user can select depends on their role:

ADMIN users:
- Can construct ANY employee filter
- Can use `preset`, `ancestorManagerIds`, `managerIds`, `employeeIds`, `employeeGroupIds`
- Can select anyone in the organization

MANAGER users:
- Can list employees by name (`employeeIds`)
- Should prefer `preset: "my-subtree"` for their full reporting tree
- Should prefer `preset: "my-direct-reports"` for their direct reports
- CANNOT use arbitrary manager IDs outside their tree

IC (Individual Contributor) users:
- Can use `preset: "me"` for themselves
- Can list specific employees by name (`employeeIds`)
- CANNOT use `preset: "my-subtree"`, `preset: "my-direct-reports"`, `ancestorManagerIds`, or `managerIds`

The system validates access using "visible subtrees" - managers see their reports, ICs see themselves and peers they collaborate with.

Common patterns:
- "everyone" -> Only admins can do this (omit specific filters)
- "just me" -> Use `preset: "me"`
- "my team" / "full team" -> Use `preset: "my-subtree"` when the team is the current user's own tree
- "my direct reports" -> Use `preset: "my-direct-reports"` when the directs are the current user's own directs
- "specific people" -> Use `employeeIds` (all roles can do this for accessible employees)
- Employee groups -> Use `employeeGroupIds` (admins, or managers if group is in their tree)

Whenever constructing a participant filter, confirm the included employees with the user prior to creating the pulse.

### UI Participant Presets (for reference)

The product UI offers these preset patterns that users may reference:

| User Says | UI Preset | Filter Implementation |
|-----------|-----------|----------------------|
| "just me" | Me | preset: "me" |
| "my team" | My Team | preset: "my-subtree" |
| "my direct reports" | My Direct Reports | preset: "my-direct-reports" |
| "everyone" | Everyone | (admins only) omit specific filters |
| "specific people" | Specific People | employeeIds: [...] |
| "a group" | Groups | employeeGroupIds: [...] |
| "another team" | Other Teams | ancestorManagerIds: [otherManagerId] |

Validation:
- Anonymous pulses require 3+ participants
- Warn if count seems wrong
- Tool will throw ForbiddenError if user doesn't have access to selected employees

CRITICAL: Pulses are only available to Windmill members. Set `hasWindmillAccess: true` in the participant filter to ensure only members are included. Non-members cannot receive pulses.

### Step 4: Confirm other settings
Confirm the other settings with the user.

Response Anonymity Options:
- Named (default):
  - Each response shows who said it
  - Creator can follow up with specific people
  - Best for: Check-ins, 1:1 prep, non-sensitive topics

- Manager Hierarchy:
  - Responses visible to the respondent's manager chain
  - Provides some privacy while allowing managers to see their team's responses
  - Best for: Team-specific feedback where managers need visibility

- Anonymous:
  - Responses are fully de-identified
  - Requires minimum 3 participants (protects identity)
  - Best for: Sensitive topics, honest feedback, psychological safety

Duration: How long participants have to respond to the pulse.

Reminder Delay: How long to wait before sending the first **reminder** notification to participants who haven't responded yet. Defaults to 1 day (1440 minutes). Leave at default unless the user explicitly asks about reminder timing.

CRITICAL DISAMBIGUATION: When the user says "send it now" or "send immediately", they mean **send the pulse now** (use `pulse_send_now` after creation). Do NOT interpret "send now" as "set the reminder delay to 0 or 1 minute". The reminder delay is a separate concept from when the pulse is sent.

Run Updates: Whether the creator gets updates from Windy throughout each run

### Step 5: Create Pulse (Optionally with Schedule)
Call `pulse_create` with:
- `name`: Generated from motivation/topics (required)
- `motivation`: What they want to learn (required)
- `discussionTopics`: Array of topics (required)
- `participants`: Employee filter from Step 3 (required)
- `anonymity`: NAMED, ANONYMOUS, or MANAGER_HIERARCHY (optional, defaults to NAMED if omitted/null)
- `durationMinutes`: Response duration in minutes, min 30 (optional, omit for no deadline)
- `notificationDelayMinutes`: Minutes before first **reminder** to non-respondents (optional, defaults to 1440). Do NOT change this based on when the user wants to send the pulse — it only controls reminder timing.
- `runUpdatesEnabled`: Whether creator gets updates from Windy throughout each run (required boolean)
- Optional schedule fields (use at most one):
  - `scheduleManual: true`
  - `scheduleOneTime`
  - `scheduleRecurring`
  - `scheduleStartDateAnniversary`

If schedule fields are omitted, create defaults to MANUAL schedule.

### Step 6: Confirm Success and Offer Next Steps
Confirm creation with user.

After confirming creation, offer these options:
1. Send now (immediately to participants) via `pulse_send_now`
2. Update schedule (one-time, recurring, or new hire anniversary) via `pulse_update`
3. Update additional configuration via `pulse_update`

Load managing_pulses_skill.md to guide them through whichever option they choose.
