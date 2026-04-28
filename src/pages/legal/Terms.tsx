import LegalLayout from "./LegalLayout";
import { H2, P, UL, Callout } from "./sections";

const Terms = () => (
  <LegalLayout eyebrow="Legal" title="Terms of Use" lastUpdated="April 28, 2026">
    <P>Welcome to Availock. These Terms of Use (“Terms”) govern your access to and use of the Availock website, applications, products, and related services (collectively, the “Services”).</P>
    <P>By accessing or using Availock, you agree to be bound by these Terms. If you do not agree, do not use the Services.</P>

    <H2>1. About Availock</H2>
    <P>Availock is a platform designed to help users manage availability, control access to communication, and improve connection timing through profile visibility, permissions, scheduling, and related tools.</P>

    <H2>2. Eligibility</H2>
    <P>You may use Availock only if:</P>
    <UL>
      <li>You are legally capable of entering a binding agreement</li>
      <li>You comply with these Terms</li>
      <li>You are at least 13 years old, or the minimum legal age in your jurisdiction</li>
    </UL>
    <P>If using Availock on behalf of a company or organization, you confirm you have authority to bind that entity.</P>

    <H2>3. Your Account</H2>
    <P>You may need to create an account to access certain features. You agree to:</P>
    <UL>
      <li>Provide accurate and current information</li>
      <li>Maintain the security of your login credentials</li>
      <li>Be responsible for all activity under your account</li>
      <li>Notify us promptly of unauthorized use</li>
    </UL>
    <P>We may suspend or terminate accounts that violate these Terms.</P>

    <H2>4. Acceptable Use</H2>
    <P>You agree not to use Availock to:</P>
    <UL>
      <li>Break any law or regulation</li>
      <li>Harass, threaten, stalk, or abuse others</li>
      <li>Spam or send unwanted communications</li>
      <li>Misrepresent identity or impersonate others</li>
      <li>Attempt unauthorized access to systems or accounts</li>
      <li>Distribute malware or harmful code</li>
      <li>Scrape, copy, or misuse platform data</li>
      <li>Circumvent access controls or permissions</li>
      <li>Interfere with platform performance or security</li>
    </UL>
    <P>Availock is designed to improve respectful communication. Misuse is prohibited.</P>

    <H2>5. User Content</H2>
    <P>You may submit or publish content such as profile information, Spotlight posts, availability notes, messages, requests, and uploaded content.</P>
    <P>You retain ownership of your content. However, by using the Services, you grant Availock a non-exclusive, worldwide, royalty-free license to host, store, display, reproduce, and process such content solely to operate and improve the Services.</P>
    <P>You are responsible for ensuring your content does not violate laws or rights of others.</P>

    <H2>6. Availability, Permissions, and Contact Access</H2>
    <P>Availock provides tools for visibility and communication control. We do not guarantee that others will follow your preferences, that requests will be accepted, immediate responses, delivery of third-party communications, or uninterrupted availability signals. Users remain responsible for their communication decisions and conduct.</P>

    <H2>7. Paid Plans and Billing</H2>
    <P>Certain features may require payment. By purchasing a paid plan, you agree:</P>
    <UL>
      <li>To pay listed fees, taxes, and applicable charges</li>
      <li>That subscriptions may renew automatically unless canceled where applicable</li>
      <li>That pricing may change with notice</li>
      <li>That refunds, if any, are subject to stated policies or applicable law</li>
    </UL>
    <P>Third-party payment processors may be used.</P>

    <H2>8. Intellectual Property</H2>
    <P>All rights in Availock, including software, branding, logos, text, design, graphics, and platform features, are owned by Availock or its licensors and protected by law. You may not copy, reverse engineer, modify, redistribute, resell, or exploit any part of the Services without written permission.</P>

    <H2>9. Feedback</H2>
    <P>If you provide suggestions, ideas, or feedback, you agree Availock may use them without restriction or compensation.</P>

    <H2>10. Third-Party Services</H2>
    <P>Availock may integrate with third-party services such as calendars, payment systems, or communication tools. We are not responsible for third-party products, availability, policies, or actions.</P>

    <H2>11. Termination</H2>
    <P>You may stop using Availock at any time. We may suspend or terminate access if you violate these Terms, if required by law, or if needed to protect users, systems, or business interests. Certain provisions survive termination by nature.</P>

    <H2>12. Disclaimers</H2>
    <P>Availock is provided on an “as is” and “as available” basis. We do not guarantee continuous uptime, error-free operation, compatibility with all devices, specific business outcomes, or increased productivity in every case. Use is at your own risk.</P>

    <H2>13. Limitation of Liability</H2>
    <P>To the maximum extent allowed by law, Availock and its affiliates shall not be liable for indirect, incidental, special, consequential, or punitive damages, including lost profits, lost data, or business interruption arising from use of the Services. Our total liability shall not exceed amounts paid by you to Availock in the preceding 12 months, if any.</P>

    <H2>14. Indemnification</H2>
    <P>You agree to defend and indemnify Availock against claims, damages, liabilities, and expenses arising from your use of the Services, your content, your violation of these Terms, or your violation of the rights of others.</P>

    <H2>15. Privacy</H2>
    <P>Your use of Availock is also governed by our Privacy Policy.</P>

    <H2>16. Changes to Terms</H2>
    <P>We may update these Terms periodically. Updated versions will be posted with a revised date. Continued use after changes means acceptance.</P>

    <H2>17. Governing Law</H2>
    <P>These Terms shall be governed by the laws of the United Arab Emirates, without regard to conflict of law rules. Any disputes shall be handled in the competent courts of the United Arab Emirates, unless applicable law requires otherwise.</P>

    <H2>18. Contact Us</H2>
    <P>Availock — Email: <a href="mailto:info@angill.com" className="text-accent underline underline-offset-4">info@angill.com</a> — Website: <a href="https://www.availock.com" className="text-accent underline underline-offset-4">www.availock.com</a></P>

    <Callout title="Principle">
      Availock exists to support respectful, intentional communication. Use the platform responsibly.
    </Callout>
  </LegalLayout>
);

export default Terms;
