---
name: manage-pulse
description: Context and guidance for managing pulses the user already has. Use when users want to change settings (name, prompt, requester or who the pulse comes from, owners), pause, resume, send now, schedule, send nudges, update participants, or check on pulse results.
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
- **Launched**: Whether the pulse is live. A new pulse is a draft: it has no participants and sends to no one. Only `pulse_launch` launches it. Pulse read tools return `launched`.
- **Live Response Streaming**: A separate feed that posts each employee response into a Slack channel as participants finish (independent of the end-of-run report). Disabled by default. The Windmill Slack bot must be a member of the channel. Anonymous pulses cannot stream. The system silently disables it if both are configured.

## Citing Pulses

Write each pulse you name as a citation link: `[Pulse name](PULSE-<pulseId>)`, with the `pulseId` from the tool result. Do this in every reply that names the pulse, including a reply that confirms a create, test, launch, update, or send, and a reply that only asks a question about the pulse. The link replaces a quoted or bold pulse name.

Pulse tools return people as keys. The `references.employees` block of the same result gives each key its `name` and `employeeId`. Write each person you name, also in a list of participants, as `[Name](EMPL-<employeeId>)`.

The `PULSE-` and `EMPL-` prefixes are required: a link with a bare ID is wrong. A citation link needs a real ID from a tool result. A pulse or person that no tool returned gets a plain name with no link. Do not write a placeholder such as `PULSE-unknown` or `EMPL-?`, and do not look someone up only to cite them.

## Statuses

| Status | Meaning |
|--------|---------|
| ACTIVE | Runs on schedule |
| PAUSED | Scheduling stopped, in-progress runs continue |

New pulses start ACTIVE as unlaunched drafts. Status does not launch a draft.

## Tools

| Tool | Purpose | Key Constraints |
|------|---------|-----------------|
| pulse_query | Find and load pulses | Supports pulseIds filter to load specific pulses |
| pulse_update | Change settings, status, or schedule | A draft rejects participant and schedule fields |
| pulse_test | Send a test run to the current user only | Works on a draft; never adds participants or launches |
| pulse_launch | Launch a draft with participants and send timing | One time per pulse; needs the user's approval |
| pulse_send_now | Send a launched pulse again immediately | Requires a launched, ACTIVE pulse |
| pulse_send_nudge | User triggered notification | Requires `sessionId`; omit `employeeIds` to remind everyone who hasn't responded; 15-minute cooldown per employee globally |
| pulse_runs_query | List runs | - |
| pulse_employee_runs_query | Get responses; supports `attentionStatus` filter (`NEEDS_MY_RESPONSE`, `AWAITING_PARTICIPANT_RESPONSE`, `MISSED_RESPONSE`) | - |
| pulse_employees_query | List participants | Shows enrolled employees |
| pulse_owner_add | Add owner | - |
| pulse_owner_update | Change owner access | - |
| pulse_owner_remove | Remove owner | Cannot remove last WRITE owner |

## Drafts, Testing, and Launch

A draft (`launched: false`) has no recipients. For a draft:

- Content and settings edits: `pulse_update`. Participant and schedule fields are rejected.
- "Test it" / "let me try it": `pulse_test` only. The test goes to the user alone, also when they named a team or the whole company earlier. A test request never calls `pulse_launch`, `pulse_send_now`, or a participant update. After the test, end your turn and wait for the user's feedback. Never call `pulse_test` and `pulse_launch` in the same turn: "test it first, then send it" means launch only after the user has seen the test and says to send.
- "Send it" / "schedule it": `pulse_launch` with `participants` and exactly one timing field: `sendNow: true`, `scheduleOneTime`, `scheduleRecurring`, or `scheduleStartDateAnniversary`.

Before `pulse_launch`, confirm the audience with its current count and the send timing, and say that a sent pulse cannot be recalled. For a scheduled send or a dynamic filter, say that the participants are resolved again at each send, so the current count is not a fixed list. Call `pulse_launch` only after the user approves this confirmation. An earlier instruction to send or launch sets the intended audience and timing; it is not the approval. Offer a test first if the user has not tested and has not declined one.

`pulse_send_now`, participant updates, and schedule updates apply to launched pulses only. The launch confirmation applies to `pulse_launch` only. On a launched pulse (`launched: true`), a clear request to send now, send to a subset, pause, or resume needs no extra confirmation: do it, also when a scheduled run is close. A pause has no end date and no automatic resume: pause now and tell the user to ask when they want it resumed. Before a settings, participant, or schedule change, confirm which pulse you found when the user did not name it exactly. A launched pulse with no runs yet is still launched.

## Schedule Types

For a launched pulse, use `pulse_update` to set schedule with ONE of these fields:

| Field | When to Use | Example |
|-----------|-------------|---------|
| `scheduleManual: true` | No automatic runs | `{pulseId: "<pulseId>", scheduleManual: true}` |
| `scheduleOneTime` | Single scheduled send | `{pulseId: "<pulseId>", scheduleOneTime: {sendAt: "2024-03-15T15:00:00", timezone: "America/New_York"}}` |
| `scheduleRecurring` | Repeating pattern | See example below |
| `scheduleStartDateAnniversary` | Employee start-date anniversary | `{pulseId: "<pulseId>", scheduleStartDateAnniversary: {offsetDays: 30, hourOfDay: 9, timezone: "America/New_York"}}` |

### Weekly Recurring Schedule Example (every Friday at 3pm)
{
  "pulseId": "<pulseId>",
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
- "send now" -> `pulse_send_now` (draft: `pulse_launch` with `sendNow: true`)
- "send next Monday at 9am" -> `pulse_update` with `scheduleOneTime`
- "every Monday" -> `pulse_update` with `scheduleRecurring`
- "every other Wednesday" -> `pulse_update` with `scheduleRecurring` interval=2
- "first Monday of each month" -> `pulse_update` with `scheduleRecurring` monthly rule
- "send 30 days after first day" -> `pulse_update` with `scheduleStartDateAnniversary`
- "one year after their start date" -> `pulse_update` with `scheduleStartDateAnniversary`, offsetDays=365
- "stream responses to #channel" / "post replies into #channel as they come in" -> `pulse_update` with `liveResponseStreamingChannel: "#channel"`
- "stop streaming responses" / "turn off live streaming" -> `pulse_update` with `liveResponseStreamingChannel: null`
- "don't thread the streamed responses" / "post each response separately" -> `pulse_update` with `liveResponseStreamingThreaded: false`
- "group streamed responses in a thread again" -> `pulse_update` with `liveResponseStreamingThreaded: true`

For a draft, pass the same schedule field to `pulse_launch` instead of `pulse_update`.

## Updating Participants

When users ask to "add" people to a pulse, they want to **expand the pulse configuration** to include additional people while keeping existing participants.

**CRITICAL**: The `participants` parameter REPLACES the entire filter. You MUST include BOTH the existing participants AND the new people.

### Step-by-Step Process for Adding Participants

1. **Identify who to add** - Query employees to find the person and their reports (e.g., Jim = EMPL-<id>)

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
- Explicit `employeeIds` and `preset: "me"` are available without the send-all capability
- Manager filters such as `preset: "my-directs"`, `preset: "my-org"`, `managerIds`, and `ancestorManagerIds` are available for teams in the member's visible or delegated reporting structure
- Company-wide filters, `employeeGroupIds`, and search queries require the send-all capability
- If a dynamic filter is denied, resolve its audience and retry with explicit `employeeIds`
- Loaded `participantFilter` values may still appear in expanded primitive form because presets are resolved server-side before persistence

### Important: Check Before Updating

If the pulse uses `ancestorManagerIds: ["EMPL-<id>"]` (Michael's team), anyone reporting up to Michael is ALREADY included. Don't make changes if:
- Jim reports to Michael (directly or indirectly)
- Jim's reports therefore also report up to Michael
- Adding `managerIds: [Jim]` would be redundant or even harmful (AND logic reduces results)

### Example: When Update Is Needed

Pulse filter: `{employeeIds: ["EMPL-<id>", "EMPL-<id>"]}` (specific people only)
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

Members with the send-all capability may use any supported participant filter. Other members must use explicit `employeeIds` or `preset: "me"`.

**Rules:**
- Anonymous pulses require 3+ participants
- Set `windmillAccess: "HAS_ACCESS"` to include only Windmill members
- ForbiddenError if the member lacks filter access or access to selected employees

## Timing

| Field | Purpose | Default |
|-------|---------|---------|
| `notificationDelayMinutes` | Delay before first **reminder** to non-respondents (does NOT control when the pulse is sent) | 1440 (1 day) |
| `pulse_deadline_update` | Change deadlines for existing runs or future defaults | Preview first |

CRITICAL: When a user says "send now" or "send immediately", use `pulse_send_now` (`pulse_launch` for a draft). Do NOT change `notificationDelayMinutes`; that controls reminder timing, not pulse delivery.

## Requester Options

Who the pulse appears to be from (cosmetic only):

| Value | Behavior |
|-------|----------|
| NONE | From Windmill / system (default) |
| SPECIFIC_EMPLOYEE | From specific person (requires `requesterEmployeeId`) |
| MANAGER | From each participant's direct manager |

## Live Response Streaming

Configure via `pulse_update`:

| Field | Purpose | Notes |
|-------|---------|-------|
| `liveResponseStreamingChannel` | Slack channel that receives each response in real time. Accepts `#name`, `name`, or a Slack channel ID like `C0123456789`. Pass `null` to disable. | Omit to leave unchanged. The Windmill Slack bot must be a member of the channel. |
| `liveResponseStreamingThreaded` | When streaming, post each response as a reply in a single Slack thread instead of as a top-level message. Defaults to `true` whenever a channel is being set. | Ignored when no channel is set. |

Anonymous pulses cannot stream responses. The service silently nulls the streaming channel if the pulse is anonymous, so warn the user (rather than calling `pulse_update`) when they ask to combine the two.

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
3. To remind everyone who hasn't responded, call `pulse_send_nudge` without `employeeIds`; it returns only the count. On an anonymous pulse this is the only option
4. To nudge specific people, get them from `pulse_employee_runs_query` with `pulseSessionIds: [sessionId]` and `attentionStatus: "AWAITING_PARTICIPANT_RESPONSE"`, then pass their `employeeIds`
5. Report the result to the user

Important:
- `AWAITING_PARTICIPANT_RESPONSE` is the right filter for "everyone who still hasn't responded". Scope it to the session to avoid pulling non-responders from other runs.

## Checking on Pulse Responses

Use `pulse_employee_runs_query` with the `attentionStatus` filter to answer common status questions without manually cross-referencing participants and responses.

| User Intent | Filter | Notes |
|-------------|--------|-------|
| "What pulses do I need to respond to?" / "What needs my attention?" | `attentionStatus: "NEEDS_MY_RESPONSE"` | Auto-scopes to the current employee. Only includes active pulses with an opened chat, no response yet, and an open/no deadline. Do not also pass an `employee` filter. |
| "Who still hasn't responded?" / "Who's outstanding on this pulse?" | `attentionStatus: "AWAITING_PARTICIPANT_RESPONSE"` | Combine with `pulseIds` or `pulseSessionIds` to scope to a specific pulse or run. Add an `employee` filter for manager/admin views over a subset. On an anonymous pulse, it matches only your own run. |
| "Who missed the deadline?" / "Who never responded before it expired?" | `attentionStatus: "MISSED_RESPONSE"` | Expired sessions only. |

Pair with `pulse_employee_runs_count` when the user only wants the number (e.g., "how many people still owe me a response?").

For pulse-level rollups (counts of completed runs, last run timestamp, etc.) use `pulse_runs_query` rather than aggregating employee runs by hand.

## Product Rules

- Anonymity can change with `pulse_update` only before launch. It is locked after launch; if the user needs a different mode, explain that they must create a new pulse.
- Schedule updates: pulse must not be COMPLETED or ARCHIVED
- Send now: pulse must be launched and ACTIVE
- Launch: one time per pulse, after the user approves the audience and send timing
- Cannot remove last owner with WRITE access
