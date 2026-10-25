import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/auth-gate";
import { PageHeader } from "@/components/common";
import { GigForm } from "@/components/gigs/gig-form";
import type { Gig } from "@/types";

export const Route = createFileRoute("/gigs/new")({
  head: () => ({
    meta: [
      { title: "Post a gig — Work" },
      { name: "description", content: "Describe a short local job, set a fixed price and get applicants." },
      { property: "og:title", content: "Post a gig — Work" },
      { property: "og:description", content: "Post a short local job on Work." },
    ],
  }),
  component: NewGig,
});

function NewGig() {
  const [done, setDone] = useState<{ gig: Gig; published: boolean } | null>(null);
  return (
    <div className="mx-auto max-w-2xl">
      <RequireAuth>
        {() => done ? (
          <div className="surface flex flex-col items-center p-10 text-center">
            <CheckCircle2 className="size-12 text-primary" />
            <h1 className="mt-3 text-2xl font-bold">{done.published ? "Your gig is live!" : "Draft saved"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{done.published ? "We'll notify you when people apply." : "Publish it whenever you're ready."}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button asChild><Link to="/gigs/$gigId" params={{ gigId: done.gig.id }}>View gig</Link></Button>
              <Button asChild variant="outline"><Link to="/my-gigs">Go to my gigs</Link></Button>
            </div>
          </div>
        ) : (
          <>
            <PageHeader title="Post a gig" sub="Personal or business — same account." />
            <GigForm onSaved={(gig, published) => setDone({ gig, published })} />
          </>
        )}
      </RequireAuth>
    </div>
  );
}
