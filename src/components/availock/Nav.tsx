import { useEffect, useState } from "react";
import logoIcon from "@/assets/availock-icon.png";

const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? "py-3" : "py-6"
      }`}
    >
      <div
        className={`mx-auto max-w-7xl px-6 md:px-10 flex items-center justify-between transition-all duration-500 ${
          scrolled
            ? "glass shadow-ambient ghost-border rounded-full mx-4 md:mx-auto py-3 md:max-w-5xl"
            : ""
        }`}
      >
        <a href="#top" className="flex items-center gap-2 group">
          <img
            src={logoIcon}
            alt="Availock"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
          <span className="font-headline font-extrabold text-xl tracking-tight text-primary">
            Availock
          </span>
        </a>
        <div className="hidden md:flex items-center gap-9 text-sm font-medium">
          <a href="#protocol" className="text-muted-foreground hover:text-primary transition-colors">Protocol</a>
          <a href="#vault" className="text-muted-foreground hover:text-primary transition-colors">The Vault</a>
          <a href="#how" className="text-muted-foreground hover:text-primary transition-colors">How it works</a>
          <a href="#video" className="text-muted-foreground hover:text-primary transition-colors">Video</a>
          <a href="#audience" className="text-muted-foreground hover:text-primary transition-colors">For You</a>
          <a href="#manifesto" className="text-muted-foreground hover:text-primary transition-colors">Manifesto</a>
          <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</a>
        </div>
        <a
          href="#claim"
          className="px-5 md:px-7 py-2.5 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-glass hover:opacity-95 active:scale-[0.97] transition"
        >
          Claim your ID
        </a>
      </div>
    </nav>
  );
};

export default Nav;
