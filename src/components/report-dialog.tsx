import { useMutation } from "@tanstack/react-query";
import { Flag } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { reportsApi } from "@/lib/api";
import { errorMessage } from "@/lib/api/errors";
import type { ReportTarget } from "@/types";

const REASONS = ["Spam or scam", "Unsafe or illegal", "Harassment", "Misleading description", "Inappropriate content", "Other"];

export function ReportDialog({ targetType, targetId, trigger }: { targetType: ReportTarget; targetId: string; trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const m = useMutation({
    mutationFn: () => reportsApi.create({ targetType, targetId, reason, details: details || undefined }),
    onSuccess: () => { toast.success("Report sent. Our team will review it."); setOpen(false); setReason(""); setDetails(""); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button variant="ghost" size="sm"><Flag /> Report</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this {targetType}</DialogTitle>
          <DialogDescription>Reports are confidential and reviewed by moderators.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason"><SelectValue placeholder="Choose a reason" /></SelectTrigger>
              <SelectContent>{REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="details">Details (optional)</Label>
            <Textarea id="details" maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!reason || m.isPending} onClick={() => m.mutate()}>{m.isPending ? "Sending…" : "Send report"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
