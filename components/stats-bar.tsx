import { Users, Clock, CheckCircle, XCircle } from "lucide-react";

const stats = [
  {
    label: "Total Applicants",
    value: "128",
    icon: Users,
    color: "text-primary",
  },
  {
    label: "Pending Review",
    value: "42",
    icon: Clock,
    color: "text-amber-500",
  },
  {
    label: "Shortlisted",
    value: "56",
    icon: CheckCircle,
    color: "text-emerald-500",
  },
  {
    label: "Rejected",
    value: "30",
    icon: XCircle,
    color: "text-destructive",
  },
];

export function StatsBar() {
  return (
    <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted ${stat.color}`}
          >
            <stat.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
