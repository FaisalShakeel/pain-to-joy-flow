import LegalLayout from "./LegalLayout";
import { H2, P, UL, Callout } from "./sections";

const Encryption = () => (
  <LegalLayout eyebrow="Security" title="Encryption & Security" lastUpdated="April 28, 2026">
    <P>Availock is committed to protecting user data through industry-standard encryption, secure system design, and responsible data handling practices. This policy explains how we safeguard information across our website, applications, and related services.</P>

    <H2>1. Our Security Commitment</H2>
    <P>Availock is built around trust, controlled access, and responsible communication. We use reasonable technical, administrative, and organizational safeguards to help protect personal information from unauthorized access, loss, misuse, alteration, or disclosure.</P>

    <H2>2. Data Encryption in Transit</H2>
    <P>Information transmitted between your device and Availock servers is protected using secure encryption protocols such as HTTPS and TLS (Transport Layer Security). Examples include:</P>
    <UL>
      <li>Account logins</li>
      <li>Profile updates</li>
      <li>Availability changes</li>
      <li>Requests and permissions</li>
      <li>Billing interactions</li>
      <li>API communications</li>
    </UL>

    <H2>3. Data Encryption at Rest</H2>
    <P>Where appropriate, sensitive stored data is protected using encryption-at-rest controls provided by trusted infrastructure providers and databases. This may include:</P>
    <UL>
      <li>Account data</li>
      <li>Authentication credentials (hashed or tokenized where applicable)</li>
      <li>Configuration settings</li>
      <li>Stored communications metadata</li>
      <li>Backup systems</li>
    </UL>

    <H2>4. Password Security</H2>
    <P>Availock does not store plain-text passwords. Passwords are secured using one-way hashing and modern authentication security practices. Users are encouraged to use strong, unique passwords.</P>

    <H2>5. Payment Security</H2>
    <P>Payments may be processed through trusted third-party payment providers. Availock does not typically store full payment card information on its own servers unless specifically stated. Payment processors maintain their own security and compliance controls.</P>

    <H2>6. Access Controls</H2>
    <P>We apply internal controls to limit access to data based on operational need:</P>
    <UL>
      <li>Role-based access controls</li>
      <li>Authentication requirements</li>
      <li>Audit logging</li>
      <li>Restricted administrative permissions</li>
      <li>Principle of least privilege</li>
    </UL>

    <H2>7. Infrastructure Security</H2>
    <P>Availock may use reputable cloud and hosting providers with security protections such as firewalls, network monitoring, secure data centers, redundancy systems, DDoS mitigation, and backup and disaster recovery controls.</P>

    <H2>8. User Responsibilities</H2>
    <P>Security is shared. Users should:</P>
    <UL>
      <li>Protect login credentials</li>
      <li>Use strong passwords</li>
      <li>Enable additional authentication features if offered</li>
      <li>Keep devices updated</li>
      <li>Avoid phishing links or suspicious requests</li>
      <li>Log out from shared devices</li>
    </UL>

    <H2>9. No Absolute Guarantee</H2>
    <P>While we implement strong safeguards, no system connected to the internet can be guaranteed 100% secure. Users acknowledge that all online services carry some level of risk.</P>

    <H2>10. Security Improvements</H2>
    <P>Availock may periodically update its systems, encryption methods, vendors, and operational safeguards to improve security as standards evolve.</P>

    <H2>11. Incident Response</H2>
    <P>If we become aware of a material security incident affecting user data, we may investigate, mitigate risks, and provide notifications where required by applicable law.</P>

    <H2>12. Contact Us</H2>
    <P>If you have security concerns or wish to report a vulnerability, contact us at <a href="mailto:info@angill.com" className="text-accent underline underline-offset-4">info@angill.com</a> — <a href="https://www.availock.com" className="text-accent underline underline-offset-4">www.availock.com</a>.</P>

    <Callout title="Trust">
      Availock is designed around visibility, control, and trust. Security and encryption are core parts of that commitment.
    </Callout>
  </LegalLayout>
);

export default Encryption;
