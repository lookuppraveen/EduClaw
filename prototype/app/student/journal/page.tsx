import { StubPage } from "@/components/layout/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Reflection journal"
      surface="Web"
      role="Student"
      weekTarget={5}
      notes="List of reflections produced via ReflectionPrompt, sortable by course/outcome/date. Click a row to view the entry."
    />
  );
}
