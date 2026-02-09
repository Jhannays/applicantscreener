import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { StatsBar } from "@/components/stats-bar";
import { ApplicantTable } from "@/components/applicant-table";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <HeroSection />
        <StatsBar />
        <ApplicantTable />
      </main>
    </div>
  );
}
