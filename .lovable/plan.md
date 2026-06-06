
# Plan — Feedback Identity + Reserved Booking Hub

Two independent workstreams. They can ship together but are scoped separately so we can review one without blocking the other.

---

## Part 1 — Availock Feedback Identity (sound + motion + haptic)

Goal: every meaningful action gives an immediate, *on-brand* confirmation through layered feedback. The vocabulary is **Signals → Protection → Permission → Availability** — radar/pulse/shield/unlock/confirmation tones, never chat/social/messaging sounds.

### 1.1 Feedback engine (`src/lib/feedback.ts`)
A single `feedback(event)` API that fans out to sound + haptic + (optionally) a motion class hook. Centralizing means every tile, button, and toast speaks the same language.

Events (initial set):
- `status.available` — soft radar ping, green pulse, light haptic
- `status.busy` / `status.focus` / `status.offline` — muted shield thud, no haptic
- `access.unlock` — two-tone unlock chime, medium haptic
- `access.lock` — short shield close, light haptic
- `request.sent` — outgoing radar sweep
- `request.approved` — confirmation tone + success haptic
- `request.denied` — soft decline (low, short), no haptic
- `ping` — single radar blip
- `callwatch.on` / `callwatch.off` — radar arm / disarm
- `booking.confirmed` — confirmation chord
- `toast.generic` — barely-there tick (used as fallback)

### 1.2 Audio assets
Generate 8–10 short MP3s via ElevenLabs SFX (≤1.5s each) under `public/sfx/`. Names match event ids. All cached, preloaded on first user interaction, mixed at ~ -18 LUFS so they sit under the UI not over it. Single user preference `sfxEnabled` (default ON) + `hapticsEnabled` (default ON), stored in localStorage, exposed in Account Settings → Feedback.

### 1.3 Haptics
`navigator.vibrate(pattern)` with feature detection. Patterns map per event (e.g. available = `[15]`, approved = `[10, 40, 10]`, denied = no-op).

### 1.4 Motion wiring
Add two reusable Tailwind utilities:
- `.morph-in` — scale 0.97 → 1 with opacity (200ms)
- `.pulse-success` — radial green glow that fades (600ms, one-shot)

Then wire the high-traffic surfaces only (don't sprinkle everywhere):
- StatusPill / Adaptive Access Orb on status change → morph + pulse + `feedback("status.available"|...)`
- PingButton click → `feedback("ping")` + existing animation
- Call Watch toggle (Explore / Contacts / Vault) → `feedback("callwatch.on/off")`
- Access request Approve/Deny in ApprovalQueues + RequestsContext → `feedback("request.approved/denied")`
- Booking confirm in Reserved (Part 2) → `feedback("booking.confirmed")`

### 1.5 Settings surface
`Account Settings → Feedback` panel: two switches (Sound, Haptics) + a “Test sounds” row that plays each event. No per-event toggles in v1.

---

## Part 2 — Reserved becomes a full Booking Hub

Today `Reserved` on Dashboard is a confirmed-only feed grouped by channel. We elevate it to a dedicated page that owns *all* scheduling activity.

### 2.1 New route + data
- New page: `src/pages/app/Reserved.tsx`, route `/app/reserved`, added to AppShell nav.
- New store: `src/lib/bookingsStore.ts` — single source of truth for bookings with shape:
  ```ts
  type BookingDirection = "mine" | "with-me";
  type BookingStatus = "upcoming" | "completed" | "cancelled" | "pending";
  type BookingChannel = "Quick Sync" | "Meeting" | "Webinar" | "Venue";
  interface Booking {
    id; direction; contactId; date; startsAt; durationMin; timeZone;
    channel; purpose?; status; source; createdAt;
  }
  ```
  Seeded with ~12 realistic mock bookings split across both directions and all statuses, persisted in localStorage so reschedule/cancel survive reload.
- Dashboard's existing `RESERVED_BY_CHANNEL` mock is replaced by a `useBookings()` selector so Dashboard and Reserved stay in sync.

### 2.2 Page structure
```
Reserved
├── Tabs:    Upcoming · My Bookings · Bookings With Me · Completed · Cancelled
├── Filters: Today · This Week · All  (chips, combine with active tab)
└── Search:  by contact name, company, or date (yyyy-mm-dd or "Fri")
```

### 2.3 Booking card
One `BookingCard` component used by every tab. Shows:
- Avatar + name + (company on second line)
- Date · time · timezone · duration
- Channel chip with icon (reuse `CHANNEL_ICON` / `CHANNEL_TONE` from Dashboard)
- Status pill (Upcoming / Pending / Completed / Cancelled)
- Purpose line (if any)
- Source label ("Booked by you" / "Booked with you" / "via Quick Sync")
- Actions, contextual to direction + status:
  - **My Bookings (upcoming):** View Profile · Reschedule · Cancel
  - **Bookings With Me (pending):** Accept · Reject · Reschedule
  - **Bookings With Me (upcoming):** View Profile · Reschedule · Cancel
  - **Completed:** View Profile · Book again
  - **Cancelled:** View Profile · Rebook

All mutating actions go through `bookingsStore` and fire `feedback("booking.confirmed" | "request.denied")` from Part 1.

### 2.4 Tab semantics
- **Upcoming** — both directions, status=upcoming, sorted ascending by startsAt
- **My Bookings** — direction=mine, all statuses, grouped by status
- **Bookings With Me** — direction=with-me, all statuses, pending pinned to top
- **Completed** — status=completed across both directions
- **Cancelled** — status=cancelled across both directions

Empty states use the existing `EmptyState` component with channel-appropriate copy.

### 2.5 Dashboard tie-in
- The current Dashboard “Reserved · Confirmed only” strip becomes a compact preview (top 3 upcoming) with a “Open Reserved” link to the new page.
- `onJumpReserved` (already a prop) navigates to `/app/reserved` instead of scrolling.

---

## Files to add
- `src/lib/feedback.ts`
- `src/lib/bookingsStore.ts`
- `src/components/app/feedback/SfxLoader.tsx` (preloads sounds on first interaction)
- `src/components/app/booking/BookingCard.tsx`
- `src/components/app/AccountFeedbackPanel.tsx`
- `src/pages/app/Reserved.tsx`
- `public/sfx/*.mp3` (generated)

## Files to edit
- `src/App.tsx` — route for `/app/reserved`, mount `<SfxLoader />`
- `src/components/app/AppShell.tsx` — nav entry for Reserved
- `src/pages/app/AccountSettings.tsx` — mount Feedback panel
- `src/pages/app/Dashboard.tsx` — read from `bookingsStore`, compact preview, route jump
- `src/components/app/StatusPill.tsx`, `AdaptiveAccessOrb.tsx`, `PingButton.tsx`, `CallWatchSettingsPanel.tsx`, `ApprovalProtocolPanel.tsx`, `RequestsContext.tsx` — wire `feedback()` calls
- `src/pages/app/Explore.tsx`, `src/pages/app/Contacts.tsx`, `src/components/app/PriorityContactsWidget.tsx` — fire `feedback("callwatch.*")` on toggle
- `tailwind.config.ts` / `src/index.css` — `morph-in`, `pulse-success` utilities

## Out of scope (call out so we agree)
- No real backend; bookingsStore is localStorage only (consistent with the rest of the app).
- No per-event sound customization in v1.
- No calendar invite / ICS export.
- Music or ambient soundscapes — only short interaction SFX.

Shall I proceed with both parts, or ship Part 2 (Reserved hub) first and Part 1 (feedback identity) second?
