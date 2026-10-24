import { Link } from "@tanstack/react-router";
import { AlertCircle, Inbox, Star, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import { errorMessage } from "@/lib/api/errors";
import type { ApplicationStatus, GigStatus } from "@/types";

export function Logo() {
  return (
    <Link to="/gigs" className="flex items-center gap-2" aria-label="Work home">
      <span className="grid size-8 place-items-center rounded-lg bg-primary font-display text-lg font-bold text-primary-foreground">w</span>
      <span className="font-display text-xl font-bold tracking-tight">work</span>
    </Link>
  );
}

export function UserAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <Avatar className={cn("size-9", className)}>
      <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">{initials(name)}</AvatarFallback>
    </Avatar>
  );
}

export function Rating({ value, count }: { value: number | null; count: number }) {
  if (value === null) return <span className="text-xs text-muted-foreground">No reviews yet</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Star className="size-3.5 fill-warning text-warning" aria-hidden />
      <span className="font-semibold text-foreground">{value.toFixed(1)}</span> ({count})
    </span>
  );
}

const statusStyles: Record<string, string> = {
  open: "bg-primary-soft text-accent-foreground",
  accepted: "bg-primary-soft text-accent-foreground",
  completed: "bg-secondary text-secondary-foreground",
  assigned: "bg-info-soft text-info",
  in_progress: "bg-warning-soft text-warning",
  pending: "bg-warning-soft text-warning",
  draft: "bg-muted text-muted-foreground",
  withdrawn: "bg-muted text-muted-foreground",
  rejected: "bg-danger-soft text-destructive",
  canceled: "bg-danger-soft text-destructive",
};
const statusLabels: Record<string, string> = {
  open: "Open", assigned: "Assigned", in_progress: "In progress", completed: "Completed", canceled: "Canceled",
  draft: "Draft", pending: "Pending", accepted: "Accepted", rejected: "Rejected", withdrawn: "Withdrawn",
};
export function StatusBadge({ status }: { status: GigStatus | ApplicationStatus | string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", statusStyles[status])}>
      {statusLabels[status] ?? status}
    </span>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">{children}</span>;
}

export function EmptyState({ icon: Icon = Inbox, title, body, action }: { icon?: LucideIcon; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="surface flex flex-col items-center px-6 py-12 text-center">
      <Icon className="size-8 text-muted-foreground" aria-hidden />
      <h3 className="mt-3 font-semibold">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="surface flex flex-col items-center px-6 py-10 text-center">
      <AlertCircle className="size-8 text-destructive" aria-hidden />
      <p className="mt-3 font-medium">{errorMessage(error)}</p>
      {onRetry && <Button variant="outline" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
    </div>
  );
}

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface p-4">
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
