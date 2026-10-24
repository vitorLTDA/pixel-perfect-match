import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/auth-card";
import { UserAvatar } from "@/components/common";
import { usersApi } from "@/lib/api";
import { errorMessage } from "@/lib/api/errors";
import { profileSchema } from "@/lib/validation/schemas";
import { meKey } from "@/features/auth";
import type { Me } from "@/types";

type V = z.infer<typeof profileSchema>;

export function ProfileForm({ me, submitLabel, onDone }: { me: Me; submitLabel: string; onDone?: () => void }) {
  const qc = useQueryClient();
  const form = useForm<V>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: me.name, bio: me.bio, city: me.city, area: me.area, skills: me.skills.join(", "), phone: me.phone ?? "" },
  });
  const m = useMutation({
    mutationFn: (v: V) => usersApi.updateMe({ ...v, skills: v.skills.split(",").map((s) => s.trim()).filter(Boolean) }),
    onSuccess: (u) => { qc.setQueryData(meKey, u); qc.invalidateQueries({ queryKey: ["user", u.id] }); toast.success("Profile saved"); onDone?.(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const err = form.formState.errors;
  return (
    <form className="space-y-4" noValidate onSubmit={form.handleSubmit((v) => m.mutate(v))}>
      <div className="flex items-center gap-4">
        <UserAvatar name={me.name} className="size-16 text-lg" />
        <p className="text-xs text-muted-foreground">Photo uploads will be available once the backend supports file storage.</p>
      </div>
      <div className="space-y-1.5"><Label htmlFor="name">Name</Label><Input id="name" {...form.register("name")} /><FieldError id="n" msg={err.name?.message} /></div>
      <div className="space-y-1.5"><Label htmlFor="bio">Short bio</Label><Textarea id="bio" rows={3} placeholder="What you're good at, what you're looking for…" {...form.register("bio")} /><FieldError id="b" msg={err.bio?.message} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="city">City</Label><Input id="city" {...form.register("city")} /><FieldError id="c" msg={err.city?.message} /></div>
        <div className="space-y-1.5"><Label htmlFor="area">Neighborhood</Label><Input id="area" {...form.register("area")} /><FieldError id="a" msg={err.area?.message} /></div>
      </div>
      <div className="space-y-1.5"><Label htmlFor="skills">Skills (comma separated)</Label><Input id="skills" placeholder="Moving, Cleaning, Gardening" {...form.register("skills")} /></div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone (private, optional)</Label>
        <Input id="phone" type="tel" {...form.register("phone")} />
        <p className="text-xs text-muted-foreground">Never shown on your public profile.</p>
      </div>
      <Button type="submit" className="h-11 w-full sm:w-auto" disabled={m.isPending}>{m.isPending ? "Saving…" : submitLabel}</Button>
    </form>
  );
}
