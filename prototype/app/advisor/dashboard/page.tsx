import { StubPage } from "@/components/layout/StubPage";

export default function AdvisorDashboard() {
  return (
    <StubPage
      title="Advisor caseload"
      surface="Web"
      role="Advisor"
      weekTarget={9}
      notes="Will show: assigned students, risk indicators, upcoming appointments, recent agent activity (consent-gated), intervention plans."
    />
  );
}
