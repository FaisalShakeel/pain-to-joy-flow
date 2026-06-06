import { useMemo, useState } from "https://esm.sh/react@18.3.1?dts";
import { CalendarDays, Search, Filter, Inbox } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import BookingCard from "@/components/app/booking/BookingCard";
import EmptyState from "@/components/app/EmptyState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useBookings, sortByDateTime, type Booking } from "@/lib/bookingsStore";

type DateFilter = "all" | "today" | "week";

const todayISO = () => new Date().toISOString().slice(0, 10);
const weekAheadISO = () => {
  const d = new Date(); d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
};

const matchesDateFilter = (b: Booking, f: DateFilter) => {
  if (f === "all") return true;
  if (f === "today") return b.date === todayISO();
  return b.date >= todayISO() && b.date <= weekAheadISO();
};

const matchesSearch = (b: Booking, q: string) => {
  if (!q.trim()) return true;
  const needle = q.toLowerCase();
  return (
    b.contactName.toLowerCase().includes(needle) ||
    (b.contactCompany ?? "").toLowerCase().includes(needle) ||
    b.date.includes(needle) ||
    b.time.includes(needle) ||
    new Date(`${b.date}T${b.time}:00`).toLocaleDateString(undefined, { weekday: "long" }).toLowerCase().includes(needle)
  );
};

const Section = ({ title, items }: { title: string; items: Booking[] }) => {
  if (items.length === 0) return null;
  return (
    <div className="mt-6 first:mt-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">{title} · {items.length}</p>
      <div className="grid md:grid-cols-2 gap-3">
        {items.map((b) => <BookingCard key={b.id} booking={b} />)}
      </div>
    </div>
  );
};

const Reserved = () => {
  const { bookings } = useBookings();
  const [tab, setTab] = useState<"upcoming" | "mine" | "with-me" | "completed" | "cancelled">("upcoming");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => bookings.filter((b) => matchesSearch(b, search) && matchesDateFilter(b, dateFilter)),
    [bookings, search, dateFilter],
  );

  const upcoming = useMemo(
    () => filtered.filter((b) => b.status === "upcoming" || b.status === "pending").sort(sortByDateTime),
    [filtered],
  );
  const mine = useMemo(() => filtered.filter((b) => b.direction === "mine").sort(sortByDateTime), [filtered]);
  const withMe = useMemo(() => {
    const list = filtered.filter((b) => b.direction === "with-me").sort(sortByDateTime);
    // Pin pending to top
    return [
      ...list.filter((b) => b.status === "pending"),
      ...list.filter((b) => b.status !== "pending"),
    ];
  }, [filtered]);
  const completed = useMemo(() => filtered.filter((b) => b.status === "completed").sort(sortByDateTime), [filtered]);
  const cancelled = useMemo(() => filtered.filter((b) => b.status === "cancelled").sort(sortByDateTime), [filtered]);

  const total = bookings.length;
  const upcomingCount = bookings.filter((b) => b.status === "upcoming" || b.status === "pending").length;

  return (
    <AppShell
      subtitle="Reserved"
      title="Booking hub"
      description={`Single source of truth for every booking — ${upcomingCount} upcoming, ${total} total.`}
    >
      <div className="space-y-4">
        {/* Filter bar */}
        <div className="rounded-3xl bg-surface-lowest ghost-border p-4 shadow-soft flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, company, or date"
              className="pl-9 h-9 text-sm rounded-full"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            {(["all", "today", "week"] as DateFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setDateFilter(f)}
                className={cn(
                  "px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider transition",
                  dateFilter === f
                    ? "bg-primary text-primary-foreground"
                    : "ghost-border bg-surface-low text-muted-foreground hover:text-primary",
                )}
              >
                {f === "all" ? "All" : f === "today" ? "Today" : "This week"}
              </button>
            ))}
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="bg-surface-lowest ghost-border h-auto p-1 flex-wrap rounded-full">
            <TabsTrigger value="upcoming" className="rounded-full text-xs">Upcoming · {upcoming.length}</TabsTrigger>
            <TabsTrigger value="mine" className="rounded-full text-xs">My Bookings · {mine.length}</TabsTrigger>
            <TabsTrigger value="with-me" className="rounded-full text-xs">Bookings With Me · {withMe.length}</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-full text-xs">Completed · {completed.length}</TabsTrigger>
            <TabsTrigger value="cancelled" className="rounded-full text-xs">Cancelled · {cancelled.length}</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4">
            {upcoming.length === 0 ? (
              <EmptyState icon={<CalendarDays className="w-5 h-5" />} title="No upcoming bookings" description="When you book a meeting or someone books with you, it appears here." />
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {upcoming.map((b) => <BookingCard key={b.id} booking={b} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mine" className="mt-4">
            {mine.length === 0 ? (
              <EmptyState icon={<CalendarDays className="w-5 h-5" />} title="You haven't booked anyone yet" description="Bookings you create with other people show up here." />
            ) : (
              <>
                <Section title="Upcoming" items={mine.filter((b) => b.status === "upcoming" || b.status === "pending")} />
                <Section title="Completed" items={mine.filter((b) => b.status === "completed")} />
                <Section title="Cancelled" items={mine.filter((b) => b.status === "cancelled")} />
              </>
            )}
          </TabsContent>

          <TabsContent value="with-me" className="mt-4">
            {withMe.length === 0 ? (
              <EmptyState icon={<Inbox className="w-5 h-5" />} title="No bookings with you yet" description="When someone books a slot on your calendar, it appears here." />
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {withMe.map((b) => <BookingCard key={b.id} booking={b} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            {completed.length === 0 ? (
              <EmptyState icon={<CalendarDays className="w-5 h-5" />} title="No completed bookings" description="Past bookings will be archived here automatically." />
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {completed.map((b) => <BookingCard key={b.id} booking={b} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="mt-4">
            {cancelled.length === 0 ? (
              <EmptyState icon={<CalendarDays className="w-5 h-5" />} title="No cancelled bookings" description="Cancelled bookings appear here so you can re-book quickly." />
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {cancelled.map((b) => <BookingCard key={b.id} booking={b} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default Reserved;