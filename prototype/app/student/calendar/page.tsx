import { StubPage } from "@/components/layout/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Calendar / schedule"
      surface="Web"
      role="Student"
      weekTarget={6}
      notes="Calendar-aware nudges, study sessions, advisor appointments, assignment deadlines pulled from LMS."
    />
  );
}
