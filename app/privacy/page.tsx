import type { Metadata } from "next";

import LegalPage, {
  LegalSection,
} from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Boxing Ring News and the Please Rewind Network handle personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This policy explains how Boxing Ring News, a publication within the Please Rewind Network, handles personal information when you visit our website, contact us or interact with our services."
    >
      <LegalSection title="Information we collect">
        <p>
          We may collect information you provide directly to us, including
          your name, email address and the contents of messages, submissions
          or enquiries you send to Boxing Ring News.
        </p>

        <p>
          We may also collect technical information such as device type,
          browser type, approximate location, pages visited, referral source
          and website interaction data.
        </p>
      </LegalSection>

      <LegalSection title="How we use information">
        <p>
          We may use information to operate and improve Boxing Ring News,
          respond to enquiries, manage editorial submissions, understand
          website usage, protect the security of the publication and comply
          with legal obligations.
        </p>
      </LegalSection>

      <LegalSection title="Please Rewind Network">
        <p>
          Boxing Ring News operates within the Please Rewind Network.
          Information may be processed using shared systems and services
          used to operate the network where reasonably necessary for
          administration, security, publishing and technical operations.
        </p>
      </LegalSection>

      <LegalSection title="Analytics">
        <p>
          Boxing Ring News may use analytics services to understand how
          readers use the site. These services may collect information about
          visits, pages viewed, devices and interactions.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Cookies and similar technologies may be used for essential website
          functions, analytics, preferences and other purposes described in
          our Cookie Policy.
        </p>
      </LegalSection>

      <LegalSection title="Third parties">
        <p>
          We may use trusted service providers to operate parts of the
          website and network infrastructure, including hosting, analytics,
          email, database and content-delivery services.
        </p>

        <p>
          We do not sell personal information.
        </p>
      </LegalSection>

      <LegalSection title="Data retention">
        <p>
          Information is retained only for as long as reasonably necessary
          for the purpose for which it was collected, subject to legal,
          security and editorial requirements.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          Depending on where you live, you may have rights relating to
          access, correction, deletion, restriction or objection to the
          processing of your personal information.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Privacy enquiries relating to Boxing Ring News can be sent through
          the Boxing Ring News Contact page.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
