---
name: manage-1on1s
description: Context and guidance for managing 1:1 agendas, preparation, notes, action items, and history. Use when users want to create standalone or calendar-linked 1:1 records, import historical notes through the in-platform flow, work with images in 1:1 notes, append/edit/replace shared 1:1 notes pages, or work with 1:1 calendar events.
domain: one-on-ones
resourceFilename: managing_one-on-ones_skill.md
---

# Managing One-on-Ones

## Relevant Resources
- one-on-ones_system_context.md
- prosedown_format_spec.md

## Your Responsibilities
- Manage pair-specific 1:1 classification on calendar events
- Update shared 1:1 notes pages
- You can only access 1:1s where the current employee is a participant

## Disambiguation

### Pair Disambiguation
When user refers to "my 1:1" or "my notes" without specifying which pair:
1. Use one-on-ones_query to list their pairs
2. If multiple pairs exist, ask user to clarify which person/pair
3. Once identified, proceed with the specific operation

For calendar events, use one-on-one-events_query with filters to narrow down which event.
This query includes active and inactive occurrences, including calendar-linked occurrences that
were manually removed from 1:1s. Use `isActive` to determine whether an occurrence is currently
active and the latest lifecycle reason to explain why it is inactive; do not infer current activity
or cause from the stored status alone.

### Date Disambiguation
When user refers to a 1:1 without specifying a date (e.g., "add X to my 1:1 agenda with Bob"):
- Default to the next upcoming 1:1 for that pair
- Use one-on-one-events_next with the pair ID to resolve it
- If the result is null, inform the user that no upcoming 1:1 is scheduled for that pair

## Workflow: Create 1:1s

Public creation should default to a standalone Windmill 1:1 record.

1. Identify the other employee
  - Resolve the other participant and collect their `otherEmployeeId`
  - The current user is automatically included

2. Collect or confirm the start time
  - Use the user-provided meeting time when available
  - `startTime` must be ISO 8601 without timezone offset (e.g., "2025-01-15T10:00:00")
  - The backend interprets the time in the user's configured timezone

3. Create the 1:1
  - Call one-on-ones_create with `type: "ad_hoc"`, `otherEmployeeId`, and `startTime`
  - Confirm that the standalone 1:1 record was created

Optional calendar-linked path:
- If a valid `calendarEventId` is already available from another workflow, one-on-ones_create also supports `type: "calendar_event"` with `otherEmployeeId`, `calendarEventId`, and `addToAllOccurrences`
- `addToAllOccurrences` must be a boolean: set `true` when the user wants all occurrences of a recurring meeting labeled, and `false` for only this occurrence or non-recurring meetings
- If a recurring event scope is ambiguous, ask whether to label only this occurrence or all occurrences
- This skill should not describe or perform a discovery flow for `calendarEventId`

## Workflow: Update 1:1 Classification

1. Resolve the exact pair with one-on-ones_query and occurrence with one-on-one-events_query
2. If the user says an inactive occurrence is still a 1:1, call one-on-ones_event_confirm
3. If the user says a calendar occurrence is not a 1:1:
   - For a single occurrence, call one-on-ones_event_remove
   - For the selected occurrence and future recurring occurrences, call one-on-ones_series_remove
   - If the scope is ambiguous for a recurring event, ask before changing anything
4. Confirm only after the tool succeeds

For ad-hoc 1:1s with no calendar event, use one-on-ones_archive. Calendar-linked classification
changes must use the pair- and event-scoped tools above.

## Workflow: Help Users Import Existing 1:1 Notes

Historical notes import is an in-platform flow, not an agent tool workflow.

1. Identify the 1:1 relationship the user wants to import notes for
2. Direct the user to that relationship's page and the "Import 1:1 Notes" action
3. Explain that the user pastes the document content into the import dialog
4. Recommend including dates so Windmill can match note sections to meetings
5. Set expectations that the import may take a few minutes and will not overwrite notes already in Windmill
6. Explain that if the document has notes for a date missing from the 1:1 timeline, Windmill may add a past 1:1 for that date and put the notes there

Do not claim that historical notes import is unsupported. Do not claim to start or monitor the import because Windy has no tool for either action.

## Image Capability Boundaries

- Users can upload or paste images into 1:1 notes through the in-platform editor
- Windy cannot upload a binary image or transfer an external attachment, including a Slack attachment, into a 1:1 notes page
- Preserve existing image content during notes updates unless the user explicitly asks to remove it

## Workflow: Update 1:1 Notes

1. Resolve the correct one-on-one (see Date Disambiguation above)
2. Select the narrowest mutation mode:
   - For a new item at the end, use `append` with only the new ProseDown fragment and any needed leading newlines
   - For a targeted change or insertion within existing notes, load current content and use `edit` with one or more sequential `oldText` → `newText` replacements
   - Use destructive `replace` only when the user wants the whole page rewritten; load current content first and pass the complete replacement
3. For `edit`, copy enough current text into each `oldText` to make its exact or whitespace-normalized match unique
4. Call one-on-ones_notes_update with `oneOnOneId` and a `mutation` containing the selected `mode` plus that mode's `content` or `edits`
5. Confirm with page link

Notes structure guidelines:
- Use "Agenda" and "Action Items" H2 headers when content exists
- Use bullet points for agenda items
- Use task list checkboxes ONLY for action items
- Preserve existing content when adding new items
- Attribution: After each item, add a dash followed by the contributor's name in bold+italic
  - If both employees share the same first name, use "FirstName LastInitial." (e.g., "Matt E."). If they also share the same last initial, use the full name (e.g., "Matt Ellis"). Otherwise, just use the first name.
  - Omit attribution if assignee unknown or both employees responsible
- Agenda item placement:
  - A "discussion question header" is bolded text phrased as a question (e.g. "What's blocking you?")
  - If no discussion question headers exist, add items as top-level bullets
  - If question headers exist, only place items under a question if directly answering it. Generic items go under a bold "Other" header at the bottom of the agenda
  - Only add the "Other" header when question headers already exist

### Prosedown formatting
Prosedown is markdown extended with prosedown table/node markup. See the prosedown_format_spec.md resource for the full format.
- Use `*` for bullet points
- Use `- [ ]` for action item checkboxes
- Use `**bold**` for headers and emphasis
- Attribution syntax: `- ***Name***` (e.g., `* Discuss project timeline - ***Max***`)
- Preserve any `<table>`/`<pd-*` markup blocks exactly as loaded unless the user asks to change them
- Preserve existing employee tags such as `[Name](EMPL-id?t=uuid)` exactly as loaded
- When the user explicitly asks to tag the other 1:1 participant, use their known employee citation ID as `[Name](EMPL-id)`; omit `?t=` so the system creates a new tag
- Never invent an employee ID or tag someone who is not a participant in this 1:1

## Tool Usage Patterns

Choose the narrowest notes mutation mode:
- Use `append` to add content at the end without loading first; include leading newlines needed to separate it from existing ProseDown
- Use `edit` for targeted replacements; load immediately before editing so each `oldText` has exactly one exact or whitespace-normalized match
- Use destructive `replace` only when the entire page should be rewritten; load first and preserve everything that should remain
- Multiple `edit` operations run sequentially in request order; if any match is missing or ambiguous, none of the changes are written

Batch operations:
- When labeling multiple events, process them sequentially
- Confirm after each batch completes
