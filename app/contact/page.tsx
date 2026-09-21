import type { Metadata } from "next";

import LegalPage, {
  LegalSection,
} from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact the Boxing Ring News editorial team.",
};

export default function ContactPage() {
  return (
    <LegalPage
      eyebrow="Contact"
      title="Contact Boxing Ring News"
      intro="News tips, corrections, interview opportunities, press releases and editorial enquiries are welcome."
    >
      <LegalSection title="Editorial enquiries">
        <p>
          For general editorial enquiries, news tips or questions about
          Boxing Ring News, contact our editorial team.
        </p>

        <p className="font-bold text-black">
          Editorial email:{" "}
          <a
            href="mailto:editor@boxingringnews.com"
            className="text-red-600 hover:underline"
          >
            editor@boxingringnews.com
          </a>
        </p>
      </LegalSection>

      <LegalSection title="Press and publicity">
        <p>
          Fighters, trainers, promoters, managers, publicists, sanctioning
          bodies, broadcasters, streaming services, venues and other boxing
          representatives are welcome to send press releases, fight
          announcements, interview opportunities, event invitations,
          media information and story pitches.
        </p>
      </LegalSection>

      <LegalSection title="Corrections">
        <p>
          To report a factual error, please include the article URL,
          details of the issue and any relevant supporting information.
        </p>
      </LegalSection>

      <LegalSection title="Network">
        <p>
          Boxing Ring News is a publication within the Please Rewind Network.
          Editorial enquiries relating specifically to Boxing Ring News
          should be sent to the Boxing Ring News editorial team.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
