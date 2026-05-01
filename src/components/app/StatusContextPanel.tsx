import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Pencil, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type ContextSection = {
  label: string;
  tone?: "core" | "playful" | "boundary";
  items: string[];
};

// Full curated library — grouped by mode/tone, ordered as per spec.
export const CONTEXT_LIBRARY: ContextSection[] = [
  { label: "Offline Mode", tone: "core", items: [
    "Out enjoying life",
    "Off the grid for a bit",
    "Recharging mode on",
    "Family time comes first",
    "Taking a real break",
    "Catch you later",
    "Living, not logging in",
    "Away for a while",
    "Stepped out of the noise",
    "Back soon, promise",
  ]},
  { label: "Offline — Playful", tone: "playful", items: [
    "Free bird for a while 🕊️",
    "Batteries under repair 🔋",
    "Unavailable… by choice 😄",
    "Out making memories",
    "Life > notifications",
  ]},
  { label: "Driving Mode", tone: "core", items: [
    "Driving — message instead",
    "Eyes on road, not phone",
    "Call later, traffic first",
    "If it's urgent, text",
    "Let me reach alive first 😄",
    "Only the boss or the wife can call",
  ]},
  { label: "Driving — Playful", tone: "playful", items: [
    "Call, but traffic fine is on you",
    "Don't call if you love me",
    "GPS > conversations right now",
    "One can wait a bit",
    "Steering > chatting",
  ]},
  { label: "Focus Mode", tone: "core", items: [
    "In deep focus",
    "Will revert back",
    "Leave a note if urgent",
    "Heads down, working",
    "Not available right now",
    "Back shortly",
  ]},
  { label: "Focus — Human", tone: "playful", items: [
    "In the zone",
    "Brain fully occupied",
    "Building something important",
    "Focus mode: ON",
    "Disturb = reset",
  ]},
  { label: "Busy Mode", tone: "core", items: [
    "In a meeting",
    "With clients",
    "Will get back soon",
    "Tied up right now",
    "Back after this",
  ]},
  { label: "Busy — Light", tone: "playful", items: [
    "In something important",
    "Not ignoring, just busy",
    "Give me a moment",
    "One thing at a time",
    "Wrapping this up",
  ]},
  { label: "Availability", tone: "core", items: [
    "Available for quick sync",
    "Open for short calls",
    "Best time to connect",
    "Ready when you are",
    "Let's keep it quick",
  ]},
  { label: "Availability — Friendly", tone: "playful", items: [
    "Catch me now",
    "Good time to reach out",
    "Let's sync",
    "Here for a bit",
    "Available, be quick 😄",
  ]},
  { label: "Flirty / Amusing", tone: "playful", items: [
    "Depends who's calling 😉",
    "Convince me it's important 😄",
    "Worth interrupting? Let's see",
    "Choose your timing wisely",
    "Impress me with urgency",
  ]},
  { label: "Boundaries", tone: "boundary", items: [
    "Do not call",
    "Messages only",
    "Schedule to connect",
    "Respect the slot",
    "Not available for calls",
  ]},
];

const toneAccent: Record<NonNullable<ContextSection["tone"]>, string> = {
  core: "bg-emerald-500",
  playful: "bg-amber-500",
  boundary: "bg-rose-500",
};

// Flat index for fast matching — one entry per message with its mode label.
type FlatItem = { text: string; mode: string; tone: NonNullable<ContextSection["tone"]> };
const FLAT_INDEX: FlatItem[] = CONTEXT_LIBRARY.flatMap((s) => {
  const mode = s.label.split("—")[0].trim().replace(/\s*Mode$/i, "");
  return s.items.map((text) => ({ text, mode, tone: s.tone ?? "core" }));
});

function scoreMatch(text: string, q: string): number {
  const t = text.toLowerCase();
  if (t === q) return 0;
  if (t.startsWith(q)) return 1;
  // word-boundary starts-with
  if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}`).test(t)) return 2;
  if (t.includes(q)) return 3;
  return -1;
}

type Props = {
  active: string;
  lastCustom?: string;
  onSelect: (msg: string) => void;
  onCustom: (msg: string) => void;
  autoFocusInput?: boolean;
};

export default function StatusContextPanel({ active, lastCustom, onSelect, onCustom, autoFocusInput = true }: Props) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const query = draft.trim().toLowerCase();
  const isSearching = query.length > 0;

  const suggestions = useMemo(() => {
    if (!isSearching) return [];
    const seen = new Set<string>();
    const scored: { item: FlatItem; score: number }[] = [];
    for (const item of FLAT_INDEX) {
      if (seen.has(item.text)) continue;
      const s = scoreMatch(item.text, query);
      if (s >= 0) {
        seen.add(item.text);
        scored.push({ item, score: s });
      }
    }
    scored.sort((a, b) => a.score - b.score || a.item.text.length - b.item.text.length);
    return scored.slice(0, 6).map((x) => x.item);
  }, [query, isSearching]);

  useEffect(() => {
    if (autoFocusInput) {
      // small delay so dropdown/sheet animation settles
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [autoFocusInput]);

  const submitCustom = (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = draft.trim();
    if (!v) return;
    // If the typed text exactly matches a preset, treat it as a preset selection.
    const exact = FLAT_INDEX.find((i) => i.text.toLowerCase() === v.toLowerCase());
    if (exact) {
      onSelect(exact.text);
      setDraft("");
      return;
    }
    onCustom(v.slice(0, 60));
    setDraft("");
  };

  const pickSuggestion = (text: string) => {
    onSelect(text);
    setDraft("");
  };

  const highlight = (text: string) => {
    if (!query) return text;
    const i = text.toLowerCase().indexOf(query);
    if (i < 0) return text;
    return (
      <>
        {text.slice(0, i)}
        <mark className="bg-primary/20 text-primary rounded-sm px-0.5">{text.slice(i, i + query.length)}</mark>
        {text.slice(i + query.length)}
      </>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Custom input — primary action, auto-focused */}
      <div className="px-1 pt-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-1.5">
          <Pencil className="w-3 h-3" /> Write your status
        </p>
        <form onSubmit={submitCustom} className="mt-1.5 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={60}
            placeholder="Write your status…"
            className="h-9 text-sm"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="grid place-items-center w-9 h-9 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 shrink-0"
            aria-label="Save custom status"
          >
            <Check className="w-4 h-4" />
          </button>
        </form>
        <p className="mt-1 text-[10px] text-muted-foreground">{draft.length}/60 · or pick a preset below</p>

        {/* Smart-search suggestions */}
        {isSearching && (
          <div
            className="mt-2 rounded-lg border border-outline-variant/50 bg-popover shadow-md overflow-hidden animate-in fade-in-0 slide-in-from-top-1 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-outline-variant/40 bg-surface-low/60">
              <Search className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Matches
              </span>
            </div>
            {suggestions.length === 0 ? (
              <div className="px-3 py-2.5 text-xs text-muted-foreground">
                No match — press <kbd className="px-1 py-0.5 rounded bg-surface text-[10px] border border-outline-variant/40">Enter</kbd> to use your custom message
              </div>
            ) : (
              <ul className="max-h-56 overflow-y-auto py-1">
                {suggestions.map((s) => (
                  <li key={s.text}>
                    <button
                      type="button"
                      onClick={() => pickSuggestion(s.text)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-[12.5px] hover:bg-surface-low transition-colors",
                        active === s.text && "bg-primary/10",
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", toneAccent[s.tone])} />
                      <span className="flex-1 truncate">{highlight(s.text)}</span>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">
                        {s.mode}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Last custom recall */}
      {!isSearching && lastCustom && (
        <div className="px-1">
          <button
            onClick={() => onSelect(lastCustom)}
            className={cn(
              "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-dashed border-primary/30 bg-primary/5 text-xs text-primary text-left",
              active === lastCustom && "ring-1 ring-primary/40",
            )}
          >
            <Sparkles className="w-3 h-3 shrink-0" />
            <span className="truncate flex-1 italic">"{lastCustom}"</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Last custom</span>
          </button>
        </div>
      )}

      {/* Grouped horizontal-scroll rows */}
      <div className={cn("flex flex-col gap-2.5 mt-1", isSearching && "opacity-40 pointer-events-none")}>
        {CONTEXT_LIBRARY.map((section) => {
          const accent = toneAccent[section.tone ?? "core"];
          return (
            <div key={section.label} className="min-w-0">
              <div className="flex items-center gap-1.5 px-1 mb-1">
                <span className={cn("w-1.5 h-1.5 rounded-full", accent)} />
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {section.label}
                </span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1.5 px-1 -mx-1 snap-x snap-mandatory">
                {section.items.map((item) => {
                  const isActive = active === item;
                  return (
                    <button
                      key={item}
                      onClick={() => onSelect(item)}
                      title={item}
                      className={cn(
                        "snap-start shrink-0 max-w-[16rem] truncate whitespace-nowrap px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary shadow-glass scale-[1.02]"
                          : "bg-surface-low text-foreground/85 border-outline-variant/40 hover:bg-surface hover:scale-[1.03] hover:border-primary/40",
                      )}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
