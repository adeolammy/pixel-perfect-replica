import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ExternalLink, Check, FileText, Download, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { downloadText, markApplied, requestApply, scoreTone, slugify, type Job } from "@/lib/jobs";


export function ScorePill({ score }: { score: number | null }) {
  const tone = scoreTone(score);
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
        tone === "high" && "bg-success text-success-foreground",
        tone === "mid" && "bg-warning text-warning-foreground",
        tone === "low" && "bg-muted text-muted-foreground",
      )}
    >
      {score ?? 0}
    </span>
  );
}

export function ScoreDot({ score }: { score: number | null }) {
  const tone = scoreTone(score);
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2 rounded-full",
        tone === "high" && "bg-success",
        tone === "mid" && "bg-warning",
        tone === "low" && "bg-muted-foreground/40",
      )}
    />
  );
}

function Chips({ items, tone }: { items: string[] | null; tone: "match" | "miss" }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={cn(
            "rounded-md border px-2 py-0.5 text-xs",
            tone === "match"
              ? "border-success/30 bg-success/10 text-success"
              : "border-destructive/25 bg-destructive/5 text-muted-foreground",
          )}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function DocBlock({
  label,
  text,
  filename,
}: {
  label: string;
  text: string;
  filename: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium"
        >
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          {label}
        </button>
        <Button size="sm" variant="outline" onClick={() => downloadText(filename, text)}>
          <Download className="size-3.5" /> Download
        </Button>
      </div>
      {open && (
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap border-t bg-muted/40 px-3 py-3 text-xs leading-relaxed">
          {text}
        </pre>
      )}
    </div>
  );
}

export function JobCard({ job, defaultOpen = false }: { job: Job; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const queryClient = useQueryClient();

  const apply = useMutation({
    mutationFn: () => markApplied(job.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Marked as applied");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const queueApply = useMutation({
    mutationFn: () => requestApply(job.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Queued — the local assistant will open this application shortly");
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const hasDocs = Boolean(job.tailored_cv_markdown);
  const slug = slugify(`${job.title}-${job.company ?? ""}`) || "job";

  return (
    <article className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <ChevronDown
          className={cn("mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">
            {job.title}
            {job.company ? <span className="font-normal text-muted-foreground"> — {job.company}</span> : null}
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {[job.source, job.location, job.salary].filter(Boolean).join(" · ") || "No details"}
          </p>
        </div>
        {job.applied ? (
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">Applied</span>
        ) : null}
        <ScorePill score={job.match_score} />
      </button>

      {open && (
        <div className="space-y-4 border-t px-4 py-4">
          {job.matched_requirements?.length ? (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Matched requirements</p>
              <Chips items={job.matched_requirements} tone="match" />
            </div>
          ) : null}

          {job.missing_requirements?.length ? (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Missing requirements</p>
              <Chips items={job.missing_requirements} tone="miss" />
            </div>
          ) : null}

          {job.description ? (
            <p className="line-clamp-6 whitespace-pre-wrap text-sm text-muted-foreground">{job.description}</p>
          ) : null}

          <Separator />

          {hasDocs ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-success">✅ Documents ready</p>
              <DocBlock
                label="Tailored CV"
                text={job.tailored_cv_markdown!}
                filename={`cv-${slug}.md`}
              />
              {job.cover_letter_text ? (
                <DocBlock
                  label="Cover letter"
                  text={job.cover_letter_text}
                  filename={`cover-letter-${slug}.txt`}
                />
              ) : null}
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Run the local generator, then refresh.")}
            >
              <FileText className="size-3.5" /> Generate CV &amp; Cover Letter
            </Button>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {job.url ? (
              <Button asChild size="sm" variant="secondary">
                <a href={job.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" /> View Original Job
                </a>
              </Button>
            ) : null}
            <Button
              size="sm"
              disabled={Boolean(job.applied) || apply.isPending}
              onClick={() => apply.mutate()}
            >
              <Check className="size-3.5" />
              {job.applied ? "Applied" : "Mark as Applied"}
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
