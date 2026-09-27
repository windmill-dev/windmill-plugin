---
name: manage-1on1s
description: Guidance for managing 1:1 agendas, preparation, action items, and history. Use when users want to create standalone or calendar-linked 1:1 records, import historical notes through the in-platform flow, update shared agendas, or work with 1:1 calendar events.
domain: one-on-ones
resourceFilename: managing_one-on-ones_skill.md
---

# Managing One-on-Ones

## Relevant Resources
- one-on-ones_system_context.md
- prosedown_format_spec.md

## Your Responsibilities
- Manage which calendar events Windmill tracks as 1:1s
- Update shared 1:1 agendas
- You can only access 1:1s where the current employee is a participant

## Disambiguation

### Person Disambiguation
When the user refers to "my 1:1" or "my agenda" without specifying the other person:
1. Use one_on_ones_partners to list their 1:1 partners
2. If multiple partners exist, ask the user to clarify which person
3. Once identified, proceed with the specific operation

Use one_on_ones_search with person and time filters to narrow down the 1:1.

### Meeting Occurrence IDs
Use the chosen search result's `oneOnOneId` for one_on_ones_open and
one_on_ones_agenda_mutate. It identifies one meeting occurrence, not the recurring pair,
the other employee, or the linked calendar event.

Synthetic example:
- Search returns `oneOnOneId: "01997b00-0000-7000-8000-000000000012"`,
  `otherEmployee.employeeId: "cma7k9f2n0001lxr91cvdj8qy"`, and
  `calendarEvent.calendarEventId: "01997b00-0000-7000-8000-000000000099"`.
- Pass `"01997b00-0000-7000-8000-000000000012"` to one_on_ones_open as `oneOnOneId`.
- Pass that same `oneOnOneId` to one_on_ones_agenda_mutate, copying the opened
  `agenda.revision` into `expectedRevision`.

### Date Disambiguation
When the user refers to a 1:1 without specifying a date:
- Search with `upcomingOnly: true`, sort by start time ascending, and use the first result
- If the result is empty, explain that no upcoming 1:1 is scheduled with that person

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
  - Call one_on_ones_create with `type: "ad_hoc"`, `otherEmployeeId`, and `startTime`
  - Confirm that the standalone 1:1 record was created

Optional calendar-linked path:
- Use one_on_ones_calendar_events_search to find a shared event with the other employee
- Call one_on_ones_create with `type: "calendar_event"`, `otherEmployeeId`,
  `calendarEventId`, and `scope`

## Workflow: Update 1:1 Tracking

1. Resolve a tracked 1:1 with one_on_ones_search or find a shared calendar event with
   one_on_ones_calendar_events_search
2. To track or restore a calendar event as a 1:1, use one_on_ones_create
3. To stop tracking a calendar-linked or standalone 1:1, use one_on_ones_delete

For standalone 1:1s with no calendar event, use one_on_ones_delete with single scope.

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
- Windy cannot upload a binary image or transfer an external attachment, including a Slack attachment, into a 1:1 agenda
- Preserve existing image content during notes updates unless the user explicitly asks to remove it

## Agenda editing

- Call `one_on_ones_open` with the exact `oneOnOneId` and
  `include: ["agenda", "template"]` before editing. Include recordings and load the relevant
  transcript when the request depends on one.
- Use the opened revision with one_on_ones_agenda_mutate. Use append to add items at the end, edit
  to add items under an existing heading or change text, and replace only for an empty agenda or a
  requested whole-page rewrite.
- Follow the user's explicit structure, headings, or placement. The rules below are defaults.
- Make one mutation for all requested changes. For edit mode, make each `oldText` match unique.
  Reopen after a revision conflict before retrying.
- Preserve existing content, headings, order, tables, tags, and unrelated markup unless asked to
  change them. Keep the user's wording, meaning, certainty, and known ownership; fix typos without
  changing intent. Do not infer an owner from formatting or generic transcript labels.
- File settled choices under Decisions and committed work under Action Items. Keep pending matters
  under discussion, updates, or open questions; add a concise heading if none fits.
- When the agenda already has content or a template, match its existing headings, order, and
  bullet style. Put an item under a heading that describes it; add a concise heading only if none
  fits. Do not wrap existing content in a new heading.
- For an empty agenda without a template, use `## Agenda` for topics and `## Action Items` for
  to-dos. Include a heading only when it has content. Use `*` bullets for agenda items and
  `- [ ]` checkboxes only for action items.
- When bold discussion-question headings exist, put an item beneath one only if it answers that
  question. Put other items under a bold **Other** heading at the end of Agenda. Without question
  headings, add top-level bullets and do not add **Other**.
- Attribute a known contributor or action owner inline as ` - ***Name***`. Use the first name,
  or a last initial/full name when the participants share a first name. Leave shared or unknown
  ownership unattributed.
- Preserve `<table>`, `<pd-*`, and existing employee tags exactly unless asked to edit them.
  When asked to tag the other participant, use their known citation ID as `[Name](EMPL-id)`.
  Never invent an employee ID.
- Confirm only what the mutation saved.

## ProseDown format
Prosedown is markdown extended with table and node markup. Plain markdown edits can use the
guidelines below. Before changing rich markup or when its round-trip behavior is uncertain, load
the full spec at file:///global/prosedown_format_spec.md.
- Never tag someone who is not a participant in this 1:1.

## 1:1 tracking

- Search for the relevant 1:1 before changing tracking. Use lifecycle `isActive` and its reason
  for the current state; stored status alone can be stale.
- For a recurring calendar event, clarify whether the user means one event or the series when
  scope is ambiguous. Use `scope: "single"` for one event and `scope: "series"` only when the
  user intends the recurring series.
- Creating or deleting 1:1 tracking does not schedule, cancel, or delete calendar events.
- Confirm a tracking change only after its tool succeeds.
