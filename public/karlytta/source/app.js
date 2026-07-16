
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let state = {};

async function load(){
  const [audio, claims, voices, timeline, assets] = await Promise.all([
    fetch('data/audio_analysis.json').then(r=>r.json()),
    fetch('data/claims.json').then(r=>r.json()),
    fetch('data/forum_posts.json').then(r=>r.json()),
    fetch('data/timeline.json').then(r=>r.json()),
    fetch('data/asset_backlog.json').then(r=>r.json())
  ]);
  state={audio,claims,voices,timeline,assets};
  renderMetrics();
  renderClaims('all');
  renderVoices();
  renderTimeline();
  setupLab();
}
function renderMetrics(){
  const map={official:'#officialMetrics',extended:'#extendedMetrics'};
  state.audio.tracks.forEach(t=>{
    const el=$(map[t.id]);
    const rows=[
      ['Duration',t.duration_display],
      ['Format',t.bit_depth],
      ['Tempo estimate',`${t.estimated_tempo_bpm} BPM`],
      ['Tonal centre',t.estimated_key],
      ['Loudness',`${t.integrated_lufs} LUFS`],
      ['True peak',`${t.true_peak_dbfs} dBFS`]
    ];
    el.innerHTML=rows.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  });
}
function renderClaims(status){
  const items=state.claims.filter(c=>status==='all'||c.status===status);
  $('#claimList').innerHTML=items.map(c=>`
    <article class="claim">
      <div class="claim-id">${c.id}</div>
      <div><h3>${c.claim}</h3><p>${c.source}</p><span class="status-tag">${c.status}</span></div>
      <div><h3>Counter-reading</h3><p>${c.counterclaim}</p><span class="status-tag">${c.dramatic_value}</span></div>
    </article>`).join('');
}
function renderVoices(){
  $('#voiceList').innerHTML=state.voices.map(v=>`
    <article class="voice">
      <header><b>${v.author}</b><span>${v.role} / ${v.stance}</span><i class="song">LINKED TRACK: ${v.song}</i></header>
      <p>${v.post}</p>
    </article>`).join('');
}
function renderTimeline(){
  $('#timelineList').innerHTML=state.timeline.map(t=>`
    <div class="time-row"><b>${t.year}</b><p>${t.event}</p></div>`).join('');
}
function setupLab(){
  const cats=[...new Set(state.assets.map(a=>a.category))];
  $('#categorySelect').innerHTML=`<option value="all">All categories</option>`+cats.map(c=>`<option>${c}</option>`).join('');
  $('#generateArtifact').onclick=()=>{
    const c=$('#categorySelect').value;
    const pool=state.assets.filter(a=>c==='all'||a.category===c);
    const a=pool[Math.floor(Math.random()*pool.length)];
    $('#artifactCard').innerHTML=`
      <span class="artifact-id">${a.asset_id} / ${a.category}</span>
      <h3>${a.asset}</h3>
      <p><b>Build rule:</b> ${a.required_links}</p>
      <p><b>Game relevance:</b> ${a.game_relevance}</p>`;
  }
}
$$('.tab').forEach(b=>b.onclick=()=>{
  $$('.tab').forEach(x=>x.classList.remove('active'));
  $$('.panel').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  $('#'+b.dataset.tab).classList.add('active');
});
$$('.filter').forEach(b=>b.onclick=()=>{
  $$('.filter').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  renderClaims(b.dataset.status);
});
load();
