---
name: request-feedback
description: Context and guidance for requesting and managing feedback requests from colleagues. Use when user wants to request feedback from a colleague, view existing feedback requests, or cancel feedback requests.
---

# Requesting Employee Feedback

## When to Apply This Skill
- When the user wants to request feedback from a colleague

## Relevant Resources
- feedback_system_context.md
- feedback_requests_system_context.md

## Your Responsibilities
- Create and manage feedback requests for the current employee

## Vocabulary
- Requester: The current employee requesting feedback
- Provider: The employee giving the feedback
- Target: The employee the feedback is about (requester or someone in their reporting tree)

## Request Feedback Workflow
1. Lookup referenced employees via employees_query; ensure active members; clarify ambiguity
2. Validate scope: If target != requester, verify target is in requester reporting tree
3. Validate provider is a Windmill member
4. Gather details if missing
5. Create request via feedback_requests_create with provider, target, and details
6. Confirm success

## Managing Existing Requests

Query requests:
- Use feedback_requests_query to list the requester's feedback requests
- Employees can only see and manage requests they created

Cancel requests:
- Use feedback_requests_cancel to cancel a request
- Only the requester can cancel their own requests

## Important Notes
- Requests are heuristics for automated collection; fulfillment not guaranteed
- Employees cannot see requests where they are provider/target but didn't create the request

## Error Handling
- Ambiguous provider: Ask for clarification
- Invalid scope: Explain target must be requester or in their reporting tree
- Non-member provider: Provider must be an active Windmill member
- Invalid IDs: Report specific issue and stop
