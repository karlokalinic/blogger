"use client";

import { Check, CircleAlert, CircleDot, GripVertical, LockKeyhole, MoreHorizontal, Plus, RadioTower, Sparkles, Trophy, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ProjectTask } from "@/lib/types";

const columns = [
  ["backlog", "BACKLOG", "Not a promise yet"],
  ["active", "IN SIGNAL", "Work that can move now"],
  ["blocked", "STATIC", "Waiting on a real condition"],
  ["done", "RECEIVED", "Evidence of finished work"],
] as const;

const areaColors: Record<ProjectTask["area"], string> = { Writing: "#b33a32", Art: "#8b7355", Code: "#59736b", Audio: "#666582", Community: "#8a604c" };

export function ProgressBoard({ initialTasks }: { initialTasks: ProjectTask[] }) {
  const [items, setItems] = useState(initialTasks);
  const [dragged, setDragged] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<ProjectTask["state"] | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newArea, setNewArea] = useState<ProjectTask["area"]>("Writing");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const local = JSON.parse(window.localStorage.getItem("veo-progress-board") || "null");
        if (Array.isArray(local) && local.length) setItems(local);
      } catch { /* use project seed */ }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("veo-progress-board", JSON.stringify(items));
  }, [items]);

  const earnedXp = useMemo(() => items.filter((task) => task.state === "done").reduce((total, task) => total + task.xp, 0), [items]);
  const level = Math.floor(earnedXp / 100) + 1;
  const levelProgress = earnedXp % 100;

  const drop = (state: ProjectTask["state"]) => {
    if (!dragged) return;
    setItems((current) => current.map((task) => task.id === dragged ? { ...task, state } : task));
    setDragged(null);
  };

  const addTask = () => {
    if (!addingTo || !newTitle.trim()) return;
    setItems((current) => [...current, { id: crypto.randomUUID(), title: newTitle.trim(), area: newArea, state: addingTo, xp: 25 }]);
    setNewTitle("");
    setAddingTo(null);
  };

  return (
    <main className="progress-page">
      <header className="studio-page-heading progress-heading">
        <div><p>PRODUCTION BOARD / PUBLIC SIGNAL LINKED</p><h1>Make progress leave a mark.</h1><span>Drag a task into Received and the project earns signal. Blocked work earns honesty, not shame.</span></div>
        <button className="studio-primary-button" onClick={() => setAddingTo("backlog")}><Plus size={14} /> Add task</button>
      </header>

      <section className="gamification-strip">
        <div className="level-badge"><RadioTower size={20} /><div><span>SIGNAL LEVEL</span><strong>{String(level).padStart(2, "0")}</strong></div></div>
        <div className="xp-progress"><div><span>{earnedXp} SIGNAL XP</span><strong>{100 - levelProgress} TO NEXT TRANSMISSION</strong></div><div><i style={{ width: `${levelProgress}%` }} /></div></div>
        <div className="next-unlock"><LockKeyhole size={17} /><div><span>NEXT PUBLIC UNLOCK</span><strong>Branimir / voice fragment 02</strong></div></div>
        <div className="streak"><Trophy size={18} /><div><span>STEADY SIGNAL</span><strong>4 useful days</strong></div></div>
      </section>

      <div className="kanban-board">
        {columns.map(([state, label, description]) => {
          const tasks = items.filter((task) => task.state === state);
          return (
            <section className={`kanban-column column-${state}`} key={state} onDragOver={(event) => event.preventDefault()} onDrop={() => drop(state)}>
              <header><div><span>{state === "done" ? <Check size={13} /> : state === "blocked" ? <CircleAlert size={13} /> : <CircleDot size={13} />}{label}</span><strong>{tasks.length}</strong></div><p>{description}</p></header>
              <div className="kanban-list">
                {tasks.map((task) => (
                  <article className="kanban-card" draggable onDragStart={() => setDragged(task.id)} key={task.id}>
                    <div className="card-grip"><GripVertical size={14} /><button><MoreHorizontal size={14} /></button></div>
                    <span className="task-area" style={{ color: areaColors[task.area] }}><i style={{ background: areaColors[task.area] }} />{task.area}</span>
                    <h3>{task.title}</h3>
                    <footer><span>+{task.xp} XP</span>{state === "blocked" ? <i>Needs condition</i> : state === "done" ? <i className="task-complete"><Check size={10} /> Complete</i> : <i>VEO-0{task.id.replace(/\D/g, "") || "X"}</i>}</footer>
                  </article>
                ))}
                {addingTo === state ? (
                  <div className="quick-task-form"><div><input autoFocus value={newTitle} onChange={(event) => setNewTitle(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addTask()} placeholder="A task you can recognize as done" /><button onClick={() => setAddingTo(null)}><X size={12} /></button></div><select value={newArea} onChange={(event) => setNewArea(event.target.value as ProjectTask["area"])}>{Object.keys(areaColors).map((area) => <option key={area}>{area}</option>)}</select><button onClick={addTask}>Add to {label.toLowerCase()}</button></div>
                ) : <button className="add-column-task" onClick={() => setAddingTo(state)}><Plus size={13} /> Add task</button>}
              </div>
            </section>
          );
        })}
      </div>

      <section className="character-awareness">
        <div className="awareness-icon"><Sparkles size={18} /></div>
        <div><span>THE WORLD NOTICED</span><p>“The motel has had light for four nights now. Nobody remembers who fixed it.”</p><small>Unlocked by completing: Motel lobby lighting pass</small></div>
        <button>Preview public fragment ↗</button>
      </section>
    </main>
  );
}
