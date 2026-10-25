import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequireAuth } from "@/components/auth-gate";
import { EmptyState, ErrorState, ListSkeleton, PageHeader, StatCard, StatusBadge } from "@/components/common";
import { gigsApi } from "@/lib/api";
import { errorMessage } from "@/lib/api/errors";
import { day, money, when } from "@/lib/format";
import type { Gig } from "@/types";

export const Route = createFileRoute("/my-gigs/")({
  head: () => ({
    meta: [
      { title: "My gigs — Work" },
      { name: "description", content: "Manage the gigs you've posted." },
      { property: "og:title", content: "My gigs — Work" },
      { property: "og:description", content: "Manage the gigs you've posted." },
    ],
  }),
  component: () => <RequireAuth>{() => <MyGigs />}</RequireAuth>,
});

const FILTERS = ["all", "open", "assigned", "in_progress", "completed", "canceled", "draft"] as const;

function CancelButton({ gig }: { gig: Gig }) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => gigsApi.cancel(gig.id),
    onSuccess: () => { toast.success("Gig canceled"); qc.invalidateQueries({ queryKey: ["my-gigs"] }); qc.invalidateQueries({ queryKey: ["gigs"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive">Cancel</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel “{gig.title}”?</AlertDialogTitle>
          <AlertDialogDescription>All pending applicants will be notified. This can't be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep gig</AlertDialogCancel>
          <AlertDialogAction onClick={() => m.mutate()} disabled={m.isPending}>Cancel gig</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function MyGigs() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const q = useQuery({ queryKey: ["my-gigs"], queryFn: gigsApi.mine });
  const gigs = q.data ?? [];
  const count = (s: string) => gigs.filter((g) => g.status === s).length;
  const shown = filter === "all" ? gigs : gigs.filter((g) => g.status === filter);
  return (
    <div>
      <PageHeader title="My gigs" sub="Jobs you've posted as an employer." action={<Button asChild><Link to="/gigs/new"><Plus /> Post a gig</Link></Button>} />
      <div className="mb-6 grid grid-cols-3 gap-3 md:grid-cols-6">
        <StatCard label="Published" value={gigs.filter((g) => g.status !== "draft").length} />
        <StatCard label="Awaiting selection" value={count("open")} />
        <StatCard label="Assigned" value={count("assigned")} />
        <StatCard label="In progress" value={count("in_progress")} />
        <StatCard label="Completed" value={count("completed")} />
        <StatCard label="Canceled" value={count("canceled")} />
      </div>
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-4">
        <TabsList className="h-auto flex-wrap">{FILTERS.map((f) => <TabsTrigger key={f} value={f} className="capitalize">{f.replace("_", " ")}</TabsTrigger>)}</TabsList>
      </Tabs>
      {q.isLoading ? <ListSkeleton /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : !shown.length ? (
        <EmptyState title="No gigs here yet" action={<Button asChild><Link to="/gigs/new">Post your first gig</Link></Button>} />
      ) : (
        <ul className="space-y-3">
          {shown.map((g) => (
            <li key={g.id} className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><StatusBadge status={g.status} /><span className="text-xs text-muted-foreground">Posted {day(g.createdAt)}</span></div>
                <Link to="/gigs/$gigId" params={{ gigId: g.id }} className="mt-1 block font-semibold hover:text-primary">{g.title}</Link>
                <div className="text-xs text-muted-foreground">{money(g.price)} · {when(g.startsAt)} · {g.applicationCount ?? 0} applications</div>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button asChild size="sm"><Link to="/my-gigs/$gigId/applications" params={{ gigId: g.id }}>Applications</Link></Button>
                {(g.status === "open" || g.status === "draft") && <Button asChild variant="outline" size="sm"><Link to="/gigs/$gigId/edit" params={{ gigId: g.id }}>Edit</Link></Button>}
                {g.agreementId && <Button asChild variant="outline" size="sm"><Link to="/agreements/$agreementId" params={{ agreementId: g.agreementId }}>Agreement</Link></Button>}
                {(g.status === "open" || g.status === "draft") && <CancelButton gig={g} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
