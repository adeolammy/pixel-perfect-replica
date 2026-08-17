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
