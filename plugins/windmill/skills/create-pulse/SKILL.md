---
name: create-pulse
description: Context and guidance for creating a new pulse survey with structured questions. Use when the user wants a pulse that does not exist yet: to gather feedback or sentiment from their team, or to "ask the team" about something. For a pulse the user already has, use the managing pulses skill.
domain: pulses
resourceFilename: creating_pulses_skill.md
---

# Creating Pulses

## When to Apply This Skill

Use this skill when:
- User wants to create a new pulse survey
- User asks to gather feedback/sentiment from their team
- User wants to "ask the team" about something

This skill covers a new pulse, from the draft through its first launch. For a pulse that already exists (change settings, requester, owners, participants, or schedule; pause or resume; send again; nudge; read results), load managing_pulses_skill.md and follow it.

"I have a pulse", "my pulse", or "the pulse about X" means a pulse that exists. Find it with `pulse_query` first and make the requested change there. Start a draft only when the user asks for a new pulse or the query finds no match.

## Relevant Resources

- pulses_system_context.md
- managing_pulses_skill.md
- employees_system_context.md

## Vocabulary

- Pulse: AI-driven conversational survey where the agent chats with employees
- Prompt: What the creator wants to learn (drives question generation)
- Questions: The structured set of questions the agent works through with each participant. Every question has a type (free response, single/multi select, yes/no, a numeric scale, or a labeled rating).
- Run: A single round of a pulse. The agent reaches out to participants and covers the questions.
- Participant: Employee who receives the pulse
- Live Response Streaming: When enabled, each employee response is posted into a Slack channel in real time as participants finish (separately from the end-of-run report). The Windmill Slack bot must already be a member of the channel for it to be selectable. Anonymous pulses cannot stream. The system silently disables streaming on anonymous pulses even if a channel is provided.

## Citing Pulses

Write each pulse you name as a citation link: `[Pulse name](PULSE-<pulseId>)`, with the `pulseId` from the tool result. Do this in every reply that names the pulse, including a reply that confirms a create, test, launch, update, or send, and a reply that only asks a question about the pulse. The link replaces a quoted or bold pulse name.

Pulse tools return people as keys. The `references.employees` block of the same result gives each key its `name` and `employeeId`. Write each person you name, also in a list of participants, as `[Name](EMPL-<employeeId>)`.

The `PULSE-` and `EMPL-` prefixes are required: a link with a bare ID is wrong. A citation link needs a real ID from a tool result. A pulse or person that no tool returned gets a plain name with no link. Do not write a placeholder such as `PULSE-unknown` or `EMPL-?`, and do not look someone up only to cite them.

## CRITICAL: How Pulse Creation Works

A pulse goes through three stages. Each stage has its own tool:

1. Draft: `pulse_create` makes a draft. A draft has no participants and no schedule. It is not live and sends to no one.
2. Test: `pulse_test` sends a test run to the creator only. It never adds participants and never launches the pulse.
3. Launch: `pulse_launch` saves the participants and the send timing, and makes the pulse live.

If the user names an audience or a send time in the creation request, keep it for the launch stage. `pulse_create` does not accept participants or a schedule. Look up, count, and list the audience in Step 6, not before the draft exists.

The creation flow gathers and confirms:
1. Prompt
2. Questions (each with a type)
3. Anonymity
4. Run updates (`runUpdatesEnabled`; on unless the user says otherwise)
5. Optional live response streaming channel (only ask if the user mentions streaming, posting to Slack as responses come in, or similar; do not prompt by default)
6. Completion location and notification channel (defaults: Anywhere and Windy chat; include them in the settings summary, but do not prompt for them by default)

The tool call also requires:
- `name` (generated from prompt/questions)
- `runUpdatesEnabled` (always pass it; `true` unless the user says otherwise)

After creation, the user can:
- Edit the draft's content and settings (via `pulse_update`). A draft rejects participant and schedule fields.
- Send a test to themselves only (via `pulse_test`)
- Launch it to participants (via `pulse_launch`)

## Workflow: Create Pulse

### Step 1: Gather Prompt
Determine what the user wants to learn from the pulse. Effectively, this is the purpose of the pulse.

Examples:
- "I want to understand how the team feels about our remote work policy"
- "I need to identify what's slowing down the engineering team"

### Step 2: Determine Questions

Propose a few questions based on the prompt, then confirm with the user. Adjust based on user input.

Each question has a `type`. Choose the type that best captures the answer you need:

| Type | Use for | Key options |
|------|---------|-------------|
| TEXT | Open-ended/qualitative answers, sentiment, "why" | Free response. Optional `formattingInstructions`. |
| SCALE | A number within a range: counts, or a 1-5 with only the ends labeled | `options`: `min`, `max`, `step`, `integer`, optional `labels.low`/`labels.high`. |
| RATING | A labeled rating scale: ordered points, each with a label (a single-select with numbers), e.g. 1 "Strongly disagree" … 5 "Strongly agree" | `options.points`: `[{value, label?}]` (>= 2 points). |
| SINGLE_SELECT | Pick exactly one from a fixed set | `options.options`: `[{value, label, description?}]`; optional free-text "other" via `enableFreeText`. |
| MULTI_SELECT | Select all that apply | `options.choices`: `[{value, label}]`; optional `minSelections`/`maxSelections`. |
| BOOLEAN | Simple yes/no | `options.defaultValue`; optional follow-up free text. |

Every question requires:
- `type` (one of the above)
- `label` (the question text shown to the employee)
- `description` (short context/instructions for the employee)
- `required` (boolean: must the employee answer?)
- type-specific `options` (required for everything except TEXT)

Guidelines for good questions:
- Prefer the simplest type that captures the intent: TEXT for open feedback, SCALE for counts/open numbers, RATING for labeled satisfaction/agreement ratings, SINGLE_SELECT/MULTI_SELECT for categorical choices, BOOLEAN for yes/no.
- Satisfy the prompt in the fewest questions possible; each should cover a single aspect of the prompt.
- Aim for 2-5 questions typically.
- Order matters: questions are asked in the order provided.

These questions will be used by the agent when conducting the pulse. Each will be covered with the employee.

### Step 3: Confirm settings
Anonymity is the only setting that needs the user's answer. When the user has already stated it, do not ask again. Every other setting has a default: no response deadline, the default reminder delay, run updates on, and no live streaming. Use the defaults without asking, create the draft, and list them in the draft confirmation so the user can change them. Ask about one of these settings only when the user raises it.

Confirm anonymity before calling `pulse_create`. It can still change with `pulse_update` before launch, but it is locked after launch.

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

CRITICAL DISAMBIGUATION: When the user says "send it now" or "send immediately", they mean **send the pulse now**: create the draft, then launch with `pulse_launch` and `sendNow: true` after the Step 7 confirmation. Do NOT interpret "send now" as "set the reminder delay to 0 or 1 minute". The reminder delay is a separate concept from when the pulse is sent.

Run Updates: Whether the creator gets updates from the agent throughout each run

Live Response Streaming (optional): If the user wants individual responses to land in a Slack channel as participants finish, pass `liveResponseStreamingChannel` (Slack channel name like `#pulse-results`, channel ID like `C0123456789`, or null to leave disabled) and optionally `liveResponseStreamingThreaded` (defaults true: responses thread under a single message instead of posting individually). The Windmill Slack bot must already be in the channel; if it isn't, the tool returns an error asking the user to add it. Anonymous pulses cannot stream. Warn the user and leave the field unset if they ask for both.

Completion Location (`surveyLocations`): Where participants can respond.
- Anywhere (default, `["WEB", "MCP"]`): on the Windmill platform or in their Windy chat. Windy can save answers for them.
- Platform only (`["WEB"]`): on the Windmill platform only. Windy can discuss the pulse, but it cannot save answers and sends participants to the platform instead.
`WEB` is always required.

Notification Channel (`notificationChannel`): How participants hear about each run.
- Windy chat (default, `AGENT`): Windy opens a chat with each participant and sends reminders there.
- Email (`EMAIL`): each participant receives an email with a link to respond on the platform.

Show both values in the settings summary with their labels (for example, "Completion: Anywhere, Notifications: Windy chat"). Change them only when the user asks. Use the labels, not the raw values, with the user.

### Step 4: Create the Draft
Call `pulse_create` with:
- `name`: Generated from prompt/questions (required)
- `prompt`: What they want to learn (required)
- `questions`: Array of typed question objects (required, at least one; see Step 2)
- `anonymity`: NAMED, ANONYMOUS, or MANAGER_HIERARCHY (required; null defaults to NAMED)
- `durationMinutes`: Response duration in minutes, min 30 (optional, omit for no deadline)
- `notificationDelayMinutes`: Minutes before first **reminder** to non-respondents (optional, defaults to 1440). Do NOT change this based on when the user wants to send the pulse; it only controls reminder timing.
- `runUpdatesEnabled`: Whether creator gets updates from the agent throughout each run (required boolean; `true` unless the user says otherwise)
- `liveResponseStreamingChannel`: Optional Slack channel reference (`#name`, `name`, or external ID like `C0123456789`) to stream individual responses into. Omit for no streaming. The Windmill Slack bot must already be in the channel.
- `liveResponseStreamingThreaded`: Optional boolean, defaults true. Only meaningful when a streaming channel is set.
- `surveyLocations`: Optional completion location. `["WEB", "MCP"]` (Anywhere) or `["WEB"]` (Platform only). Omit for Anywhere.
- `notificationChannel`: Optional. `AGENT` (Windy chat) or `EMAIL`. Omit for Windy chat.

### Step 5: Offer a Test
Tell the user that the draft exists, has no participants, and is not live. Offer to send a test to them with `pulse_test`, then wait for their answer.

- When the user asks to test, call `pulse_test` only. The test goes to the user alone, also when the request named a team or the whole company. A test request never calls `pulse_launch`, `pulse_send_now`, or a participant update.
- After a test, end your turn and wait for the user's feedback. Apply edits with `pulse_update`. Never call `pulse_test` and `pulse_launch` in the same turn. "Test it on me first, then send it" means: send the test now, and launch only after the user has seen the test and tells you again to send.
- A test is encouraged, not required. If the user declines, continue to Step 6.

### Step 6: Select Participants

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

Whenever constructing a participant filter, confirm the included employees with the user prior to launching the pulse.

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

Pulses require Windmill membership. Set `windmillAccess: "HAS_ACCESS"` in the participant filter.

### Step 7: Confirm and Launch
Before launch, confirm in one message:
- The audience and its current count.
- The send timing: now, one time, recurring, or start-date anniversary.
- That a sent pulse cannot be recalled.

For a scheduled send or a dynamic filter (a team, a group, or the whole company), say that the participants are resolved again at each send. The current count is not a fixed list of future recipients.

Call `pulse_launch` only after the user approves this confirmation. An instruction to send or launch that came before this confirmation, for example in the creation request, sets the intended audience and timing. It is not the approval. Send the confirmation after the draft exists, then wait for the user's reply. Do not call `pulse_launch` to check a filter, to preview, or to save participants early: every successful call makes the pulse live. To check an audience, count it with the employee tools. Pass `pulseId`, `participants`, and exactly one timing field:

| User intent | Timing field |
|-------------|--------------|
| "send now" | `sendNow: true` |
| "send next Monday at 9am" | `scheduleOneTime` |
| "every Friday" | `scheduleRecurring` |
| "30 days after their start date" | `scheduleStartDateAnniversary` |

After launch, load managing_pulses_skill.md for repeat sends (`pulse_send_now`), participant or schedule changes (`pulse_update`), and results.
