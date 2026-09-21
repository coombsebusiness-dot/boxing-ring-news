import type { Metadata } from "next";

import LegalPage, {
  LegalSection,
} from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description:
    "The editorial standards and reporting principles followed by Boxing Ring News.",
};

export default function EditorialPolicyPage() {
  return (
    <LegalPage
      eyebrow="Standards"
      title="Editorial Policy"
      intro="Boxing Ring News is committed to accurate, independent and transparent boxing journalism."
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
          Our reporting may draw on original interviews, press materials,
          official announcements, public records, direct statements and
          reporting from established publications.
        </p>

        <p>
          Where another publication breaks or materially contributes to a
          story, we aim to provide appropriate attribution.
        </p>
      </LegalSection>

      <LegalSection title="Boxing reports and rumours">
        <p>
          Fight negotiations, opponent discussions, rankings, title
          situations and other developing boxing stories can change quickly.
          We aim to distinguish clearly between officially announced
          information, attributed reports, direct statements and speculation.
        </p>
      </LegalSection>

      <LegalSection title="Artificial intelligence">
        <p>
          Boxing Ring News may use artificial intelligence and automated
          tools to assist with research, organisation, transcription,
          discovery and drafting.
        </p>

        <p>
          Editorial responsibility remains with Boxing Ring News. AI
          assistance does not remove the requirement for human review,
          source assessment and editorial judgement before publication.
        </p>
      </LegalSection>

      <LegalSection title="Independence">
        <p>
          Editorial decisions are made based on newsworthiness, relevance
          and reader value rather than favourable treatment for advertisers,
          promoters, managers, broadcasters, sanctioning bodies or other
          commercial interests.
        </p>
      </LegalSection>

      <LegalSection title="Sponsored material">
        <p>
          Paid, sponsored or commercially influenced material will be
          labelled so readers can distinguish it from independent editorial
          coverage.
        </p>
      </LegalSection>

      <LegalSection title="Network relationship">
        <p>
          Boxing Ring News is a publication within the Please Rewind Network.
          Its boxing coverage is produced under the Boxing Ring News
          editorial identity and standards described on this page.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
