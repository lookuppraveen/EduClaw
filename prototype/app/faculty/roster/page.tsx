import { StubPage } from "@/components/layout/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Roster (consent-gated)"
      surface="Web"
      role="Faculty"
      weekTarget={8}
      notes="Class roster showing only what each student has consented to share with faculty. Mastery summary and engagement signals where allowed."
    />
  );
}
