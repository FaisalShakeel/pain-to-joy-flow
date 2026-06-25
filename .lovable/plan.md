# Relay Control Architecture Refactor

## 1. Strip Watch Lists back to organization-only

File: `src/components/app/SpotlightWindow.tsx`

- Remove the entire Visibility Window block from the Manage sheet (radio group: Business / Custom / Always, and the time pickers).
- Remove `VisibilityMode`, `VisibilityWindow`, `DEFAULT_VIS`, `fmt12`, `visibilityLabel`, `draftVisibility` state, and the `visibility` field on the `Watchlist` interface and all initial watchlist objects.
- Remove visibility subtitles from the watchlist dropdown items.
- Keep: create, rename, delete, icon edit, add/remove/move contacts, search, save/cancel — exactly as before the visibility patch.

## 2. New publisher-side relay model

New file: `src/lib/relayStore.ts`

```ts
export type Audience = "colleague" | "client" | "friend" | "vip_family";
export type RuleMode = "always" | "hidden" | "office" | "custom";
export interface TimeWindow { from: string; to: string } // "HH:MM"
export interface AudienceRule {
  mode: RuleMode;
  window?: TimeWindow; // for "custom"
}
export interface ContactOverride {
  contactId: string;
  mode: RuleMode | "default";
  window?: TimeWindow;
  expiresAt?: string; // ISO date; undefined = permanent
}
export interface RelayState {
  audienceDefaults: Record<Audience, AudienceRule>;
  contactAudience: Record<string, Audience>; // assigned at approval
  overrides: Record<string, ContactOverride>; // by contactId
}
```

- Defaults: colleague=office (09–18), client=office (09–18), friend=custom 09–22, vip_family=always.
- localStorage-backed with a tiny pub/sub `useRelayState()` hook (mirrors `pinsStore` pattern in the repo).
- Helpers: `resolveVisibility(contactId)` returning effective rule using the hierarchy: contact override → time-bound override (if not expired) → audience default → global always. Auto-purges expired overrides on read.
- `assignAudience(contactId, audience)` and `setOverride(contactId, partial)`.

## 3. Relay Control page

New file: `src/pages/app/RelayControl.tsx`, route added in `src/App.tsx` at `/app/settings/relay`.

Sections:

- **Audience defaults** — 4 cards (Colleagues, Clients, Friends, VIP Family) each with a mode radio (Always / Hidden / Office Hours / Custom) and time pickers when Custom.
- **Contact relay overrides** — table/list of all contacts (`mockData.contacts`) with columns: Name, Audience (select), Current Rule (resolved text), Status badge (Default / Always Visible Until … / Hidden Until … / Custom HH–HH Until …), Clock button.
- **Filters** above the list: All / Active Overrides / Expiring Soon / Always Visible / Hidden / Custom Schedule + search.
- **Override dialog** (shadcn Dialog) launched by the clock: mode radio, custom window time pickers, duration radio (Today / 3d / 1w / 2w / 1mo / Custom date), Save / Clear / Cancel.

## 4. Settings entry point

File: `src/pages/app/AccountSettings.tsx`

- Add a "Relay Control" card linking to `/app/settings/relay` alongside the other privacy/availability panels.

## 5. Connection approval audience picker

File: `src/components/app/AccessRequestDetailsPanel.tsx` (and/or the approve action in `RequestsContext`).

- When approving a request, show an inline audience radio (Colleague / Client / Friend / VIP Family). On approve, call `assignAudience(contactId, audience)` so the new connection inherits the audience default.

## 6. Hierarchy enforcement

Anywhere availability is rendered for a contact (Spotlight rows, contact profile status pill), call `resolveVisibility(contactId)` to decide whether to display live status or fall back to "unavailable". Initial wiring: gate the live status text in `SpotlightWindow` rows and `ContactProfile` header.

## Technical notes

- No backend; all state in localStorage so it survives reloads.
- Expiry check runs on every `resolveVisibility` call and on store read; no timers needed.
- "Office Hours" reads from the existing working-hours setting if present, else defaults to 09:00–18:00 local.
- Watch List code touches no relay logic after this refactor — they become pure viewer-side filters again.
