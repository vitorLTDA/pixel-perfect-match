import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequireAuth } from "@/components/auth-gate";
import { Chip, EmptyState, ErrorState, ListSkeleton, PageHeader, StatusBadge } from "@/components/common";
import { reportsApi } from "@/lib/api";
import { errorMessage } from "@/lib/api/errors";
import { ago } from "@/lib/format";
import type { Report } from "@/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Moderation — Work" },
      { name: "description", content: "Trust and safety review queue." },
      { property: "og:title", content: "Moderation — Work" },
      { property: "og:description", content: "Work moderation." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <RequireAuth admin>{() => <Admin />}</RequireAuth>,
});

function Admin() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-reports"], queryFn: reportsApi.adminList });
  const m = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "dismiss" | "hide_gig" | "suspend_user" }) => reportsApi.resolve(id, action),
    onSuccess: () => { toast.success("Report resolved"); qc.invalidateQueries(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const row = (r: Report, actions: boolean) => (
    <li key={r.id} className="surface p-4">
      <div className="flex flex-wrap items-center gap-2"><Chip>{r.targetType}</Chip><StatusBadge status={r.status === "open" ? "pending" : r.status === "dismissed" ? "withdrawn" : "completed"} /><span className="text-xs text-muted-foreground">by {r.reporter.name} · {ago(r.createdAt)}</span></div>
      <p className="mt-2 font-semibold">{r.reason}</p>
      <p className="line-clamp-2 text-sm text-muted-foreground">Target: {r.targetLabel}</p>
      {r.details && <p className="mt-1 text-sm">{r.details}</p>}
      {r.resolution && <p className="mt-1 text-xs text-muted-foreground">Resolution: {r.resolution}{r.resolvedAt ? ` · ${ago(r.resolvedAt)}` : ""}</p>}
      {actions && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={m.isPending} onClick={() => m.mutate({ id: r.id, action: "dismiss" })}>Dismiss</Button>
          {r.targetType === "gig" && <Button size="sm" variant="outline" disabled={m.isPending} onClick={() => m.mutate({ id: r.id, action: "hide_gig" })}>Hide gig</Button>}
          {(r.targetType === "user" || r.targetType === "gig") && <Button size="sm" variant="destructive" disabled={m.isPending} onClick={() => m.mutate({ id: r.id, action: "suspend_user" })}>Suspend user</Button>}
        </div>
      )}
    </li>
  );
  const open = q.data?.filter((r) => r.status === "open") ?? [];
  const done = q.data?.filter((r) => r.status !== "open") ?? [];
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Moderation" sub="Admin-only. Every action is checked by the server." />
      {q.isLoading ? <ListSkeleton /> : q.isError ? <ErrorState error={q.error} /> : (
        <Tabs defaultValue="open">
          <TabsList><TabsTrigger value="open">Open ({open.length})</TabsTrigger><TabsTrigger value="history">History ({done.length})</TabsTrigger></TabsList>
          <TabsContent value="open">{open.length ? <ul className="space-y-3">{open.map((r) => row(r, true))}</ul> : <EmptyState title="No open reports" />}</TabsContent>
          <TabsContent value="history">{done.length ? <ul className="space-y-3">{done.map((r) => row(r, false))}</ul> : <EmptyState title="No moderation history yet" />}</TabsContent>
        </Tabs>
      )}
    </div>
  );
}
