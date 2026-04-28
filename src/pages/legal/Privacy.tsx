import LegalLayout from "./LegalLayout";
import { H2, P, UL, Callout } from "./sections";

const Privacy = () => (
  <LegalLayout eyebrow="Legal" title="Privacy Policy" lastUpdated="April 28, 2026">
    <P>
      Availock (“Availock,” “we,” “our,” or “us”) values your privacy and is committed to
      protecting your personal information. This Privacy Policy explains how we collect, use,
      disclose, and safeguard your information when you use our website, mobile applications,
      products, and related services (collectively, the “Services”).
    </P>
    <P>By using Availock, you agree to the practices described in this Privacy Policy.</P>

    <H2>1. Information We Collect</H2>
    <P>We may collect the following categories of information:</P>
    <h3 className="font-headline font-semibold text-primary mt-6 mb-2">A. Information You Provide Directly</h3>
    <UL>
      <li>Name, username, profile information</li>
      <li>Email address</li>
      <li>Phone number (if provided)</li>
      <li>Availability status preferences</li>
      <li>Contact permissions and settings</li>
      <li>Messages or requests sent through the platform</li>
      <li>Payment and billing details (processed through third-party providers)</li>
    </UL>
    <h3 className="font-headline font-semibold text-primary mt-6 mb-2">B. Information Collected Automatically</h3>
    <UL>
      <li>IP address</li>
      <li>Device type and operating system</li>
      <li>Browser type</li>
      <li>App usage activity</li>
      <li>Pages viewed and interactions</li>
      <li>Cookies and similar technologies</li>
      <li>Log data and timestamps</li>
    </UL>
    <h3 className="font-headline font-semibold text-primary mt-6 mb-2">C. Optional Integrations</h3>
    <P>
      If you connect third-party services (such as calendar tools), we may access limited data
      necessary to provide syncing and automation features.
    </P>

    <H2>2. How We Use Information</H2>
    <P>We use information to:</P>
    <UL>
      <li>Provide, operate, and improve Availock</li>
      <li>Display and manage availability status</li>
      <li>Process requests, permissions, and connections</li>
      <li>Personalize user experience</li>
      <li>Enable notifications and reminders</li>
      <li>Prevent abuse, spam, fraud, and misuse</li>
      <li>Analyze performance and usage trends</li>
      <li>Process payments and subscriptions</li>
      <li>Communicate updates, support, and service notices</li>
      <li>Comply with legal obligations</li>
    </UL>

    <H2>3. Availability and Profile Visibility</H2>
    <P>Availock is built around visibility and controlled access. Depending on your settings, certain profile information may be visible to others, including:</P>
    <UL>
      <li>Display name</li>
      <li>Availability status</li>
      <li>Public profile link / QR access</li>
      <li>Spotlight messages or public notes</li>
      <li>Preferred connection methods</li>
    </UL>
    <P>You control what is shared through your settings.</P>

    <H2>4. Sharing of Information</H2>
    <P><strong className="text-primary">We do not sell your personal information.</strong> We may share data only in these situations:</P>
    <UL>
      <li>With service providers who help operate Availock (hosting, payments, analytics, support)</li>
      <li>With users according to your sharing and permission settings</li>
      <li>When required by law, regulation, subpoena, or legal request</li>
      <li>To protect rights, safety, security, or prevent fraud</li>
      <li>During a merger, acquisition, or asset transfer</li>
    </UL>

    <H2>5. Payments</H2>
    <P>
      Paid plans may be processed through third-party payment processors. Availock does not
      store full payment card details unless explicitly stated. Payment providers manage
      sensitive payment information under their own policies.
    </P>

    <H2>6. Data Retention</H2>
    <P>We retain personal data only as long as necessary to provide the Services, maintain account history, meet legal, tax, accounting, or compliance requirements, resolve disputes, and enforce agreements. When no longer needed, data may be deleted or anonymized.</P>

    <H2>7. Security</H2>
    <P>
      We use reasonable administrative, technical, and organizational measures to protect your
      information. However, no online service can guarantee absolute security. You are
      responsible for protecting your login credentials and devices.
    </P>

    <H2>8. Your Choices and Rights</H2>
    <P>Depending on your location, you may have rights to:</P>
    <UL>
      <li>Access your data</li>
      <li>Correct inaccurate information</li>
      <li>Delete your account or data</li>
      <li>Object to certain processing</li>
      <li>Withdraw consent where applicable</li>
      <li>Export certain data</li>
    </UL>
    <P>To make a request, contact us at <a href="mailto:info@angill.com" className="text-accent underline underline-offset-4">info@angill.com</a>.</P>

    <H2>9. Cookies and Analytics</H2>
    <P>We may use cookies and similar tools to remember preferences, improve performance, measure traffic and usage, and enhance security. You can manage cookies through your browser settings.</P>

    <H2>10. Third-Party Links and Services</H2>
    <P>Availock may contain links or integrations with third-party services. We are not responsible for their privacy practices. Please review their policies separately.</P>

    <H2>11. Children’s Privacy</H2>
    <P>Availock is not intended for children under the age of 13 (or applicable minimum age in your jurisdiction). We do not knowingly collect personal information from children.</P>

    <H2>12. International Users</H2>
    <P>Your information may be processed and stored in countries different from your own. By using the Services, you understand that laws may differ across jurisdictions.</P>

    <H2>13. Changes to This Policy</H2>
    <P>We may update this Privacy Policy from time to time. Updated versions will be posted with a revised “Last Updated” date. Continued use of the Services means you accept the updated policy.</P>

    <H2>14. Contact Us</H2>
    <P>
      Availock — Email: <a href="mailto:info@angill.com" className="text-accent underline underline-offset-4">info@angill.com</a> — Website: <a href="https://www.availock.com" className="text-accent underline underline-offset-4">www.availock.com</a>
    </P>

    <Callout title="Transparency">
      Availock is designed to give users more control over availability and access. We aim to
      protect privacy while enabling respectful, intentional communication.
    </Callout>
  </LegalLayout>
);

export default Privacy;
