import type { Metadata } from "next";

import LegalPage, {
  LegalSection,
} from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Boxing Ring News, an independent boxing publication within the Please Rewind Network.",
};

export default function AboutPage() {
  return (
    <LegalPage
      eyebrow="About"
      title="Inside the fight game."
      intro="Boxing Ring News is an independent boxing publication within the Please Rewind Network, covering the fights, fighters and stories shaping the sport."
    >
      <LegalSection title="What we cover">
        <p>
          Boxing Ring News covers professional boxing and major developments
          across the sport, including fight announcements, results,
          championships, rankings, fighters, trainers, promoters,
          sanctioning bodies, broadcasters and the business of boxing.
        </p>
      </LegalSection>

      <LegalSection title="Our approach">
        <p>
          We want Boxing Ring News to be fast without becoming careless,
          informed without becoming inaccessible and useful without filling
          stories with unnecessary noise.
        </p>

        <p>
          Our reporting combines human editorial judgement with modern
          research and newsroom technology.
        </p>
      </LegalSection>

      <LegalSection title="Original reporting">
        <p>
          Alongside daily boxing news, Boxing Ring News aims to publish
          original interviews, features, exclusive reporting and stories
          supplied directly by fighters, trainers, promoters, managers,
          publicists, broadcasters and other sources within the sport.
        </p>
      </LegalSection>

      <LegalSection title="Please Rewind Network">
        <p>
          Boxing Ring News is a publication within the Please Rewind Network,
          a network of independent editorial and media brands. Boxing Ring
          News maintains its own boxing-focused editorial identity and
          standards while operating as part of the wider network.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
