## Goal

Turn the 25 uploaded screens into a polished, investor-ready, responsive clickable prototype of **Availock — the availability-first communication platform**. Frontend-only this pass (mock data), with a clean component system and React Router structure ready to wire into Lovable Cloud later.

Tagline: *Availock — See availability first. Connect the right way.*

## Phase 1 — Audit findings

**Coverage we have (25 screens)**: onboarding, signup, login, password reset, dashboard, contact search, availability calendar, contact profile (locked + approved), access request inbox, request-sent modal, provider approval flow, approval queues, live call (busy + available), messages, schedule call, contact log, share/QR, settings, edit profile, FAQ, pricing, and updated Terms copy.

**Gaps & UX problems detected → fixes baked into the build**:
- *No reset-password landing page* → add `/reset-password` (required by Lovable auth flow even though we mock it now).
- *No notifications screen* → add `/app/notifications` (bell in topbar already implies one). Reuses request + message item components.
- *No analytics/insights screen for providers* → add `/app/analytics` (referenced in spec; uses simple SVG bar charts and time-saved stat cards).
- *No upgrade/checkout screen* → add `/app/upgrade` linked from pricing CTAs and "Free plan" banner.
- *No empty states* → every list (Contacts, Requests, Messages, Log, Notifications) ships with a designed empty state component.
- *Live Call screen has weak CTA hierarchy* → primary "Call now" only when available; otherwise primary becomes "Request callback" and "Call now" is disabled with reason.
- *Request flow dead-ends after sending* → RequestSentDialog now has clear next actions: "View request status" → `/app/requests` and "Browse contacts" → `/app/contacts`.
- *Provider vs Seeker not enforced* → onboarding role saved to `localStorage.availock_role`; sidebar items adapt (Providers see Approval Queues + Analytics; Seekers see Schedule + Log prominently). Both can switch via Settings.
- *Pricing tiers don't tie back to UI* → Free plan banner in dashboard, "Upgrade to unlock" lock badges on premium features (Smart Filter, Analytics, Power Calls).

## Phase 2 — Routes

Marketing & legal (existing, lightly updated):
- `/` landing · `/privacy` · `/terms` (append upload-22 sections) · `/encryption` · `/contact` · `/patent-pending` · `/faq` (NEW from #23) · `/pricing` (NEW from #24)

Auth flow:
- `/signup` · `/login` · `/forgot-password` · `/reset-password` · `/onboarding`

Authenticated app shell (`/app/*`):
- `/app` Dashboard · `/app/contacts` · `/app/contact/:id` · `/app/contact/:id/log` · `/app/contact/:id/call` · `/app/availability` · `/app/schedule/:id` · `/app/requests` · `/app/requests/manage` · `/app/requests/queues` · `/app/messages` · `/app/notifications` (new) · `/app/analytics` (new, provider) · `/app/share` · `/app/settings` · `/app/settings/edit` · `/app/upgrade` (new)

## Component system

`src/components/ui/*` (existing shadcn) is the foundation. New higher-level pieces:

- `components/auth/AuthShell` — minimal header + atmospheric background.
- `components/app/AppShell` — shadcn `Sidebar` (collapsible="icon") + topbar (search, notifications bell, avatar menu). Mobile: bottom nav.
- `components/app/StatusPill` — Available / Busy / Locked / Pending / Approved / Denied.
- `components/app/RoleBadge` — Provider / Seeker chip.
- `components/app/ContactRow`, `RequestCard`, `MessageRow`, `LogEntry`, `SlotChip`, `PricingCard`, `FaqItem`, `EmptyState`, `LockedFeatureCard`, `RequestSentDialog`, `UpgradePromptBanner`.
- `lib/mockData.ts` — single source for contacts, requests, queues, messages, transactions, log, notifications, current "me", and role.
- `lib/role.ts` — `useRole()` hook reading/writing `localStorage.availock_role`.

Design tokens already in `index.css` + `tailwind.config.ts` cover the look (midnight-indigo, Manrope/Inter, glass, ghost-border, gradient-primary, soft shadows). No new tokens needed; just consistent application.

## Per-screen mapping

| Upload | Route / Component | Notes |
|---|---|---|
| 1 Onboarding | `/onboarding` | Provider/Seeker bento → saves role → `/app` |
| 2 Signup | `/signup` | Validation, show/hide password → `/onboarding` |
| 3 Login | `/login` | Email + password; Google/Biometrics → "Coming soon" toast → `/app` |
| 4 Forgot password | `/forgot-password` | Toast → `/login` |
| — (new) | `/reset-password` | Set new password form (mock) |
| 5 Account Settings | `/app/settings` | Profile, payment, transactions, logout, role switch |
| 6 Edit Profile | `/app/settings/edit` | Avatar, details, security toggles |
| 7 QR Sharing | `/app/share` | `qrcode.react` (added), copy link, social share |
| 8 Control Center | `/app` | Dashboard: status toggle, today's slots, request + call cards, free-plan banner |
| 9 Contact Search | `/app/contacts` | Live filter, empty state |
| 10 Check Availability | `/app/availability` | "Connecting…" → schedule grid |
| 11 Profile (locked) | `/app/contact/:id` | State = locked → Request Access → RequestSentDialog (#13) |
| 12 Access Requests | `/app/requests` | Approve / Deny / Schedule actions |
| 13 Request Sent | `RequestSentDialog` | New CTAs: View status / Browse contacts |
| 14 Approval Flow | `/app/requests/manage` | Velocity chart, Smart Filter rules, batch actions (Provider) |
| 15 Approval Queues | `/app/requests/queues` | Tabs: Pending / In Review / Auto-routed (Provider) |
| 16 Profile (approved) | `/app/contact/:id` | Same component, approved state → Schedule + Live Call CTAs |
| 17 Live Call (busy) | `/app/contact/:id/call` | Status block, Request callback primary |
| 18 Live Call (available) | same route | Toggleable; "Call now" primary → toast |
| 19 Messages | `/app/messages` | Conversations list + thread + unread badges |
| 20 Schedule Call | `/app/schedule/:id` | Booking mode, calendar, slots, summary → confirm toast |
| 21 Contact Log | `/app/contact/:id/log` | Timeline + "Ready for new connection" CTA |
| 22 Privacy/Terms | append into `/terms` | Authenticity, Credential Safety, Termination, Governing Law, "Engineered for Trust" |
| 23 FAQ | `/faq` | Categories sidebar + accordion + bottom CTA card |
| 24 Pricing | `/pricing` | 5 tiers (Basic/Personal/Professional/Organization/Enterprise), "Compare detailed features" table, CTA → `/signup` or `/app/upgrade` |
| — (new) | `/app/notifications` | Bell target; mixes requests + messages + system |
| — (new) | `/app/analytics` | Provider-only: time-saved, requests handled, response time, weekly chart |
| — (new) | `/app/upgrade` | Tier confirm + mock card form → success toast → `/app` |

## Navigation wiring (clickable flows)

- **Onboarding**: `/` → Login link in Nav → `/login` ↔ `/signup` → `/onboarding` → `/app`
- **Seeker**: `/app` → `/app/contacts` → `/app/contact/:id` (locked) → Request Access → RequestSentDialog → `/app/requests` (own outgoing) ↔ once approved → `/app/contact/:id` (approved) → `/app/schedule/:id` or `/app/contact/:id/call` → `/app/messages` → `/app/contact/:id/log`
- **Provider**: `/app` → `/app/requests` → `/app/requests/queues` → `/app/requests/manage` → approve → `/app/analytics`; status toggle from dashboard or topbar
- **Monetization**: `/pricing` → `/signup` (new users) or `/app/upgrade` (existing) → success → `/app`. Lock badges on Smart Filter, Analytics, Power Calls open `/app/upgrade`.
- **Retention**: topbar bell → `/app/notifications`; dashboard surfaces "Streak: 5 days respecting focus time" + "X interruptions saved this week" stat.

Marketing Nav gets a small "Login" link beside "Claim your ID", plus "Pricing" and "FAQ" added to the menu. Footer already links legal pages — add Pricing + FAQ.

## Responsive strategy

Mobile-first. Sidebar uses shadcn `collapsible="icon"` on tablet/desktop and shifts to a fixed bottom nav on mobile (Dashboard, Contacts, Requests, Messages, Profile). All forms stack at <640px. Tested at 375, 768, 1024, 1440.

## Visual standard

Premium/clean: glass cards, soft shadow-elevated, rounded-2xl, generous spacing, subtle `transition` + `active:scale-[0.98]` on CTAs, framer-motion-free (use Tailwind transitions to stay light). Material Symbols in source HTML are mapped to existing `lucide-react` icons.

## Build order (single delivery, in this sequence to keep navigation working at every step)

1. Mock data + role hook + AuthShell + AppShell (with sidebar, topbar, bottom nav).
2. Auth pages (Signup, Login, Forgot, Reset, Onboarding) + route additions + Nav "Login" link + Claim "Log in" link.
3. Dashboard + Contacts + Contact Profile (both states) + RequestSentDialog + Availability.
4. Requests inbox + Approval Flow + Approval Queues + Notifications.
5. Live Call (both states) + Schedule Call + Contact Log + Messages.
6. Share + Settings + Edit Profile + Upgrade.
7. Pricing page + FAQ page + Terms append + marketing Nav/Footer link additions.
8. Empty states polish + responsive QA pass.

## Out of scope / clearly flagged follow-ups

- Real authentication, password reset email, OAuth, biometrics → Lovable Cloud (one follow-up turn). Until then `/reset-password` is a mock form.
- Real persistence of contacts/requests/messages/transactions/role.
- Route guards on `/app/*`.
- Real-time messaging and call infrastructure.
- Real Stripe/Paddle for `/app/upgrade`.

## Acceptance

- All 25 designs present at fidelity; 4 sensible new screens (`/reset-password`, `/app/notifications`, `/app/analytics`, `/app/upgrade`) added to close UX gaps.
- End-to-end click-through works for Seeker, Provider, and Monetization journeys without dead ends.
- Layout works at 375 / 768 / 1024 / 1440. Sidebar collapses; mobile gets bottom nav.
- Marketing landing, footer, and legal pages preserved (Terms gets new sections appended; Nav gets Login + Pricing + FAQ links).
- One reusable component system; no duplicated row/card markup across screens.
