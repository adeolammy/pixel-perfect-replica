import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpDown, LogOut, RefreshCw, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgeBadge, JobCard, ScoreDot } from "@/components/JobCard";
import { LocalBridgeToolbar } from "@/components/LocalBridgeToolbar";
import { jobsQuery, type Job } from "@/lib/jobs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Glasgow Job Dashboard — Data Analyst & Housing Roles" },
      {
        name: "description",
        content:
          "Personal job-search dashboard: review scored Data Analyst and Housing roles in Glasgow, read tailored CVs and cover letters, and track applications.",
      },
      { property: "og:title", content: "Glasgow Job Dashboard" },
      {
        property: "og:description",
        content:
          "Review scored job matches, tailored CVs and cover letters, and track which roles you've applied to.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span aria-hidden className={cn("size-1.5 rounded-full", tone)} />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
        <p className="font-mono text-xl font-medium tabular-nums">{value}</p>
      </div>
    </div>
  );
}

const SOURCES = ["myjobscotland", "Civil Service", "Reed", "LinkedIn", "Indeed", "S1jobs", "Manual"] as const;

function matchesSource(job: Job, source: string | null) {
  if (!source) return true;
  return (job.source ?? "").toLowerCase().replace(/\s+/g, "").includes(source.toLowerCase().replace(/\s+/g, ""));
}

function SourceRibbon({
  jobs,
  value,
  onChange,
}: {
  jobs: Job[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const chip = (label: string, active: boolean, count: number, onClick: () => void) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
        active
          ? "border-primary/50 bg-primary/15 text-foreground"
          : "border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground",
      )}
    >
      {label}
      <span className="font-mono text-[10px] tabular-nums opacity-70">{count}</span>
    </button>
  );
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {chip("All sources", value === null, jobs.length, () => onChange(null))}
      {SOURCES.map((s) =>
        chip(s, value === s, jobs.filter((j) => matchesSource(j, s)).length, () => onChange(value === s ? null : s)),
      )}
    </div>
  );
}

type SortKey = "title" | "company" | "source" | "match_score" | "collected_at" | "closing_date" | "applied";

function AllJobsTable({ jobs, filter }: { jobs: Job[]; filter: string }) {
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: "match_score", asc: false });
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const filtered = jobs.filter((j) =>
      !q ? true : [j.title, j.company, j.source, j.location].some((v) => v?.toLowerCase().includes(q)),
    );
    return [...filtered].sort((a, b) => {
      if (sort.key === "closing_date" && !a.closing_date !== !b.closing_date) return a.closing_date ? -1 : 1;
      const av = a[sort.key] ?? "";
      const bv = b[sort.key] ?? "";
      const cmp =
        typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sort.asc ? cmp : -cmp;
    });
  }, [jobs, filter, sort]);

  const openJob = jobs.find((j) => j.id === openId) ?? null;

  const header = (key: SortKey, label: string, className?: string) => (
    <th className={cn("px-3 py-2 text-left font-normal", className)}>
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-foreground"
        onClick={() => setSort((s) => ({ key, asc: s.key === key ? !s.asc : false }))}
      >
        {label}
        <ArrowUpDown className={cn("size-3", sort.key === key ? "opacity-100" : "opacity-40")} />
      </button>
    </th>
  );

  return (
    <>
      <div className="overflow-x-auto rounded-lg border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              {header("title", "Role")}
              {header("company", "Company")}
              {header("source", "Source")}
              {header("match_score", "Score")}
              {header("closing_date", "Closes")}
              {header("collected_at", "Added")}
              {header("applied", "Status")}
            </tr>
          </thead>
          <tbody>
            {rows.map((job) => (
              <tr
                key={job.id}
                onClick={() => setOpenId(job.id)}
                className="cursor-pointer border-t border-border/60 transition-colors first:border-t-0 hover:bg-accent/40"
              >
                <td className="max-w-[18rem] truncate px-3 py-2.5 font-medium">{job.title}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{job.company ?? "—"}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{job.source ?? "—"}</td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-2 font-mono text-xs tabular-nums">
                    <ScoreDot score={job.match_score} />
                    {job.match_score ?? "—"}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  {job.closing_date ? <ClosingBadge closingDate={job.closing_date} /> : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-3 py-2.5">
                  <AgeBadge collectedAt={job.collected_at} applied={!!job.applied} />
                </td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      aria-hidden
                      className={cn("size-1.5 rounded-full", job.applied ? "bg-success" : "bg-muted-foreground/50")}
                    />
                    {job.applied ? "Applied" : "Open"}
                  </span>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No jobs match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={openJob !== null} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{openJob?.title ?? "Job"}</SheetTitle>
            <SheetDescription>{openJob?.company ?? "Job details"}</SheetDescription>
          </SheetHeader>
          {openJob ? (
            <div className="px-4 pb-6">
              <JobCard key={openJob.id} job={openJob} defaultOpen />
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

function SignOutButton() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await queryClient.cancelQueries();
        queryClient.clear();
        await supabase.auth.signOut();
        navigate({ to: "/auth", replace: true });
      }}
    >
      <LogOut className="size-3.5" /> Sign out
    </Button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function Dashboard() {
  const { data: jobs = [], isLoading, isError, error, refetch, isFetching } = useQuery(jobsQuery);
  const [source, setSource] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const visible = jobs.filter((j) => matchesSource(j, source));
  const recommended = visible.filter((j) => j.recommended && !j.applied);
  const applied = visible
    .filter((j) => j.applied)
    .sort((a, b) => (b.applied_at ?? "").localeCompare(a.applied_at ?? ""));
  const queued = jobs.filter((j) => j.apply_requested && !j.applied).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-md border bg-surface font-mono text-xs text-primary">
              GJ
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-tight">Glasgow Job Command Center</h1>
              <p className="truncate font-mono text-[11px] text-muted-foreground">data analyst · housing · glasgow</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <section className="grid grid-cols-2 divide-border overflow-hidden rounded-lg border bg-surface sm:grid-cols-4 sm:divide-x">
          <Stat label="Total" value={jobs.length} tone="bg-info" />
          <Stat label="Recommended" value={jobs.filter((j) => j.recommended && !j.applied).length} tone="bg-primary" />
          <Stat label="Queued" value={queued} tone="bg-warning" />
          <Stat label="Applied" value={jobs.filter((j) => j.applied).length} tone="bg-success" />
        </section>

        {isError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Couldn't load jobs: {(error as Error).message}
          </p>
        ) : isLoading ? (
          <p className="font-mono text-xs text-muted-foreground">Loading jobs…</p>
        ) : (
          <Tabs defaultValue="overview" className="gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="recommended">
                  Recommended <span className="font-mono text-[10px] opacity-70">{recommended.length}</span>
                </TabsTrigger>
                <TabsTrigger value="applied">
                  Applied <span className="font-mono text-[10px] opacity-70">{applied.length}</span>
                </TabsTrigger>
                <TabsTrigger value="all">All Jobs</TabsTrigger>
              </TabsList>
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter by title, company, source or location…"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>

            <SourceRibbon jobs={jobs} value={source} onChange={setSource} />

            <TabsContent value="overview" className="space-y-4">
              <div className="rounded-lg border bg-surface p-4">
                <p className="mb-3 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Local assistant</p>
                <LocalBridgeToolbar />
              </div>
              {!jobs.length && <Empty>No jobs yet. Run the local collector script, then refresh.</Empty>}
            </TabsContent>

            <TabsContent value="recommended" className="space-y-2">
              {recommended.length ? (
                recommended.map((job) => <JobCard key={job.id} job={job} />)
              ) : (
                <Empty>No recommended jobs yet.</Empty>
              )}
            </TabsContent>

            <TabsContent value="applied" className="space-y-2">
              {applied.length ? (
                applied.map((job) => <JobCard key={job.id} job={job} />)
              ) : (
                <Empty>No applied jobs yet. Jobs you mark as applied will appear here.</Empty>
              )}
            </TabsContent>

            <TabsContent value="all">
              <AllJobsTable jobs={visible} filter={filter} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
