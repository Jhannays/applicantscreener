import { Upload, Users } from "lucide-react";

export function HeroSection() {
  return (
    <section className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-balance">
            Resume Screening Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review, evaluate, and manage applicants in one place.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
            <Users className="h-4 w-4" />
            View All
          </button>
          <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <Upload className="h-4 w-4" />
            Upload Resume
          </button>
        </div>
      </div>
    </section>
  );
}
