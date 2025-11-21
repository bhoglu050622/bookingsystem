import { HeroSection } from "@/components/marketing/hero-section";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { InstructorShowcase } from "@/components/instructors/instructor-showcase";
import { PageShell } from "@/components/layout/page-shell";

export default function Home() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <FeatureGrid />
      <InstructorShowcase />
    </div>
  );
}
