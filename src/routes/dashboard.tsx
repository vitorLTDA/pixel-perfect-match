import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/auth-gate";
import { EmptyState, ListSkeleton, PageHeader, StatCard, StatusBadge } from "@/components/common";
import { applicationsApi, notificationsApi } from "@/lib/api";
import { money, when } from "@/lib/format";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My activity — Work" },
      { name: "description", content: "Your applications, upcoming gigs and updates." },
      { property: "og:title", content: "My activity — Work" },
      { property: "og:description", content: "Your Work activity at a glance." },
    ],
  }),
  component: () => <RequireAuth>{(me) => <Dashboard name={me.name} />}</RequireAuth>,
});

function Dashboard({ name }: { name: string }) {
  const apps = useQuery({ queryKey: ["my-applications"], queryFn: applicationsApi.mine });
  const notes = useQuery({ queryKey: ["notifications"], queryFn: notificationsApi.list });
  const list = apps.data ?? [];
  const accepted = list.filter((a) => a.status === "accepted");
  const upcoming = accepted.filter((a) => a.gig.status === "assigned" || a.gig.status === "in_progress");
  return (
    <div>
      <PageHeader title={`Hi, ${name.split(" ")[0]}`} sub="Your work activity at a glance." action={<Button asChild variant="outline"><Link to="/my-gigs">Gigs I posted</Link></Button>} />
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Pending applications" value={list.filter((a) => a.status === "pending").length} />
        <StatCard label="Accepted" value={accepted.length} />
        <StatCard label="Upcoming gigs" value={upcoming.length} />
        <StatCard label="Completed" value={accepted.filter((a) => a.gig.status === "completed").length} />
        <StatCard label="Unread updates" value={notes.data?.filter((n) => !n.read).length ?? 0} />
      </div>
      <h2 className="mb-3 text-lg font-semibold">Upcoming gigs</h2>
      {apps.isLoading ? <ListSkeleton rows={2} /> : !upcoming.length ? (
        <EmptyState title="No upcoming gigs" body="When an employer selects you, the gig shows up here." action={<Button asChild><Link to="/gigs">Browse gigs</Link></Button>} />
      ) : (
        <ul className="space-y-3">
          {upcoming.map((a) => (
            <li key={a.id} className="surface flex items-center gap-3 p-4">
              <div className="flex-1"><div className="font-semibold">{a.gig.title}</div><div className="text-xs text-muted-foreground">{money(a.gig.price)} · {when(a.gig.startsAt)} · {a.gig.area}</div></div>
              <StatusBadge status={a.gig.status} />
              {a.gig.agreementId && <Button asChild size="sm"><Link to="/agreements/$agreementId" params={{ agreementId: a.gig.agreementId }}>Open</Link></Button>}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6"><Button asChild variant="link" className="px-0"><Link to="/my-applications">See all my applications →</Link></Button></div>
    </div>
  );
}
