import { Link } from "react-router-dom";
import { CalendarDays, Zap, Radio, Building2, RotateCw, X, Check, UserRound } from "lucide-react";
import Avatar from "@/components/app/Avatar";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { feedback } from "@/lib/feedback";
import {
  type Booking,
  type BookingChannel,
  formatBookingWhen,
  useBookings,
} from "@/lib/bookingsStore";

const CHANNEL_TONE: Record<BookingChannel, string> = {
  "Quick Sync": "bg-amber-500/15 text-amber-700",
  Meeting: "bg-sky-500/15 text-sky-700",
  Webinar: "bg-orange-500/15 text-orange-700",
  Venue: "bg-emerald-500/15 text-emerald-700",
};

const CHANNEL_ICON: Record<BookingChannel, JSX.Element> = {
  "Quick Sync": <Zap className="w-2.5 h-2.5" />,
  Meeting: <CalendarDays className="w-2.5 h-2.5" />,
  Webinar: <Radio className="w-2.5 h-2.5" />,
  Venue: <Building2 className="w-2.5 h-2.5" />,
};

const STATUS_TONE = {
  upcoming: "bg-emerald-500/15 text-emerald-700",
  pending: "bg-amber-500/15 text-amber-700",
  completed: "bg-sky-500/10 text-sky-700",
  cancelled: "bg-destructive/10 text-destructive",
} as const;

const BookingCard = ({ booking }: { booking: Booking }) => {
  const { update, remove } = useBookings();

  const cancel = () => {
    update(booking.id, { status: "cancelled" });
    feedback("request.denied");
    toast({ title: "Booking cancelled", description: `${booking.contactName} · ${formatBookingWhen(booking)}` });
  };

  const accept = () => {
    update(booking.id, { status: "upcoming" });
    feedback("booking.confirmed");
    toast({ title: "Booking accepted", description: `${booking.contactName} confirmed.` });
  };

  const reject = () => {
    update(booking.id, { status: "cancelled" });
    feedback("request.denied");
    toast({ title: "Booking rejected", description: `${booking.contactName} has been notified.` });
  };

  const reschedule = () => {
    feedback("ping");
    toast({ title: "Reschedule request sent", description: `${booking.contactName} will pick a new time.` });
  };

  const bookAgain = () => {
    feedback("request.sent");
    toast({ title: "Opening booking flow", description: `New booking with ${booking.contactName}.` });
  };

  const isPending = booking.status === "pending";
  const isUpcoming = booking.status === "upcoming";

  return (
    <div className="p-4 rounded-2xl ghost-border bg-surface-lowest shadow-soft hover:shadow-ambient transition-all animate-fade-in">
      <div className="flex items-start gap-3">
        <Avatar initials={booking.contactInitials} accent={booking.contactAccent} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-primary truncate">{booking.contactName}</p>
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-[0.14em]", STATUS_TONE[booking.status])}>
              {booking.status}
            </span>
          </div>
          {booking.contactCompany && (
            <p className="text-[11px] text-muted-foreground truncate">{booking.contactCompany}</p>
          )}
          <p className="mt-1 text-[12px] text-muted-foreground">{formatBookingWhen(booking)}</p>
          {booking.purpose && (
            <p className="mt-1 text-[12px] text-foreground/80 line-clamp-2">"{booking.purpose}"</p>
          )}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-semibold uppercase tracking-[0.12em]", CHANNEL_TONE[booking.channel])}>
              {CHANNEL_ICON[booking.channel]} {booking.channel}
            </span>
            <span className="text-[10px] text-muted-foreground/80">{booking.source}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-1.5 flex-wrap">
        <Link
          to={`/app/contact/${booking.contactId}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full ghost-border bg-surface-low text-[11px] font-semibold text-primary hover:bg-surface transition"
        >
          <UserRound className="w-3 h-3" /> View profile
        </Link>

        {isPending && booking.direction === "with-me" && (
          <>
            <button
              onClick={accept}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-500/25 transition"
            >
              <Check className="w-3 h-3" /> Accept
            </button>
            <button
              onClick={reject}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-[11px] font-semibold hover:bg-destructive/20 transition"
            >
              <X className="w-3 h-3" /> Reject
            </button>
          </>
        )}

        {(isUpcoming || isPending) && (
          <>
            <button
              onClick={reschedule}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full ghost-border bg-surface-low text-[11px] font-semibold text-primary hover:bg-surface transition"
            >
              <RotateCw className="w-3 h-3" /> Reschedule
            </button>
            <button
              onClick={cancel}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full ghost-border bg-surface-low text-[11px] font-semibold text-destructive hover:bg-destructive/10 transition"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </>
        )}

        {(booking.status === "completed" || booking.status === "cancelled") && (
          <button
            onClick={bookAgain}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full ghost-border bg-surface-low text-[11px] font-semibold text-primary hover:bg-surface transition"
          >
            <CalendarDays className="w-3 h-3" /> Book again
          </button>
        )}
      </div>
    </div>
  );
};

export default BookingCard;