import { Fragment, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobCard, ScoreDot } from "@/components/JobCard";
import { jobsQuery, type Job } from "@/lib/jobs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
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
    ],
  }),
  component: Dashboard,
});

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

type SortKey = "title" | "company" | "source" | "match_score" | "applied";

function AllJobsTable({ jobs }: { jobs: Job[] }) {
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: "match_score", asc: false });
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const filtered = jobs.filter((j) =>
      !q
        ? true
        : [j.title, j.company, j.source, j.location].some((v) => v?.toLowerCase().includes(q)),
    );
    return [...filtered].sort((a, b) => {
      const av = a[sort.key] ?? "";
      const bv = b[sort.key] ?? "";
      const cmp = typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sort.asc ? cmp : -cmp;
    });
  }, [jobs, filter, sort]);

  const header = (key: SortKey, label: string, className?: string) => (
    <th className={cn("px-3 py-2 text-left font-medium", className)}>
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-foreground"
        onClick={() => setSort((s) => ({ key, asc: s.key === key ? !s.asc : false }))}
      >
        {label}
        <ArrowUpDown className="size-3" />
      </button>
    </th>
  );

  return (
    <div className="space-y-3">
      <Input
        placeholder="Filter by title, company, source or location…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-sm"
      />
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              {header("title", "Title")}
              {header("company", "Company")}
              {header("source", "Source")}
              {header("match_score", "Score")}
              {header("applied", "Applied")}
            </tr>
          </thead>
          <tbody>
            {rows.map((job) => (
              <Fragment key={job.id}>
                <tr
                  onClick={() => setOpenId((id) => (id === job.id ? null : job.id))}
                  className="cursor-pointer border-t hover:bg-muted/40"
                >
                  <td className="px-3 py-2">{job.title}</td>
                  <td className="px-3 py-2 text-muted-foreground">{job.company ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{job.source ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-2 tabular-nums">
                      <ScoreDot score={job.match_score} />
                      {job.match_score ?? 0}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{job.applied ? "Yes" : "No"}</td>
                </tr>
                {openId === job.id && (
                  <tr className="border-t bg-muted/20">
                    <td colSpan={5} className="p-3">
                      <JobCard job={job} defaultOpen />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!rows.length && (
              <tr className="border-t">
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  No jobs match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Dashboard() {
  const { data: jobs = [], isLoading, isError, error, refetch, isFetching } = useQuery(jobsQuery);

  const recommended = jobs.filter((j) => j.recommended);
  const applied = jobs.filter((j) => j.applied);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Job Application Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Data Analyst &amp; Housing roles · Glasgow
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} /> Refresh
        </Button>
      </header>

      {isError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Couldn't load jobs: {(error as Error).message}
        </p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading jobs…</p>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
            <TabsTrigger value="all">All Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Total Jobs" value={jobs.length} />
              <Stat label="Recommended" value={recommended.length} />
              <Stat label="Applied" value={applied.length} />
            </div>
            {!jobs.length && (
              <p className="mt-6 text-sm text-muted-foreground">
                No jobs yet. Run the local collector script, then refresh.
              </p>
            )}
          </TabsContent>

          <TabsContent value="recommended" className="mt-4 space-y-3">
            {recommended.length ? (
              recommended.map((job) => <JobCard key={job.id} job={job} />)
            ) : (
              <p className="text-sm text-muted-foreground">No recommended jobs yet.</p>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <AllJobsTable jobs={jobs} />
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}
