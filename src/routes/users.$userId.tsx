import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flag, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, EmptyState, ErrorState, ListSkeleton, Rating, UserAvatar } from "@/components/common";
import { ReportDialog } from "@/components/report-dialog";
import { useMe } from "@/features/auth";
import { usersApi } from "@/lib/api";
import { day } from "@/lib/format";

export const Route = createFileRoute("/users/$userId")({
  head: () => ({
    meta: [
      { title: "Member profile — Work" },
      { name: "description", content: "Skills, reviews and completed gigs." },
      { property: "og:title", content: "Member profile — Work" },
      { property: "og:description", content: "A Work member profile." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { userId } = Route.useParams();
  const { data: me } = useMe();
  const q = useQuery({ queryKey: ["user", userId], queryFn: () => usersApi.get(userId) });
  if (q.isLoading) return <ListSkeleton rows={2} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const { user: u, reviews } = q.data!;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="surface flex flex-col items-center p-6 text-center sm:flex-row sm:text-left">
        <UserAvatar name={u.name} className="size-20 text-xl" />
        <div className="mt-3 flex-1 sm:ml-5 sm:mt-0">
          <h1 className="text-2xl font-bold">{u.name}</h1>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground sm:justify-start">
            {u.city && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{u.area}, {u.city}</span>}
            <Rating value={u.rating} count={u.reviewCount} />
            <span>{u.completedGigs} completed gigs</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Member since {day(u.memberSince)}</p>
        </div>
      </div>
      {u.bio && <p className="text-sm leading-relaxed">{u.bio}</p>}
      {u.skills.length > 0 && <div className="flex flex-wrap gap-1.5">{u.skills.map((s) => <Chip key={s}>{s}</Chip>)}</div>}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Reviews</h2>
        {!reviews.length ? <EmptyState title="No reviews yet" /> : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold"><span className="text-warning">{"★".repeat(r.rating)}</span> {r.reviewer.name}</span>
                  {me && <ReportDialog targetType="review" targetId={r.id} trigger={<Button variant="ghost" size="icon" aria-label="Report review"><Flag /></Button>} />}
                </div>
                <p className="text-xs text-muted-foreground">{r.gigTitle} · {day(r.createdAt)}</p>
                {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
      {me && me.id !== u.id && <ReportDialog targetType="user" targetId={u.id} />}
    </div>
  );
}
