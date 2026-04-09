---
name: manage-1on1s
description: Context and guidance for managing 1:1 meetings. Use when users want to create 1:1s, update shared 1:1 notes pages, manage notification preferences, or work with 1:1 calendar events.
---

# Managing One-on-Ones

## Relevant Resources
- one-on-ones_system_context.md
- meetings_system_context.md

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

Default approach: Try calendar event first, fall back to ad-hoc

1. First, search for an existing calendar event using meetings_calendar_query
  - Filter by attendee name if user mentions a specific person
  - Filter by time/date if user specifies when
  - This tool returns calendar events with an `eventId` — pass it as the `calendarEventId` when creating the 1:1

2. If matching calendar event found:
  - Call one-on-ones_create with `type: "calendar_event"`, `otherEmployeeId`, and `calendarEventId`
  - The current user is automatically included — only provide the other employee's ID
  - Set `addToAllOccurrences: true` for recurring events when appropriate
  - Confirm 1:1 created and linked to calendar

3. If NO matching calendar event found (or user explicitly says "no calendar event"):
  - Fall back to ad-hoc creation
  - Call one-on-ones_create with `type: "ad_hoc"`, `otherEmployeeId`, and `startTime`
  - `startTime` must be ISO 8601 without timezone offset (e.g., "2025-01-15T10:00:00")
  - The backend interprets the time in the user's configured timezone
  - Confirm ad-hoc 1:1 created

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

## Workflow: Manage Notification Preferences

Loading notification config:
1. Call one-on-ones_notification-config_load to get the current employee's notification preferences
2. Returns which relationship types have 1:1 notifications enabled (direct reports, indirect reports, managers, peers)
3. Also returns the current notification timing offset in minutes before the meeting

Updating notification config:
1. Load existing config via one-on-ones_notification-config_load
2. Call one-on-ones_notification-config_update with the desired changes
3. For notification timing: omit the field to leave it unchanged, or pass one of these exact minute values to set a specific timing: 30, 60, 120, 180, 360, 1440, 2880
4. Only include the fields you want to change — omitted fields remain unchanged
5. Confirm update

## Tool Usage Patterns

Always load before write:
- Notes pages: Load with one-on-ones_agenda_load before calling one-on-ones_agenda_update
- Notification config: Load with one-on-ones_notification-config_load before calling one-on-ones_notification-config_update

Batch operations:
- When labeling multiple events, process them sequentially
- Confirm after each batch completes

Full replacement model:
- Notes updates replace the entire page content
- Build the complete desired content before calling update
- Never use partial/append operations
