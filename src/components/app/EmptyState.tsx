import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

const EmptyState = ({ icon: Icon, title, description, action }: Props) => (
  <div className="rounded-2xl ghost-border bg-surface-lowest p-10 text-center">
    <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 grid place-items-center mb-4">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <h3 className="font-headline font-semibold text-primary text-lg">{title}</h3>
    <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;