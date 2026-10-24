import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard, FieldError } from "@/components/auth-card";
import { authApi } from "@/lib/api";
import { API_MODE } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { loginSchema } from "@/lib/validation/schemas";
import { meKey } from "@/features/auth";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  head: () => ({
    meta: [
      { title: "Sign in — Work" },
      { name: "description", content: "Sign in to apply for gigs or hire local help." },
      { property: "og:title", content: "Sign in — Work" },
      { property: "og:description", content: "Sign in to Work." },
    ],
  }),
  component: LoginPage,
});

const safeRedirect = (r?: string) => (r && r.startsWith("/") && !r.startsWith("//") ? r : "/gigs");

const DEMO = [
  { label: "Ana · employer", email: "ana@work.demo" },
  { label: "Bruno · worker", email: "bruno@work.demo" },
  { label: "Carla · worker", email: "carla@work.demo" },
  { label: "Moderator", email: "admin@work.demo" },
];

function LoginPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const form = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const m = useMutation({
    mutationFn: authApi.login,
    onSuccess: (me) => { qc.clear(); qc.setQueryData(meKey, me); navigate({ to: safeRedirect(redirect) }); },
  });
  const err = form.formState.errors;
  return (
    <AuthCard title="Welcome back" sub="Sign in to apply, post gigs and message." footer={<>New to Work? <Link to="/register" search={{ redirect }} className="font-medium text-primary">Create an account</Link></>}>
      <form className="space-y-4" noValidate onSubmit={form.handleSubmit((v) => m.mutate(v))}>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!err.email} aria-describedby="email-err" {...form.register("email")} />
          <FieldError id="email-err" msg={err.email?.message} />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between"><Label htmlFor="password">Password</Label><Link to="/forgot-password" className="text-xs text-primary">Forgot?</Link></div>
          <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!err.password} aria-describedby="pw-err" {...form.register("password")} />
          <FieldError id="pw-err" msg={err.password?.message} />
        </div>
        {m.isError && <p role="alert" className="rounded-md bg-danger-soft p-3 text-sm text-destructive">{errorMessage(m.error)}</p>}
        <Button type="submit" className="h-11 w-full" disabled={m.isPending}>{m.isPending ? "Signing in…" : "Sign in"}</Button>
      </form>
      {API_MODE === "mock" && (
        <div className="mt-6 border-t pt-4">
          <p className="mb-2 text-xs text-muted-foreground">Demo accounts (password <code>demo1234</code>):</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO.map((d) => (
              <Button key={d.email} type="button" variant="outline" size="sm" disabled={m.isPending} onClick={() => m.mutate({ email: d.email, password: "demo1234" })}>{d.label}</Button>
            ))}
          </div>
        </div>
      )}
    </AuthCard>
  );
}
