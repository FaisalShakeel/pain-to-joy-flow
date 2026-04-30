import { useState } from "react";
import { Phone, MessageSquare, Zap, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBypass } from "./BypassContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Props {
  contactId: string;
  contactName: string;
  kind: "call" | "message";
  className?: string;
  variant?: "tile" | "inline";
  /** if provided, navigate here on confirm (e.g., live call route) */
  to?: string;
}

/**
 * Priority Bypass — controlled privilege.
 * Renders disabled with hint when not granted; confirms before firing.
 */
const PriorityBypassButton = ({ contactId, contactName, kind, className, variant = "inline", to }: Props) => {
  const { canBypass, recordUsage, usedTodayBy, settings } = useBypass();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const guard = canBypass(contactId, kind);
  const Icon = kind === "call" ? Phone : MessageSquare;
  const label = kind === "call" ? "Priority Call" : "Priority Message";
  const hint = guard.ok
    ? `${usedTodayBy(contactId, kind)}/${kind === "call" ? settings.callsPerContactPerDay : settings.messagesPerContactPerDay} today`
    : guard.reason;

  const fire = () => {
    recordUsage(contactId, kind);
    toast({
      title: kind === "call" ? "Priority call placed" : "Priority message sent",
      description: `${contactName} will see this as a Priority ${kind}.`,
    });
    setConfirmOpen(false);
    if (to) navigate(to);
  };

  if (variant === "tile") {
    return (
      <>
        <button
          type="button"
          disabled={!guard.ok}
          onClick={() => setConfirmOpen(true)}
          title={hint}
          className={cn(
            "w-full flex items-center justify-between gap-2 p-3 rounded-2xl border text-left transition",
            guard.ok
              ? "bg-gradient-to-r from-gold/15 to-gold/5 border-gold/40 text-primary hover:from-gold/25 hover:to-gold/10"
              : "bg-surface-low border-border text-muted-foreground cursor-not-allowed",
            className,
          )}
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <span className={cn(
              "grid place-items-center w-9 h-9 rounded-xl shrink-0",
              guard.ok ? "bg-gold text-background" : "bg-surface text-muted-foreground",
            )}>
              <Zap className="w-4 h-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold truncate">⚡ {label}</span>
              <span className="block text-[10px] truncate">{hint}</span>
            </span>
          </span>
          {!guard.ok && <Lock className="w-3.5 h-3.5 shrink-0" />}
        </button>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-gold" />
                {kind === "call" ? "Use Priority Bypass to call now?" : "Send priority message instantly?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                This bypasses {contactName}'s protocol lanes and surfaces immediately.
                Use sparingly — overuse may revoke privilege.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={fire} className="bg-gold text-background hover:bg-gold/90">
                <Zap className="w-3.5 h-3.5 mr-1" /> Bypass {kind === "call" ? "Call" : "Send"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={!guard.ok}
        onClick={() => setConfirmOpen(true)}
        title={hint}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition border",
          guard.ok
            ? "bg-gold text-background border-gold hover:bg-gold/90"
            : "bg-surface-low text-muted-foreground border-border cursor-not-allowed",
          className,
        )}
      >
        <Zap className="w-3 h-3" />
        {label}
        {!guard.ok && <Lock className="w-3 h-3 ml-0.5" />}
      </button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-gold" />
              {kind === "call" ? "Use Priority Bypass to call now?" : "Send priority message instantly?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This bypasses {contactName}'s protocol lanes and surfaces immediately.
              Use sparingly — overuse may revoke privilege.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={fire} className="bg-gold text-background hover:bg-gold/90">
              Bypass {kind === "call" ? "Call" : "Send"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PriorityBypassButton;