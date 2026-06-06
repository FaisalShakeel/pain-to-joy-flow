import { useEffect, useState } from "react";

export type BookingDirection = "mine" | "with-me";
export type BookingStatus = "upcoming" | "pending" | "completed" | "cancelled";
export type BookingChannel = "Quick Sync" | "Meeting" | "Webinar" | "Venue";

export interface Booking {
  id: string;
  direction: BookingDirection;
  contactId: string;
  contactName: string;
  contactInitials: string;
  contactCompany?: string;
  contactAccent?: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  /** HH:MM 24h */
  time: string;
  durationMin: number;
  timeZone: string;
  channel: BookingChannel;
  purpose?: string;
  source: string; // human label e.g. "Booked via Quick Sync"
  status: BookingStatus;
  createdAt: number;
}

const KEY = "availock.bookings.v1";
const EVT = "availock:bookings-changed";

const today = () => new Date();
const isoFromOffset = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const SEED: Booking[] = [
  {
    id: "bk-1", direction: "mine", contactId: "sarah-jenkins", contactName: "Sarah Jenkins",
    contactInitials: "SJ", contactCompany: "Northwind Holdings", contactAccent: "from-sky-500 to-indigo-600",
    date: isoFromOffset(0), time: "14:00", durationMin: 30, timeZone: "GMT+4",
    channel: "Meeting", purpose: "Board prep review", source: "Booked by you",
    status: "upcoming", createdAt: Date.now() - 86400000,
  },
  {
    id: "bk-2", direction: "mine", contactId: "rashid-al-amir", contactName: "Rashid Al-Amir",
    contactInitials: "RA", contactCompany: "Atlas Studio", contactAccent: "from-amber-500 to-rose-500",
    date: isoFromOffset(1), time: "11:30", durationMin: 45, timeZone: "GMT+4",
    channel: "Meeting", purpose: "Technical sync", source: "Booked by you",
    status: "upcoming", createdAt: Date.now() - 172800000,
  },
  {
    id: "bk-3", direction: "mine", contactId: "kenji-tanaka", contactName: "Kenji Tanaka",
    contactInitials: "KT", contactCompany: "Sumi Robotics", contactAccent: "from-sky-600 to-indigo-700",
    date: isoFromOffset(0), time: "10:00", durationMin: 3, timeZone: "GMT+4",
    channel: "Quick Sync", source: "Booked via Quick Sync",
    status: "upcoming", createdAt: Date.now() - 7200000,
  },
  {
    id: "bk-4", direction: "with-me", contactId: "elena-vance", contactName: "Elena Vance",
    contactInitials: "EV", contactCompany: "Helio Labs", contactAccent: "from-emerald-500 to-teal-600",
    date: isoFromOffset(2), time: "15:00", durationMin: 30, timeZone: "GMT+4",
    channel: "Meeting", purpose: "Discuss Q4 roadmap collaboration", source: "Booked with you",
    status: "pending", createdAt: Date.now() - 3600000,
  },
  {
    id: "bk-5", direction: "with-me", contactId: "noor-hassan", contactName: "Noor Hassan",
    contactInitials: "NH", contactCompany: "Lumière Studio", contactAccent: "from-pink-500 to-rose-600",
    date: isoFromOffset(0), time: "16:30", durationMin: 15, timeZone: "GMT+4",
    channel: "Quick Sync", purpose: "Creative review", source: "Booked with you",
    status: "upcoming", createdAt: Date.now() - 1800000,
  },
  {
    id: "bk-6", direction: "with-me", contactId: "owen-blake", contactName: "Owen Blake",
    contactInitials: "OB", contactCompany: "Blake Ventures", contactAccent: "from-stone-500 to-zinc-700",
    date: isoFromOffset(3), time: "09:00", durationMin: 30, timeZone: "GMT+4",
    channel: "Meeting", purpose: "Intro · Series B follow-up", source: "Booked with you",
    status: "pending", createdAt: Date.now() - 900000,
  },
  {
    id: "bk-7", direction: "mine", contactId: "leo-fontaine", contactName: "Leo Fontaine",
    contactInitials: "LF", contactCompany: "Family", contactAccent: "from-orange-400 to-red-600",
    date: isoFromOffset(-2), time: "19:00", durationMin: 30, timeZone: "GMT+4",
    channel: "Meeting", purpose: "Family catch-up", source: "Booked by you",
    status: "completed", createdAt: Date.now() - 8 * 86400000,
  },
  {
    id: "bk-8", direction: "with-me", contactId: "alex-rivera", contactName: "Alex Rivera",
    contactInitials: "AR", contactCompany: "Helio Labs", contactAccent: "from-violet-500 to-fuchsia-600",
    date: isoFromOffset(-3), time: "10:30", durationMin: 45, timeZone: "GMT+4",
    channel: "Meeting", purpose: "Auth subsystem review", source: "Booked with you",
    status: "completed", createdAt: Date.now() - 5 * 86400000,
  },
  {
    id: "bk-9", direction: "with-me", contactId: "hana-park", contactName: "Hana Park",
    contactInitials: "HP", contactCompany: "Helio Labs", contactAccent: "from-emerald-400 to-cyan-600",
    date: isoFromOffset(4), time: "17:00", durationMin: 60, timeZone: "GMT+4",
    channel: "Webinar", purpose: "Product Q&A", source: "Booked with you",
    status: "upcoming", createdAt: Date.now() - 600000,
  },
  {
    id: "bk-10", direction: "mine", contactId: "tomas-berg", contactName: "Tomas Berg",
    contactInitials: "TB", contactCompany: "Vane & Co.", contactAccent: "from-indigo-400 to-blue-700",
    date: isoFromOffset(-5), time: "14:00", durationMin: 30, timeZone: "GMT+4",
    channel: "Meeting", purpose: "Cancelled · scheduling conflict", source: "Booked by you",
    status: "cancelled", createdAt: Date.now() - 6 * 86400000,
  },
  {
    id: "bk-11", direction: "mine", contactId: "yara-nasser", contactName: "Yara Nasser",
    contactInitials: "YN", contactCompany: "Northwind Holdings", contactAccent: "from-slate-500 to-gray-700",
    date: isoFromOffset(2), time: "12:00", durationMin: 45, timeZone: "GMT+4",
    channel: "Meeting", purpose: "Contract review", source: "Booked by you",
    status: "upcoming", createdAt: Date.now() - 1200000,
  },
  {
    id: "bk-12", direction: "with-me", contactId: "julian-vane", contactName: "Julian Vane",
    contactInitials: "JV", contactCompany: "Vane & Co.", contactAccent: "from-indigo-500 to-violet-600",
    date: isoFromOffset(5), time: "18:30", durationMin: 90, timeZone: "GMT+4",
    channel: "Venue", purpose: "Studio B · Tribe meet", source: "Booked with you",
    status: "upcoming", createdAt: Date.now() - 7200000,
  },
];

const read = (): Booking[] => {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(SEED));
      return SEED;
    }
    return JSON.parse(raw) as Booking[];
  } catch { return SEED; }
};

const write = (next: Booking[]) => {
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVT));
};

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>(read);

  useEffect(() => {
    const sync = () => setBookings(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = (id: string, patch: Partial<Booking>) => {
    const next = read().map((b) => (b.id === id ? { ...b, ...patch } : b));
    write(next);
    setBookings(next);
  };

  const remove = (id: string) => {
    const next = read().filter((b) => b.id !== id);
    write(next);
    setBookings(next);
  };

  return { bookings, update, remove };
};

/** Sort helper — chronological */
export const sortByDateTime = (a: Booking, b: Booking) => {
  const ak = `${a.date}T${a.time}`;
  const bk = `${b.date}T${b.time}`;
  return ak < bk ? -1 : ak > bk ? 1 : 0;
};

/** Human formatter — "Today · 14:00 GMT+4 · 30 min" */
export const formatBookingWhen = (b: Booking) => {
  const d = new Date(`${b.date}T${b.time}:00`);
  const today = new Date();
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
  const sameDay = (x: Date, y: Date) => x.toDateString() === y.toDateString();
  let label: string;
  if (sameDay(d, today)) label = "Today";
  else if (sameDay(d, tomorrow)) label = "Tomorrow";
  else label = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return `${label} · ${b.time} ${b.timeZone} · ${b.durationMin} min`;
};