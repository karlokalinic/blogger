import { ProgressBoard } from "@/components/studio/progress-board";
import { tasks } from "@/lib/content";

export default function ProgressPage() {
  return <ProgressBoard initialTasks={tasks} />;
}
