import { StubPage } from "@/components/layout/StubPage";

export default function AdminDashboard() {
  return (
    <StubPage
      title="Tenant overview"
      surface="Web"
      role="Admin"
      weekTarget={9}
      notes="Will show: tenant status, integration health (LMS/SIS/SSO/library), KPI rollup (six headline metrics), eval-suite results, audit-log highlights, cost per agent."
    />
  );
}
