import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/gigs" });
  },
  head: () => ({
    meta: [
      { title: "Work — Find local small gigs" },
      { name: "description", content: "Short, in-person jobs near you at fixed prices." },
      { property: "og:title", content: "Work — Find local small gigs" },
      { property: "og:description", content: "Short, in-person jobs near you at fixed prices." },
    ],
  }),
});
