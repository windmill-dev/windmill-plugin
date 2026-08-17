---
name: create-pulse
description: Context and guidance for creating pulse surveys. Use when user wants to create a new pulse, gather feedback or sentiment from their team, or asks to "ask the team" about something.
domain: pulses
resourceFilename: creating_pulses_skill.md
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

- Pulse: AI-driven conversational survey where the agent chats with employees
- Prompt: What the creator wants to learn (drives AI topic generation)
- Discussion Guide: Topics that guide the agent's conversation with employees
- Run: A single round of a pulse. The agent reaches out to participants and covers the discussion topics.
- Participant: Employee who receives the pulse
- Live Response Streaming: When enabled, each employee response is posted into a Slack channel in real time as participants finish (separately from the end-of-run report). The Windmill Slack bot must already be a member of the channel for it to be selectable. Anonymous pulses cannot stream. The system silently disables streaming on anonymous pulses even if a channel is provided.

## CRITICAL: How Pulse Creation Works

Creating a pulse can include schedule configuration in the same call.

The creation flow gathers and confirms:
1. Prompt
2. Discussion topics (can be AI-generated if needed)
3. Participants
4. Anonymity
5. Run updates preference (`runUpdatesEnabled` true/false)
6. Optional schedule preference (manual, one-time, recurring, or start-date anniversary)
7. Optional live response streaming channel (only ask if the user mentions streaming, posting to Slack as responses come in, or similar; do not prompt by default)

The tool call also requires:
- `name` (generated from prompt/topics)
- `runUpdatesEnabled` (explicit boolean; do not omit)

The pulse is created in ACTIVE status. If no schedule fields are provided, it defaults to MANUAL.

After creation, the user can:
- Update configuration (via `pulse_update`)
- Update schedule (via `pulse_update`)
- Send it now (via `pulse_send_now`)

## Workflow: Create Pulse

### Step 1: Gather Prompt
Determine what the user wants to learn from the pulse. Effectively, this is the purpose of the pulse.

Examples:
- "I want to understand how the team feels about our remote work policy"
- "I need to identify what's slowing down the engineering team"

### Step 2: Determine Discussion Topics

Propose a few topics based on the prompt, then confirm with the user. Adjust based on user input.

Guidelines for good topics:
- Open-ended questions work best
- Satisfy the prompt in the fewest number of topics possible
- Each should directly relate to prompt, and seek to cover a single aspect of the prompt
- Aim for 2-4 topics typically

These topics will be used by the agent when conducting the pulse. Each topic will be covered with the user.

### Step 3: Select Participants

Determine who should receive this pulse.

Construct an employee filter based on the user's input, and confirm the total count with the user after testing and validating your filter construction.

Participant Filter Access:
- Explicit `employeeIds` and `preset: "me"` are available without the send-all capability.
- Manager filters such as `preset: "my-directs"`, `preset: "my-org"`, `managerIds`, and `ancestorManagerIds` are available for teams in the member's visible or delegated reporting structure.
- Company-wide filters, `employeeGroupIds`, and search queries require the send-all capability.
- When a user cannot use a dynamic filter, resolve the intended audience to specific employees and retry with `employeeIds`.
- Underlying employee visibility checks still apply to every selected employee.

Common patterns:
- "everyone" -> Requires the send-all capability (omit specific filters)
- "just me" -> Use `preset: "me"`
- "my team" / "full team" -> Use `preset: "my-org"`
- "my direct reports" -> Use `preset: "my-directs"`
- "specific people" -> Use `employeeIds`
- Employee groups -> Use `employeeGroupIds` with the send-all capability; otherwise resolve the group to `employeeIds`

Whenever constructing a participant filter, confirm the included employees with the user prior to creating the pulse.

### UI Participant Presets (for reference)

The product UI offers these preset patterns that users may reference:

| User Says | UI Preset | Filter Implementation |
|-----------|-----------|----------------------|
| "just me" | Me | preset: "me" |
| "my team" | My Team | preset: "my-org" |
| "my direct reports" | My Direct Reports | preset: "my-directs" |
| "everyone" | Everyone | omit specific filters (send-all capability required) |
| "specific people" | Specific People | employeeIds: [...] |
| "a group" | Groups | employeeGroupIds: [...] (send-all capability required) |
| "another team" | Other Teams | ancestorManagerIds: [otherManagerId] (visible or delegated team required) |

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

Run Updates: Whether the creator gets updates from the agent throughout each run

Live Response Streaming (optional): If the user wants individual responses to land in a Slack channel as participants finish, pass `liveResponseStreamingChannel` (Slack channel name like `#pulse-results`, channel ID like `C0123456789`, or null to leave disabled) and optionally `liveResponseStreamingThreaded` (defaults true: responses thread under a single message instead of posting individually). The Windmill Slack bot must already be in the channel. If it isn't, the tool returns an error asking the user to add it. Anonymous pulses cannot stream. Warn the user and leave the field unset if they ask for both.

### Step 5: Create Pulse (Optionally with Schedule)
Call `pulse_create` with:
- `name`: Generated from prompt/topics (required)
- `prompt`: What they want to learn (required)
- `discussionTopics`: Array of topics (required)
- `participants`: Employee filter from Step 3 (required)
- `anonymity`: NAMED, ANONYMOUS, or MANAGER_HIERARCHY (optional, defaults to NAMED if omitted/null)
- `durationMinutes`: Response duration in minutes, min 30 (optional, omit for no deadline)
- `notificationDelayMinutes`: Minutes before first **reminder** to non-respondents (optional, defaults to 1440). Do NOT change this based on when the user wants to send the pulse; it only controls reminder timing.
- `runUpdatesEnabled`: Whether creator gets updates from the agent throughout each run (required boolean)
- `liveResponseStreamingChannel`: Optional Slack channel reference (`#name`, `name`, or external ID like `C0123456789`) to stream individual responses into. Omit for no streaming. The Windmill Slack bot must already be in the channel.
- `liveResponseStreamingThreaded`: Optional boolean, defaults true. Only meaningful when a streaming channel is set.
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
