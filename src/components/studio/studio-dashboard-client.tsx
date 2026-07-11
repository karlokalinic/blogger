"use client";

import { Check, Circle, MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import type { ProjectTask } from "@/lib/types";

export function StudioDashboardClient({ tasks }: { tasks: ProjectTask[] }) {
  const focusTasks = tasks.filter((task) => task.state === "active").slice(0, 3);
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try { setDone(JSON.parse(window.localStorage.getItem("veo-done-today") || "[]")); } catch { setDone([]); }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggle = (id: string) => {
    const next = done.includes(id) ? done.filter((item) => item !== id) : [...done, id];
    setDone(next);
    window.localStorage.setItem("veo-done-today", JSON.stringify(next));
  };

  return (
    <div className="focus-list">
      {focusTasks.map((task) => (
        <div className={done.includes(task.id) ? "focus-item done" : "focus-item"} key={task.id}>
          <button onClick={() => toggle(task.id)} aria-label={done.includes(task.id) ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}>
            {done.includes(task.id) ? <Check size={14} /> : <Circle size={14} />}
          </button>
          <div><strong>{task.title}</strong><span>{task.area} / +{task.xp} signal XP</span></div>
          <span className={`area-badge area-${task.area.toLowerCase()}`}>{task.area}</span>
          <button className="task-more" aria-label={`More options for ${task.title}`}><MoreHorizontal size={15} /></button>
        </div>
      ))}
      <div className="focus-complete"><span>{done.length} / {focusTasks.length} received today</span><div><i style={{ width: `${Math.min(100, done.length / focusTasks.length * 100)}%` }} /></div></div>
    </div>
  );
}
