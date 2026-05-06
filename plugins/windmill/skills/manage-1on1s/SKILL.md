---
name: manage-1on1s
description: Context and guidance for managing 1:1 meetings. Use when users want to create ad-hoc or calendar-linked 1:1s, update shared 1:1 notes pages, or work with 1:1 calendar events.
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
- If a valid `calendarEventId` is already available from another workflow, one-on-ones_create also supports `type: "calendar_event"` with `otherEmployeeId`, `calendarEventId`, and `addToAllOccurrences`
- `addToAllOccurrences` must be a boolean: set `true` when the user wants all occurrences of a recurring meeting labeled, and `false` for only this occurrence or non-recurring meetings
- If a recurring event scope is ambiguous, ask whether to label only this occurrence or all occurrences
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
4. Update using the correct tool based on the format returned by the load tool:
   - If the load tool returned content as a **string** (markdown): use one-on-ones_agenda_update with markdown content
   - If the load tool returned content as a **JSON object** (ProseMirror JSON): use one-on-ones_agenda_update_json with ProseMirror JSON content
5. Confirm with page link

Notes structure guidelines (applies to both formats):
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

### When content is Markdown (string)
- Use `*` for bullet points
- Use `- [ ]` for action item checkboxes
- Use `**bold**` for headers and emphasis
- Attribution syntax: `- ***Name***` (e.g., `* Discuss project timeline - ***Max***`)

### When content is ProseMirror JSON (object)

#### ProseMirror JSON Format Reference

Page content uses ProseMirror JSON — the canonical document format of the rich-text editor.

Document: { "type": "doc", "content": [...blocks] }

Block nodes:
- { "type": "paragraph", "content": [...inline] }
- { "type": "heading", "attrs": { "level": 1-6 }, "content": [...inline] }
- { "type": "bulletList", "content": [...listItems] }
- { "type": "orderedList", "content": [...listItems] }
- { "type": "listItem", "content": [paragraph, ...blocks] }  (first child MUST be paragraph)
- { "type": "taskList", "content": [...taskItems] }
- { "type": "taskItem", "attrs": { "checked": true|false }, "content": [paragraph, ...] }
- { "type": "blockquote", "content": [...blocks] }
- { "type": "codeBlock", "content": [...text] }
- { "type": "horizontalRule" }
- { "type": "table", "content": [...tableRows] }
- { "type": "tableRow", "content": [...cells] }
- { "type": "tableCell", "attrs": { "colspan": 1, "rowspan": 1, "colwidth": null }, "content": [...blocks] }
- { "type": "tableHeader", "attrs": { "colspan": 1, "rowspan": 1, "colwidth": null }, "content": [...blocks] }

Inline:
- { "type": "text", "text": "..." }
- { "type": "text", "text": "...", "marks": [...marks] }
- { "type": "hardBreak" }

Marks (array on text nodes):
- { "type": "bold" }
- { "type": "italic" }
- { "type": "strike" }
- { "type": "code" }
- { "type": "link", "attrs": { "href": "..." } }
- { "type": "highlight", "attrs": { "color": "#hex" } }
- { "type": "superscript" }
- { "type": "subscript" }

Rules:
- Omit "attrs" when all values are defaults
- Omit "content" on leaf nodes (horizontalRule, hardBreak)
- Omit "marks" on text nodes with no formatting
- listItem first child must be a paragraph
- Table cells contain block nodes (at minimum one paragraph)
- When updating, always return the FULL document — the system diffs and applies only the changes
- CRITICAL: Escape double quotes inside text values with backslash. Example: { "text": "Discuss the \"Project Alpha\" initiative" }

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
