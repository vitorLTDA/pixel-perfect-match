import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/auth-gate";
import { Chip, EmptyState, ErrorState, ListSkeleton, PageHeader, Rating, StatusBadge, UserAvatar } from "@/components/common";
import { applicationsApi } from "@/lib/api";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { ago, money } from "@/lib/format";
import type { Application } from "@/types";

export const Route = createFileRoute("/my-gigs/$gigId/applications")({
  head: () => ({
    meta: [
      { title: "Applications — Work" },
      { name: "description", content: "Review applicants and select one worker." },
      { property: "og:title", content: "Applications — Work" },
      { property: "og:description", content: "Review applicants for your gig." },
    ],
  }),
  component: () => <RequireAuth>{() => <Applications />}</RequireAuth>,
});

function Applications() {
  const { gigId } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [pick, setPick] = useState<Application | null>(null);
  const q = useQuery({ queryKey: ["gig-apps", gigId], queryFn: () => applicationsApi.forGig(gigId) });
  const select = useMutation({
    mutationFn: (appId: string) => applicationsApi.selectWorker(gigId, appId),
    onSuccess: (ag) => {
      toast.success(`${ag.worker.name} selected. Address shared with them.`);
      setPick(null);
      ["gig-apps", "my-gigs", "gig", "gigs", "conversations", "notifications"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      navigate({ to: "/agreements/$agreementId", params: { agreementId: ag.id } });
    },
    onError: (e) => {
      setPick(null);
      toast.error(errorMessage(e));
      if (e instanceof ApiError && e.status === 409) qc.invalidateQueries({ queryKey: ["gig-apps", gigId] });
    },
  });

  if (q.isLoading) return <ListSkeleton />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const { gig, applications } = q.data!;
  const canSelect = gig.status === "open";

  return (
    <div>
      <Link to="/my-gigs" className="text-sm text-muted-foreground hover:text-foreground">← My gigs</Link>
      <PageHeader title={gig.title} sub={`${money(gig.price)} fixed · ${applications.length} application${applications.length === 1 ? "" : "s"}`} action={<StatusBadge status={gig.status} />} />
      {!canSelect && gig.agreementId && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-accent p-4 text-sm text-accent-foreground">
          A worker has been selected for this gig.
          <Button asChild size="sm"><Link to="/agreements/$agreementId" params={{ agreementId: gig.agreementId }}>Open agreement</Link></Button>
        </div>
      )}
      {!applications.length ? <EmptyState title="No applications yet" body="We'll notify you as soon as someone applies." /> : (
        <ul className="grid gap-3 md:grid-cols-2">
          {applications.map((a) => (
            <li key={a.id} className="surface flex flex-col p-5">
              <div className="flex items-start gap-3">
                <UserAvatar name={a.worker.name} className="size-11" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2"><span className="font-semibold">{a.worker.name}</span><StatusBadge status={a.status} /></div>
                  <Rating value={a.worker.rating} count={a.worker.reviewCount} />
                  <div className="text-xs text-muted-foreground">{a.worker.completedGigs} completed · applied {ago(a.createdAt)}</div>
                </div>
              </div>
              {a.worker.bio && <p className="mt-3 text-sm text-muted-foreground">{a.worker.bio}</p>}
              {a.worker.skills.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{a.worker.skills.map((s) => <Chip key={s}>{s}</Chip>)}</div>}
              {a.message && <blockquote className="mt-3 rounded-lg bg-secondary p-3 text-sm">“{a.message}”</blockquote>}
              <div className="mt-4 flex gap-2 pt-1">
                <Button asChild variant="outline" size="sm"><Link to="/users/$userId" params={{ userId: a.worker.id }}>View profile</Link></Button>
                {canSelect && a.status === "pending" && <Button size="sm" className="ml-auto" onClick={() => setPick(a)}>Select worker</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <AlertDialog open={!!pick} onOpenChange={(o) => !o && !select.isPending && setPick(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Select {pick?.worker.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll agree on the fixed price of <strong>{money(gig.price)}</strong>. All other applicants will be notified that the gig is filled, and the exact address will be shared with {pick?.worker.name.split(" ")[0]}. You can only select one worker.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={select.isPending}>Not yet</AlertDialogCancel>
            <AlertDialogAction disabled={select.isPending} onClick={(e) => { e.preventDefault(); if (pick) select.mutate(pick.id); }}>
              {select.isPending ? "Selecting…" : "Confirm selection"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
