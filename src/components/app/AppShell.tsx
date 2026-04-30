import { ReactNode, useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Inbox,
  CalendarDays,
  MessageSquare,
  QrCode,
  Settings,
  BarChart3,
  Bell,
  Menu,
  X,
  Crown,
  ShieldCheck,
  LogOut,
  Pencil,
  UserCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logoIcon from "@/assets/availock-icon.png";
import { useRole } from "@/lib/role";
import { me } from "@/lib/mockData";
import { useNotifications } from "./NotificationsContext";
import { useMessages } from "./MessagesContext";
import { useRequests } from "./RequestsContext";
import Avatar from "./Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
  end?: boolean;
  providerOnly?: boolean;
}

const baseItems: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/contacts", label: "Contacts", icon: Users },
  { to: "/app/availability", label: "Availability", icon: CalendarDays },
  { to: "/app/requests", label: "Requests", icon: Inbox },
  { to: "/app/messages", label: "Messages", icon: MessageSquare },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3, providerOnly: true },
  { to: "/app/share", label: "Share", icon: QrCode },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

// Map sibling/child routes to a sidebar item so the right entry highlights.
const activeAliases: { match: (path: string) => boolean; to: string }[] = [
  { to: "/app/contacts", match: (p) => p.startsWith("/app/contact/") || p.startsWith("/app/contacts") },
  { to: "/app/availability", match: (p) => p.startsWith("/app/availability") || p.startsWith("/app/schedule") },
  { to: "/app/requests", match: (p) => p.startsWith("/app/requests") },
  { to: "/app/messages", match: (p) => p.startsWith("/app/messages") },
  { to: "/app/analytics", match: (p) => p.startsWith("/app/analytics") },
  { to: "/app/share", match: (p) => p.startsWith("/app/share") },
  { to: "/app/settings", label: "" as never, match: (p) => p.startsWith("/app/settings") } as any,
];

const isItemActive = (to: string, end: boolean | undefined, pathname: string) => {
  if (end) return pathname === to;
  if (pathname === to || pathname.startsWith(to + "/")) return true;
  const alias = activeAliases.find((a) => a.to === to);
  return alias ? alias.match(pathname) : false;
};

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  headerInline?: ReactNode;
  hideBell?: boolean;
}

const AppShell = ({ children, title, subtitle, actions, headerInline, hideBell }: Props) => {
  const [role] = useRole();
  const [mobileNav, setMobileNav] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const items = baseItems.filter((i) => !i.providerOnly || role === "provider");
  const { unreadCount } = useNotifications();
  const { unreadCount: messagesUnread, markAllRead: markAllMessagesRead } = useMessages();
  const { pendingIncomingCount } = useRequests();

  useEffect(() => {
    if (location.pathname.startsWith("/app/messages") && messagesUnread > 0) {
      markAllMessagesRead();
    }
  }, [location.pathname, markAllMessagesRead, messagesUnread]);

  const handleNavClick = (to: string) => {
    if (to === "/app/messages") markAllMessagesRead();
  };

  const itemsWithBadges = items.map((i) => {
    if (i.to === "/app/messages") {
      return { ...i, badge: location.pathname.startsWith("/app/messages") ? undefined : messagesUnread || undefined };
    }
    if (i.to === "/app/requests") return { ...i, badge: pendingIncomingCount || undefined };
    return i;
  });

  return (
    <div className="min-h-screen bg-surface text-foreground flex">
      {/* Sidebar (desktop / tablet) */}
      <aside className="hidden md:flex w-64 lg:w-72 shrink-0 flex-col bg-surface-lowest border-r border-border/50 sticky top-0 h-screen">
        <Link to="/app" className="flex items-center px-6 py-6" aria-label="Availock home">
          <img src={logoIcon} alt="Availock" className="h-12 md:h-14 w-auto object-contain" />
          <span className="ml-3 font-headline font-extrabold text-xl text-primary tracking-tight">
            Availock
          </span>
        </Link>

        <nav className="px-3 flex-1 overflow-y-auto">
          <p className="px-3 mt-2 mb-2 text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">
            Workspace
          </p>
          <ul className="space-y-0.5">
            {itemsWithBadges.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => handleNavClick(item.to)}
                  className={() => {
                    const isActive = isItemActive(item.to, item.end, location.pathname);
                    return cn(
                      "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-glass"
                        : "text-muted-foreground hover:text-primary hover:bg-surface-low",
                    );
                  }}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                      {item.badge}
                    </span>
                  ) : null}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="mt-6 mx-1 rounded-2xl bg-gradient-vault p-4 text-primary-foreground shadow-elevated">
            <Crown className="w-5 h-5 text-gold" />
            <p className="mt-2 font-headline font-bold text-sm leading-snug">Unlock the Vault</p>
            <p className="mt-1 text-[11px] text-primary-foreground/80 leading-relaxed">
              Smart Filter, analytics and Power Calls — from $9/mo.
            </p>
            <Link
              to="/app/upgrade"
              className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gold hover:text-gold/80"
            >
              Upgrade →
            </Link>
          </div>
        </nav>

        <div className="p-3 border-t border-border/50">
          <Link
            to="/app/settings"
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-low transition"
          >
            <Avatar initials={me.initials} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary truncate">{me.name}</p>
              <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> {role === "provider" ? "Provider" : "Seeker"} · {me.plan}
              </p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col pb-20 md:pb-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border/50">
          <div className="px-4 md:px-8 py-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNav(true)}
              className="md:hidden grid place-items-center w-9 h-9 rounded-lg ghost-border bg-surface-lowest"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4 text-primary" />
            </button>

            <div className="flex-1" />

            {!hideBell && (
              <button
                type="button"
                onClick={() => navigate("/app/notifications")}
                className="relative grid place-items-center w-9 h-9 rounded-full ghost-border bg-surface-lowest hover:bg-surface-low transition"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 text-primary" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 grid place-items-center w-4 h-4 rounded-full bg-accent text-accent-foreground text-[9px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate("/app/messages")}
              className="relative grid place-items-center w-9 h-9 rounded-full ghost-border bg-surface-lowest hover:bg-surface-low transition"
              aria-label="Messages"
            >
              <MessageSquare className="w-4 h-4 text-primary" />
              {messagesUnread > 0 && (
                <span className="absolute -top-1 -right-1 grid place-items-center min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold">
                  {messagesUnread > 9 ? "9+" : messagesUnread}
                </span>
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Account menu"
                className="rounded-full ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 hover:opacity-90 transition"
              >
                <Avatar initials={me.initials} size="sm" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="flex items-center gap-3 py-2">
                  <Avatar initials={me.initials} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">{me.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{me.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/app/settings")}>
                  <UserCircle2 className="w-4 h-4 mr-2" /> View profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/app/settings/edit")}>
                  <Pencil className="w-4 h-4 mr-2" /> Edit profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/app/settings")}>
                  <Settings className="w-4 h-4 mr-2" /> Account settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/")} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {(title || actions || headerInline) && (
            <div className="px-4 md:px-8 pb-3 pt-0.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                {subtitle && (
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent mr-1">{subtitle}</p>
                )}
                {title && (
                  <h1 className="font-headline font-extrabold text-primary text-xl md:text-2xl leading-tight">
                    {title}
                  </h1>
                )}
                {headerInline}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          )}
        </header>

        <main className="flex-1 px-4 md:px-8 py-4 md:py-5">{children}</main>
      </div>

      {/* Mobile drawer */}
      {mobileNav && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileNav(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-surface-lowest p-5 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <Link to="/app" onClick={() => setMobileNav(false)} className="flex items-center" aria-label="Availock home">
                <img src={logoIcon} alt="Availock" className="h-12 md:h-14 w-auto object-contain" />
                <span className="ml-3 font-headline font-extrabold text-xl text-primary tracking-tight">
                  Availock
                </span>
              </Link>
              <button onClick={() => setMobileNav(false)} aria-label="Close menu" className="grid place-items-center w-9 h-9 rounded-lg ghost-border">
                <X className="w-4 h-4 text-primary" />
              </button>
            </div>
            <ul className="space-y-1">
              {itemsWithBadges.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={() => {
                      handleNavClick(item.to);
                      setMobileNav(false);
                    }}
                    className={() => {
                      const isActive = isItemActive(item.to, item.end, location.pathname);
                      return cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-surface-low",
                      );
                    }}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                        {item.badge}
                      </span>
                    ) : null}
                  </NavLink>
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                setMobileNav(false);
                navigate("/");
              }}
              className="mt-auto inline-flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-destructive transition"
            >
              <LogOut className="w-4 h-4" /> Log out
            </button>
          </aside>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-lowest border-t border-border/50">
        <ul className="grid grid-cols-5">
          {[
            baseItems[0],
            baseItems[1],
            baseItems[3],
            baseItems[4],
            baseItems[7],
          ].map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={() => handleNavClick(item.to)}
                className={() => {
                  const isActive = isItemActive(item.to, item.end, location.pathname);
                  return cn(
                    "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium",
                    isActive ? "text-primary" : "text-muted-foreground",
                  );
                }}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default AppShell;