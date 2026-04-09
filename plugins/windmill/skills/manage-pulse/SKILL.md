---
name: manage-pulse
description: Context and guidance for managing existing pulses. Use when users want to pause, resume, trigger, schedule, send nudges, update participants, or check on pulse results.
---

# Managing Pulses

## When to Apply

Use when users want to update, control, or check on existing pulses.

## Vocabulary

- **Run**: A single round of a pulse (one send to participants)
- **Trigger**: Manually start a run of a pulse
- **Nudge**: User triggered notification to respond to a pulse
- **Requester**: Who the pulse appears to be from
- **Launched**: Whether or not the pulse has been taken out of its initial "draft" state. Triggering a pulse, or setting to active will automatically launch the pulse.

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
| pulse_update | Change settings or status | Use `status` param to pause/resume |
| pulse_trigger | Start run manually | Requires ACTIVE status, 6-hour gap per employee |
| pulse_send_nudge | User triggered notification | 15-minute cooldown per employee globally |
| pulse_runs_query | List runs | - |
| pulse_employee_runs_query | Get responses | - |
| pulse_employees_query | List participants | Shows enrolled employees |
| pulse_owner_add | Add owner | - |
| pulse_owner_update | Change owner access | - |
| pulse_owner_remove | Remove owner | Cannot remove last WRITE owner |

## Schedule Types

Pulses default to MANUAL. Update via pulse_update using ONE of these parameters:

| Parameter | When to Use | Example |
|-----------|-------------|---------|
| `scheduleManual: true` | User triggers each run | `{pulseId: "WT-1", scheduleManual: true}` |
| `scheduleOneTime` | Single scheduled send | `{pulseId: "WT-1", scheduleOneTime: {sendAt: "2024-03-15T15:00:00", timezone: "America/New_York"}}` |
| `scheduleRecurring` | Repeating pattern | See examples below |
| `scheduleStartDateAnniversary` | Employee start date anniversary | `{pulseId: "WT-1", scheduleStartDateAnniversary: {offsetDays: 30, hourOfDay: 9, timezone: "America/New_York"}}` |

**Use ONLY ONE schedule parameter per call.** The tool validates that only one is provided.

### One-Time Schedule Example
{
  "pulseId": "WT-1",
  "scheduleOneTime": {
    "sendAt": "2024-03-15T15:00:00",
    "timezone": "America/New_York"
  }
}

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

### New Hire Anniversary Schedule Example (30-day check-in at 9am weekdays)
{
  "pulseId": "WT-1",
  "scheduleStartDateAnniversary": {
    "offsetDays": 30,
    "hourOfDay": 9,
    "timezone": "America/New_York"
  }
}

**User intent mapping:**
- "send next Monday at 9am" -> `scheduleOneTime` with sendAt as ISO datetime
- "every Monday" -> `scheduleRecurring` with frequency=WEEKLY, daysOfWeek=["MONDAY"]
- "every other Wednesday" -> `scheduleRecurring` with frequency=WEEKLY, interval=2, daysOfWeek=["WEDNESDAY"]
- "every Friday at 3pm" -> `scheduleRecurring` with frequency=WEEKLY, daysOfWeek=["FRIDAY"], start time as "...T15:00:00"
- "first Monday of each month" -> `scheduleRecurring` with frequency=MONTHLY, weeksOfMonth=[1], setPositions=[1], daysOfWeek=["MONDAY"]
- "send 30 days after first day" -> `scheduleStartDateAnniversary` with offsetDays=30
- "one year after their start date" -> `scheduleStartDateAnniversary` with offsetDays=365

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
   - Filter fields within the same object are ANDed - use `or` array for union

### Important: Check Before Updating

If the pulse uses `ancestorManagerIds: ["EMPL-1"]` (Michael's team), anyone reporting up to Michael is ALREADY included. Don't make changes if:
- Jim reports to Michael (directly or indirectly)
- Jim's reports therefore also report up to Michael
- Adding `managerIds: [Jim]` would be redundant or even harmful (AND logic reduces results)

### Example: When Update IS Needed

Pulse filter: `{employeeIds: ["EMPL-2", "EMPL-3"]}` (specific people only)
Request: "Add Jim's direct reports"

Update with:
{
  "pulseId": "WT-1",
  "participants": {
    "or": [
      {"employeeIds": ["EMPL-2", "EMPL-3"]},
      {"managerIds": ["EMPL-3"]}
    ]
  }
}

### Common Mistakes to Avoid

- **DO NOT** make destructive updates without checking enrollment first
- **DO NOT** use only the new filter - this removes existing participants
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
| ADMIN | Any filter: `employeeIds`, `ancestorManagerIds`, `managerIds`, `departmentId`, `employeeGroupIds` |
| MANAGER | `employeeIds`, `ancestorManagerIds` (own ID only - their subtree) |
| IC | `employeeIds` only (accessible employees) |

**Rules:**
- Anonymous pulses require 3+ participants
- Set `hasWindmillAccess: true` to include only Windmill members
- ForbiddenError if user lacks access to selected employees

## Timing

| Field | Purpose | Default |
|-------|---------|---------|
| `notificationDelayMinutes` | Delay before first **reminder** to non-respondents (does NOT control when the pulse is sent) | 1440 (1 day) |
| `durationMinutes` | Response deadline window (min 30, null = no deadline) | null |

CRITICAL: When a user says "send now" or "send immediately", use pulse_trigger to trigger the pulse. Do NOT change `notificationDelayMinutes` — that controls reminder timing, not pulse delivery.

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
2. Call `pulse_send_nudge` with `pulseId` and `employeeIds` to nudge
3. Report the result to the user

## Product Rules

- Cannot change anonymity after responses collected
- Trigger: 6-hour minimum gap per employee, pulse must be ACTIVE
- Cannot remove last owner with WRITE access
