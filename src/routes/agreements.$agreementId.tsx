import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Lock, MapPin, MessageSquare, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RequireAuth } from "@/components/auth-gate";
import { ErrorState, ListSkeleton, PageHeader, StatusBadge, UserAvatar } from "@/components/common";
import { ReportDialog } from "@/components/report-dialog";
import { agreementsApi } from "@/lib/api";
import { errorMessage } from "@/lib/api/errors";
import { hours, money, when } from "@/lib/format";
import type { Agreement } from "@/types";

export const Route = createFileRoute("/agreements/$agreementId")({
  head: () => ({
    meta: [
      { title: "Agreement — Work" },
      { name: "description", content: "Gig agreement, address and completion." },
      { property: "og:title", content: "Agreement — Work" },
      { property: "og:description", content: "Gig agreement on Work." },
    ],
  }),
  component: () => <RequireAuth>{() => <AgreementPage />}</RequireAuth>,
});

function AgreementPage() {
  const { agreementId } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["agreement", agreementId], queryFn: () => agreementsApi.get(agreementId) });
  // Only requested after the agreement loads (i.e. server confirmed participation). Never cached across sessions.
  const addr = useQuery({ queryKey: ["address", agreementId], queryFn: () => agreementsApi.address(agreementId), enabled: q.isSuccess, gcTime: 0, staleTime: 0 });
  const refresh = (a: Agreement) => { qc.setQueryData(["agreement", agreementId], a); ["my-gigs", "my-applications", "gig", "notifications"].forEach((k) => qc.invalidateQueries({ queryKey: [k] })); };
  const start = useMutation({ mutationFn: () => agreementsApi.start(agreementId), onSuccess: (a) => { refresh(a); toast.success("Marked as started"); }, onError: (e) => toast.error(errorMessage(e)) });
  const confirm = useMutation({ mutationFn: () => agreementsApi.confirm(agreementId), onSuccess: (a) => { refresh(a); toast.success(a.status === "completed" ? "Gig completed!" : "Your confirmation is recorded"); }, onError: (e) => toast.error(errorMessage(e)) });

  if (q.isLoading) return <ListSkeleton />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const a = q.data!;
  const other = a.myRole === "employer" ? a.worker : a.employer;
  const iConfirmed = a.myRole === "employer" ? a.employerConfirmed : a.workerConfirmed;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title={a.title} sub={`You are the ${a.myRole}`} action={<StatusBadge status={a.status} />} />
      <div className="surface grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
        <div><div className="text-xs text-muted-foreground">Agreed price</div><div className="font-display text-xl font-bold text-primary">{money(a.price)}</div></div>
        <div><div className="text-xs text-muted-foreground">When</div><div className="font-semibold">{when(a.startsAt)}</div></div>
        <div><div className="text-xs text-muted-foreground">Duration</div><div className="font-semibold">{hours(a.durationHours)}</div></div>
      </div>

      <section className="surface p-5">
        <h2 className="mb-2 flex items-center gap-2 font-semibold"><Lock className="size-4 text-primary" />Exact address</h2>
        {addr.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : addr.isError ? <p className="text-sm text-destructive">{errorMessage(addr.error)}</p> : addr.data && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            <div><div className="font-medium">{addr.data.street}</div><div className="text-muted-foreground">{addr.data.area}, {addr.data.city}</div>{addr.data.complement && <div className="mt-1">{addr.data.complement}</div>}</div>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">Visible only to you and {other.name.split(" ")[0]}.</p>
      </section>

      <section className="surface flex items-center gap-3 p-5">
        <UserAvatar name={other.name} className="size-11" />
        <div className="flex-1"><Link to="/users/$userId" params={{ userId: other.id }} className="font-semibold hover:text-primary">{other.name}</Link><div className="text-xs text-muted-foreground">{a.myRole === "employer" ? "Your worker" : "Your employer"}</div></div>
        <Button asChild variant="outline"><Link to="/messages/$conversationId" params={{ conversationId: a.conversationId }}><MessageSquare /> Message</Link></Button>
      </section>

      <section className="surface space-y-4 p-5">
        <h2 className="font-semibold">Progress</h2>
        <ol className="space-y-2 text-sm">
          {[
            ["Worker selected", true],
            ["Gig started", a.status !== "assigned"],
            [`Employer confirmed (${a.employer.name.split(" ")[0]})`, a.employerConfirmed],
            [`Worker confirmed (${a.worker.name.split(" ")[0]})`, a.workerConfirmed],
          ].map(([label, ok]) => (
            <li key={label as string} className="flex items-center gap-2">{ok ? <CheckCircle2 className="size-4 text-primary" /> : <Circle className="size-4 text-muted-foreground" />}{label}</li>
          ))}
        </ol>
        {a.status === "assigned" && <Button onClick={() => start.mutate()} disabled={start.isPending}>{start.isPending ? "Updating…" : "Mark as started"}</Button>}
        {a.status === "in_progress" && (iConfirmed
          ? <p className="text-sm text-muted-foreground">You've confirmed. Waiting for {other.name.split(" ")[0]} to confirm.</p>
          : <Button onClick={() => confirm.mutate()} disabled={confirm.isPending}>{confirm.isPending ? "Confirming…" : "Confirm work is complete"}</Button>)}
        {a.status === "completed" && <p className="text-sm font-medium text-primary">Completed by both sides.</p>}
        <div><ReportDialog targetType="user" targetId={other.id} trigger={<Button variant="link" size="sm" className="px-0 text-muted-foreground">Something went wrong? Report a problem</Button>} /></div>
      </section>

      {a.status === "completed" && <ReviewBox a={a} />}
    </div>
  );
}

function ReviewBox({ a }: { a: Agreement }) {
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const m = useMutation({
    mutationFn: () => agreementsApi.review(a.id, { rating, comment: comment.trim() || undefined }),
    onSuccess: () => { toast.success("Thanks for your review!"); qc.invalidateQueries({ queryKey: ["agreement", a.id] }); qc.invalidateQueries({ queryKey: ["user"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const other = a.myRole === "employer" ? a.worker : a.employer;
  if (a.myReviewSubmitted) return <div className="surface p-5 text-sm text-muted-foreground">You've reviewed {other.name}. Thank you!</div>;
  return (
    <form className="surface space-y-3 p-5" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
      <h2 className="font-semibold">Review {other.name}</h2>
      <div role="radiogroup" aria-label="Rating" className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)}>
            <Star className={`size-7 ${n <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
          </button>
        ))}
      </div>
      <div className="space-y-1.5"><Label htmlFor="rv">Feedback (optional)</Label><Textarea id="rv" maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} /></div>
      <Button type="submit" disabled={!rating || m.isPending}>{m.isPending ? "Submitting…" : "Submit review"}</Button>
    </form>
  );
}
