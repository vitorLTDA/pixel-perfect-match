import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, Lock, MapPin, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Chip, ErrorState, ListSkeleton, Rating, StatusBadge, UserAvatar } from "@/components/common";
import { ReportDialog } from "@/components/report-dialog";
import { useMe } from "@/features/auth";
import { applicationsApi, gigsApi, usersApi } from "@/lib/api";
import { errorMessage } from "@/lib/api/errors";
import { ago, hours, money, when } from "@/lib/format";

export const Route = createFileRoute("/gigs/$gigId")({
  head: () => ({
    meta: [
      { title: "Gig details — Work" },
      { name: "description", content: "See the fixed price, time and general area for this local gig." },
      { property: "og:title", content: "Gig details — Work" },
      { property: "og:description", content: "A local small gig on Work." },
    ],
  }),
  component: GigDetail,
});

function GigDetail() {
  const { gigId } = Route.useParams();
  const { data: me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const gig = useQuery({ queryKey: ["gig", gigId, me?.id ?? "anon"], queryFn: () => gigsApi.get(gigId) });
  const employerId = gig.data?.employer.id;
  const employer = useQuery({ queryKey: ["user", employerId], queryFn: () => usersApi.get(employerId!), enabled: !!employerId });

  const apply = useMutation({
    mutationFn: () => applicationsApi.apply(gigId, message.trim() || undefined),
    onSuccess: () => {
      toast.success("Application sent! The employer will be notified.");
      setMessage("");
      qc.invalidateQueries({ queryKey: ["gig", gigId] });
      qc.invalidateQueries({ queryKey: ["my-applications"] });
      qc.invalidateQueries({ queryKey: ["gigs"] });
    },
    onError: (e) => { toast.error(errorMessage(e)); qc.invalidateQueries({ queryKey: ["gig", gigId] }); },
  });

  if (gig.isLoading) return <ListSkeleton rows={2} />;
  if (gig.isError) return <ErrorState error={gig.error} onRetry={() => gig.refetch()} />;
  const g = gig.data!;

  const closedReason =
    g.status === "assigned" || g.status === "in_progress" ? "A worker has already been selected for this gig."
    : g.status === "completed" ? "This gig has been completed."
    : g.status === "canceled" ? "The employer canceled this gig."
    : g.status === "draft" ? "This gig is still a draft." : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <article className="space-y-6">
        <div>
          <Link to="/gigs" className="text-sm text-muted-foreground hover:text-foreground">← All gigs</Link>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Chip>{g.category}</Chip><Chip>{g.type === "business" ? "Business gig" : "Personal gig"}</Chip><StatusBadge status={g.status} />
          </div>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{g.title}</h1>
          <p className="mt-1 text-xs text-muted-foreground">Posted {ago(g.createdAt)}</p>
        </div>
        <div className="surface grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
          <div><div className="text-xs text-muted-foreground">Fixed price</div><div className="font-display text-xl font-bold text-primary">{money(g.price)}</div></div>
          <div><div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" />Duration</div><div className="font-semibold">{hours(g.durationHours)}</div></div>
          <div><div className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="size-3" />When</div><div className="font-semibold">{when(g.startsAt)}</div></div>
          <div><div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />Area</div><div className="font-semibold">{g.area}, {g.city}</div></div>
        </div>
        <section>
          <h2 className="mb-2 text-lg font-semibold">About the job</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed">{g.description}</p>
        </section>
        <div className="flex items-start gap-3 rounded-xl bg-accent p-4 text-sm text-accent-foreground">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <p>The exact address is shared only with the selected worker after the employer confirms them.</p>
        </div>
        <div className="flex items-start gap-3 rounded-xl border p-4 text-sm">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-muted-foreground">Stay safe: keep conversations on Work, meet at the agreed time, and report anything that feels wrong. Payment is arranged directly between you — Work never asks for money upfront.</p>
        </div>
        {employer.data && employer.data.reviews.length > 0 && (
          <section>
            <h2 className="mb-2 text-lg font-semibold">Reviews of {g.employer.name.split(" ")[0]}</h2>
            <ul className="space-y-2">
              {employer.data.reviews.slice(0, 3).map((r) => (
                <li key={r.id} className="surface p-4 text-sm"><div className="font-medium">{"★".repeat(r.rating)} · {r.reviewer.name}</div>{r.comment && <p className="mt-1 text-muted-foreground">{r.comment}</p>}</li>
              ))}
            </ul>
          </section>
        )}
        {me && !g.isOwner && <ReportDialog targetType="gig" targetId={g.id} />}
      </article>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
        <div className="surface p-5">
          {g.isOwner ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold">This is your gig</p>
              {g.applicationCount !== undefined && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="size-4" />{g.applicationCount} application{g.applicationCount === 1 ? "" : "s"}</p>}
              <Button asChild className="w-full"><Link to="/my-gigs/$gigId/applications" params={{ gigId: g.id }}>Manage applications</Link></Button>
              {(g.status === "open" || g.status === "draft") && <Button asChild variant="outline" className="w-full"><Link to="/gigs/$gigId/edit" params={{ gigId: g.id }}>Edit gig</Link></Button>}
              {g.agreementId && <Button asChild variant="outline" className="w-full"><Link to="/agreements/$agreementId" params={{ agreementId: g.agreementId }}>View agreement</Link></Button>}
            </div>
          ) : g.myApplication && g.myApplication.status !== "withdrawn" ? (
            <div className="space-y-3">
              <p className="text-sm">Your application: <StatusBadge status={g.myApplication.status} /></p>
              {g.agreementId ? <Button asChild className="w-full"><Link to="/agreements/$agreementId" params={{ agreementId: g.agreementId }}>Open agreement & address</Link></Button>
                : <Button asChild variant="outline" className="w-full"><Link to="/my-applications">My applications</Link></Button>}
            </div>
          ) : closedReason ? (
            <div><Button disabled className="w-full">Applications closed</Button><p className="mt-2 text-sm text-muted-foreground">{closedReason}</p></div>
          ) : !me ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Sign in to apply for {money(g.price)}.</p>
              <Button className="w-full" onClick={() => navigate({ to: "/login", search: { redirect: `/gigs/${g.id}` } })}>Sign in to apply</Button>
              <Button variant="outline" className="w-full" onClick={() => navigate({ to: "/register", search: { redirect: `/gigs/${g.id}` } })}>Create account</Button>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); apply.mutate(); }}>
              <div className="space-y-1.5">
                <Label htmlFor="msg">Message to employer (optional)</Label>
                <Textarea id="msg" maxLength={500} placeholder="Why you're a good fit, availability…" value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">You're applying for the fixed price of <strong>{money(g.price)}</strong>.</p>
              <Button type="submit" className="w-full" disabled={apply.isPending}>{apply.isPending ? "Sending…" : "Apply"}</Button>
            </form>
          )}
        </div>
        <Link to="/users/$userId" params={{ userId: g.employer.id }} className="surface flex items-center gap-3 p-4 hover:shadow-lift">
          <UserAvatar name={g.employer.name} className="size-11" />
          <div className="min-w-0">
            <div className="font-semibold">{g.employer.name}</div>
            <Rating value={g.employer.rating} count={g.employer.reviewCount} />
            <div className="text-xs text-muted-foreground">{g.employer.completedGigs} completed gigs</div>
          </div>
        </Link>
      </aside>
    </div>
  );
}
