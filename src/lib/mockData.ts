export type SyncStatus = "locked" | "pending" | "approved";
export type AvailabilityStatus = "available" | "busy" | "focus" | "offline";
export type Relationship = "client" | "colleague" | "family" | "investor" | "mentor" | "friend";
export type AlertKind = "callback" | "message" | "calendar";

export interface Contact {
  id: string;
  name: string;
  title: string;
  org: string;
  initials: string;
  accent: string; // tailwind bg utility
  status: AvailabilityStatus;
  syncStatus: SyncStatus;
  bio: string;
  responseTime: string;
  tags: string[];
  availabilityContext: string;
  relationship: Relationship;
  favorite?: boolean;
  frequent?: boolean;
  alerts?: AlertKind[];
}

export interface AccessRequest {
  id: string;
  contactId: string;
  reason: string;
  urgency: "low" | "medium" | "high";
  receivedAt: string; // human readable
  state: "pending" | "approved" | "denied" | "scheduled";
  direction: "incoming" | "outgoing";
  purpose?: string;
  relation?: Relationship;
  referredBy?: string;
  channel?: "voice" | "message" | "calendar";
  senderType?: "member" | "guest";
}

export interface MessageThread {
  id: string;
  contactId: string;
  preview: string;
  unread: number;
  lastAt: string;
  messages: { id: string; from: "me" | "them"; body: string; at: string }[];
}

export interface LogEntry {
  id: string;
  contactId: string;
  kind: "call" | "message" | "request" | "schedule";
  summary: string;
  at: string;
}

export interface Notification {
  id: string;
  kind: "request" | "message" | "system" | "schedule";
  title: string;
  body: string;
  at: string;
  unread: boolean;
}

export interface Transaction {
  id: string;
  description: string;
  amount: string;
  date: string;
  status: "Paid" | "Refunded" | "Pending";
}

export const me = {
  id: "me",
  name: "Alistair Finch",
  initials: "AF",
  email: "alistair@availock.com",
  phone: "+971 50 123 4567",
  title: "Director of Strategic Operations",
  org: "Northwind Holdings",
  plan: "Free",
  status: "available" as AvailabilityStatus,
  streak: 5,
  interruptionsSavedThisWeek: 27,
};

export const contacts: Contact[] = [
  {
    id: "julian-vane",
    name: "Julian Vane",
    title: "Architectural Leadership",
    org: "Vane & Co.",
    initials: "JV",
    accent: "from-indigo-500 to-violet-600",
    status: "focus",
    syncStatus: "locked",
    bio: "Permission-based architecture for executive operators. Replies to vetted requests within 4 working hours.",
    responseTime: "≈ 4h",
    tags: ["Architecture", "Leadership", "Strategy"],
    availabilityContext: "In a meeting — leave a message",
    relationship: "client",
    favorite: true,
    frequent: true,
    alerts: ["message", "calendar"],
  },
  {
    id: "rashid-al-amir",
    name: "Rashid Al-Amir",
    title: "Architectural Leadership",
    org: "Atlas Studio",
    initials: "RA",
    accent: "from-amber-500 to-rose-500",
    status: "available",
    syncStatus: "approved",
    bio: "Sync approved. Open to live calls during posted technical windows.",
    responseTime: "≈ 30m",
    tags: ["Design", "Mentorship"],
    availabilityContext: "Available now until 5:00 PM",
    relationship: "mentor",
    frequent: true,
    alerts: ["callback"],
  },
  {
    id: "elena-vance",
    name: "Elena Vance",
    title: "Product Lead",
    org: "Helio Labs",
    initials: "EV",
    accent: "from-emerald-500 to-teal-600",
    status: "busy",
    syncStatus: "pending",
    bio: "Reviewing your request — typically responds within a working day.",
    responseTime: "≈ 1d",
    tags: ["Product", "Research"],
    availabilityContext: "Expected free in ~30 minutes",
    relationship: "client",
  },
  {
    id: "sarah-jenkins",
    name: "Sarah Jenkins",
    title: "Chief of Staff",
    org: "Northwind Holdings",
    initials: "SJ",
    accent: "from-sky-500 to-indigo-600",
    status: "available",
    syncStatus: "approved",
    bio: "Available for technical syncs and board prep.",
    responseTime: "≈ 1h",
    tags: ["Operations", "Strategy"],
    availabilityContext: "Available after 2:00 PM",
    relationship: "colleague",
    favorite: true,
    frequent: true,
    alerts: ["calendar"],
  },
  {
    id: "mark-thompson",
    name: "Mark Thompson",
    title: "Investor Relations",
    org: "Lumen Partners",
    initials: "MT",
    accent: "from-rose-500 to-pink-600",
    status: "offline",
    syncStatus: "approved",
    bio: "Office hours: Tue & Thu, 14:00–16:00 GST.",
    responseTime: "≈ 2d",
    tags: ["Capital", "Diligence"],
    availabilityContext: "Office hours Tue & Thu, 2–4 PM GST",
    relationship: "investor",
  },
  {
    id: "alex-rivera",
    name: "Alex Rivera",
    title: "Head of Engineering",
    org: "Helio Labs",
    initials: "AR",
    accent: "from-violet-500 to-fuchsia-600",
    status: "focus",
    syncStatus: "locked",
    bio: "Currently in deep work — async messages only until Friday.",
    responseTime: "≈ 1d",
    tags: ["Engineering", "Architecture"],
    availabilityContext: "Deep focus until Friday — async only",
    relationship: "colleague",
    favorite: true,
    alerts: ["message"],
  },
];

export const requests: AccessRequest[] = [
  {
    id: "r1",
    contactId: "elena-vance",
    reason: "Discuss Q4 product roadmap collaboration.",
    urgency: "medium",
    receivedAt: "2h ago",
    state: "pending",
    direction: "incoming",
  },
  {
    id: "r2",
    contactId: "mark-thompson",
    reason: "Series B follow-up — diligence questions.",
    urgency: "high",
    receivedAt: "5h ago",
    state: "pending",
    direction: "incoming",
  },
  {
    id: "r3",
    contactId: "alex-rivera",
    reason: "Architecture review of the auth subsystem.",
    urgency: "low",
    receivedAt: "Yesterday",
    state: "scheduled",
    direction: "incoming",
  },
  {
    id: "r4",
    contactId: "julian-vane",
    reason: "Quick intro — referred by Sarah Jenkins.",
    urgency: "medium",
    receivedAt: "1d ago",
    state: "pending",
    direction: "outgoing",
  },
];

export const threads: MessageThread[] = [
  {
    id: "t1",
    contactId: "sarah-jenkins",
    preview: "Confirmed — see you Thursday at 10:00.",
    unread: 2,
    lastAt: "12m",
    messages: [
      { id: "m1", from: "them", body: "Are you still good for the board prep?", at: "10:02" },
      { id: "m2", from: "me", body: "Yes — sending the deck now.", at: "10:04" },
      { id: "m3", from: "them", body: "Confirmed — see you Thursday at 10:00.", at: "10:05" },
    ],
  },
  {
    id: "t2",
    contactId: "mark-thompson",
    preview: "Board Review Q4 — slide pack attached.",
    unread: 0,
    lastAt: "1h",
    messages: [
      { id: "m1", from: "them", body: "Board Review Q4 — slide pack attached.", at: "09:14" },
    ],
  },
  {
    id: "t3",
    contactId: "alex-rivera",
    preview: "Pushed the auth refactor — review when you're free.",
    unread: 1,
    lastAt: "3h",
    messages: [
      { id: "m1", from: "them", body: "Pushed the auth refactor — review when you're free.", at: "07:48" },
    ],
  },
];

export const log: LogEntry[] = [
  { id: "l1", contactId: "rashid-al-amir", kind: "call", summary: "Live call · 22 min · Notes captured", at: "Today · 09:14" },
  { id: "l2", contactId: "rashid-al-amir", kind: "message", summary: "Shared revised brief for the Atlas pitch.", at: "Yesterday" },
  { id: "l3", contactId: "rashid-al-amir", kind: "schedule", summary: "Scheduled review window — Friday 14:00 GST", at: "2 days ago" },
  { id: "l4", contactId: "rashid-al-amir", kind: "request", summary: "Access approved by Rashid", at: "Last week" },
];

export const notifications: Notification[] = [
  { id: "n1", kind: "request", title: "New access request", body: "Elena Vance requested access — 'Discuss Q4 product roadmap'.", at: "2h ago", unread: true },
  { id: "n2", kind: "message", title: "Sarah Jenkins replied", body: "Confirmed — see you Thursday at 10:00.", at: "12m", unread: true },
  { id: "n3", kind: "schedule", title: "Upcoming: Rashid Al-Amir", body: "Live call window opens in 35 minutes.", at: "now", unread: true },
  { id: "n4", kind: "system", title: "Streak: 5 days", body: "You've protected your focus time five days running.", at: "Today", unread: false },
];

export const transactions: Transaction[] = [
  { id: "tx1", description: "Personal — Monthly", amount: "$9.00", date: "Apr 12, 2026", status: "Paid" },
  { id: "tx2", description: "Personal — Monthly", amount: "$9.00", date: "Mar 12, 2026", status: "Paid" },
  { id: "tx3", description: "Add-on · Power Calls (10)", amount: "$4.00", date: "Feb 28, 2026", status: "Paid" },
];

export const findContact = (id: string) => contacts.find((c) => c.id === id);