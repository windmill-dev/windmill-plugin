# Managing One-on-Ones (Notification Workflow)

## Your Responsibilities
- Manage 1:1 labels on calendar events
- Update shared 1:1 notes pages
- Configure notification preferences for 1:1s
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
3. Inspect the returned content shape to determine the update path:
   - If content is a string (markdown): use one-on-ones_agenda_update
   - If content is a structured object (JSON) and one-on-ones_agenda_update_json is available: use that tool
4. Build full replacement content (never delete content unless user explicitly requests)
5. Call the appropriate update tool with `oneOnOneId` and complete new content
6. Confirm with page link

### Notes Structure Guidelines (Markdown)
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

### Notes Structure Guidelines (JSON)
When content is returned as structured JSON and one-on-ones_agenda_update_json is available:
- Pass `oneOnOneId` and `content` (ProseMirror JSON document)
- Follow the schema returned by the load tool
- Preserve existing items unless explicitly asked to remove them

## Workflow: Manage Notification Preferences

Notification config controls when and how the user receives 1:1 meeting notifications.

### Loading Notification Config
1. Call one-on-ones_notification-config_load (no input required)
2. Returns the current employee's notification preferences:
   - `directReportsEnabled`: Whether notifications are enabled for 1:1s with direct reports
   - `indirectReportsEnabled`: Whether notifications are enabled for indirect reports
   - `managersEnabled`: Whether notifications are enabled for managers
   - `peersEnabled`: Whether notifications are enabled for peers
   - `notificationOffsetMinutes`: Minutes before the meeting when notifications are sent

### Updating Notification Config
1. Load existing config via one-on-ones_notification-config_load
2. Call one-on-ones_notification-config_update with the desired changes
3. Partial updates supported — only include fields you want to change:
   - `directReportsEnabled`: Enable/disable notifications for 1:1s with direct reports
   - `indirectReportsEnabled`: Enable/disable for indirect reports
   - `managersEnabled`: Enable/disable for managers
   - `peersEnabled`: Enable/disable for peers
   - `notificationOffsetMinutes`: Minutes before meeting to send notification
4. Omitted fields remain unchanged

### Supported notificationOffsetMinutes Values
The `notificationOffsetMinutes` field accepts these exact values:
- `30` — 30 minutes before
- `60` — 1 hour before
- `120` — 2 hours before
- `180` — 3 hours before
- `360` — 6 hours before
- `1440` — 1 day before
- `2880` — 2 days before

### Example Updates

Enable notifications for direct reports only:
```json
{
  "directReportsEnabled": true,
  "indirectReportsEnabled": false,
  "managersEnabled": false,
  "peersEnabled": false
}
```

Change notification timing to 1 hour before:
```json
{
  "notificationOffsetMinutes": 60
}
```

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
