# Availability → Spotlight Relay System

Make the Availability module the single source of truth for scheduling. Spotlight becomes a lightweight broadcast/relay layer fed from the builders.

## 1. Shared "Relay to Spotlight" panel

Create `src/components/app/RelayToSpotlightPanel.tsx` — a reusable inline block embedded in all three builders.

Controls:
- Master toggle: ☑ Relay to Spotlight
- Audience: Public, Team, Office, Friends, Family, Selected Contacts, Private
- Expiry timer: 1h / 3h / today / until slot ends / custom
- Permissions (chips): Allow booking, questions, RSVP, quick join, share, reactions, waitlist
- Live indicators (chips): live now, urgent, limited access
- Tone hint: info / offer / warn (auto-derived from builder type, overridable)

State shape exposed via `value` / `onChange`:

```ts
type RelayConfig = {
  enabled: boolean;
  audience: AudienceTag | "public" | "team" | "selected" | "private";
  expiry: string;          // human label
  permissions: Record<"booking"|"questions"|"rsvp"|"quickJoin"|"share"|"reactions"|"waitlist", boolean>;
  indicators: { live: boolean; urgent: boolean; limited: boolean };
  tone: "info" | "warn" | "offer";
};
```

## 2. Extend SpotlightContext with relay cards

Augment `SpotlightPost` in `src/components/app/SpotlightContext.tsx`:

```ts
relay?: {
  source: "hybrid" | "quicksync" | "event-access";
  sourceId: string;          // builder draft id
  remainingSlots?: number;
  totalSlots?: number;
  startsAt?: number;
  endsAt?: number;
  permissions: RelayConfig["permissions"];
  indicators: RelayConfig["indicators"];
  viewHref: string;          // back to Availability
};
```

Add helper `createRelay(config, sourcePayload)` that builds a `SpotlightPost` and pushes it. Auto-expire by filtering posts where `expiresAt < now`.

## 3. Builder integration

Embed `<RelayToSpotlightPanel />` near the publish/save action in:
- `src/pages/app/FocusMeetingBuilder.tsx` (Hybrid Availability)
- `src/pages/app/QuickSyncBuilder.tsx`
- `src/pages/app/WebinarBuilder.tsx` (Event Access)

On save: if `relay.enabled`, call `createRelay(...)` with builder-derived title/body (e.g. "OPEN QUICK SYNC · 2:00–4:00 PM"), then toast "Relayed to Spotlight".

## 4. Spotlight relay card UI

New `src/components/app/SpotlightRelayCard.tsx` rendered inside `SpotlightBoard` when `post.relay` is present. Layout:

```text
🟢 OPEN QUICK SYNC                      live · 3 left
Founder sync slots · 2:00 PM – 4:00 PM
Audience: Selected Contacts · expires in 2h
[View Availability]  [Ask Question]  [RSVP] …
```

- Compact, command-center styling (uses existing `bg-surface-lowest ghost-border`, no social-card chrome).
- Subtle pulse dot when `indicators.live`.
- Action buttons rendered conditionally from `permissions`.
- Primary action always routes back to the Availability page — never opens a scheduling editor inside Spotlight.

Patch `SpotlightBoard.tsx` to branch: `post.relay ? <SpotlightRelayCard/> : <existing card/>`.

## 5. Guard Spotlight against heavy creation

In `SpotlightWindow.tsx` (the composer), replace any "create event/slot" affordances with a hint card:

> "Scheduling lives in Availability. Create a slot there and toggle Relay to Spotlight."

Link buttons → `/app/availability/focus`, `/quicksync`, `/webinars`.

Keep simple text announcements as-is.

## 6. Sidebar

Confirm `AppShell.tsx` Availability group order:
- Hybrid Availability Scheduling → `/app/availability/focus`
- Quick Sync Scheduling → `/app/availability/quicksync`
- Event Access Scheduling → `/app/availability/webinars`
- Communication Patterns → `/app/availability`

(Adjust labels only; routes already exist.)

## Out of scope

- No backend wiring (state stays in `SpotlightContext`, in-memory).
- No AI suggestion engine yet — leave a stub button "Suggest relay copy" that prefills from builder fields.
- No real-time participant socket; `remainingSlots` decrements locally on RSVP/book click.

## Technical notes

- All new colors/styles via existing semantic tokens (`surface-lowest`, `ghost-border`, `primary`, `gold`). No hard-coded hex.
- Auto-expire handled with a `useEffect` interval in `SpotlightProvider` that prunes expired relay posts every 60s.
- Reuse `AUDIENCE_TAGS` from `SpotlightContext` plus add `"public" | "team" | "selected" | "private"` super-set in the relay panel.
