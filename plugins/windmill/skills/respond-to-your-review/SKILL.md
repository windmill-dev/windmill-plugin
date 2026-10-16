---
name: respond-to-your-review
description: Participant workflow playbook for completing your own performance review: find open to-dos, load the full review context, and draft and submit answers. References the best-practices skill for writing guidance.
domain: performance-reviews
resourceFilename: performance-reviews_respond_to_your_review_skill.md
---

# Respond to Your Review

Participant workflow for completing a performance review as a reviewee.

## Relevant Resources
- performance-reviews_system_context.md
- performance-reviews_review_best_practices_skill.md: writing quality, evidence, fairness, tone, and the "help me think through my own review" relational guidance

Tools with the `performance-reviews_admin_*` prefix require cycle-admin access. Use the participant tools below for your own work; enrollment and stage-assignment lookups are not required.

## Step 1: Find What You Owe

Call performance-reviews_my_todos_load to get the participant's open review tasks across all active cycles.

- Returns assignments with their stage type (SELF, PEER, UPWARD) and submission state.
- List them with links; no caveats needed at this stage.

## Step 2: Load the Full Review Context

Call performance-reviews_review_load for the specific assignment.

- For a self-review, this returns the configured questions plus a self-review context brief, if one has been generated for the cycle (it may be empty early in the cycle).
- For a peer review, it returns the peer's questions.
- Use the loaded context as the basis for drafting. Do not fill in answers from memory or assumption.

## Step 3: Draft and Submit

Call performance-reviews_review_answer to save draft answers or submit.

- Saving a draft is reversible; submission is the meaningful commit.
- Before submitting, preview the answers with the user and confirm intent.
- Refer to performance-reviews_review_best_practices_skill.md for specificity, evidence, and tone guidance, especially the relational element when writing a self-assessment.

## Key Constraints

- A participant never sees the peer feedback or upward feedback written about them.
- Self-review answers are visible to the participant's manager and cycle admins.
- Submitting is not the same as sharing: a submitted manager review isn't accessible to the receiving employee until it is shared with them.
