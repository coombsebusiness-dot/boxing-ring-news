import type {
  Metadata,
} from "next";

import LegalPage, {
  LegalSection,
} from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Informant Wire collects, uses and protects personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This policy explains how Informant Wire handles personal information when you visit our website, contact us or interact with our services."
    >
      <LegalSection title="Information we collect">
        <p>
          We may collect information you provide directly to us,
          including your name, email address and the contents of
          messages, submissions or enquiries you send to Informant Wire.
        </p>

        <p>
          We may also collect technical information such as device type,
          browser type, approximate location, pages visited, referral
          source and website interaction data.
        </p>
      </LegalSection>

      <LegalSection title="How we use information">
        <p>
          We may use information to operate and improve Informant Wire,
          respond to enquiries, manage editorial submissions, understand
          website usage, protect the security of the publication and
          comply with legal obligations.
        </p>
      </LegalSection>

      <LegalSection title="Analytics">
        <p>
          Informant Wire may use analytics services to understand how
          readers use the site. These services may collect information
          about visits, pages viewed, devices and interactions.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Cookies and similar technologies may be used for essential
          website functions, analytics, preferences and other purposes
          described in our Cookie Policy.
        </p>
      </LegalSection>

      <LegalSection title="Third parties">
        <p>
          We may use trusted service providers to operate parts of the
          website, including hosting, analytics, email, database and
          content-delivery services.
        </p>

        <p>
          We do not sell personal information.
        </p>
      </LegalSection>

      <LegalSection title="Data retention">
        <p>
          Information is retained only for as long as reasonably
          necessary for the purpose for which it was collected, subject
          to legal, security and editorial requirements.
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
          Privacy enquiries can be sent through the Informant Wire
          Contact page.
        </p>
      </LegalSection>
    </LegalPage>
  );
}