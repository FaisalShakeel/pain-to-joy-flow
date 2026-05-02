import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const PreviewModeBanner = ({ className }: { className?: string }) => (
  <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em]", className)}>
    <Eye className="w-3 h-3" />
    Preview Mode
  </div>
);

export default PreviewModeBanner;
