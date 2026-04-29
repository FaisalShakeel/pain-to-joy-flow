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
  {
    id: "noor-hassan",
    name: "Noor Hassan",
    title: "Brand Director",
    org: "Lumière Studio",
    initials: "NH",
    accent: "from-pink-500 to-rose-600",
    status: "available",
    syncStatus: "approved",
    bio: "Open for creative reviews on Mondays.",
    responseTime: "≈ 45m",
    tags: ["Brand", "Creative"],
    availabilityContext: "Available to sync before 5:15 PM",
    relationship: "client",
    alerts: ["message"],
  },
  {
    id: "david-okafor",
    name: "David Okafor",
    title: "CFO",
    org: "Northwind Holdings",
    initials: "DO",
    accent: "from-cyan-500 to-blue-600",
    status: "busy",
    syncStatus: "approved",
    bio: "In financial close — limited slots this week.",
    responseTime: "≈ 3h",
    tags: ["Finance"],
    availabilityContext: "Free after 4:30 PM today",
    relationship: "colleague",
    favorite: true,
  },
  {
    id: "lin-wei",
    name: "Lin Wei",
    title: "Engineering Manager",
    org: "Helio Labs",
    initials: "LW",
    accent: "from-teal-500 to-emerald-600",
    status: "focus",
    syncStatus: "locked",
    bio: "Sprint planning week — async preferred.",
    responseTime: "≈ 6h",
    tags: ["Engineering"],
    availabilityContext: "In sprint — async only until Thursday",
    relationship: "colleague",
    alerts: ["message"],
  },
  {
    id: "amelia-reyes",
    name: "Amelia Reyes",
    title: "Partner",
    org: "Reyes Capital",
    initials: "AR",
    accent: "from-yellow-500 to-orange-600",
    status: "offline",
    syncStatus: "approved",
    bio: "Travelling — back next Monday.",
    responseTime: "≈ 2d",
    tags: ["Capital"],
    availabilityContext: "Travelling — returns Monday 9 AM",
    relationship: "investor",
  },
  {
    id: "tomas-berg",
    name: "Tomas Berg",
    title: "Senior Architect",
    org: "Vane & Co.",
    initials: "TB",
    accent: "from-indigo-400 to-blue-700",
    status: "available",
    syncStatus: "approved",
    bio: "Open for technical reviews this afternoon.",
    responseTime: "≈ 20m",
    tags: ["Architecture"],
    availabilityContext: "Available to sync before 6:00 PM",
    relationship: "colleague",
    frequent: true,
    alerts: ["callback"],
  },
  {
    id: "priya-shah",
    name: "Priya Shah",
    title: "Head of People",
    org: "Northwind Holdings",
    initials: "PS",
    accent: "from-fuchsia-500 to-purple-600",
    status: "available",
    syncStatus: "approved",
    bio: "Drop-in office hours every weekday 11–12.",
    responseTime: "≈ 1h",
    tags: ["People", "Culture"],
    availabilityContext: "Office hours daily 11 AM – 12 PM",
    relationship: "colleague",
  },
  {
    id: "owen-blake",
    name: "Owen Blake",
    title: "Founder",
    org: "Blake Ventures",
    initials: "OB",
    accent: "from-stone-500 to-zinc-700",
    status: "busy",
    syncStatus: "pending",
    bio: "Reviewing deck — will revert by EOD.",
    responseTime: "≈ 1d",
    tags: ["Founders"],
    availabilityContext: "In meetings — free after 5:00 PM",
    relationship: "investor",
  },
  {
    id: "isla-moreau",
    name: "Isla Moreau",
    title: "Design Lead",
    org: "Atlas Studio",
    initials: "IM",
    accent: "from-rose-400 to-fuchsia-600",
    status: "focus",
    syncStatus: "locked",
    bio: "In design crit — async only.",
    responseTime: "≈ 4h",
    tags: ["Design"],
    availabilityContext: "Design crit until 4:00 PM",
    relationship: "colleague",
    alerts: ["message"],
  },
  {
    id: "kenji-tanaka",
    name: "Kenji Tanaka",
    title: "CTO",
    org: "Sumi Robotics",
    initials: "KT",
    accent: "from-sky-600 to-indigo-700",
    status: "available",
    syncStatus: "approved",
    bio: "Open for technical syncs this week.",
    responseTime: "≈ 1h",
    tags: ["Engineering", "Robotics"],
    availabilityContext: "Available to sync before 5:15 PM",
    relationship: "mentor",
    favorite: true,
    alerts: ["calendar"],
  },
  {
    id: "hana-park",
    name: "Hana Park",
    title: "Marketing Director",
    org: "Helio Labs",
    initials: "HP",
    accent: "from-emerald-400 to-cyan-600",
    status: "busy",
    syncStatus: "approved",
    bio: "Launch week — short windows only.",
    responseTime: "≈ 2h",
    tags: ["Marketing"],
    availabilityContext: "Launch week — 15-min windows only",
    relationship: "colleague",
  },
  {
    id: "leo-fontaine",
    name: "Leo Fontaine",
    title: "Brother",
    org: "Family",
    initials: "LF",
    accent: "from-orange-400 to-red-600",
    status: "available",
    syncStatus: "approved",
    bio: "Always reachable for family calls.",
    responseTime: "≈ 5m",
    tags: ["Family"],
    availabilityContext: "Free after 7:00 PM tonight",
    relationship: "family",
    favorite: true,
    alerts: ["callback"],
  },
  {
    id: "mira-coelho",
    name: "Mira Coelho",
    title: "Operating Partner",
    org: "Lumen Partners",
    initials: "MC",
    accent: "from-violet-600 to-indigo-700",
    status: "focus",
    syncStatus: "locked",
    bio: "Diligence sprint — async only.",
    responseTime: "≈ 1d",
    tags: ["Capital", "Diligence"],
    availabilityContext: "Diligence sprint until next Tuesday",
    relationship: "investor",
  },
  {
    id: "samir-khan",
    name: "Samir Khan",
    title: "Old Friend",
    org: "Personal",
    initials: "SK",
    accent: "from-lime-500 to-green-600",
    status: "offline",
    syncStatus: "approved",
    bio: "Catch-up calls on weekends.",
    responseTime: "≈ 1d",
    tags: ["Personal"],
    availabilityContext: "Free this Saturday afternoon",
    relationship: "friend",
  },
  {
    id: "yara-nasser",
    name: "Yara Nasser",
    title: "Legal Counsel",
    org: "Northwind Holdings",
    initials: "YN",
    accent: "from-slate-500 to-gray-700",
    status: "available",
    syncStatus: "approved",
    bio: "Available for contract reviews.",
    responseTime: "≈ 90m",
    tags: ["Legal"],
    availabilityContext: "Available to sync before 5:15 PM",
    relationship: "colleague",
    alerts: ["calendar"],
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
    purpose: "Strategic discussion",
    relation: "client",
    channel: "voice",
    senderType: "member",
    referredBy: "Sarah Jenkins",
  },
  {
    id: "r2",
    contactId: "mark-thompson",
    reason: "Series B follow-up — diligence questions.",
    urgency: "high",
    receivedAt: "5h ago",
    state: "pending",
    direction: "incoming",
    purpose: "Deal / partnership",
    relation: "investor",
    channel: "calendar",
    senderType: "member",
  },
  {
    id: "r3",
    contactId: "alex-rivera",
    reason: "Architecture review of the auth subsystem.",
    urgency: "low",
    receivedAt: "Yesterday",
    state: "scheduled",
    direction: "incoming",
    purpose: "Advice / mentoring",
    relation: "colleague",
    channel: "message",
    senderType: "guest",
  },
  {
    id: "r4",
    contactId: "julian-vane",
    reason: "Quick intro — referred by Sarah Jenkins.",
    urgency: "medium",
    receivedAt: "1d ago",
    state: "pending",
    direction: "outgoing",
    purpose: "Intro",
    relation: "client",
    channel: "voice",
    senderType: "member",
    referredBy: "Sarah Jenkins",
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

/* ============================================================
 * Owner-controlled profile schema (input = output)
 * Every field shown on ContactProfile is defined here, plus a
 * per-field visibility rule the owner controls from Edit Profile.
 * ============================================================ */

export type Visibility = "public" | "approved" | "hidden";

/** Viewer access tier derived from sync status (or "owner" when self). */
export type ViewerAccess = "owner" | "approved" | "public";

export interface CommsChannel {
  id: string;
  kind: "email" | "phone" | "mobile" | "whatsapp" | "sms";
  label: string;
  value: string;
  visibility: Visibility;
}

export interface SocialHandle {
  id: string;
  kind: "x" | "instagram" | "linkedin" | "github" | "website" | "other";
  label: string;
  value: string; // handle or URL
  href: string;
  visibility: Visibility;
}

export interface OwnerProfile {
  // Identity
  name: string;
  firstName: string;
  initials: string;
  title: string;
  org: string;
  accent: string;

  // Narrative
  bio: string;
  tags: string[];
  responseTime: string;
  availabilityContext: string;

  // Operations Center
  operationDays: string;
  operationDaysSub?: string;
  operationHours: string;
  timeZone: string;
  location: string;
  headquarters: string;
  headquartersSub?: string;

  // Channels
  primaryComms: CommsChannel[];
  socialHandles: SocialHandle[];

  // Per-field visibility — keys are stable field ids
  visibility: {
    bio: Visibility;
    tags: Visibility;
    title: Visibility;
    org: Visibility;
    availabilityContext: Visibility;
    operationDays: Visibility;
    operationHours: Visibility;
    timeZone: Visibility;
    location: Visibility;
    headquarters: Visibility;
    primaryCommsSection: Visibility;
    socialHandlesSection: Visibility;
  };
}

/** Returns whether a given visibility rule allows the viewer. */
export const canSee = (rule: Visibility, viewer: ViewerAccess): boolean => {
  if (viewer === "owner") return true;
  if (rule === "hidden") return false;
  if (rule === "public") return true;
  return viewer === "approved"; // rule === "approved"
};

/** Default visibility map applied to mock contacts so the viewer sees something sensible. */
const defaultVisibility: OwnerProfile["visibility"] = {
  bio: "public",
  tags: "public",
  title: "public",
  org: "public",
  availabilityContext: "public",
  operationDays: "approved",
  operationHours: "approved",
  timeZone: "public",
  location: "public",
  headquarters: "public",
  primaryCommsSection: "approved",
  socialHandlesSection: "public",
};

/** Build a default OwnerProfile from a Contact (mock-only). */
export const ownerProfileFor = (c: Contact): OwnerProfile => {
  const handle = c.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z_]/g, "");
  const emailDomain = c.org.toLowerCase().replace(/[^a-z]/g, "") || "company";
  const email = `${handle.split("_")[0]}@${emailDomain}.io`;
  return {
    name: c.name,
    firstName: c.name.split(" ")[0],
    initials: c.initials,
    title: c.title,
    org: c.org,
    accent: c.accent,
    bio: c.bio,
    tags: c.tags,
    responseTime: c.responseTime,
    availabilityContext: c.availabilityContext,
    operationDays: "Monday — Friday",
    operationDaysSub: "Weekend access by priority only",
    operationHours: "09:00 — 18:00 (GMT+0)",
    timeZone: "GMT+0 · London",
    location: "London, United Kingdom",
    headquarters: c.org,
    headquartersSub: `${c.name.split(" ")[0]}'s primary base`,
    primaryComms: [
      { id: "email", kind: "email", label: "Email", value: email, visibility: "approved" },
      { id: "office", kind: "phone", label: "Office Number", value: "+44 20 7946 0123", visibility: "approved" },
      { id: "mobile", kind: "mobile", label: "Mobile Number", value: "+44 7700 900 123", visibility: "approved" },
    ],
    socialHandles: [
      { id: "x", kind: "x", label: "X (Twitter)", value: `@${handle}`, href: "#", visibility: "public" },
      { id: "ig", kind: "instagram", label: "Instagram", value: `@${handle.split("_")[0]}.work`, href: "#", visibility: "public" },
    ],
    visibility: { ...defaultVisibility },
  };
};

/** Owner profile of the signed-in user (`me`) — the source of truth for EditProfile. */
export const myOwnerProfile: OwnerProfile = {
  name: me.name,
  firstName: me.name.split(" ")[0],
  initials: me.initials,
  title: me.title,
  org: me.org,
  accent: "from-indigo-500 to-violet-600",
  bio: "Permission-based operator. I respond to vetted requests within one working day.",
  tags: ["Operations", "Strategy"],
  responseTime: "≈ 4h",
  availabilityContext: "Available after 2:00 PM",
  operationDays: "Monday — Friday",
  operationDaysSub: "Weekends async only",
  operationHours: "09:00 — 18:00 (GMT+4)",
  timeZone: "GMT+4 · Gulf Standard Time",
  location: "Dubai, United Arab Emirates",
  headquarters: me.org,
  headquartersSub: "Dubai, UAE",
  primaryComms: [
    { id: "email", kind: "email", label: "Email", value: me.email, visibility: "approved" },
    { id: "mobile", kind: "mobile", label: "Mobile Number", value: me.phone, visibility: "approved" },
    { id: "whatsapp", kind: "whatsapp", label: "WhatsApp", value: me.phone, visibility: "hidden" },
  ],
  socialHandles: [
    { id: "linkedin", kind: "linkedin", label: "LinkedIn", value: "alistair-finch", href: "https://linkedin.com/in/alistair-finch", visibility: "public" },
    { id: "x", kind: "x", label: "X (Twitter)", value: "@alistairfinch", href: "https://x.com/alistairfinch", visibility: "public" },
    { id: "site", kind: "website", label: "Website", value: "availock.com", href: "https://availock.com", visibility: "public" },
  ],
  visibility: { ...defaultVisibility },
};