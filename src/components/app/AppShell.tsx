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
  Compass,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  CalendarClock,
  Zap,
  UsersRound,
  Radio,
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
  children?: { to: string; label: string; icon: typeof LayoutDashboard }[];
}

const baseItems: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/explore", label: "Explore", icon: Compass },
  { to: "/app/contacts", label: "Contacts", icon: Users },
  {
    to: "/app/availability",
    label: "Availability",
    icon: CalendarDays,
    children: [
      { to: "/app/availability/focus-meetings", label: "Hybrid Scheduling", icon: CalendarClock },
      { to: "/app/availability/quick-sync", label: "Quick Sync", icon: Zap },
      { to: "/app/availability/webinars", label: "Event Access Scheduling", icon: UsersRound },
      { to: "/app/availability", label: "Communication Patterns", icon: Radio },
    ],
  },
  { to: "/app/requests", label: "Requests", icon: Inbox },
  { to: "/app/messages", label: "Messages", icon: MessageSquare },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
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
  description?: string;
  actions?: ReactNode;
  headerInline?: ReactNode;
  hideBell?: boolean;
  /** When true, collapses sidebar/header/bottom-nav and removes main padding for maximum content area. */
  fullscreen?: boolean;
  /** Called when the user clicks the built-in exit-fullscreen affordance. */
  onExitFullscreen?: () => void;
}

const AppShell = ({ children, title, subtitle, description, actions, headerInline, hideBell, fullscreen, onExitFullscreen }: Props) => {
  const [role] = useRole();
  const [mobileNav, setMobileNav] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const sidebarActuallyHidden = sidebarHidden || !!fullscreen;
  const [openGroup, setOpenGroup] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("nav.openGroup");
  });
  const navigate = useNavigate();
  const location = useLocation();
  const items = baseItems;
  const { unreadCount } = useNotifications();
  const { unreadCount: messagesUnread, markAllRead: markAllMessagesRead } = useMessages();
  const { pendingIncomingCount } = useRequests();

  useEffect(() => {
    if (location.pathname.startsWith("/app/messages") && messagesUnread > 0) {
      markAllMessagesRead();
    }
  }, [location.pathname, markAllMessagesRead, messagesUnread]);

  // Auto-open the group that contains the active route
  useEffect(() => {
    const parent = baseItems.find(
      (i) => i.children && i.children.some((c) => location.pathname === c.to || location.pathname.startsWith(c.to + "/")),
    );
    if (parent) setOpenGroup(parent.to);
  }, [location.pathname]);

  const toggleGroup = (to: string) => {
    setOpenGroup((prev) => {
      const next = prev === to ? null : to;
      if (typeof window !== "undefined") {
        if (next) window.localStorage.setItem("nav.openGroup", next);
        else window.localStorage.removeItem("nav.openGroup");
      }
      return next;
    });
  };

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
    <div className="min-h-screen app-ambient grain text-foreground flex overflow-x-hidden">
      {/* Sidebar (desktop / tablet) */}
      <aside
        className={cn(
          "w-64 lg:w-72 shrink-0 flex-col bg-surface-lowest/72 backdrop-blur-2xl border-r border-outline-variant/30 sticky top-0 h-screen transition-all shadow-soft",
          sidebarActuallyHidden ? "hidden" : "hidden md:flex",
        )}
      >
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
              <li
                key={item.to}
                onMouseLeave={item.children ? () => {
                  // Auto-collapse when cursor leaves, unless this group contains the active route.
                  const containsActive = item.children!.some(
                    (c) => location.pathname === c.to || location.pathname.startsWith(c.to + "/"),
                  );
                  if (!containsActive && openGroup === item.to) setOpenGroup(null);
                } : undefined}
              >
                {item.children ? (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleGroup(item.to)}
                      aria-expanded={openGroup === item.to}
                      className={cn(
                        "group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer",
                        isItemActive(item.to, item.end, location.pathname)
                          ? "bg-primary text-primary-foreground shadow-glass"
                          : "text-muted-foreground hover:text-primary hover:bg-surface-low/80 hover:translate-x-0.5",
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight
                        className={cn(
                          "w-3.5 h-3.5 shrink-0 transition-transform duration-300 ease-out",
                          openGroup === item.to && "rotate-90",
                        )}
                      />
                    </button>
                    <div
                      className={cn(
                        "grid transition-[grid-template-rows] duration-300 ease-out",
                        openGroup === item.to ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                      )}
                    >
                      <ul className="overflow-hidden ml-4 mt-2 border-l border-outline-variant/40 pl-2.5 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.to}>
                            <NavLink
                              to={child.to}
                              end
                              className={({ isActive }) =>
                                cn(
                                  "flex items-center gap-2.5 px-3 py-2 md:py-1.5 rounded-lg text-[12.5px] font-medium transition-all cursor-pointer",
                                  isActive
                                    ? "bg-primary/10 text-primary ring-1 ring-primary/30 shadow-soft font-semibold"
                                    : "text-muted-foreground hover:text-primary hover:bg-primary/5 hover:translate-x-0.5",
                                )
                              }
                            >
                              <child.icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                              <span className="truncate">{child.label}</span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
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
                )}
              </li>
            ))}
          </ul>

          <div className="mt-6 mx-1 rounded-2xl bg-gradient-vault p-4 text-primary-foreground shadow-elevated">
            <Crown className="w-5 h-5 text-gold" />
            <p className="mt-2 font-headline font-bold text-sm leading-snug">Unlock the Vault</p>
            <p className="mt-1 text-[11px] text-primary-foreground/80 leading-relaxed">
              Priority access, Direct Call Sync & Ping — from $91/yr with the 30% Early Supporter Offer.
            </p>
            <Link
              to="/app/upgrade"
              className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gold hover:text-gold/80"
            >
              Upgrade →
            </Link>
          </div>
        </nav>

        <div className="p-3 border-t border-border/50 flex items-center gap-2">
          <Link
            to="/app/settings"
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-low transition flex-1 min-w-0"
          >
            <Avatar initials={me.initials} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary truncate">{me.name}</p>
              <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> {me.plan}
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarHidden(true)}
            className="shrink-0 grid place-items-center w-8 h-8 rounded-lg ghost-border bg-surface-lowest hover:bg-surface-low transition"
            aria-label="Hide sidebar"
            title="Hide sidebar"
          >
            <PanelLeftClose className="w-4 h-4 text-primary" />
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className={cn("flex-1 min-w-0 flex flex-col", fullscreen ? "pb-0" : "pb-20 md:pb-0")}>
        {/* Top bar */}
        {!fullscreen && (
        <header className="sticky top-0 z-30 glass-panel border-b border-outline-variant/30 !rounded-none">
          <div className="px-4 md:px-8 py-1 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNav(true)}
              className="md:hidden grid place-items-center w-9 h-9 rounded-lg ghost-border bg-surface-lowest"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4 text-primary" />
            </button>
            {sidebarHidden && (
              <button
                type="button"
                onClick={() => setSidebarHidden(false)}
                className="hidden md:grid place-items-center w-9 h-9 rounded-lg ghost-border bg-surface-lowest hover:bg-surface-low transition"
                aria-label="Show sidebar"
                title="Show sidebar"
              >
                <PanelLeftOpen className="w-4 h-4 text-primary" />
              </button>
            )}

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
            <div className="px-4 md:px-8 pb-1.5 pt-0">
              <div className="flex flex-col gap-1 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-col gap-0 min-w-0">
                  {(subtitle || description) && (
                    <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-accent/85 whitespace-nowrap overflow-hidden text-ellipsis">
                      {subtitle}
                      {subtitle && description ? " : " : ""}
                      {description}
                    </p>
                  )}
                  {title && (
                    <h1 className="font-headline font-semibold text-primary text-[1.2rem] md:text-[1.5rem] leading-[1.05] tracking-[-0.022em]">
                      {title}
                    </h1>
                  )}
                </div>
                {(headerInline || actions) && (
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end lg:text-right">
                    {headerInline && <div className="min-w-0 flex items-center gap-2 flex-wrap lg:justify-end">{headerInline}</div>}
                    {actions && <div className="flex items-center gap-2 lg:justify-end">{actions}</div>}
                  </div>
                )}
              </div>
            </div>
          )}
        </header>
        )}
        {fullscreen && (
          <button
            type="button"
            onClick={onExitFullscreen}
            className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-surface-lowest ghost-border text-[11px] font-semibold text-primary shadow-elevated hover:bg-surface-low transition"
            aria-label="Exit fullscreen"
            title="Exit fullscreen"
          >
            <X className="w-3.5 h-3.5" /> Exit fullscreen
          </button>
        )}

        <main className={cn("flex-1 min-w-0 overflow-x-hidden", fullscreen ? "px-2 md:px-3 py-2" : "px-4 md:px-10 py-6 md:py-9")}>{children}</main>
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
                  {item.children ? (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleGroup(item.to)}
                        aria-expanded={openGroup === item.to}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer",
                          isItemActive(item.to, item.end, location.pathname)
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-surface-low",
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronRight
                          className={cn(
                            "w-3.5 h-3.5 transition-transform",
                            openGroup === item.to && "rotate-90",
                          )}
                        />
                      </button>
                      {openGroup === item.to && (
                        <ul className="ml-4 mt-1 border-l border-outline-variant/40 pl-2 space-y-0.5">
                          {item.children.map((child) => (
                            <li key={child.to}>
                              <NavLink
                                to={child.to}
                                end
                                onClick={() => setMobileNav(false)}
                                className={({ isActive }) =>
                                  cn(
                                    "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12.5px] font-medium cursor-pointer",
                                    isActive
                                      ? "bg-surface-low text-primary ring-1 ring-primary/15 shadow-soft"
                                      : "text-muted-foreground hover:bg-surface-low/60",
                                  )
                                }
                              >
                                <child.icon className="w-3.5 h-3.5 opacity-80" />
                                <span className="truncate">{child.label}</span>
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
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
                  )}
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
      {!fullscreen && (
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-lowest border-t border-border/50">
        <ul className="grid grid-cols-5">
          {[
            baseItems[0],
            baseItems[1],
            baseItems[2],
            baseItems[5],
            baseItems[8],
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
      )}
    </div>
  );
};

export default AppShell;