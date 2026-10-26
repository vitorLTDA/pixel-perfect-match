import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RequireAuth } from "@/components/auth-gate";
import { ErrorState, ListSkeleton } from "@/components/common";
import { ReportDialog } from "@/components/report-dialog";
import { messagesApi } from "@/lib/api";
import { errorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const Route = createFileRoute("/messages/$conversationId")({
  head: () => ({
    meta: [
      { title: "Conversation — Work" },
      { name: "description", content: "Private gig conversation." },
      { property: "og:title", content: "Conversation — Work" },
      { property: "og:description", content: "Private gig conversation." },
    ],
  }),
  component: () => <RequireAuth>{(me) => <Thread meId={me.id} />}</RequireAuth>,
});

function Thread({ meId }: { meId: string }) {
  const { conversationId } = Route.useParams();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const convs = useQuery({ queryKey: ["conversations"], queryFn: messagesApi.conversations });
  const q = useQuery({ queryKey: ["messages", conversationId], queryFn: () => messagesApi.messages(conversationId), refetchInterval: 8000 });
  const send = useMutation({
    mutationFn: (body: string) => messagesApi.send(conversationId, body),
    onSuccess: () => { setText(""); qc.invalidateQueries({ queryKey: ["messages", conversationId] }); qc.invalidateQueries({ queryKey: ["conversations"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [q.data?.length]);
  useEffect(() => { if (q.isSuccess) qc.invalidateQueries({ queryKey: ["conversations"] }); }, [q.isSuccess, qc]);
  const conv = convs.data?.find((c) => c.id === conversationId);

  if (q.isLoading) return <ListSkeleton />;
  if (q.isError) return <ErrorState error={q.error} />;
  return (
    <div className="mx-auto flex h-[calc(100vh-12rem)] max-w-2xl flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <Link to="/messages" className="text-sm text-muted-foreground">← Messages</Link>
          <h1 className="text-lg font-bold">{conv?.other.name ?? "Conversation"}</h1>
          {conv && <Link to="/gigs/$gigId" params={{ gigId: conv.gigId }} className="text-xs text-primary">{conv.gigTitle}</Link>}
        </div>
        <ReportDialog targetType="message" targetId={conversationId} />
      </div>
      <div className="surface flex-1 space-y-2 overflow-y-auto p-4" aria-live="polite">
        {q.data!.map((m) => {
          const mine = m.senderId === meId;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%] rounded-2xl px-3.5 py-2 text-sm", mine ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className="mt-0.5 text-[10px] opacity-70">{format(new Date(m.createdAt), "d MMM HH:mm")}</p>
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) send.mutate(text.trim()); }}>
        <Input aria-label="Message" className="h-11" maxLength={2000} placeholder="Write a message…" value={text} onChange={(e) => setText(e.target.value)} />
        <Button type="submit" className="h-11" disabled={!text.trim() || send.isPending} aria-label="Send"><Send /></Button>
      </form>
    </div>
  );
}
