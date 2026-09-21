import type { Metadata } from "next";

import LegalPage, {
  LegalSection,
} from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Information about cookies and similar technologies used by Boxing Ring News.",
};

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Cookie Policy"
      intro="This policy explains how Boxing Ring News, a publication within the Please Rewind Network, may use cookies and similar technologies."
    >
      <LegalSection title="What are cookies?">
        <p>
          Cookies are small files stored on your device when you visit
          websites. They can help websites function correctly, remember
          preferences and understand how visitors use a service.
        </p>
      </LegalSection>

      <LegalSection title="Essential cookies">
        <p>
          Some cookies may be required for security, authentication,
          administration and other functions necessary for the website to
          operate.
        </p>
      </LegalSection>

      <LegalSection title="Analytics cookies">
        <p>
          We may use analytics technologies to understand traffic,
          readership patterns and how visitors interact with Boxing Ring
          News.
        </p>
      </LegalSection>

      <LegalSection title="Third-party services">
        <p>
          Some services embedded in or connected to Boxing Ring News may
          place their own cookies or use similar technologies under their
          respective policies.
        </p>
      </LegalSection>

      <LegalSection title="Network services">
        <p>
          Boxing Ring News operates within the Please Rewind Network and may
          use shared technical services across the network. Where those
          services use cookies or similar technologies, their use is covered
          by this policy where applicable to Boxing Ring News.
        </p>
      </LegalSection>

      <LegalSection title="Managing cookies">
        <p>
          Most browsers allow you to control or delete cookies through
          browser settings. Blocking certain cookies may affect how parts of
          the website function.
        </p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          We may update this policy as our website, technology or legal
          obligations change.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
