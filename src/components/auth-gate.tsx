import { Link, useLocation } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useMe } from "@/features/auth";
import type { Me } from "@/types";
import { Button } from "@/components/ui/button";
import { EmptyState, ListSkeleton } from "./common";

/** UX-only guard. The API independently rejects unauthenticated requests. */
export function RequireAuth({ children, admin }: { children: (me: Me) => ReactNode; admin?: boolean }) {
  const { data: me, isLoading } = useMe();
  const loc = useLocation();
  if (isLoading) return <ListSkeleton />;
  if (!me)
    return (
      <EmptyState
        icon={Lock}
        title="Sign in to continue"
        body="This page is only available to signed-in members."
        action={<Button asChild><Link to="/login" search={{ redirect: loc.href }}>Sign in</Link></Button>}
      />
    );
  if (admin && !me.isAdmin) return <EmptyState icon={Lock} title="Not authorized" body="You don't have access to this area." />;
  return <>{children(me)}</>;
}
