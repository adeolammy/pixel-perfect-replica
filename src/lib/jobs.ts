import { supabase } from "@/integrations/supabase/client";

export type Job = {
  id: string;
  source: string | null;
  title: string;
  company: string | null;
  location: string | null;
  url: string | null;
  description: string | null;
  salary: string | null;
  closing_date: string | null;
  collected_at: string | null;
  match_score: number | null;
  matched_requirements: string[] | null;
  missing_requirements: string[] | null;
  recommended: boolean | null;
  tailored_cv_markdown: string | null;
  cover_letter_text: string | null;
  applied: boolean | null;
  applied_at: string | null;
  apply_requested: boolean | null;
  apply_requested_at: string | null;
};

export const jobsQuery = {
  queryKey: ["jobs"],
  queryFn: async (): Promise<Job[]> => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("match_score", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Job[];
  },
};

export async function markApplied(id: string) {
  const { error } = await supabase
    .from("jobs")
    .update({ applied: true, applied_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function requestApply(id: string) {
  const { error } = await supabase
    .from("jobs")
    .update({ apply_requested: true, apply_requested_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}


export async function deleteJob(id: string) {
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) throw error;
}

export type NewJob = {
  url: string;
  title: string;
  company: string;
  location: string;
  description: string;
};

export async function addManualJob(job: NewJob) {
  const { error } = await supabase.from("jobs").insert({
    source: "Manual",
    title: job.title,
    company: job.company || null,
    location: job.location || null,
    url: job.url,
    description: job.description,
    salary: null,
    closing_date: null,
    match_score: null,
    matched_requirements: [],
    missing_requirements: [],
    recommended: true,
    applied: false,
    apply_requested: false,
  });
  if (error) {
    if (error.code === "23505") throw new Error("This job is already in your list.");
    throw error;
  }
}

export const BRIDGE_URL = "http://localhost:8765";
export const BRIDGE_OFFLINE_MESSAGE =
  "Local assistant isn't running. Start 4_Start_Local_Bridge.bat on your computer first.";

export type BridgeResponse = { started: boolean; reason?: string };

export async function callBridge(path: string): Promise<BridgeResponse> {
  const res = await fetch(`${BRIDGE_URL}${path}`, { method: "POST" });
  return (await res.json()) as BridgeResponse;
}

export async function bridgeStatus(): Promise<{ running: boolean; task?: string }> {
  const res = await fetch(`${BRIDGE_URL}/status`);
  return (await res.json()) as { running: boolean; task?: string };
}

export function isManual(job: Job) {
  return job.source === "Manual" && job.match_score === null;
}

export function scoreTone(score: number | null): "high" | "mid" | "low" {
  const s = score ?? 0;
  if (s >= 70) return "high";
  if (s >= 50) return "mid";
  return "low";
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
