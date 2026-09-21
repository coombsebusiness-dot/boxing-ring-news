import type { Metadata } from "next";

import LegalPage, {
  LegalSection,
} from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms governing use of the Boxing Ring News website.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Use"
      intro="These terms govern your use of Boxing Ring News, a publication within the Please Rewind Network."
    >
      <LegalSection title="Using Boxing Ring News">
        <p>
          You may use Boxing Ring News for lawful personal and informational
          purposes.
        </p>

        <p>
          You must not attempt to interfere with the security, availability
          or operation of the website.
        </p>
      </LegalSection>

      <LegalSection title="Editorial content">
        <p>
          Boxing Ring News publishes boxing news, reporting, features,
          interviews, analysis and other editorial material for general
          information.
        </p>

        <p>
          While we work to maintain accurate reporting, information can
          change as stories develop.
        </p>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <p>
          Unless otherwise stated, original Boxing Ring News text, branding,
          design and other original material are protected by applicable
          intellectual property laws.
        </p>

        <p>
          Third-party images, video, trademarks and other materials remain
          the property of their respective owners.
        </p>
      </LegalSection>

      <LegalSection title="Please Rewind Network">
        <p>
          Boxing Ring News is a publication within the Please Rewind Network.
          References to Boxing Ring News in these terms relate to the Boxing
          Ring News website, services and editorial content.
        </p>
      </LegalSection>

      <LegalSection title="Links to other websites">
        <p>
          Boxing Ring News may link to third-party websites for reporting,
          sourcing or additional context. We are not responsible for the
          content, availability or privacy practices of external sites.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may modify these terms when necessary. Continued use of the
          website after changes are published constitutes acceptance of the
          updated terms.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
