"use client";

import { useState } from "react";
import {
  ChevronDown,
  MoreHorizontal,
  ArrowUpDown,
  FileText,
  Mail,
  Star,
} from "lucide-react";

type Status = "Pending" | "Shortlisted" | "Rejected" | "Interview";

interface Applicant {
  id: number;
  name: string;
  email: string;
  role: string;
  experience: string;
  status: Status;
  rating: number;
  appliedDate: string;
}

const sampleApplicants: Applicant[] = [
  {
    id: 1,
    name: "Sarah Chen",
    email: "sarah.chen@email.com",
    role: "Senior Frontend Engineer",
    experience: "6 years",
    status: "Shortlisted",
    rating: 4,
    appliedDate: "2026-02-01",
  },
  {
    id: 2,
    name: "Michael Torres",
    email: "m.torres@email.com",
    role: "Backend Developer",
    experience: "4 years",
    status: "Pending",
    rating: 3,
    appliedDate: "2026-02-03",
  },
  {
    id: 3,
    name: "Emily Johnson",
    email: "e.johnson@email.com",
    role: "Full Stack Engineer",
    experience: "8 years",
    status: "Interview",
    rating: 5,
    appliedDate: "2026-01-28",
  },
  {
    id: 4,
    name: "David Kim",
    email: "d.kim@email.com",
    role: "DevOps Engineer",
    experience: "3 years",
    status: "Rejected",
    rating: 2,
    appliedDate: "2026-01-25",
  },
  {
    id: 5,
    name: "Aisha Patel",
    email: "a.patel@email.com",
    role: "Senior Frontend Engineer",
    experience: "7 years",
    status: "Shortlisted",
    rating: 5,
    appliedDate: "2026-02-05",
  },
  {
    id: 6,
    name: "James Wilson",
    email: "j.wilson@email.com",
    role: "Product Designer",
    experience: "5 years",
    status: "Pending",
    rating: 3,
    appliedDate: "2026-02-07",
  },
  {
    id: 7,
    name: "Lena Hofmann",
    email: "l.hofmann@email.com",
    role: "Data Engineer",
    experience: "4 years",
    status: "Interview",
    rating: 4,
    appliedDate: "2026-02-02",
  },
  {
    id: 8,
    name: "Carlos Rivera",
    email: "c.rivera@email.com",
    role: "Backend Developer",
    experience: "2 years",
    status: "Pending",
    rating: 2,
    appliedDate: "2026-02-08",
  },
];

const statusStyles: Record<Status, string> = {
  Pending: "bg-amber-500/10 text-amber-600",
  Shortlisted: "bg-emerald-500/10 text-emerald-600",
  Rejected: "bg-red-500/10 text-red-600",
  Interview: "bg-primary/10 text-primary",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
}

export function ApplicantTable() {
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const filtered =
    filter === "All"
      ? sampleApplicants
      : sampleApplicants.filter((a) => a.status === filter);

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          All Applicants
        </h2>
        <div className="flex gap-2">
          {(["All", "Pending", "Shortlisted", "Interview", "Rejected"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {s}
              </button>
            )
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    Applicant <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                  Role
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                  Experience
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                  Rating
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                  Applied
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((applicant) => (
                <tr
                  key={applicant.id}
                  className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">
                        {applicant.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {applicant.email}
                      </p>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-foreground md:table-cell">
                    {applicant.role}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {applicant.experience}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[applicant.status]}`}
                    >
                      {applicant.status}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <StarRating rating={applicant.rating} />
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {new Date(applicant.appliedDate).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenMenu(
                            openMenu === applicant.id ? null : applicant.id
                          )
                        }
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={`Actions for ${applicant.name}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {openMenu === applicant.id && (
                        <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-md border border-border bg-popover p-1 shadow-lg">
                          <button
                            onClick={() => setOpenMenu(null)}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-popover-foreground hover:bg-accent"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            View Resume
                          </button>
                          <button
                            onClick={() => setOpenMenu(null)}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-popover-foreground hover:bg-accent"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            Send Email
                          </button>
                          <button
                            onClick={() => setOpenMenu(null)}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-popover-foreground hover:bg-accent"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                            Change Status
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="mb-2 h-8 w-8" />
            <p className="text-sm">No applicants found for this filter.</p>
          </div>
        )}
      </div>
    </section>
  );
}
