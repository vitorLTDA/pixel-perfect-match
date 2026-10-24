import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/auth-gate";
import { ProfileForm } from "@/components/profiles/profile-form";

export const Route = createFileRoute("/onboarding")({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  head: () => ({
    meta: [
      { title: "Complete your profile — Work" },
      { name: "description", content: "Tell neighbors a bit about yourself." },
      { property: "og:title", content: "Complete your profile — Work" },
      { property: "og:description", content: "Set up your Work profile." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const go = () => navigate({ to: redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/gigs" });
  return (
    <div className="mx-auto max-w-lg">
      <RequireAuth>
        {(me) => (
          <div className="surface p-6">
            <h1 className="text-2xl font-bold">Welcome, {me.name.split(" ")[0]}!</h1>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">A complete profile helps employers and workers trust you. You can post gigs and apply with the same account.</p>
            <ProfileForm me={me} submitLabel="Save and continue" onDone={go} />
            <Button variant="link" className="mt-2 px-0" onClick={go}>Skip for now</Button>
          </div>
        )}
      </RequireAuth>
    </div>
  );
}
