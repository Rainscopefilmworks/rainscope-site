# Site Improvements

This document tracks the issues found during the live-site audit and will be the working brief before implementation begins.

## Current Findings

### High Priority

1. Portfolio modal close interaction breaks on `/our-work/`.
   The project modal's close button can be blocked by the video layer, causing normal clicks to fail.

2. Homepage hero video appears to request the same asset repeatedly.
   Multiple `206` requests were observed for `hero-videov3.mp4` during a single page load session. This should be reviewed for autoplay, preload, and lifecycle behavior.

3. Production pages are shipping verbose debug logs.
   `/rentals/` and `/shop/` output extensive internal filtering and catalog logs in the browser console. These should be removed or gated behind a development flag.

### Medium Priority

4. Homepage stats show `0+`, `0%`, and `0+` on initial mobile render.
   The counters later update after scroll, but the first visible state is weak and can reduce trust.

5. `/our-work/` emits an iframe/embed warning.
   The page logs a warning that `allow` takes precedence over `allowfullscreen`. This is minor but should be cleaned up.

## Improvement Opportunities

1. Deep-link featured work cards to specific projects instead of sending every card to the general portfolio page.

2. Reduce friction in the contact flow.
   The first step currently asks only for a name. A clearer value proposition or a more efficient first step may improve conversion.

3. Revisit homepage performance budget.
   The hero media experience is visually strong, but it likely carries the biggest performance and mobile UX cost.

## Proposed Work Order

1. Fix broken interaction issues.
2. Remove production debug logging.
3. Stabilize homepage stat rendering.
4. Review and optimize homepage video loading behavior.
5. Clean up smaller warnings and conversion improvements.

## Stack Confirmation

Confirmed stack baseline:

- Static site generator: `Eleventy`
- Dev server: `eleventy --serve`
- Build command: `eleventy`
- Current styling approach: custom CSS

### Tailwind Decision

Tailwind can make sense, but only if we expect broader UI work beyond the current bug-fix pass.

Recommended default:

1. Keep the immediate fixes in the current CSS approach.
2. Add Tailwind only if we are planning a larger component/style cleanup across multiple pages.

Reasoning:

- The current audit items are mostly interaction, performance, and cleanup issues.
- Adding Tailwind now introduces setup work and styling churn that is not required to fix the highest-priority problems.
- Tailwind becomes more valuable if we want to standardize repeated layouts, cards, forms, buttons, spacing, and responsive behavior across the whole site.

## Notes

- Audit source: live review of `https://rainscopefilmworks.com/` on desktop and mobile via Playwright on April 2, 2026.
- Keep implementation scoped carefully because the current worktree already contains unrelated local edits.
