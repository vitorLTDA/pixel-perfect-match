import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { MailCheck } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard, FieldError } from "@/components/auth-card";
import { authApi } from "@/lib/api";
import { errorMessage } from "@/lib/api/errors";
import { forgotSchema } from "@/lib/validation/schemas";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Work" },
      { name: "description", content: "Get a link to reset your Work password." },
      { property: "og:title", content: "Reset your password — Work" },
      { property: "og:description", content: "Reset your Work password." },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const form = useForm<z.infer<typeof forgotSchema>>({ resolver: zodResolver(forgotSchema), defaultValues: { email: "" } });
  const m = useMutation({ mutationFn: (v: { email: string }) => authApi.forgotPassword(v.email) });
  if (m.isSuccess)
    return (
      <AuthCard title="Check your inbox" footer={<Link to="/login" className="font-medium text-primary">Back to sign in</Link>}>
        <div className="flex gap-3 text-sm text-muted-foreground"><MailCheck className="size-5 shrink-0 text-primary" />If an account exists for that email, we've sent a reset link.</div>
      </AuthCard>
    );
  return (
    <AuthCard title="Forgot your password?" sub="We'll email you a reset link." footer={<Link to="/login" className="font-medium text-primary">Back to sign in</Link>}>
      <form className="space-y-4" noValidate onSubmit={form.handleSubmit((v) => m.mutate(v))}>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" aria-describedby="email-err" {...form.register("email")} />
          <FieldError id="email-err" msg={form.formState.errors.email?.message} />
        </div>
        {m.isError && <p role="alert" className="text-sm text-destructive">{errorMessage(m.error)}</p>}
        <Button type="submit" className="h-11 w-full" disabled={m.isPending}>{m.isPending ? "Sending…" : "Send reset link"}</Button>
      </form>
    </AuthCard>
  );
}
