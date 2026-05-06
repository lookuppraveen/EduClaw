import { StubPage } from "@/components/layout/StubPage";

export default function Page() {
  return (
    <StubPage
      title="My courses"
      surface="Web"
      role="Faculty"
      weekTarget={7}
      notes="List of courses taught with policy status, review queue depth, materials ingestion status."
    />
  );
}
