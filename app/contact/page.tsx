import type {
  Metadata,
} from "next";

import LegalPage, {
  LegalSection,
} from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact the Informant Wire editorial team.",
};

export default function ContactPage() {
  return (
    <LegalPage
      eyebrow="Contact"
      title="Contact Informant Wire"
      intro="News tips, corrections, interview opportunities, press releases and editorial enquiries are welcome."
    >
      <LegalSection title="Editorial enquiries">
        <p>
          For general editorial enquiries, news tips or questions about
          Informant Wire, contact our editorial team.
        </p>

        <p className="font-bold text-black">
  Editorial email:{" "}
  <a
    href="mailto:editor@informantwire.com"
    className="text-red-600 hover:underline"
  >
    editor@informantwire.com
  </a>
</p>
      </LegalSection>

      <LegalSection title="Press and publicity">
        <p>
          Publicists, studios, distributors, filmmakers, networks,
          streaming services, labels and representatives are welcome to
          send press releases, screening opportunities, interview
          requests and story pitches.
        </p>
      </LegalSection>

      <LegalSection title="Corrections">
        <p>
          To report a factual error, please include the article URL,
          details of the issue and any relevant supporting information.
        </p>
      </LegalSection>
    </LegalPage>
  );
}