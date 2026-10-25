import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, MapPin } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/auth-card";
import { Chip } from "@/components/common";
import { gigsApi } from "@/lib/api";
import { errorMessage } from "@/lib/api/errors";
import { hours, money, when } from "@/lib/format";
import { gigSchema, type GigFormValues } from "@/lib/validation/schemas";
import { CATEGORIES, type Gig } from "@/types";

export function GigForm({ initial, gigId, onSaved }: { initial?: Partial<GigFormValues>; gigId?: string; onSaved: (g: Gig, published: boolean) => void }) {
  const qc = useQueryClient();
  const [preview, setPreview] = useState<GigFormValues | null>(null);
  const form = useForm<GigFormValues>({
    resolver: zodResolver(gigSchema),
    defaultValues: { title: "", description: "", type: "personal", durationHours: 2, date: "", time: "", city: "", area: "", street: "", complement: "", ...initial } as GigFormValues,
  });
  const m = useMutation({
    mutationFn: ({ v, publish }: { v: GigFormValues; publish: boolean }) => {
      const { date, time, ...rest } = v;
      const body = { ...rest, startsAt: new Date(`${date}T${time}`).toISOString(), publish };
      return gigId ? gigsApi.update(gigId, body) : gigsApi.create(body);
    },
    onSuccess: (g, { publish }) => { qc.invalidateQueries({ queryKey: ["gigs"] }); qc.invalidateQueries({ queryKey: ["my-gigs"] }); qc.invalidateQueries({ queryKey: ["gig", g.id] }); onSaved(g, publish); },
  });
  const err = form.formState.errors;
  const f = (name: keyof GigFormValues, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} aria-invalid={!!err[name]} aria-describedby={`${name}-e`} {...props} {...form.register(name)} />
      <FieldError id={`${name}-e`} msg={err[name]?.message} />
    </div>
  );

  if (preview)
    return (
      <div className="space-y-4">
        <div className="surface p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview — what workers will see</p>
          <div className="mb-2 flex gap-1.5"><Chip>{preview.category}</Chip><Chip>{preview.type === "business" ? "Business" : "Personal"}</Chip></div>
          <h2 className="text-xl font-bold">{preview.title}</h2>
          <p className="mt-2 whitespace-pre-line text-sm">{preview.description}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <strong className="text-primary">{money(Number(preview.price))}</strong>
            <span>{hours(Number(preview.durationHours))}</span>
            <span>{when(new Date(`${preview.date}T${preview.time}`).toISOString())}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{preview.area}, {preview.city}</span>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-xl bg-accent p-4 text-sm text-accent-foreground"><Lock className="mt-0.5 size-4" />Private, shown only to the worker you select: {preview.street}{preview.complement ? ` · ${preview.complement}` : ""}</div>
        {m.isError && <p role="alert" className="rounded-md bg-danger-soft p-3 text-sm text-destructive">{errorMessage(m.error)}</p>}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => setPreview(null)} disabled={m.isPending}>Back to edit</Button>
          <Button variant="secondary" onClick={() => m.mutate({ v: preview, publish: false })} disabled={m.isPending}>Save as draft</Button>
          <Button className="sm:ml-auto" onClick={() => m.mutate({ v: preview, publish: true })} disabled={m.isPending}>{m.isPending ? "Publishing…" : "Publish gig"}</Button>
        </div>
      </div>
    );

  return (
    <form noValidate className="space-y-6" onSubmit={form.handleSubmit((v) => setPreview(v))}>
      <section className="surface space-y-4 p-5">
        <h2 className="font-semibold">1. The job</h2>
        {f("title", "Title", { placeholder: "e.g. Help carry a sofa upstairs" })}
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={5} aria-describedby="description-e" {...form.register("description")} />
          <FieldError id="description-e" msg={err.description?.message} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Controller control={form.control} name="category" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="category" aria-describedby="category-e"><SelectValue placeholder="Choose…" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            )} />
            <FieldError id="category-e" msg={err.category?.message} />
          </div>
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">Gig type</legend>
            <Controller control={form.control} name="type" render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4 pt-2">
                <div className="flex items-center gap-2"><RadioGroupItem id="t-p" value="personal" /><Label htmlFor="t-p" className="font-normal">Personal</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem id="t-b" value="business" /><Label htmlFor="t-b" className="font-normal">Business</Label></div>
              </RadioGroup>
            )} />
          </fieldset>
        </div>
      </section>

      <section className="surface space-y-4 p-5">
        <h2 className="font-semibold">2. Price & time</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            {f("price", "Fixed price (€)", { type: "number", inputMode: "decimal", min: 5 })}
            <p className="mt-1 text-xs text-muted-foreground">The total you'll pay for the whole job — not hourly. Workers can't bid.</p>
          </div>
          {f("durationHours", "Estimated duration (hours)", { type: "number", step: 0.5, min: 0.5 })}
          {f("date", "Date", { type: "date" })}
          {f("time", "Start time", { type: "time" })}
        </div>
      </section>

      <section className="surface space-y-4 p-5">
        <h2 className="font-semibold">3. Location</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {f("city", "City (public)")}
          {f("area", "Neighborhood (public)")}
        </div>
        <div className="space-y-4 rounded-lg border border-dashed p-4">
          <p className="flex items-center gap-2 text-sm font-medium"><Lock className="size-4 text-primary" />Private — revealed only to the worker you select</p>
          {f("street", "Street address", { autoComplete: "street-address" })}
          {f("complement", "Apartment, buzzer or access notes (optional)")}
        </div>
      </section>
      <Button type="submit" className="h-11 w-full sm:w-auto">Preview</Button>
    </form>
  );
}
