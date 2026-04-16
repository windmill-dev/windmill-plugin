---
name: manage-notes
description: Context and guidance for managing private notes for the current employee. Use when users want to create, retrieve, update, or delete personal notes about colleagues.
domain: private-notes
resourceFilename: manage_private_notes_skill.md
---

# Managing Private Notes

## Relevant Resources
- private_notes_system_context.md
- employees_system_context.md

## Your Responsibilities
- Create, retrieve, update, and delete private notes for the current employee

## Principles

Privacy: Notes are strictly private - only the owner can access their notes

Single employee: Each note must reference exactly one employee (required, 1:1 relationship)

Voice preservation: Preserve user's words and meaning when creating or updating notes

Employee resolution: Always resolve the employee reference before saving using employees_query or employees_load. This applies to BOTH the `employeeId` parameter AND any employee names written in note content. If a name in the note body cannot be resolved to a known employee, either look it up first or preserve only what the user provided.

## Finding Notes

Semantic search:
- Use private_notes_query with `semanticQuery` for themes, concepts, or fuzzy memories
- Backed by vector similarity search
- Best for "notes about X" or "when I talked about Y"

Text search:
- Use private_notes_query with `textQuery` for exact phrases or specific keywords
- Best for finding specific words or names

Employee filter:
- Combine with semantic or text queries when user mentions a specific person
- Use `employeeId` parameter after resolving employee via employees_query

Fallback strategy:
- If zero results with one search type, try the other
- Broaden filters if still no results
- Ask user to clarify or try different keywords

## Disambiguation

When user refers to "my note" or "that note" without clear identification:
1. Use search tools to find matching notes
2. If multiple matches, show brief list and ask user to clarify
3. Once identified, proceed with operation

## Workflow: Create Note

1. Collect note content from user (preserve their voice)
2. Resolve any employee reference via employees_query or employees_load
3. Call private_notes_create with content and `employeeId` for the reference
4. Confirm note created

## Workflow: Update Note

Critical: Always load before update

1. Find the note via search tools
2. Load current note content via private_notes_load using `noteId`
3. Build full replacement content (preserve existing content unless user explicitly requests changes)
4. Resolve any new employee reference
5. Call private_notes_update with `noteId`, complete new content, and updated `employeeId`
6. Confirm note updated

## Workflow: Delete Note

1. Find the note via search tools (if not already identified)
2. Call private_notes_delete with `noteId`
3. Confirm note deleted (soft delete/archived)

## Tool Usage Patterns

Always load before write:
- Load note with private_notes_load before calling private_notes_update

Full replacement model:
- Updates replace the entire note content
- Build the complete desired content before calling update
- Never use partial/append operations

Resolve references first:
- Always resolve employee mentions to IDs before create/update
- Use employees_query for name-based lookup
- Use employees_load if you already have an ID
- This includes names mentioned in note content, not just the `employeeId` parameter
- If the user provides only a first name, search for matching employees to get the full name before writing it in the note

## Error Handling

Note not found:
- Verify search criteria with user
- Try alternative search method (semantic vs text)
- Confirm note actually exists

Employee reference not found:
- Ask user for full name or clarifying details
- Try broader search parameters
- Suggest similar names if available

Tool failures:
- Report concise error reason
- Suggest alternative action if available
