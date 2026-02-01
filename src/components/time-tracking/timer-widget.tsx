/**
 * Timer Widget Component
 * Floating timer for tracking time across the app
 */

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Play, Pause, StopCircle, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface RunningTimer {
  id: string;
  project_id: string;
  project_name: string;
  task_id: string | null;
  task_title: string | null;
  start_time: string;
  elapsed_seconds: number;
  description: string | null;
}

export function TimerWidget() {
  const { user } = useAuth();
  const [timer, setTimer] = useState<RunningTimer | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchRunningTimer();
  }, [user]);

  // Update elapsed time every second
  useEffect(() => {
    if (!timer) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const fetchRunningTimer = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc("get_running_timer", {
        p_user_id: user.id,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const runningTimer = data[0];
        setTimer(runningTimer);
        setElapsedSeconds(runningTimer.elapsed_seconds || 0);
      } else {
        setTimer(null);
      }
    } catch (error) {
      console.error("Error fetching running timer:", error);
    }
  };

  const stopTimer = async () => {
    if (!timer) return;

    setStopping(true);
    try {
      const { error } = await supabase
        .from("time_entries")
        .update({
          end_time: new Date().toISOString(),
          is_running: false,
        })
        .eq("id", timer.id);

      if (error) throw error;

      toast.success(`Time tracked: ${formatDuration(elapsedSeconds)}`);
      setTimer(null);
      setElapsedSeconds(0);
    } catch (error) {
      console.error("Error stopping timer:", error);
      toast.error("Failed to stop timer");
    } finally {
      setStopping(false);
    }
  };

  if (!timer) return null;

  return (
    <Card className="fixed bottom-6 right-6 z-50 w-[320px] border-2 shadow-lg">
      <div className="flex items-center justify-between p-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Tracking time</span>
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums">
            {formatDuration(elapsedSeconds)}
          </div>
          <div className="text-sm">
            <p className="font-medium truncate">{timer.project_name}</p>
            {timer.task_title && (
              <p className="text-xs text-muted-foreground truncate">
                {timer.task_title}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={stopTimer}
            disabled={stopping}
            className="h-9"
          >
            {stopping ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <StopCircle className="mr-2 h-4 w-4" />
                Stop
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
