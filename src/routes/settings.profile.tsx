import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/auth-gate";
import { PageHeader } from "@/components/common";
import { ProfileForm } from "@/components/profiles/profile-form";

export const Route = createFileRoute("/settings/profile")({
  head: () => ({
    meta: [
      { title: "Edit profile — Work" },
      { name: "description", content: "Update your Work profile." },
      { property: "og:title", content: "Edit profile — Work" },
      { property: "og:description", content: "Update your Work profile." },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Edit profile" sub="Your email and phone are never shown publicly." />
      <RequireAuth>{(me) => <div className="surface p-6"><ProfileForm me={me} submitLabel="Save changes" /></div>}</RequireAuth>
    </div>
  ),
});
