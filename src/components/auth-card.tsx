import type { ReactNode } from "react";
import { Logo } from "./common";

export function AuthCard({ title, sub, children, footer }: { title: string; sub?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="mx-auto max-w-md py-4">
      <div className="mb-6 flex justify-center"><Logo /></div>
      <div className="surface p-6 sm:p-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-4 text-center text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}

export function FieldError({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return <p id={id} role="alert" className="text-xs font-medium text-destructive">{msg}</p>;
}
