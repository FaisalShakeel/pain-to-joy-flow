import LegalLayout from "./LegalLayout";
import { Callout } from "./sections";
import { Mail, Building2, Globe } from "lucide-react";

const Contact = () => (
  <LegalLayout eyebrow="Get in touch" title="Contact Us">
    <p className="text-muted-foreground leading-relaxed">
      We’d be happy to hear from you regarding Availock, partnerships, support, media inquiries,
      or general questions.
    </p>

    <div className="mt-10 grid sm:grid-cols-2 gap-5">
      <div className="p-6 rounded-2xl bg-surface-low ghost-border">
        <Building2 className="w-5 h-5 text-accent mb-3" />
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent mb-2">Company</p>
        <p className="font-headline font-bold text-primary text-lg">Availock</p>
        <p className="text-muted-foreground text-sm mt-1">
          Operated by ANGILL TECHNOLOGIESS FZE LLC
          <br />
          Registered in the United Arab Emirates
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-surface-low ghost-border">
        <Mail className="w-5 h-5 text-accent mb-3" />
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent mb-2">Email</p>
        <a
          href="mailto:info@angill.com"
          className="font-headline font-bold text-primary text-lg hover:text-accent transition"
        >
          info@angill.com
        </a>
        <p className="text-muted-foreground text-sm mt-1">One address for everything below.</p>
      </div>
    </div>

    <h2 className="font-headline font-bold text-primary text-2xl md:text-3xl mt-14 mb-3">Business Inquiries</h2>
    <p className="text-muted-foreground leading-relaxed">
      For partnerships, enterprise solutions, investment discussions, or strategic collaborations,
      reach us at <a href="mailto:info@angill.com" className="text-accent underline underline-offset-4">info@angill.com</a>.
    </p>

    <h2 className="font-headline font-bold text-primary text-2xl md:text-3xl mt-10 mb-3">Support</h2>
    <p className="text-muted-foreground leading-relaxed">
      For product support, account assistance, or technical questions, email{" "}
      <a href="mailto:info@angill.com" className="text-accent underline underline-offset-4">info@angill.com</a>.
    </p>

    <h2 className="font-headline font-bold text-primary text-2xl md:text-3xl mt-10 mb-3">Response Time</h2>
    <p className="text-muted-foreground leading-relaxed">
      We aim to respond to inquiries as promptly as possible during standard business days.
    </p>

    <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
      <Globe className="w-4 h-4 text-accent" />
      <a href="https://www.availock.com" className="hover:text-primary transition">www.availock.com</a>
    </div>

    <Callout title="Trust">
      Thank you for your interest in Availock — building a smarter, more respectful way to connect.
    </Callout>
  </LegalLayout>
);

export default Contact;
