import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contactName: string;
}

const RequestSentDialog = ({ open, onOpenChange, contactName }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md rounded-3xl bg-surface-lowest border-0 shadow-elevated">
      <div className="text-center pt-2">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 grid place-items-center mb-5">
          <Check className="w-7 h-7 text-emerald-600" strokeWidth={3} />
        </div>
        <h2 className="font-headline font-extrabold text-primary text-2xl">Request Sent Successfully</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your access request to <span className="text-primary font-semibold">{contactName}</span> is in their approval queue.
          You'll be notified the moment they respond.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <Link
            to="/app/requests"
            onClick={() => onOpenChange(false)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-elevated hover:opacity-95 transition"
          >
            View request status <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/app/contacts"
            onClick={() => onOpenChange(false)}
            className="flex-1 inline-flex items-center justify-center px-5 py-3 rounded-full ghost-border bg-surface-low text-primary text-sm font-semibold hover:bg-surface transition"
          >
            Browse contacts
          </Link>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default RequestSentDialog;