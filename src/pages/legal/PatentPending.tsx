import LegalLayout from "./LegalLayout";
import { H2, P, Callout } from "./sections";

const PatentPending = () => (
  <LegalLayout eyebrow="Legal" title="Patent Pending Notice" lastUpdated="April 28, 2026">
    <P>
      Certain products, systems, methods, features, designs, and technologies related to
      Availock may be protected by one or more pending patent applications in applicable
      jurisdictions.
    </P>
    <P>
      This website and the Availock platform may contain inventions, processes, user flows,
      communication-control methods, availability-access systems, software implementations,
      and related intellectual property that are the subject of pending patent filings.
    </P>
    <P>
      Unauthorized copying, imitation, reverse engineering, commercial exploitation, or
      misappropriation of proprietary concepts, methods, or technology may violate
      intellectual property laws and other applicable rights.
    </P>

    <H2>Ownership</H2>
    <P>
      <strong className="text-primary">Patent Pending</strong> — Owned and/or operated by{" "}
      <strong className="text-primary">ANGILL TECHNOLOGIESS FZE LLC</strong>, registered in
      the United Arab Emirates.
    </P>

    <H2>Inquiries</H2>
    <P>
      For licensing, partnership, or intellectual property inquiries, please contact:{" "}
      <a href="mailto:info@angill.com" className="text-accent underline underline-offset-4">
        info@angill.com
      </a>
    </P>

    <Callout title="Protected Innovation">
      Availock's concepts, flows, and systems are the result of original research and design.
      All rights reserved.
    </Callout>
  </LegalLayout>
);

export default PatentPending;