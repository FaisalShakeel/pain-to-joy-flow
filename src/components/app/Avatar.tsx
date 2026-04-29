import { cn } from "@/lib/utils";

interface Props {
  initials: string;
  accent?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "w-8 h-8 text-[11px]",
  md: "w-10 h-10 text-xs",
  lg: "w-14 h-14 text-sm",
  xl: "w-20 h-20 text-base",
};

const Avatar = ({ initials, accent = "from-primary to-primary-glow", size = "md", className }: Props) => (
  <div
    className={cn(
      "grid place-items-center rounded-full font-semibold text-white bg-gradient-to-br shadow-sm",
      accent,
      sizes[size],
      className,
    )}
    aria-hidden="true"
  >
    {initials}
  </div>
);

export default Avatar;