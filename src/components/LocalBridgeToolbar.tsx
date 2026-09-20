import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, PlayCircle, FileText, Search, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AddJobDialog } from "@/components/AddJobDialog";
import { BRIDGE_OFFLINE_MESSAGE, bridgeStatus, callBridge } from "@/lib/jobs";

const ACTIONS = [
  { key: "find", label: "Find New Jobs", path: "/find-jobs", icon: Search },
  { key: "docs", label: "Generate Documents", path: "/generate-docs", icon: FileText },
  { key: "apply", label: "Run Apply Queue", path: "/run-apply-queue", icon: PlayCircle },
] as const;

export function LocalBridgeToolbar() {
  const [pending, setPending] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        const s = await bridgeStatus();
        if (!active) return;
        setRunning(s.running ? s.task ?? "task" : null);
        if (!s.running) queryClient.invalidateQueries({ queryKey: ["jobs"] });
      } catch {
        if (active) setRunning(null);
      }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [queryClient]);

  const run = async (key: string, path: string) => {
    setPending(key);
    try {
      const data = await callBridge(path);
      if (data.started) {
        toast.success("Started — check your local terminal window for progress");
      } else {
        toast.error(data.reason || "Another task is already running.");
      }
    } catch {
      toast.error(BRIDGE_OFFLINE_MESSAGE);
    }
    setTimeout(() => setPending(null), 3000);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map(({ key, label, path, icon: Icon }) => (
          <Button
            key={key}
            size="sm"
            variant="outline"
            disabled={pending !== null || running !== null}
            onClick={() => run(key, path)}
          >
            {pending === key ? <Loader2 className="size-3.5 animate-spin" /> : <Icon className="size-3.5" />}
            {label}
          </Button>
        ))}
        <AddJobDialog
          trigger={
            <Button size="sm">
              <Plus className="size-3.5" /> Add a Job Manually
            </Button>
          }
        />
      </div>
      {running ? (
        <p className="text-xs text-muted-foreground">Currently running: {running}</p>
      ) : null}
    </div>
  );
}
