## Fix two regressions on the Contacts page

### 1. Description placement — before the title, not under it
Currently the description renders as a paragraph below the title. The user wants the descriptive sentence to appear **in front of** the "Your contacts" title inside the header.

Change in `src/components/app/AppShell.tsx`:
- Remove the `description` block that renders under the `<h1>`.
- Render `description` **above** the title (just under the `subtitle` eyebrow, before the `<h1>`), as a leading paragraph in the header. Keep `max-w-2xl` and muted styling so it reads as intro copy that precedes the title.

No other AppShell consumers pass `description`, so this is safe.

### 2. Restore the toolbar to its original location
The previous change moved the toolbar (back button, search, filters, density toggle) into `headerInline`. That was never requested. Revert it.

Change in `src/pages/app/Contacts.tsx`:
- Remove `headerInline={...}` from the `<AppShell>` props.
- Re-render the same toolbar block inside the page body (above the contacts grid), exactly where it lived before — wrapped in its original container so back button / search / filters / density toggle sit on the page, not in the header row.
- Keep `subtitle`, `title`, and `description` props on `<AppShell>` so the header still shows the intro sentence + title.

### Files touched
- `src/components/app/AppShell.tsx` — move `description` rendering above `<h1>`.
- `src/pages/app/Contacts.tsx` — remove `headerInline`, restore toolbar to page body.

No business logic, no styling beyond the placement fixes.