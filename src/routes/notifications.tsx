import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/auth-gate";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/common";
import { notificationsApi } from "@/lib/api";
import { ago } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Work" },
      { name: "description", content: "Updates on your gigs and applications." },
      { property: "og:title", content: "Notifications — Work" },
      { property: "og:description", content: "Your Work notifications." },
    ],
  }),
  component: () => <RequireAuth>{() => <Notes />}</RequireAuth>,
});

function Notes() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ["notifications"], queryFn: notificationsApi.list });
  const inv = () => qc.invalidateQueries({ queryKey: ["notifications"] });
  const read = useMutation({ mutationFn: notificationsApi.read, onSuccess: inv });
  const all = useMutation({ mutationFn: notificationsApi.readAll, onSuccess: inv });
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Notifications" action={<Button variant="outline" size="sm" disabled={all.isPending || !q.data?.some((n) => !n.read)} onClick={() => all.mutate()}>Mark all read</Button>} />
      {q.isLoading ? <ListSkeleton /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : !q.data?.length ? <EmptyState icon={Bell} title="You're all caught up" /> : (
        <ul className="surface divide-y overflow-hidden p-0">
          {q.data.map((n) => (
            <li key={n.id}>
              <button className={cn("flex w-full gap-3 p-4 text-left hover:bg-secondary", !n.read && "bg-accent/50")} onClick={() => { if (!n.read) read.mutate(n.id); if (n.link) navigate({ to: n.link }); }}>
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-primary")} aria-label={n.read ? undefined : "Unread"} />
                <span className="flex-1"><span className="block text-sm font-semibold">{n.title}</span><span className="block text-sm text-muted-foreground">{n.body}</span><span className="text-xs text-muted-foreground">{ago(n.createdAt)}</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
