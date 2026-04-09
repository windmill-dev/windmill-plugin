---
name: collect-feedback
description: Context and guidance for collecting user-initiated feedback about colleagues. Use when user wants to give feedback to a coworker.
---

# Collecting User-Initiated Employee Feedback

## When to Apply This Skill
- When the user wants to give feedback to a colleague

## Relevant Resources
- feedback_system_context.md
- feedback_shoutouts_system_context.md

## Your Responsibilities
- Collect, confirm, and submit the user's feedback about colleagues
- Manage shoutouts for positive feedback

## Collection Workflow
1. Identify targets via employees_query; reject self; clarify ambiguous matches
2. Collect feedback (see conversation rules below)
3. Confirm the feedback you are about to submit. If positive and shoutouts configured, ask if user wants to share as shoutout; create after submit (step 4)
4. Submit per recipient (feedback_create supports multiple pieces of feedback)
5. Confirm success after all submissions are complete

## Conversation Rules
- At most ONE question per message. Do not chain questions
- No process announcements
- Maintain a conversational, down to earth tone

### Follow-ups
- Only ask follow-ups for deeper feedback when necessary. Avoid them unless absolutely necessary.
- Limit follow-ups to 1-2 per submission (if any are required)
- When asking follow-ups for deeper feedback, use a feed-forward approach
  - Example: Instead of "How could they have done better?", phrase as "What could they do differently in the future?"

## Feedback Submission Formatting

### Default Mode (WYSIWYG)
By default, the user's words ARE the feedback. Submit what they said with only spelling/grammar corrections.
- Preserve their exact formatting, phrasing, specific details, examples, and tone
  - Include any links provided by the user
- Fix spelling and grammar only. Do NOT rephrase, summarize, generalize, or add new language. Do not inject filler text.
- If feedback spans multiple messages, weave them together but use the user's actual words and phrases
- Perspective: Do NOT change pronouns or person. If the user says "she did X", submit "she did X" — not "you did X". Feedback is logged on a shared platform, not delivered privately. Preserve the user's exact perspective.
- Constraints: Omit conversation filler such as the user greeting you or their sign-offs. Save the feedback, not the surrounding conversation.
- Multiple recipients: Submit individualized feedback per person, but maintain everything else about the feedback.

### Rewrite Mode (user-initiated only)
If the user explicitly asks you to "turn this into feedback", "clean it up", "rewrite it", or similar:
- You may restructure and polish the feedback while preserving the core meaning and key details
- You MUST present the rewritten feedback to the user for confirmation before submitting
- If a shoutout will be created, also confirm the shoutout text before creating it
- Do not enter rewrite mode unless the user explicitly signals it

## Handling Visibility
- Check current visibility setting via feedback_load_visibility_setting
- Note: Shoutouts will set visibility to PUBLIC regardless of default setting
- Employee cannot control visibility directly

## Offering Shoutouts
- The shoutouts system will share positive feedback to a pre-configured channel
- Shoutouts can only be created for highly positive feedback without constructive elements
- Users will often signal shoutout intent when initiating feedback. Do not offer a shoutout if this is the case.
- If user does not signal intent, offer a shoutout if feedback meets criteria and shoutouts are configured.
- Use the feedback_shoutouts_create tool to create a shoutout after submitting the feedback.
- Use the feedback_shoutouts_load_config tool to check if shoutouts are configured and enabled.
- Do not offer a shoutout if it is not configured and enabled.
- If user signals intent to create shoutout, and they are not configured, let them know prior to collecting feedback.

## Shoutout Comment Content
- The shoutout comment MUST be the same text as the submitted feedback. Do not rewrite, summarize, or generate a new comment.
- The comment is what gets broadcast to the company channel -- it should reflect exactly what the user said, not a condensed or reworded version.
- For multiple recipients in one shoutout, combine names and use the shared feedback text: e.g., "X and Y did great on..." -- do not duplicate the feedback for each recipient.

## Tool Usage Patterns

Submission model:
- One piece of feedback per recipient; multiple recipients require multiple submissions
- Use feedback_create for each recipient
- Shoutouts created after feedback submission using feedback_shoutouts_create
- Many pieces of feedback can be combined into a single shoutout (requires feedbackIds)

## Error Handling
- Employee not found: Ask for full name or department
- Non-member target: Target is not an active Windmill member; cannot submit feedback
- Tool failure: Report failure to user
