import type {
  Metadata,
} from "next";

import LegalPage, {
  LegalSection,
} from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Corrections Policy",
  description:
    "How Informant Wire handles corrections and updates to published reporting.",
};

export default function CorrectionsPolicyPage() {
  return (
    <LegalPage
      eyebrow="Standards"
      title="Corrections Policy"
      intro="When Informant Wire gets something wrong, we aim to correct the record clearly and promptly."
    >
      <LegalSection title="Corrections">
        <p>
          Material factual errors will be corrected when identified and
          confirmed.
        </p>

        <p>
          Significant corrections may be accompanied by a note
          explaining what was changed.
        </p>
      </LegalSection>

      <LegalSection title="Updates">
        <p>
          News stories may be updated as new information becomes
          available. Routine additions, formatting changes or minor
          wording improvements may not require a correction notice.
        </p>
      </LegalSection>

      <LegalSection title="Developing stories">
        <p>
          Breaking and developing stories can change quickly. We aim to
          update the existing article as reliable new information
          becomes available rather than creating unnecessary duplicate
          reports.
        </p>
      </LegalSection>

      <LegalSection title="Requesting a correction">
        <p>
          If you believe an Informant Wire article contains a factual
          error, contact us with the article URL, the information you
          believe is incorrect and any supporting evidence.
        </p>
      </LegalSection>
    </LegalPage>
  );
}