import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import hero from "@/assets/hero-gigs.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/common";
import { GigCard } from "@/components/gigs/gig-card";
import { gigsApi } from "@/lib/api";
import { CATEGORIES, type GigFilters } from "@/types";

const searchSchema = z.object({
  q: z.string().optional().catch(undefined),
  category: z.string().optional().catch(undefined),
  city: z.string().optional().catch(undefined),
  minPrice: z.coerce.number().optional().catch(undefined),
  maxPrice: z.coerce.number().optional().catch(undefined),
  posted: z.enum(["24h", "7d", "30d"]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export const Route = createFileRoute("/gigs/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Browse local gigs — Work" },
      { name: "description", content: "Short, in-person jobs near you: moving, cleaning, gardening and more, at fixed prices." },
      { property: "og:title", content: "Browse local gigs — Work" },
      { property: "og:description", content: "Short, in-person jobs near you at fixed prices." },
    ],
  }),
  component: GigsPage,
});

function Filters({ f, set }: { f: GigFilters; set: (p: Partial<GigFilters>) => void }) {
  const [city, setCity] = useState(f.city ?? "");
  const [minP, setMinP] = useState(f.minPrice?.toString() ?? "");
  const [maxP, setMaxP] = useState(f.maxPrice?.toString() ?? "");
  useEffect(() => { setCity(f.city ?? ""); setMinP(f.minPrice?.toString() ?? ""); setMaxP(f.maxPrice?.toString() ?? ""); }, [f.city, f.minPrice, f.maxPrice]);
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="f-cat">Category</Label>
        <Select value={f.category ?? "all"} onValueChange={(v) => set({ category: v === "all" ? undefined : v })}>
          <SelectTrigger id="f-cat"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="f-city">City or area</Label>
        <Input id="f-city" value={city} placeholder="e.g. Lisbon" onChange={(e) => setCity(e.target.value)} onBlur={() => set({ city: city || undefined })} onKeyDown={(e) => e.key === "Enter" && set({ city: city || undefined })} />
      </div>
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">Fixed price (€)</legend>
        <div className="flex gap-2">
          <Input aria-label="Minimum price" inputMode="numeric" placeholder="Min" value={minP} onChange={(e) => setMinP(e.target.value)} onBlur={() => set({ minPrice: minP ? Number(minP) : undefined })} />
          <Input aria-label="Maximum price" inputMode="numeric" placeholder="Max" value={maxP} onChange={(e) => setMaxP(e.target.value)} onBlur={() => set({ maxPrice: maxP ? Number(maxP) : undefined })} />
        </div>
      </fieldset>
      <div className="space-y-1.5">
        <Label htmlFor="f-posted">Posted</Label>
        <Select value={f.posted ?? "any"} onValueChange={(v) => set({ posted: v === "any" ? undefined : (v as GigFilters["posted"]) })}>
          <SelectTrigger id="f-posted"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any time</SelectItem>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function GigsPage() {
  const f = Route.useSearch();
  const navigate = useNavigate({ from: "/gigs/" });
  const [q, setQ] = useState(f.q ?? "");
  const set = (p: Partial<GigFilters>) => navigate({ search: (prev) => ({ ...prev, ...p, page: p.page ?? undefined }) });
  const query = useQuery({ queryKey: ["gigs", f], queryFn: () => gigsApi.list(f), placeholderData: keepPreviousData });

  const active = [
    f.q && { k: "q", label: `“${f.q}”` },
    f.category && { k: "category", label: f.category },
    f.city && { k: "city", label: f.city },
    f.minPrice !== undefined && { k: "minPrice", label: `≥ €${f.minPrice}` },
    f.maxPrice !== undefined && { k: "maxPrice", label: `≤ €${f.maxPrice}` },
    f.posted && { k: "posted", label: `Last ${f.posted}` },
  ].filter(Boolean) as { k: keyof GigFilters; label: string }[];

  const data = query.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const page = f.page ?? 1;

  return (
    <div>
      <section className="relative mb-6 overflow-hidden rounded-2xl">
        <img src={hero} alt="Two neighbors carrying a dresser up front steps" width={1600} height={800} className="h-48 w-full object-cover sm:h-64" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
          <h1 className="max-w-xl text-2xl font-bold text-background sm:text-4xl">Small jobs, done by people nearby.</h1>
          <p className="mt-1 text-sm text-background/85 sm:text-base">1–3 hour gigs at a fixed price. No bidding, no haggling.</p>
        </div>
      </section>

      <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); set({ q: q || undefined }); }} role="search">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input aria-label="Search gigs" className="h-11 pl-9" placeholder="Search sofa, garden, cleaning…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button type="submit" className="h-11">Search</Button>
        <Sheet>
          <SheetTrigger asChild><Button type="button" variant="outline" className="h-11 lg:hidden" aria-label="Filters"><SlidersHorizontal /></Button></SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto px-4 pb-8">
            <SheetHeader className="px-0"><SheetTitle>Filters</SheetTitle></SheetHeader>
            <Filters f={f} set={set} />
          </SheetContent>
        </Sheet>
      </form>

      {active.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {active.map((a) => (
            <button key={a.k} onClick={() => { if (a.k === "q") setQ(""); set({ [a.k]: undefined }); }} className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground" aria-label={`Remove filter ${a.label}`}>
              {a.label} <X className="size-3" />
            </button>
          ))}
          <Button variant="link" size="sm" onClick={() => { setQ(""); navigate({ search: {} }); }}>Clear all</Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="surface hidden h-fit p-5 lg:block" aria-label="Filters"><Filters f={f} set={set} /></aside>
        <div>
          {query.isLoading ? <ListSkeleton rows={4} /> : query.isError ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : !data?.items.length ? (
            <EmptyState title="No gigs match your filters" body="Try a different area or widen the price range." action={<Button variant="outline" onClick={() => { setQ(""); navigate({ search: {} }); }}>Clear filters</Button>} />
          ) : (
            <>
              <p className="mb-3 text-sm text-muted-foreground">{data.total} open gig{data.total === 1 ? "" : "s"}</p>
              <div className="grid gap-4 md:grid-cols-2">{data.items.map((g) => <GigCard key={g.id} gig={g} />)}</div>
              {pages > 1 && (
                <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Pagination">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => set({ page: page - 1 })}><ChevronLeft /> Prev</Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
                  <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => set({ page: page + 1 })}>Next <ChevronRight /></Button>
                </nav>
              )}
            </>
          )}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Have a job? <Link to="/gigs/new" className="font-medium text-primary underline-offset-4 hover:underline">Post a gig</Link> in two minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
