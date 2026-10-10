---
name: write-manager-reviews
description: Core manager workflow for writing performance reviews: load the full review context (self/peer/upward feedback + per-question suggestions), draft and submit, locking and submission semantics, fairness guidance, and the manager↔report coaching element.
domain: performance-reviews
resourceFilename: performance-reviews_write_manager_reviews_skill.md
---

# Write Manager Reviews

Core manager workflow for completing a manager review for a direct (or assigned) report.

## Relevant Resources
- performance-reviews_system_context.md
- performance-reviews_review_best_practices_skill.md: specificity, evidence, fairness/bias avoidance, tone, and the manager↔report coaching element

Tools with the `performance-reviews_admin_*` prefix require active WRITE ownership of the cycle. Manager access alone does not grant this permission. Use the review tools below for manager work.

## Step 1: Gather Context

Call performance-reviews_review_load for the manager review assignment.

This assembles and returns:
- The configured manager-review questions for the cycle
- The subject employee's self-review responses
- Aggregated peer feedback (if the cycle has a peer stage)
- Upward feedback from the subject's direct reports (if applicable)
- A manager context report with per-question suggestions, when one has been generated for the review (it may be empty early in the cycle)

Use everything loaded here as the drafting foundation. Do not summarize or invent details not present in the loaded context.

## Step 2: Draft and Submit

Call performance-reviews_review_answer with `reviewType: MANAGER` to save drafts or submit.

- Drafts are reversible; submission is the meaningful commit for the manager review.
- Before submitting, preview all answers with the manager and confirm intent.
- Submitted manager reviews aren't accessible to the receiving employee until the review is shared with them.

## Fairness and Specificity

- Evaluate the employee against the role and cycle criteria, not relative to peers in this session.
- Peer and upward feedback are inputs, not the final word. The manager review is the manager's own assessment, informed by that feedback.
- Where feedback is conflicting, acknowledge the range or explain which signal you weight more and why.
- See performance-reviews_review_best_practices_skill.md for full guidance on evidence-grounding, bias avoidance, and tone.

## Coaching Element

Frame manager review answers developmentally: describe what the employee did well, where they can grow, and how you will support that growth. This is the manager's primary coaching artifact for the cycle; make it useful to the employee when it is eventually shared.

## Locking and Submission Semantics

- Submission and locking are separate: a submitted manager review remains editable until it is explicitly locked.
- Submitting is a meaningful commit. You must get explicit user confirmation before calling the tool.
