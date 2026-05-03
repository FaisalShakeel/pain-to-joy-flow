# Quick Sync Slot Picker Dialog

## Goal
When the user clicks the **Quick Sync** badge (the gold "QSync" pill overlaid on the profile avatar / shown in the profile header), open a dialog that displays the offered Quick Sync windows for **today**, broken into **3-minute slots**, each marked **Available** or **Booked**, with one-tap booking.

## Behavior
- Two windows shown for status `available`: **10:00–10:30** and **14:00–14:30**.
- Each window auto-generates 10 slots of 3 minutes (10:00, 10:03, … 10:27 / 14:00, 14:03, … 14:27).
- Each slot shows time + state badge:
  - **Available** → primary button, click → confirmation toast "Quick Sync booked for HH:MM" and slot flips to Booked locally.
  - **Booked** → disabled muted chip with lock icon.
- A deterministic mock marks ~30% of slots as already booked (seeded by slot index so it stays consistent per render).
- Header of dialog: contact name + "Same-day Quick Sync · 3-min calls".
- Footer: "Times shown in your local timezone" + close.

## UI/UX
- Use existing `Dialog` from `@/components/ui/dialog`.
- Two-column grid (one per window) on `md+`; stacked on mobile.
- Slot pills laid out as a wrap grid (5 per row), tabular-nums, small.
- Reuses existing tokens (`bg-primary`, `bg-surface-low`, `ghost-border`, `text-muted-foreground`).

## Technical changes

1. **New component** `src/components/app/QuickSyncSlotsDialog.tsx`
   - Props: `open`, `onOpenChange`, `contactName`, `windows: SyncWindow[]`.
   - Internal helper `expandWindow(start, end, stepMin=3)` returns `string[]` of slot starts.
   - Internal `useState<Set<string>>` of locally-booked slots; merged with mock-booked set.
   - Renders `Dialog` → grid of windows → grid of slot buttons.

2. **Update** `src/components/app/QuickSyncBadge.tsx`
   - Replace the `HoverCard` with a click-to-open trigger that opens `QuickSyncSlotsDialog`.
   - Keep the visual badge (Zap + "QSync" + compact times) unchanged.
   - Drop the existing `onBook` "Book Quick Sync" button (the dialog replaces that flow). Keep the `onBook` prop optional for backward compatibility but it becomes unused; or remove it — we'll remove it and update the one caller.

3. **Update** `src/pages/app/ContactProfile.tsx`
   - Pass `contactName={contact.name}` to `QuickSyncBadge` (windows already passed).
   - Remove now-unused `onBook` on the badge (the "Book Meeting" button in `ActionPanel` still routes to the scheduler).

## Out of scope
- Persistence of booked slots (mock only, resets on reload).
- Real availability data from a backend.
- Changing the windows for `focus` status (will continue to show 16:30–17:00 as a single window).
