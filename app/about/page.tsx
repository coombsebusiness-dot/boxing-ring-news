import type {
  Metadata,
} from "next";

import LegalPage, {
  LegalSection,
} from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Informant Wire and our approach to entertainment journalism.",
};

export default function AboutPage() {
  return (
    <LegalPage
      eyebrow="About"
      title="Entertainment starts here."
      intro="Informant Wire is an independent entertainment publication covering the stories shaping film, television, streaming, music, gaming, celebrity, awards, industry and culture."
    >
      <LegalSection title="What we cover">
        <p>
          Informant Wire reports across the entertainment industry,
          from major studio announcements and streaming developments to
          casting, awards, music, gaming and the business behind the
          stories.
        </p>
      </LegalSection>

      <LegalSection title="Our approach">
        <p>
          We want Informant Wire to be fast without becoming careless,
          informed without becoming inaccessible and useful without
          filling stories with unnecessary noise.
        </p>

        <p>
          Our reporting combines human editorial judgement with modern
          research and newsroom technology.
        </p>
      </LegalSection>

      <LegalSection title="Original reporting">
        <p>
          Alongside daily entertainment news, Informant Wire aims to
          publish original interviews, features, exclusive reporting
          and stories supplied directly by filmmakers, studios,
          publicists and other industry sources.
        </p>
      </LegalSection>
    </LegalPage>
  );
}