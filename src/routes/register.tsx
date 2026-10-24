import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard, FieldError } from "@/components/auth-card";
import { authApi } from "@/lib/api";
import { errorMessage } from "@/lib/api/errors";
import { registerSchema } from "@/lib/validation/schemas";
import { meKey } from "@/features/auth";

export const Route = createFileRoute("/register")({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  head: () => ({
    meta: [
      { title: "Create your account — Work" },
      { name: "description", content: "One account to post gigs and to work on them." },
      { property: "og:title", content: "Create your account — Work" },
      { property: "og:description", content: "Join Work to hire or earn locally." },
    ],
  }),
  component: RegisterPage,
});

type V = z.input<typeof registerSchema>;

function RegisterPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const form = useForm<V>({ resolver: zodResolver(registerSchema), defaultValues: { name: "", email: "", password: "", confirm: "", terms: false as unknown as true } });
  const m = useMutation({
    mutationFn: (v: V) => authApi.register({ name: v.name, email: v.email, password: v.password }),
    onSuccess: (me) => { qc.clear(); qc.setQueryData(meKey, me); navigate({ to: "/onboarding", search: { redirect } }); },
  });
  const err = form.formState.errors;
  const field = (name: "name" | "email" | "password" | "confirm", label: string, type = "text", ac?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type={type} autoComplete={ac} aria-invalid={!!err[name]} aria-describedby={`${name}-err`} {...form.register(name)} />
      <FieldError id={`${name}-err`} msg={err[name]?.message} />
    </div>
  );
  return (
    <AuthCard title="Create your account" sub="Post gigs and work on them with the same account." footer={<>Already a member? <Link to="/login" search={{ redirect }} className="font-medium text-primary">Sign in</Link></>}>
      <form className="space-y-4" noValidate onSubmit={form.handleSubmit((v) => m.mutate(v))}>
        {field("name", "Full name", "text", "name")}
        {field("email", "Email", "email", "email")}
        {field("password", "Password", "password", "new-password")}
        {field("confirm", "Confirm password", "password", "new-password")}
        <div className="space-y-1.5">
          <div className="flex items-start gap-2">
            <Controller control={form.control} name="terms" render={({ field: f }) => <Checkbox id="terms" checked={!!f.value} onCheckedChange={(c) => f.onChange(c === true)} aria-describedby="terms-err" />} />
            <Label htmlFor="terms" className="text-sm font-normal leading-snug">I accept the Terms of Service and Privacy Policy.</Label>
          </div>
          <FieldError id="terms-err" msg={err.terms?.message} />
        </div>
        {m.isError && <p role="alert" className="rounded-md bg-danger-soft p-3 text-sm text-destructive">{errorMessage(m.error)}</p>}
        <Button type="submit" className="h-11 w-full" disabled={m.isPending}>{m.isPending ? "Creating account…" : "Create account"}</Button>
      </form>
    </AuthCard>
  );
}
