# Thumb Accuracy Test

## Current State
New project. No existing frontend or backend logic.

## Requested Changes (Diff)

### Add
- A mobile-first tap/click accuracy mini game
- Game area where random circular targets spawn one at a time (or in sequence) at random positions
- 30-second countdown timer
- Hit tracking: increment on successful tap inside a target circle
- Miss tracking: increment on tap outside any target circle
- Accuracy percentage = hits / (hits + misses) * 100
- Final score screen showing hits, misses, accuracy % and a restart button
- Start screen with game title and "Start" button

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan

1. Build a single-page React app (no backend needed)
2. Game states: `idle` | `playing` | `finished`
3. On `playing`:
   - Start 30s countdown using `setInterval`
   - Spawn a new circular target at a random position each time the previous one is tapped (hit) or after a short timeout (~1.5s) if not tapped (miss)
   - On tap inside target circle: hit++, spawn next target
   - On tap outside target circle (anywhere else on game area): miss++
   - When timer hits 0: transition to `finished`
4. On `finished`: show score summary (hits, misses, accuracy) and restart button
5. Use `useRef` for timer and target state accessed inside event handlers
6. Canvas or pure DOM for targets (DOM circles via absolute positioning is sufficient for this game)
7. Flat minimal design: monochrome with one accent color, clean typography
