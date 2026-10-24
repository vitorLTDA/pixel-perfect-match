import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Briefcase, LayoutDashboard, LogOut, MessageSquare, Plus, Search, Settings, Shield, User, WifiOff } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo, UserAvatar } from "@/components/common";
import { useLogout, useMe } from "@/features/auth";
import { notificationsApi } from "@/lib/api";
import { API_MODE } from "@/lib/api/client";

function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const up = () => setOnline(navigator.onLine);
    up();
    window.addEventListener("online", up);
    window.addEventListener("offline", up);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", up); };
  }, []);
  return online;
}

const navCls = "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground";
const activeCls = { className: "rounded-md px-3 py-2 text-sm font-medium bg-secondary text-foreground" };

export function AppShell({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const online = useOnline();
  const { data: notes } = useQuery({ queryKey: ["notifications"], queryFn: notificationsApi.list, enabled: !!me, refetchInterval: 20_000 });
  const unread = notes?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="flex min-h-screen flex-col">
      {API_MODE === "mock" && (
        <div className="bg-accent px-4 py-1.5 text-center text-xs text-accent-foreground">
          Demo mode — sample data lives only in this tab and resets when you reload.
        </div>
      )}
      {!online && (
        <div role="status" className="flex items-center justify-center gap-2 bg-warning-soft px-4 py-1.5 text-xs text-warning">
          <WifiOff className="size-3.5" /> You're offline. Actions won't be sent until you reconnect.
        </div>
      )}
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <Logo />
          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Main">
            <Link to="/gigs" className={navCls} activeProps={activeCls}>Browse gigs</Link>
            {me && <Link to="/dashboard" className={navCls} activeProps={activeCls}>My activity</Link>}
            {me && <Link to="/my-gigs" className={navCls} activeProps={activeCls}>My gigs</Link>}
            {me && <Link to="/messages" className={navCls} activeProps={activeCls}>Messages</Link>}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <Button asChild size="sm" className="hidden sm:inline-flex"><Link to="/gigs/new"><Plus /> Post a gig</Link></Button>
            {me ? (
              <>
                <Button asChild variant="ghost" size="icon" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
                  <Link to="/notifications" className="relative">
                    <Bell />
                    {unread > 0 && <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{unread}</span>}
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger className="rounded-full" aria-label="Profile menu"><UserAvatar name={me.name} className="size-8" /></DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel className="truncate">{me.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => navigate({ to: "/users/$userId", params: { userId: me.id } })}><User /> Public profile</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate({ to: "/settings/profile" })}><Settings /> Edit profile</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate({ to: "/my-applications" })}><Briefcase /> My applications</DropdownMenuItem>
                    {me.isAdmin && <DropdownMenuItem onSelect={() => navigate({ to: "/admin" })}><Shield /> Moderation</DropdownMenuItem>}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => logout.mutate(undefined, { onSuccess: () => navigate({ to: "/gigs" }) })}><LogOut /> Sign out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm"><Link to="/login">Sign in</Link></Button>
                <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex"><Link to="/register">Join</Link></Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 md:pb-12">{children}</main>
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background md:hidden">
        {[
          { to: "/gigs", icon: Search, label: "Browse" },
          { to: "/dashboard", icon: LayoutDashboard, label: "Activity" },
          { to: "/gigs/new", icon: Plus, label: "Post" },
          { to: "/messages", icon: MessageSquare, label: "Messages" },
          { to: "/my-gigs", icon: Briefcase, label: "My gigs" },
        ].map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground" activeProps={{ className: "flex flex-col items-center gap-0.5 py-2 text-[11px] text-primary font-semibold" }} activeOptions={{ exact: true }}>
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
