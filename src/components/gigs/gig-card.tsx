import { Link } from "@tanstack/react-router";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Chip, StatusBadge, UserAvatar } from "@/components/common";
import { ago, hours, money, when } from "@/lib/format";
import type { Gig } from "@/types";

export function GigCard({ gig }: { gig: Gig }) {
  return (
    <Link
      to="/gigs/$gigId"
      params={{ gigId: gig.id }}
      className="surface group block p-5 transition-shadow hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <Chip>{gig.category}</Chip>
            <Chip>{gig.type === "business" ? "Business" : "Personal"}</Chip>
            {gig.myApplication && <StatusBadge status={gig.myApplication.status} />}
          </div>
          <h3 className="font-display text-lg font-semibold leading-snug group-hover:text-primary">{gig.title}</h3>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-xl font-bold text-primary">{money(gig.price)}</div>
          <div className="text-[11px] text-muted-foreground">fixed price</div>
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{gig.description}</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{gig.area}, {gig.city}</span>
        <span className="inline-flex items-center gap-1"><Calendar className="size-3.5" />{when(gig.startsAt)}</span>
        <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{hours(gig.durationHours)}</span>
      </div>
      <div className="mt-4 flex items-center justify-between border-t pt-3">
        <span className="flex items-center gap-2 text-sm">
          <UserAvatar name={gig.employer.name} className="size-6" />
          {gig.employer.name}
        </span>
        <span className="text-xs text-muted-foreground">Posted {ago(gig.createdAt)}</span>
      </div>
    </Link>
  );
}
