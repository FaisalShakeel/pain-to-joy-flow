import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import EmptyState from "@/components/app/EmptyState";
import { contacts, threads as initial } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

const Messages = () => {
  const [threads, setThreads] = useState(initial);
  const [active, setActive] = useState(initial[0]?.id ?? null);
  const [draft, setDraft] = useState("");

  const current = threads.find((t) => t.id === active);
  const contact = current ? contacts.find((c) => c.id === current.contactId) : undefined;

  const send = () => {
    if (!current || !draft.trim()) return;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === current.id
          ? { ...t, messages: [...t.messages, { id: `m${Date.now()}`, from: "me", body: draft.trim(), at: "now" }], preview: draft.trim(), unread: 0, lastAt: "now" }
          : t,
      ),
    );
    setDraft("");
    toast({ title: "Sent" });
  };

  return (
    <AppShell subtitle="Secure communications" title="Messages">
      <div className="grid lg:grid-cols-[320px_1fr] gap-5 h-[calc(100vh-220px)] min-h-[480px]">
        {/* List */}
        <aside className="rounded-3xl bg-surface-lowest ghost-border p-3 overflow-y-auto">
          <ul className="space-y-1">
            {threads.map((t) => {
              const c = contacts.find((x) => x.id === t.contactId)!;
              const isActive = t.id === active;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => setActive(t.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition ${
                      isActive ? "bg-primary text-primary-foreground" : "hover:bg-surface-low"
                    }`}
                  >
                    <Avatar initials={c.initials} accent={c.accent} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-semibold text-sm truncate ${isActive ? "" : "text-primary"}`}>{c.name}</p>
                        <span className={`text-[10px] ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{t.lastAt}</span>
                      </div>
                      <p className={`text-xs truncate ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{t.preview}</p>
                    </div>
                    {t.unread > 0 && !isActive && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">{t.unread}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Thread */}
        <section className="rounded-3xl bg-surface-lowest ghost-border flex flex-col overflow-hidden">
          {current && contact ? (
            <>
              <header className="px-5 py-4 border-b border-border/50 flex items-center gap-3">
                <Avatar initials={contact.initials} accent={contact.accent} />
                <div>
                  <p className="font-headline font-bold text-primary">{contact.name}</p>
                  <p className="text-xs text-muted-foreground">{contact.title}</p>
                </div>
              </header>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {current.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                        m.from === "me"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-surface-low text-primary rounded-tl-sm"
                      }`}
                    >
                      {m.body}
                      <span className={`block mt-1 text-[10px] ${m.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{m.at}</span>
                    </div>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="px-5 py-3 border-t border-border/50 flex items-center gap-2"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message…"
                  className="flex-1 px-4 py-2.5 rounded-full bg-surface-low ghost-border outline-none text-sm placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  className="grid place-items-center w-10 h-10 rounded-full bg-gradient-primary text-primary-foreground hover:opacity-95 transition"
                  aria-label="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="m-auto p-6">
              <EmptyState icon={MessageSquare} title="No conversation selected" description="Pick a thread to read or reply." />
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
};

export default Messages;