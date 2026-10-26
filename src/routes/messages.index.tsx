import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { RequireAuth } from "@/components/auth-gate";
import { EmptyState, ErrorState, ListSkeleton, PageHeader, UserAvatar } from "@/components/common";
import { messagesApi } from "@/lib/api";
import { ago } from "@/lib/format";

export const Route = createFileRoute("/messages/")({
  head: () => ({
    meta: [
      { title: "Messages — Work" },
      { name: "description", content: "Coordinate gigs with your employer or worker." },
      { property: "og:title", content: "Messages — Work" },
      { property: "og:description", content: "Your Work conversations." },
    ],
  }),
  component: () => <RequireAuth>{() => <Inbox />}</RequireAuth>,
});

function Inbox() {
  const q = useQuery({ queryKey: ["conversations"], queryFn: messagesApi.conversations, refetchInterval: 15_000 });
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Messages" sub="Conversations open once a worker is selected." />
      {q.isLoading ? <ListSkeleton /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : !q.data?.length ? (
        <EmptyState icon={MessageSquare} title="No conversations yet" body="You'll be able to message once you're matched on a gig." />
      ) : (
        <ul className="surface divide-y overflow-hidden p-0">
          {q.data.map((c) => (
            <li key={c.id}>
              <Link to="/messages/$conversationId" params={{ conversationId: c.id }} className="flex items-center gap-3 p-4 hover:bg-secondary">
                <UserAvatar name={c.other.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2"><span className="font-semibold">{c.other.name}</span>{c.lastMessage && <span className="text-xs text-muted-foreground">{ago(c.lastMessage.createdAt)}</span>}</div>
                  <div className="truncate text-xs text-muted-foreground">{c.gigTitle}</div>
                  {c.lastMessage && <div className={`truncate text-sm ${c.unreadCount ? "font-semibold" : "text-muted-foreground"}`}>{c.lastMessage.body}</div>}
                </div>
                {c.unreadCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground" aria-label={`${c.unreadCount} unread`}>{c.unreadCount}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
