---
name: manage-1on1s
description: Context and guidance for managing 1:1 meetings. Use when users want to create 1:1s, update shared 1:1 notes pages, or work with 1:1 calendar events.
domain: one-on-ones
resourceFilename: managing_one-on-ones_skill.md
---

# Managing One-on-Ones

## Relevant Resources
- one-on-ones_system_context.md

## Your Responsibilities
- Manage 1:1 labels on calendar events
- Update shared 1:1 notes pages
- You can only access 1:1s where the current employee is a participant

## Disambiguation

### Pair Disambiguation
When user refers to "my 1:1" or "my notes" without specifying which pair:
1. Use one-on-ones_query to list their active pairs
2. If multiple pairs exist, ask user to clarify which person/pair
3. Once identified, proceed with the specific operation

For calendar events, use one-on-one-events_query with filters to narrow down which event.

### Date Disambiguation
When user refers to a 1:1 without specifying a date (e.g., "add X to my 1:1 agenda with Bob"):
- Default to the next upcoming 1:1 for that pair
- Use one-on-one-events_next with the pair ID to resolve it
- If the result is null, inform the user that no upcoming 1:1 is scheduled for that pair

## Workflow: Create 1:1s

Public creation should default to ad-hoc creation.

1. Identify the other employee
  - Resolve the other participant and collect their `otherEmployeeId`
  - The current user is automatically included

2. Collect or confirm the start time
  - Use the user-provided meeting time when available
  - `startTime` must be ISO 8601 without timezone offset (e.g., "2025-01-15T10:00:00")
  - The backend interprets the time in the user's configured timezone

3. Create the 1:1
  - Call one-on-ones_create with `type: "ad_hoc"`, `otherEmployeeId`, and `startTime`
  - Confirm ad-hoc 1:1 created

Optional calendar-linked path:
- If a valid `calendarEventId` is already available from another workflow, one-on-ones_create also supports `type: "calendar_event"` with `otherEmployeeId` and `calendarEventId`
- This skill should not describe or perform a discovery flow for `calendarEventId`

## Workflow: Archive 1:1s

1. Identify the 1:1 to archive
2. Call one-on-ones_archive with `oneOnOneId`
3. Set `archiveAllOccurrences: true` for recurring calendar-linked 1:1s when appropriate
4. Confirm 1:1 archived

## Workflow: Update 1:1 Notes

Critical: Always load before update

1. Resolve the correct one-on-one (see Date Disambiguation above)
2. Load current page content via one-on-ones_agenda_load using that `oneOnOneId`
3. Build full replacement content (never delete content unless user explicitly requests)
4. Call one-on-ones_agenda_update with `oneOnOneId` and complete new content
5. Confirm with page link

Notes structure guidelines:
- Format: Markdown
- Use "Agenda" and "Action Items" H2 headers when content exists
- Use bullet points (`*` markdown notation) for agenda items
- Use markdown task list checkboxes (`- [ ]`) ONLY for action items
- Preserve existing content when adding new items
- Attribution: After each item, add a dash followed by the contributor's name in bold+italic
  - Syntax: `- ***Name***` (e.g., `* Discuss project timeline - ***Max***`)
  - If both employees share the same first name, use "FirstName LastInitial." (e.g., "Matt E."). If they also share the same last initial, use the full name (e.g., "Matt Ellis"). Otherwise, just use the first name.
  - Omit attribution if assignee unknown or both employees responsible
- Agenda item placement:
  - If no discussion question headers exist (bold text like `**Question?**`), add items as top-level bullets
  - If question headers exist, only place items under a question if directly answering it. Generic items go under a bold `**Other**` header at the bottom of the agenda
  - Only add the `**Other**` header when question headers already exist

## Tool Usage Patterns

Always load before write:
- Notes pages: Load with one-on-ones_agenda_load before calling one-on-ones_agenda_update

Batch operations:
- When labeling multiple events, process them sequentially
- Confirm after each batch completes

Full replacement model:
- Notes updates replace the entire page content
- Build the complete desired content before calling update
- Never use partial/append operations
