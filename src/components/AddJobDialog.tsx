import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addManualJob, callBridge } from "@/lib/jobs";

export function AddJobDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ url: "", title: "", company: "", location: "", description: "" });
  const queryClient = useQueryClient();

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addManualJob(form);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setOpen(false);
      setForm({ url: "", title: "", company: "", location: "", description: "" });
      try {
        await callBridge("/generate-docs");
        toast.success("Job added — generating your CV and cover letter now, check back in a moment.");
      } catch {
        toast.success(
          "Job added! Start the local bridge and click 'Generate Documents' to create its CV and cover letter.",
        );
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a job manually</DialogTitle>
          <DialogDescription>It goes straight into Recommended, no scoring needed.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="job-url">Job URL</Label>
            <Input id="job-url" required value={form.url} onChange={set("url")} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="job-title">Job Title</Label>
            <Input id="job-title" required value={form.title} onChange={set("title")} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="job-company">Company</Label>
              <Input id="job-company" value={form.company} onChange={set("company")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-location">Location</Label>
              <Input id="job-location" value={form.location} onChange={set("location")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="job-description">Description</Label>
            <Textarea
              id="job-description"
              required
              rows={8}
              value={form.description}
              onChange={set("description")}
              placeholder="Paste the full job description/requirements from the listing page here."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Adding…" : "Add job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
