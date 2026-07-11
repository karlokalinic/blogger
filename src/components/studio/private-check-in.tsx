"use client";

import { ArrowRight, BookOpenText, Check, Clock3, HeartHandshake, Lock, RefreshCcw, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

const needs = [
  ["reflect", "Say it back clearly", "Separate what happened from what it made you conclude."],
  ["next", "Make ten minutes smaller", "Choose one action that does not need to solve the whole situation."],
  ["sort", "Sort fact from fear", "Keep uncertainty without calling it evidence."],
  ["write", "Turn it into a private log", "Keep the experience without forcing a lesson from it."],
] as const;

export function PrivateCheckIn() {
  const [text, setText] = useState("");
  const [need, setNeed] = useState<(typeof needs)[number][0]>("reflect");
  const [response, setResponse] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const wordCount = useMemo(() => text.trim() ? text.trim().split(/\s+/).length : 0, [text]);

  const respond = () => {
    const clean = text.trim();
    if (!clean) return;
    const firstSentence = clean.split(/[.!?](?:\s|$)/)[0].trim();
    const possibleFacts = clean.split(/[.!?](?:\s|$)/).map((item) => item.trim()).filter(Boolean).filter((item) => !/\b(always|never|everyone|nobody|must|ruined|hopeless)\b/i.test(item)).slice(0, 2);
    const output: Record<string, string[]> = {
      reflect: [
        `The clearest event in what you wrote is: “${firstSentence}${/[.!?]$/.test(firstSentence) ? "" : "."}”`,
        "Then the event begins carrying a verdict about you or the future. The verdict may feel accurate, but it is still a second step. You do not have to disprove it tonight to notice that it is a step.",
        "A smaller honest sentence might be: this affected me, I do not yet know everything it means, and I am allowed to respond before I understand it perfectly.",
      ],
      next: [
        "For the next ten minutes, the goal is not resolution. The goal is to lower the number of things your body must hold at once.",
        "Choose one closed action: drink water, wash your face, open a window, put one object away, or send one plain sentence to a safe person. Pick the action that ends when it is done.",
        "After that, ask again. Ten minutes is not a promise about the rest of the day.",
      ],
      sort: [
        `What currently reads most like observation: ${possibleFacts.length ? possibleFacts.map((item) => `“${item}.”`).join(" ") : `“${firstSentence}."`}`,
        "Words such as always, never, everyone and ruined can describe intensity while pretending to describe evidence. If one appears above, keep the feeling and put the universal claim on probation.",
        "Unknown is not good news. It is also not proof of the worst version. You can leave it unknown without making yourself optimistic.",
      ],
      write: [
        "Keep the event specific: where you were, what was said or done, what your body noticed first. You do not need to become wise before the paragraph ends.",
        "Write the conclusion separately. Then write what the conclusion asks you to do. That distance is often enough to reveal whether the thought is information, protection or punishment.",
        "This can remain private. An experience does not owe the public a finished meaning.",
      ],
    };
    setResponse(output[need]);
    setSaved(false);
  };

  const saveAsDraft = () => {
    const body = `${text.trim()}\n\n---\n\n${response.join("\n\n")}`;
    window.localStorage.setItem("veo-writing-draft", JSON.stringify({ title: `Private check-in — ${new Date().toLocaleDateString()}`, body, kind: "Private thought", visibility: "Private draft", savedAt: new Date().toISOString() }));
    setSaved(true);
  };

  return (
    <main className="checkin-page">
      <header className="studio-page-heading checkin-heading">
        <div><p>PRIVATE CHECK-IN / DEVICE ONLY</p><h1>You do not have to make art from this.</h1><span>A small, rule-based reflection tool for moments when thought becomes louder than evidence.</span></div>
        <div className="privacy-badge"><Lock size={13} /> Nothing here leaves this page</div>
      </header>

      <div className="checkin-layout">
        <section className="checkin-card">
          <div className="checkin-card-head"><HeartHandshake size={19} /><div><span>START WITH THE UNEDITED VERSION</span><strong>What is taking up the most space right now?</strong></div></div>
          <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="You can be unfair, repetitive, dramatic or uncertain here. This box is not a public post." rows={9} />
          <div className="checkin-count"><span>{wordCount} words</span><span>Not autosaved</span></div>
          <fieldset>
            <legend>WHAT WOULD HELP MORE THAN ADVICE?</legend>
            <div className="need-grid">{needs.map(([value, title, description]) => <label className={need === value ? "selected" : ""} key={value}><input type="radio" name="need" checked={need === value} onChange={() => setNeed(value)} /><i>{need === value && <Check size={11} />}</i><strong>{title}</strong><span>{description}</span></label>)}</div>
          </fieldset>
          <button className="studio-primary-button checkin-submit" disabled={!text.trim()} onClick={respond}>Reflect without diagnosing <ArrowRight size={14} /></button>
        </section>

        <aside className="checkin-response">
          <div className="response-head"><div><ShieldCheck size={16} /><span>GROUNDING RESPONSE</span></div><small>No model / no profile / no diagnosis</small></div>
          {response.length ? <><div className="response-copy">{response.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><div className="response-actions"><button onClick={respond}><RefreshCcw size={13} /> Read again</button><button onClick={saveAsDraft}><BookOpenText size={13} /> {saved ? "Saved to writing desk" : "Keep as private draft"}</button></div></> : <div className="response-empty"><Clock3 size={24} /><strong>No response until you ask for one.</strong><p>The tool will reflect structure and offer a smaller next step. It will not score your mood or turn distress into productivity.</p></div>}
          <div className="support-boundary"><strong>Important boundary</strong><p>This is a writing and grounding aid, not therapy or emergency support. If you may be in immediate danger or unable to keep yourself safe, contact local emergency services or a person who can be physically present.</p></div>
        </aside>
      </div>
    </main>
  );
}
