import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequireAuth } from "@/components/auth-gate";
import { EmptyState, ErrorState, ListSkeleton, PageHeader, StatusBadge } from "@/components/common";
import { applicationsApi } from "@/lib/api";
import { errorMessage } from "@/lib/api/errors";
import { day, money, when } from "@/lib/format";

export const Route = createFileRoute("/my-applications")({
  head: () => ({
    meta: [
      { title: "My applications — Work" },
      { name: "description", content: "Track the status of gigs you applied to." },
      { property: "og:title", content: "My applications — Work" },
      { property: "og:description", content: "Track your gig applications." },
    ],
  }),
  component: () => <RequireAuth>{() => <MyApps />}</RequireAuth>,
});

const FILTERS = ["all", "pending", "accepted", "rejected", "withdrawn"] as const;

function MyApps() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const q = useQuery({ queryKey: ["my-applications"], queryFn: applicationsApi.mine });
  const withdraw = useMutation({
    mutationFn: applicationsApi.withdraw,
    onSuccess: () => { toast.success("Application withdrawn"); qc.invalidateQueries({ queryKey: ["my-applications"] }); qc.invalidateQueries({ queryKey: ["gig"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const list = (q.data ?? []).filter((a) => filter === "all" || a.status === filter);
  return (
    <div>
      <PageHeader title="My applications" sub="Gigs you've applied to as a worker." />
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-4">
        <TabsList className="h-auto flex-wrap">{FILTERS.map((f) => <TabsTrigger key={f} value={f} className="capitalize">{f}</TabsTrigger>)}</TabsList>
      </Tabs>
      {q.isLoading ? <ListSkeleton /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : !list.length ? (
        <EmptyState title="No applications" action={<Button asChild><Link to="/gigs">Find a gig</Link></Button>} />
      ) : (
        <ul className="space-y-3">
          {list.map((a) => (
            <li key={a.id} className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><StatusBadge status={a.status} /><span className="text-xs text-muted-foreground">Applied {day(a.createdAt)}</span></div>
                <Link to="/gigs/$gigId" params={{ gigId: a.gig.id }} className="mt-1 block font-semibold hover:text-primary">{a.gig.title}</Link>
                <div className="text-xs text-muted-foreground">{money(a.gig.price)} · {a.gig.employer.name} · {when(a.gig.startsAt)}</div>
              </div>
              <div className="flex gap-2">
                {a.status === "accepted" && a.gig.agreementId && <Button asChild size="sm"><Link to="/agreements/$agreementId" params={{ agreementId: a.gig.agreementId }}>Agreement & address</Link></Button>}
                {a.status === "pending" && <Button variant="outline" size="sm" disabled={withdraw.isPending} onClick={() => withdraw.mutate(a.id)}>Withdraw</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
