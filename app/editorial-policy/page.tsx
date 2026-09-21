import type {
  Metadata,
} from "next";

import LegalPage, {
  LegalSection,
} from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description:
    "The editorial standards and reporting principles followed by Informant Wire.",
};

export default function EditorialPolicyPage() {
  return (
    <LegalPage
      eyebrow="Standards"
      title="Editorial Policy"
      intro="Informant Wire is committed to accurate, independent and transparent entertainment journalism."
    >
      <LegalSection title="Accuracy">
        <p>
          We aim to publish information that has been researched and
          supported by credible sources.
        </p>

        <p>
          Where a story is developing, we may update it as additional
          verified information becomes available.
        </p>
      </LegalSection>

      <LegalSection title="Sources">
        <p>
          Our reporting may draw on original interviews, press
          materials, public records, official announcements, direct
          statements and reporting from established publications.
        </p>

        <p>
          Where another publication breaks or materially contributes to
          a story, we aim to provide appropriate attribution.
        </p>
      </LegalSection>

      <LegalSection title="Artificial intelligence">
        <p>
          Informant Wire may use artificial intelligence and automated
          tools to assist with research, organisation, transcription,
          discovery and drafting.
        </p>

        <p>
          Editorial responsibility remains with Informant Wire. AI
          assistance does not remove the requirement for human review,
          source assessment and editorial judgement before publication.
        </p>
      </LegalSection>

      <LegalSection title="Independence">
        <p>
          Editorial decisions are made based on newsworthiness,
          relevance and reader value rather than favourable treatment
          for advertisers, studios, publicists or other commercial
          interests.
        </p>
      </LegalSection>

      <LegalSection title="Rumours and developing stories">
        <p>
          Rumours, unconfirmed reports and disputed claims should be
          clearly identified as such. We aim not to present speculation
          as established fact.
        </p>
      </LegalSection>

      <LegalSection title="Sponsored material">
        <p>
          Paid, sponsored or commercially influenced material will be
          labelled so readers can distinguish it from independent
          editorial coverage.
        </p>
      </LegalSection>
    </LegalPage>
  );
}