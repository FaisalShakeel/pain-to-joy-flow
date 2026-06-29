import { useState } from "react";
import { Volume2, Vibrate, Radar, Play, ChevronDown, ChevronUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { feedback, FEEDBACK_EVENTS, useFeedbackPrefs } from "@/lib/feedback";
import { cn } from "@/lib/utils";

const AccountFeedbackPanel = () => {
  const { prefs, update } = useFeedbackPrefs();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent inline-flex items-center gap-1.5">
            <Radar className="w-3 h-3 text-emerald-600" /> Feedback identity
          </p>
          <h3 className="mt-1 font-headline font-bold text-primary">
            Sound + motion that feels alive
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-md">
            On-brand confirmation for every meaningful action — radar pings, shield closes, unlock chimes. No chat or social media sounds.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            "grid place-items-center w-9 h-9 rounded-xl",
            prefs.sfxEnabled ? "bg-emerald-500/15 text-emerald-600" : "bg-surface-low text-muted-foreground",
          )}>
            <Volume2 className="w-4 h-4" />
          </span>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="grid place-items-center w-8 h-8 rounded-full bg-surface-low hover:bg-surface text-primary transition"
          >
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {open && (<>
      <div className="mt-5 grid sm:grid-cols-2 gap-3">
        <label className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-surface-low ghost-border">
          <div className="min-w-0 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-primary">Sound</p>
              <p className="text-[11px] text-muted-foreground">Synthesized signal tones</p>
            </div>
          </div>
          <Switch checked={prefs.sfxEnabled} onCheckedChange={(v) => update({ sfxEnabled: v })} />
        </label>
        <label className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-surface-low ghost-border">
          <div className="min-w-0 flex items-center gap-2">
            <Vibrate className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-primary">Haptics</p>
              <p className="text-[11px] text-muted-foreground">Mobile vibration on confirm</p>
            </div>
          </div>
          <Switch checked={prefs.hapticsEnabled} onCheckedChange={(v) => update({ hapticsEnabled: v })} />
        </label>
      </div>

      <div className={cn("mt-5 transition", !prefs.sfxEnabled && !prefs.hapticsEnabled && "opacity-50")}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Test sounds
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {FEEDBACK_EVENTS.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => feedback(e.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl ghost-border bg-surface-low text-left hover:bg-surface transition"
            >
              <Play className="w-3 h-3 text-accent shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-primary truncate">{e.label}</p>
                <p className="text-[9.5px] text-muted-foreground truncate">{e.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      </>)}
    </div>
  );
};

export default AccountFeedbackPanel;