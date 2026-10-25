import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { RequireAuth } from "@/components/auth-gate";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/common";
import { GigForm } from "@/components/gigs/gig-form";
import { gigsApi } from "@/lib/api";

export const Route = createFileRoute("/gigs/$gigId_/edit")({
  head: () => ({
    meta: [
      { title: "Edit gig — Work" },
      { name: "description", content: "Update your gig." },
      { property: "og:title", content: "Edit gig — Work" },
      { property: "og:description", content: "Update your gig." },
    ],
  }),
  component: EditGig,
});

function EditGig() {
  const { gigId } = Route.useParams();
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-2xl">
      <RequireAuth>{() => <Inner gigId={gigId} onSaved={() => { toast.success("Gig updated"); navigate({ to: "/gigs/$gigId", params: { gigId } }); }} />}</RequireAuth>
    </div>
  );
}

function Inner({ gigId, onSaved }: { gigId: string; onSaved: () => void }) {
  const q = useQuery({ queryKey: ["gig-edit", gigId], queryFn: () => gigsApi.getForEdit(gigId), gcTime: 0 });
  if (q.isLoading) return <ListSkeleton />;
  if (q.isError) return <ErrorState error={q.error} />;
  const g = q.data!;
  if (g.status !== "open" && g.status !== "draft") return <EmptyState title="This gig can't be edited" body="Gigs can only be edited before a worker is selected." />;
  const d = new Date(g.startsAt);
  return (
    <>
      <PageHeader title="Edit gig" />
      <GigForm gigId={gigId} onSaved={onSaved} initial={{ title: g.title, description: g.description, category: g.category, type: g.type, price: g.price, durationHours: g.durationHours, date: format(d, "yyyy-MM-dd"), time: format(d, "HH:mm"), city: g.city, area: g.area, street: g.street, complement: g.complement ?? "" }} />
    </>
  );
}
