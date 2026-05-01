---
name: manage-pulse
description: Context and guidance for managing existing pulses. Use when users want to pause, resume, send now, schedule, send nudges, update participants, or check on pulse results.
domain: pulses
resourceFilename: managing_pulses_skill.md
---

# Managing Pulses

## When to Apply

Use when users want to update, control, or check on existing pulses.

## Vocabulary

- **Run**: A single round of a pulse (one send to participants)
- **Send Now**: Manually run a pulse immediately
- **Nudge**: User triggered notification to respond to a pulse
- **Requester**: Who the pulse appears to be from
- **Launched**: Whether or not the pulse has been taken out of its initial "draft" state. This happens when a non-manual schedule is set via `pulse_update`, or when `pulse_send_now` is used.

## Statuses

| Status | Meaning |
|--------|---------|
| ACTIVE | Runs on schedule |
| PAUSED | Scheduling stopped, in-progress runs continue |

New pulses start ACTIVE.

## Tools

| Tool | Purpose | Key Constraints |
|------|---------|-----------------|
| pulse_query | Find and load pulses | Supports pulseIds filter to load specific pulses |
| pulse_update | Change settings, status, or schedule | Non-manual schedule fields also launch an unlaunched pulse |
| pulse_send_now | Send pulse immediately | Requires ACTIVE status |
| pulse_send_nudge | User triggered notification | Requires `sessionId` and explicit `employeeIds`; 15-minute cooldown per employee globally |
| pulse_runs_query | List runs | - |
| pulse_employee_runs_query | Get responses; supports `attentionStatus` filter (`NEEDS_MY_RESPONSE`, `AWAITING_PARTICIPANT_RESPONSE`, `MISSED_RESPONSE`) | - |
| pulse_employees_query | List participants | Shows enrolled employees |
| pulse_owner_add | Add owner | - |
| pulse_owner_update | Change owner access | - |
| pulse_owner_remove | Remove owner | Cannot remove last WRITE owner |

## Schedule Types

Use `pulse_update` to set schedule with ONE of these fields:

| Field | When to Use | Example |
|-----------|-------------|---------|
| `scheduleManual: true` | No automatic runs | `{pulseId: "WT-1", scheduleManual: true}` |
| `scheduleOneTime` | Single scheduled send | `{pulseId: "WT-1", scheduleOneTime: {sendAt: "2024-03-15T15:00:00", timezone: "America/New_York"}}` |
| `scheduleRecurring` | Repeating pattern | See example below |
| `scheduleStartDateAnniversary` | Employee start-date anniversary | `{pulseId: "WT-1", scheduleStartDateAnniversary: {offsetDays: 30, hourOfDay: 9, timezone: "America/New_York"}}` |

### Weekly Recurring Schedule Example (every Friday at 3pm)
{
  "pulseId": "WT-1",
  "scheduleRecurring": {
    "timezone": "America/New_York",
    "rules": [{
      "frequency": "WEEKLY",
      "daysOfWeek": ["FRIDAY"],
      "start": "2024-03-15T15:00:00",
      "interval": 1
    }]
  }
}

**User intent mapping:**
- "send now" -> `pulse_send_now`
- "send next Monday at 9am" -> `pulse_update` with `scheduleOneTime`
- "every Monday" -> `pulse_update` with `scheduleRecurring`
- "every other Wednesday" -> `pulse_update` with `scheduleRecurring` interval=2
- "first Monday of each month" -> `pulse_update` with `scheduleRecurring` monthly rule
- "send 30 days after first day" -> `pulse_update` with `scheduleStartDateAnniversary`
- "one year after their start date" -> `pulse_update` with `scheduleStartDateAnniversary`, offsetDays=365

When `scheduleOneTime`, `scheduleRecurring`, or `scheduleStartDateAnniversary` is set on an unlaunched pulse, update also launches it.

## Updating Participants

When users ask to "add" people to a pulse, they want to **expand the pulse configuration** to include additional people while keeping existing participants.

**CRITICAL**: The `participants` parameter REPLACES the entire filter. You MUST include BOTH the existing participants AND the new people.

### Step-by-Step Process for Adding Participants

1. **Identify who to add** - Query employees to find the person and their reports (e.g., Jim = EMPL-3)

2. **Check if already included** - BEFORE making any changes:
   - Query `pulse_employees_query` to see current enrollment
   - Check the org structure: if the pulse uses `ancestorManagerIds`, anyone in that subtree is already included
   - If the people are already enrolled AND the filter already covers them, NO UPDATE IS NEEDED

3. **If update needed, get current filter** - Load the pulse via `pulse_query` to see the `participantFilter`

4. **Construct expanded filter** - ONLY if the people aren't already covered:
   - Keep ALL existing filter criteria
   - Add new criteria that extends (not replaces) the scope
   - The participant filter must remain a SINGLE employee filter object
   - Do NOT invent `or` or `and` branches; they are not supported by this MCP filter schema
   - If the desired union cannot be represented as one filter object, explain the limitation and confirm a replacement scope with the user before updating

### Using Presets vs Explicit IDs

For NEW participant filter inputs:
- Prefer `preset: "me"`, `preset: "my-directs"`, or `preset: "my-org"` when the scope is relative to the current authenticated user
- Use explicit `employeeIds`, `managerIds`, or `ancestorManagerIds` when targeting named employees or another manager's tree
- Loaded `participantFilter` values may still appear in expanded primitive form because presets are resolved server-side before persistence

### Important: Check Before Updating

If the pulse uses `ancestorManagerIds: ["EMPL-1"]` (Michael's team), anyone reporting up to Michael is ALREADY included. Don't make changes if:
- Jim reports to Michael (directly or indirectly)
- Jim's reports therefore also report up to Michael
- Adding `managerIds: [Jim]` would be redundant or even harmful (AND logic reduces results)

### Example: When Update Is Needed

Pulse filter: `{employeeIds: ["EMPL-2", "EMPL-3"]}` (specific people only)
Request: "Add Jim's direct reports"

This is NOT expressible as a single MCP employee filter object without changing the semantics.

Do not fabricate an `or` branch. Instead:
- Explain that the current participant filter is "specific people only"
- Explain that "specific people" plus "Jim's direct reports" cannot be represented as one supported participant filter object
- Ask whether the user wants to replace the participant scope with a different single filter, such as Jim's direct reports only, Jim's subtree, or a new explicit employee list

### Common Mistakes to Avoid

- **DO NOT** make destructive updates without checking enrollment first
- **DO NOT** use only the new filter - this removes existing participants
- **DO NOT** use unsupported `or` or `and` arrays in participant filters
- **DO NOT** combine managerIds with ancestorManagerIds in same filter object (AND logic may return empty set)

### When participantFilter is Not Visible

If `pulse_query` doesn't show participantFilter:
- "My team" pulse from user X likely uses `ancestorManagerIds: [X's ID]`
- Check if the people to add are in that subtree FIRST
- If they're already included, inform the user - no update needed

## Participant Permissions

Who users can select depends on their role:

| Role | Can Use |
|------|---------|
| ADMIN | Any filter: `preset`, `employeeIds`, `ancestorManagerIds`, `managerIds`, `employeeGroupIds` |
| MANAGER | `employeeIds`, `preset: "my-org"`, `preset: "my-directs"` |
| IC | `employeeIds`, `preset: "me"` |

**Rules:**
- Anonymous pulses require 3+ participants
- Set `hasWindmillAccess: true` to include only Windmill members
- ForbiddenError if user lacks access to selected employees

## Timing

| Field | Purpose | Default |
|-------|---------|---------|
| `notificationDelayMinutes` | Delay before first **reminder** to non-respondents (does NOT control when the pulse is sent) | 1440 (1 day) |
| `durationMinutes` | Response deadline window (min 30, null = no deadline) | null |

CRITICAL: When a user says "send now" or "send immediately", use `pulse_send_now`. Do NOT change `notificationDelayMinutes` — that controls reminder timing, not pulse delivery.

## Requester Options

Who the pulse appears to be from (cosmetic only):

| Value | Behavior |
|-------|----------|
| NONE | From "Windy" / system (default) |
| SPECIFIC_EMPLOYEE | From specific person (requires `requesterEmployeeId`) |
| MANAGER | From each participant's direct manager |

## Owner Access Levels

| Level | Can Do |
|-------|--------|
| READ | View pulse and responses |
| WRITE | Edit settings, manage owners |

## Report Configs

Configure who gets notified about results via `reportConfigs` array:

| recipientType | Who Gets Notified |
|---------------|-------------------|
| OWNERS | Pulse creator(s) |
| PARTICIPANTS | Everyone who received pulse |
| SPECIFIC_EMPLOYEE | Specific people |
| MANAGER | Each participant's manager (sees their reports' data only) |

Each config has `enabled` (boolean) and optional `sharingChannels` (Slack or email).

Set `publicResponses: true` to let all participants see each other's responses.

Do not leak the actual enum values to the user. Use friendly names and labels instead.

## Sending Nudges

**CRITICAL**: To send nudges, call `pulse_send_nudge`:
1. Find the pulse via `pulse_query`
2. Find the target run/session via `pulse_runs_query` (usually the latest run)
3. Determine the specific employees to nudge — call `pulse_employee_runs_query` with `pulseSessionIds: [sessionId]` and `attentionStatus: "AWAITING_PARTICIPANT_RESPONSE"` to get the non-responders for that session
4. Call `pulse_send_nudge` with `pulseId`, `sessionId`, and explicit `employeeIds`
5. Report the result to the user

Important:
- There is no "nudge all non-responders" shortcut parameter. You must send explicit `employeeIds`.
- `AWAITING_PARTICIPANT_RESPONSE` is the right filter for "everyone who still hasn't responded" — scope it to the session to avoid pulling non-responders from other runs.

## Checking on Pulse Responses

Use `pulse_employee_runs_query` with the `attentionStatus` filter to answer common status questions without manually cross-referencing participants and responses.

| User Intent | Filter | Notes |
|-------------|--------|-------|
| "What pulses do I need to respond to?" / "What needs my attention?" | `attentionStatus: "NEEDS_MY_RESPONSE"` | Auto-scopes to the current employee. Only includes active pulses with an opened chat, no response yet, and an open/no deadline. Do not also pass an `employee` filter. |
| "Who still hasn't responded?" / "Who's outstanding on this pulse?" | `attentionStatus: "AWAITING_PARTICIPANT_RESPONSE"` | Combine with `pulseIds` or `pulseSessionIds` to scope to a specific pulse or run. Add an `employee` filter for manager/admin views over a subset. |
| "Who missed the deadline?" / "Who never responded before it expired?" | `attentionStatus: "MISSED_RESPONSE"` | Expired sessions only. |

Pair with `pulse_employee_runs_count` when the user only wants the number (e.g., "how many people still owe me a response?").

For pulse-level rollups (counts of completed runs, last run timestamp, etc.) use `pulse_runs_query` rather than aggregating employee runs by hand.

## Product Rules

- Cannot change anonymity after responses collected
- Schedule updates: pulse must not be COMPLETED or ARCHIVED
- Send now: pulse must be ACTIVE
- Cannot remove last owner with WRITE access
