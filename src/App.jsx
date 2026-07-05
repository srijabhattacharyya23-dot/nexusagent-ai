import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Cpu, Settings, ShieldCheck, Terminal,
  RotateCcw, Play, AlertTriangle, CheckCircle2, Info,
  ChevronRight, Code, User, Sliders, CalendarDays, ListTodo,
  Timer, BookOpen, HelpCircle, Volume2, Bookmark, Award, Layers, Zap
} from 'lucide-react';

/* ─── DATA ─────────────────────────────────────────────────── */
const FLASHCARDS = [
  { q: "What is Model Context Protocol (MCP)?", a: "An open standard by Anthropic connecting LLMs to local tool schemas, resource URIs, and pre-built prompts via JSON-RPC 2.0." },
  { q: "What is the ADK (Agent Development Kit)?", a: "An orchestration pattern defining agents with local skills (milestones, graph sorting, conflict checks) synchronized by a master orchestrator." },
  { q: "How does the Task Optimization Agent order tasks?", a: "It checks the dependency matrix, detects cycles, and runs a Topological Sort to organize execution linearly without conflicts." },
  { q: "Explain the Security Sandbox execution checks.", a: "Sanitizes parameters via Zod, blocks illegal strings (rm, sudo), restricts CPU time and RAM limits, and logs all violations." },
  { q: "What is Active Recall in study methodologies?", a: "A cognitive science technique stimulating memory through retrieval testing cycles instead of passive review — proven to 2× retention." },
  { q: "What makes NexusAgent AI fully offline?", a: "All agents are simulated locally, audio is synthesized via Web Audio API oscillators, and MCP uses in-process JSON-RPC — zero external APIs." },
];

const QUIZ_QUESTIONS = [
  { q: "What protocol handles communications between client LLMs and local tools?", a: ["JSON-RPC 2.0 (MCP)", "HTTP/3 REST", "GraphQL", "XML SOAP"], correct: 0, explanation: "MCP uses JSON-RPC 2.0 as its transport layer for structured request/response between AI models and local tool servers." },
  { q: "What algorithm resolves linear task dependencies in NexusAgent?", a: ["Dijkstra Sorter", "Topological Sort", "Binary Search Tree", "QuickSort"], correct: 1, explanation: "Topological Sort processes a DAG of task dependencies and outputs a linear ordering respecting all dependency edges." },
  { q: "Which agent decomposes the initial unstructured goal objective?", a: ["Task Optimization Agent", "Planner Agent", "Life Scheduler Agent", "Sandbox Monitor"], correct: 1, explanation: "The Planner Agent is first in the pipeline — it parses raw goals, breaks them into milestones, and creates a dependency graph." },
  { q: "How does the Life Scheduler handle calendar overlap conflicts?", a: ["Cancels tasks", "Defers tasks past locked slots", "Overwrites prior slots", "Crashes"], correct: 1, explanation: "The Life Scheduler shifts tasks to the next available block, skipping locked intervals like lunch (12–13h) and syncs (15–16h)." },
  { q: "Which component executes agent CLI tools safely?", a: ["Vite Dev Server", "Express Route", "Security Sandbox", "Zod Validator"], correct: 2, explanation: "The Security Sandbox intercepts CLI commands, blocking dangerous patterns like 'rm -rf' and enforcing memory/time limits." },
  { q: "What is the core request format in MCP specifications?", a: ["JSON-RPC 2.0", "Markdown", "XML Payload", "Protocol Buffers"], correct: 0, explanation: "MCP strictly uses JSON-RPC 2.0 with fields: jsonrpc, id, method, and params for any MCP-compatible client." },
  { q: "Which tool validates agent schemas in the sandbox?", a: ["CORS", "Lucide React", "Express JSON", "Zod Schemas"], correct: 3, explanation: "Zod is a TypeScript-first schema validation library used to validate and sanitize all agent input parameters." },
  { q: "What is the URI of the active timeline resource in our MCP server?", a: ["db://sqlite", "system://logs", "schedule://current", "file://task"], correct: 2, explanation: "The MCP server exposes 'schedule://current' as a resource URI returning the fully compiled task timeline in JSON." },
  { q: "What dot color represents a running agent node in the visualizer?", a: ["White dot", "Orange dot", "Green dot", "Red dot"], correct: 1, explanation: "ADK Graph Visualizer uses White = Idle, Orange (pulsing) = Running, Green = Completed for real-time agent state." },
  { q: "What is the main benefit of ADK Agent synchronization?", a: ["Bypasses Zod security", "Runs offline without keys", "Minimizes RAM to zero", "Requires cloud credentials"], correct: 1, explanation: "NexusAgent AI is fully offline — no API keys, no cloud. The ADK system runs in-process with local simulation and Web Audio." },
];

const SOUNDSCAPES = [
  { id: 'none',       emoji: '🔇', name: 'Silence',        desc: 'No audio' },
  { id: 'lofi',       emoji: '🎵', name: 'Warm Lofi',       desc: 'Triangle pads + slow sweep' },
  { id: 'rain',       emoji: '🌧️', name: 'Rainforest',      desc: 'Bandpass filtered noise' },
  { id: 'ocean',      emoji: '🌊', name: 'Ocean Waves',     desc: 'LFO-modulated swells' },
  { id: 'campfire',   emoji: '🔥', name: 'Campfire',        desc: 'Crackle + warm hum' },
  { id: 'drone',      emoji: '🌌', name: 'Cosmic Drone',    desc: 'Detuned deep sine waves' },
  { id: 'whitenoise', emoji: '💨', name: 'White Noise',     desc: 'Soft lowpass static' },
];

/* ─── APP ──────────────────────────────────────────────────── */
export default function App() {
  const [activeTab, setActiveTab]     = useState('dashboard');
  const [sysTab, setSysTab]           = useState('agents'); // agents | mcp | sandbox | logs
  const [state, setState]             = useState({ objective: '', targetDate: '', priority: 'medium', timeline: [], logs: [] });
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  // Goal form
  const [goalObjective, setGoalObjective] = useState('');
  const [goalDate, setGoalDate]           = useState('');
  const [goalPriority, setGoalPriority]   = useState('medium');

  // Sandbox
  const [sandboxCmd, setSandboxCmd]       = useState('');
  const [sandboxOutput, setSandboxOutput] = useState(null);
  const [sandboxMemory, setSandboxMemory] = useState(64);
  const [sandboxTimeout, setSandboxTimeout] = useState(2000);

  // MCP
  const [mcpRequest, setMcpRequest] = useState(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "mcp_write_log", arguments: { message: "Triggered from NexusAgent dashboard" } } }, null, 2));
  const [mcpResponse, setMcpResponse] = useState(null);

  // ADK Graph
  const [graphStates, setGraphStates] = useState({ start: 'completed', planner: 'completed', optimizer: 'completed', examStudy: 'completed', scheduler: 'completed', end: 'completed' });

  // Todo
  const [todos, setTodos] = useState([
    { id: 1, text: "Decompose learning syllabus via Planner Agent", completed: true, priority: "high" },
    { id: 2, text: "Run topological sorting to fix task overlaps", completed: true, priority: "high" },
    { id: 3, text: "Execute sandbox validation for code checks", completed: false, priority: "medium" },
    { id: 4, text: "Review Active Recall flashcards", completed: false, priority: "low" },
    { id: 5, text: "Sync conflicts via Life Scheduler", completed: false, priority: "high" },
  ]);
  const [todoInput, setTodoInput]     = useState('');
  const [todoPriority, setTodoPriority] = useState('medium');

  // Pomodoro
  const [timeLeft, setTimeLeft]       = useState(1500);
  const [timerActive, setTimerActive] = useState(false);
  const [timerType, setTimerType]     = useState('focus');
  const [soundscape, setSoundscape]   = useState('none');
  const audioCtxRef    = useRef(null);
  const sourceNodesRef = useRef({});

  // Flashcards
  const [cardIndex, setCardIndex]     = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);

  // Quiz
  const [quizAnswers, setQuizAnswers] = useState(Array(10).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore]     = useState(0);

  const logsEndRef = useRef(null);

  /* ── API Helpers ─────────────────────────────────────── */
  const fetchState = async () => {
    try {
      const data = await fetch('/api/state').then(r => r.json());
      setState(data);
      setGoalObjective(data.objective);
      setGoalDate(data.targetDate);
      setGoalPriority(data.priority);
      setError(null);
    } catch { setError("Cannot connect to NexusAgent orchestrator."); }
  };

  useEffect(() => { fetchState(); }, []);
  useEffect(() => { if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [state.logs]);

  /* ── Pomodoro ────────────────────────────────────────── */
  useEffect(() => {
    let iv = null;
    if (timerActive && timeLeft > 0) { iv = setInterval(() => setTimeLeft(p => p - 1), 1000); }
    else if (timeLeft === 0 && timerActive) { setTimerActive(false); playBeep(); alert("⏱️ Pomodoro complete!"); }
    return () => clearInterval(iv);
  }, [timerActive, timeLeft]);

  useEffect(() => { startSynth(soundscape); return stopSynth; }, [soundscape]);

  const startSynth = (type) => {
    try {
      if (type === 'none') { stopSynth(); return; }
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      stopSynth();
      if (ctx.state === 'suspended') ctx.resume();
      const dest = ctx.destination;

      if (type === 'whitenoise') {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600;
        const g = ctx.createGain(); g.gain.value = 0.12;
        src.connect(f); f.connect(g); g.connect(dest); src.start(0);
        sourceNodesRef.current = { src, g };
      } else if (type === 'drone') {
        const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 60;
        const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 60.5;
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 120;
        const g = ctx.createGain(); g.gain.value = 0.25;
        o1.connect(f); o2.connect(f); f.connect(g); g.connect(dest);
        o1.start(0); o2.start(0);
        sourceNodesRef.current = { o1, o2, g };
      } else if (type === 'rain') {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1000; f.Q.value = 0.8;
        const g = ctx.createGain(); g.gain.value = 0.08;
        src.connect(f); f.connect(g); g.connect(dest); src.start(0);
        sourceNodesRef.current = { src, g };
      } else if (type === 'lofi') {
        const freqs = [110, 130.81, 164.81, 196];
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 280;
        const g = ctx.createGain(); g.gain.value = 0.18;
        const oscs = freqs.map(fr => {
          const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = fr;
          o.detune.value = Math.random() * 6 - 3; o.connect(f); o.start(0); return o;
        });
        const sw = ctx.createOscillator(); sw.frequency.value = 0.12;
        const sg = ctx.createGain(); sg.gain.value = 60;
        sw.connect(sg); sg.connect(f.frequency); sw.start(0);
        f.connect(g); g.connect(dest);
        sourceNodesRef.current = { oscs, sw, g };
      } else if (type === 'ocean') {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.18;
        const lg = ctx.createGain(); lg.gain.value = 0.09;
        const g = ctx.createGain(); g.gain.value = 0.07;
        lfo.connect(lg); lg.connect(g.gain);
        src.connect(f); f.connect(g); g.connect(dest);
        src.start(0); lfo.start(0);
        sourceNodesRef.current = { src, lfo, g };
      } else if (type === 'campfire') {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() < 0.03 ? (Math.random() * 2 - 1) * 3 : (Math.random() * 2 - 1) * 0.05;
        const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
        const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 800;
        const g = ctx.createGain(); g.gain.value = 0.22;
        const hum = ctx.createOscillator(); hum.type = 'sine'; hum.frequency.value = 80;
        const hg = ctx.createGain(); hg.gain.value = 0.06;
        src.connect(f); f.connect(g); g.connect(dest);
        hum.connect(hg); hg.connect(dest);
        src.start(0); hum.start(0);
        sourceNodesRef.current = { src, hum, g };
      }
    } catch (e) { console.error(e); }
  };

  const stopSynth = () => {
    try {
      const n = sourceNodesRef.current;
      ['src','o1','o2','sw','lfo','hum'].forEach(k => { if (n[k]) { try { n[k].stop(); } catch{} delete n[k]; } });
      if (n.oscs) { n.oscs.forEach(o => { try { o.stop(); } catch{} }); delete n.oscs; }
      if (n.g) { n.g.disconnect(); delete n.g; }
    } catch {}
  };

  const playBeep = () => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(800, ctx.currentTime);
      g.gain.setValueAtTime(0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.6);
    } catch {}
  };

  /* ── Orchestrate ─────────────────────────────────────── */
  const handleOrchestrate = async (e) => {
    e?.preventDefault(); setLoading(true); setError(null);
    const set = (s) => setGraphStates(p => ({ ...p, ...s }));
    set({ start: 'idle', planner: 'idle', optimizer: 'idle', examStudy: 'idle', scheduler: 'idle', end: 'idle' });
    setTimeout(() => set({ start: 'running' }), 0);
    setTimeout(() => set({ start: 'completed', planner: 'running' }), 450);
    setTimeout(() => set({ planner: 'completed', optimizer: 'running' }), 900);
    setTimeout(() => set({ optimizer: 'completed', examStudy: 'running' }), 1350);
    setTimeout(() => set({ examStudy: 'completed', scheduler: 'running' }), 1800);
    setTimeout(() => set({ scheduler: 'completed', end: 'running' }), 2250);
    setTimeout(() => set({ end: 'completed' }), 2650);
    try {
      const res = await fetch('/api/orchestrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ objective: goalObjective, targetDate: goalDate, priority: goalPriority }) });
      const data = await res.json();
      if (res.ok) { setTimeout(async () => { await fetchState(); setLoading(false); }, 2700); }
      else { setError(data.error || "Orchestration failed."); setLoading(false); }
    } catch { setError("Connection failure during orchestration."); setLoading(false); }
  };

  /* ── Sandbox ─────────────────────────────────────────── */
  const handleRunSandbox = async (e) => {
    e.preventDefault(); if (!sandboxCmd.trim()) return;
    try {
      const res = await fetch('/api/sandbox/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command: sandboxCmd, timeoutMs: sandboxTimeout, memoryLimitMb: sandboxMemory }) });
      setSandboxOutput(await res.json()); setSandboxCmd(''); await fetchState();
    } catch (err) { console.error(err); }
  };

  const handleMcpSubmit = async () => {
    try {
      const res = await fetch('/api/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: mcpRequest });
      setMcpResponse(await res.json()); await fetchState();
    } catch (err) { setMcpResponse({ jsonrpc: "2.0", id: null, error: { code: -32700, message: `Parse Error: ${err.message}` } }); }
  };

  const handleReset = async () => {
    try {
      await fetch('/api/reset', { method: 'POST' }); await fetchState();
      setGraphStates({ start: 'completed', planner: 'completed', optimizer: 'completed', examStudy: 'completed', scheduler: 'completed', end: 'completed' });
      setSandboxOutput(null); setSandboxCmd(''); setError(null);
    } catch {}
  };

  /* ── Todo ────────────────────────────────────────────── */
  const addTodo = (e) => { e.preventDefault(); if (!todoInput.trim()) return; setTodos(p => [...p, { id: Date.now(), text: todoInput, completed: false, priority: todoPriority }]); setTodoInput(''); };
  const toggleTodo = (id) => setTodos(p => p.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const removeTodo = (id) => setTodos(p => p.filter(t => t.id !== id));

  /* ── Timer ───────────────────────────────────────────── */
  const selectTimer = (type, secs) => { setTimerType(type); setTimeLeft(secs); setTimerActive(false); };
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  /* ── Quiz ────────────────────────────────────────────── */
  const selectAnswer = (qi, ci) => { if (quizSubmitted) return; const a = [...quizAnswers]; a[qi] = ci; setQuizAnswers(a); };
  const submitQuiz = () => {
    const unanswered = quizAnswers.filter(a => a === null).length;
    if (unanswered > 0) { alert(`Answer all 10 questions! ${unanswered} remaining.`); return; }
    setQuizScore(QUIZ_QUESTIONS.filter((q, i) => quizAnswers[i] === q.correct).length);
    setQuizSubmitted(true);
  };
  const resetQuiz = () => { setQuizAnswers(Array(10).fill(null)); setQuizSubmitted(false); setQuizScore(0); };

  /* ── Dot renderer ────────────────────────────────────── */
  const Dot = ({ status }) => (
    <span className={`graph-node-dot state-${status}`} />
  );

  /* ── Log classifier ──────────────────────────────────── */
  const logClass = (t) => {
    if (t.includes('[System]')) return 'console-log system';
    if (t.includes('[Planner Agent]')) return 'console-log agent-planner';
    if (t.includes('[Task Optimization Agent]')) return 'console-log agent-optimizer';
    if (t.includes('[Life Scheduler Agent]')) return 'console-log agent-scheduler';
    if (t.includes('[Sandbox]')) return 'console-log sandbox';
    if (t.includes('SECURITY ALERT') || t.includes('ERROR')) return 'console-log security-alert';
    return 'console-log';
  };

  /* ── NAV ITEMS ───────────────────────────────────────── */
  const NAV = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Board' },
    { id: 'planner',   icon: <ListTodo size={20} />,        label: 'Tasks' },
    { id: 'pomodoro',  icon: <Timer size={20} />,           label: 'Focus' },
    { id: 'flashcards',icon: <BookOpen size={20} />,        label: 'Cards' },
    { id: 'quiz',      icon: <HelpCircle size={20} />,      label: 'Quiz' },
    { id: 'system',    icon: <Settings size={20} />,        label: 'System' },
  ];

  /* ─────────────────── RENDER ─────────────────────────── */
  return (
    <div className="app-container">

      {/* ── SIDEBAR ───────────────────────────────────── */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-icon">⚡</div>
          <div className="brand-text">
            <span className="brand-name">NexusAgent</span>
            <span className="brand-sub">AI Platform</span>
          </div>
        </div>

        <div className="sidebar-divider" />

        <nav className="nav-links">
          {NAV.map(n => (
            <button key={n.id} className={`nav-link ${activeTab === n.id ? 'active' : ''}`} onClick={() => setActiveTab(n.id)}>
              <span className="nav-icon">{n.icon}</span>
              <span className="nav-label">{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="offline-badge">
            <span className="status-dot" />
            <span className="offline-text">100% Offline</span>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={handleReset} title="Reset all agents">
            <RotateCcw size={15} />
          </button>
        </div>
      </aside>

      {/* ── MAIN ──────────────────────────────────────── */}
      <main className="main-content">
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '12px 20px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={16} />{error}
          </div>
        )}

        {/* ══════════════ DASHBOARD ══════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="fade-in">
            <div className="dashboard-header">
              <div className="header-title-area">
                <h1>⚡ NexusAgent AI</h1>
                <p>Synchronized ADK multi-agent orchestration — 100% offline, zero API keys.</p>
              </div>
              <div className="actions-row">
                <button className="btn btn-secondary" onClick={fetchState}><RotateCcw size={14} /> Refresh</button>
              </div>
            </div>

            {/* Hero stat cards */}
            <div className="hero-stats">
              {[
                { icon: '🤖', label: 'Active Agents', value: '4', color: 'var(--accent-teal)' },
                { icon: '🔧', label: 'MCP Tools', value: '3', color: 'var(--accent-purple)' },
                { icon: '📅', label: 'Timeline Slots', value: state.timeline.length, color: 'var(--warning)' },
                { icon: '🛡️', label: 'Sandbox Status', value: 'SECURE', color: 'var(--success)' },
              ].map((s, i) => (
                <div key={i} className="hero-stat">
                  <div className="hero-stat-icon" style={{ background: `${s.color}18` }}>{s.icon}</div>
                  <div className="hero-stat-value" style={{ color: s.color }}>{s.value}</div>
                  <div className="hero-stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Goal form */}
            <section className="card" style={{ marginBottom: '20px' }}>
              <div className="card-title"><Zap size={18} style={{ color: 'var(--accent-teal)' }} />Launch Multi-Agent Objective</div>
              <form onSubmit={handleOrchestrate} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '14px', alignItems: 'end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Goal Objective</label>
                  <input type="text" className="form-input" placeholder="e.g. Prepare for ML exam on July 10" value={goalObjective} onChange={e => setGoalObjective(e.target.value)} required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Target Date</label>
                  <input type="date" className="form-input" value={goalDate} onChange={e => setGoalDate(e.target.value)} required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Priority</label>
                  <select className="form-input" value={goalPriority} onChange={e => setGoalPriority(e.target.value)}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '44px' }}>
                  <Play size={15} />{loading ? 'Compiling…' : 'Execute'}
                </button>
              </form>
            </section>

            {/* ADK Graph */}
            <section className="card" style={{ marginBottom: '20px' }}>
              <div className="card-title"><Sliders size={16} style={{ color: 'var(--accent-purple)' }} />ADK Multi-Agent Graph Compilation</div>
              <div className="graph-pipeline">
                {[
                  { key: 'start',     label: 'Start',    sub: 'Input Data' },
                  { key: 'planner',   label: 'Planner',  sub: 'Orchestration' },
                  { key: 'optimizer', label: 'Optimizer',sub: 'Eisenhower' },
                  { key: 'examStudy', label: 'Exam Study',sub: 'Active Recall' },
                  { key: 'scheduler', label: 'Scheduler', sub: 'Conflict Check' },
                  { key: 'end',       label: 'End',      sub: 'Final State' },
                ].map((node, i, arr) => (
                  <React.Fragment key={node.key}>
                    <div className="graph-node">
                      <Dot status={graphStates[node.key]} />
                      <div className="graph-node-label">{node.label}</div>
                      <div className="graph-node-sub">{node.sub}</div>
                    </div>
                    {i < arr.length - 1 && <span className="graph-arrow"><ChevronRight size={14} /></span>}
                  </React.Fragment>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>⚪ Idle</span><span style={{ color: 'var(--warning)' }}>🟠 Running</span><span style={{ color: 'var(--success)' }}>🟢 Completed</span>
              </div>
            </section>

            {/* Three info boxes + Timeline */}
            <div className="grid-3" style={{ marginBottom: '20px' }}>
              {/* Active Agents */}
              <div className="card">
                <div className="card-title" style={{ fontSize: '14px' }}><User size={15} style={{ color: 'var(--accent-teal)' }} />Active AGENTs</div>
                {['Planner Agent', 'Task Optimizer', 'Exam Study Agent', 'Life Scheduler'].map(a => (
                  <div key={a} className="agent-mini-card" style={{ marginBottom: '8px' }}>
                    <span className="agent-mini-dot" style={{ background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{a}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--success)', fontWeight: 700 }}>ONLINE</span>
                  </div>
                ))}
              </div>

              {/* MCP Tools */}
              <div className="card">
                <div className="card-title" style={{ fontSize: '14px' }}><Code size={15} style={{ color: 'var(--accent-purple)' }} />LOCAL MCP TOOLS</div>
                {['mcp_write_log', 'mcp_read_schedule', 'mcp_validate_sandbox'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-purple)', flexShrink: 0 }} />
                    <code style={{ fontSize: '12px', color: 'var(--accent-purple)' }}>{t}</code>
                  </div>
                ))}
              </div>

              {/* Scheduled Slots */}
              <div className="card">
                <div className="card-title" style={{ fontSize: '14px' }}><CalendarDays size={15} style={{ color: 'var(--warning)' }} />SCHEDULED SLOTS ({state.timeline.length})</div>
                <div style={{ maxHeight: '130px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {state.timeline.length === 0
                    ? <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No slots yet. Run orchestration above.</span>
                    : state.timeline.map(t => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ color: 'var(--accent-teal)', fontWeight: 700 }}>{t.timeSlot}</span>
                        <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{t.title}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>

            {/* Timeline */}
            {state.timeline.length > 0 && (
              <section className="card">
                <div className="card-title"><CheckCircle2 size={18} style={{ color: 'var(--success)' }} />Compiled Calendar — {state.targetDate}</div>
                <div className="timeline-list">
                  {state.timeline.map(task => (
                    <div key={task.id} className={`timeline-item ${task.assignedAgent === 'Planner' ? 'planner-task' : task.assignedAgent === 'Optimizer' ? 'optimizer-task' : 'scheduler-task'}`}>
                      <div className="timeline-slot">{task.timeSlot}</div>
                      <div className="timeline-details">
                        <div className="timeline-title">{task.title}</div>
                        <div className="timeline-meta">
                          <span className="tag tag-teal">Agent: {task.assignedAgent}</span>
                          <span className="tag tag-purple">Seq: {task.executionOrder}</span>
                          <span className="tag tag-yellow">Effort: {task.complexity}</span>
                        </div>
                      </div>
                      <span className="tag tag-green">{task.status}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ══════════════ STUDY PLANNER ══════════════════ */}
        {activeTab === 'planner' && (
          <div className="fade-in">
            <div className="dashboard-header">
              <div className="header-title-area"><h1>Study Task Planner</h1><p>Track milestones, set priorities, and coordinate your study workflow.</p></div>
            </div>
            <div className="grid-2">
              <section className="card">
                <div className="card-title"><ListTodo size={18} style={{ color: 'var(--accent-teal)' }} />Add New Task</div>
                <form onSubmit={addTodo}>
                  <div className="form-group">
                    <label className="form-label">Task Description</label>
                    <input type="text" className="form-input" placeholder="e.g. Read Chapter 4 — Neural Nets" value={todoInput} onChange={e => setTodoInput(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-input" value={todoPriority} onChange={e => setTodoPriority(e.target.value)}>
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Task</button>
                </form>
              </section>

              <section className="card">
                <div className="card-title"><Bookmark size={18} style={{ color: 'var(--accent-purple)' }} />Task Checklist <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 400 }}>({todos.filter(t => !t.completed).length} remaining)</span></div>
                <div className="todo-list-container">
                  {todos.length === 0
                    ? <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No tasks yet.</div>
                    : todos.map(t => (
                      <div key={t.id} className={`todo-item ${t.completed ? 'completed' : ''}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexGrow: 1, minWidth: 0 }}>
                          <input type="checkbox" checked={t.completed} onChange={() => toggleTodo(t.id)} style={{ width: '16px', height: '16px', accentColor: 'var(--accent-teal)', cursor: 'pointer', flexShrink: 0 }} />
                          <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.text}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span className={`tag ${t.priority === 'high' ? 'tag-red' : t.priority === 'medium' ? 'tag-purple' : 'tag-teal'}`}>{t.priority}</span>
                          <button onClick={() => removeTodo(t.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '2px' }}>×</button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ══════════════ POMODORO ══════════════════════ */}
        {activeTab === 'pomodoro' && (
          <div className="fade-in">
            <div className="dashboard-header">
              <div className="header-title-area"><h1>Pomodoro & Offline Soundscapes</h1><p>All audio synthesized in-browser via Web Audio API — no internet required.</p></div>
            </div>
            <div className="grid-2">
              {/* Timer */}
              <section className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                  {[['focus','Focus 25m',1500],['short','Break 5m',300],['long','Long 15m',900]].map(([type, label, secs]) => (
                    <button key={type} className={`btn ${timerType === type ? 'btn-primary' : 'btn-secondary'}`} onClick={() => selectTimer(type, secs)} style={{ fontSize: '12px' }}>{label}</button>
                  ))}
                </div>
                <div className="pomodoro-display">{fmt(timeLeft)}</div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button className="btn btn-primary" onClick={() => setTimerActive(!timerActive)} style={{ minWidth: '100px' }}>{timerActive ? '⏸ Pause' : '▶ Start'}</button>
                  <button className="btn btn-secondary" onClick={() => selectTimer(timerType, timerType === 'focus' ? 1500 : timerType === 'short' ? 300 : 900)}>↺ Reset</button>
                </div>
                <div style={{ marginTop: '24px', width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(1 - timeLeft / (timerType === 'focus' ? 1500 : timerType === 'short' ? 300 : 900)) * 100}%`, background: 'linear-gradient(90deg, var(--accent-teal), var(--accent-purple))', transition: 'width 1s linear', borderRadius: '4px' }} />
                </div>
              </section>

              {/* Soundscapes */}
              <section className="card">
                <div className="card-title"><Volume2 size={18} style={{ color: 'var(--accent-teal)' }} />Timer Soundscapes</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {SOUNDSCAPES.map(s => (
                    <button key={s.id} className={`soundscape-btn ${soundscape === s.id ? 'active' : ''}`} onClick={() => setSoundscape(s.id)}>
                      <span className="soundscape-emoji">{s.emoji}</span>
                      <span className="soundscape-info">
                        <span className="soundscape-name">{s.name}</span>
                        <span className="soundscape-desc">{s.desc}</span>
                      </span>
                      {soundscape === s.id && s.id !== 'none' && <span className="soundscape-badge">▶ ON</span>}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ══════════════ FLASHCARDS ════════════════════ */}
        {activeTab === 'flashcards' && (
          <div className="fade-in">
            <div className="dashboard-header">
              <div className="header-title-area"><h1>AI & MCP Flashcards</h1><p>Click the card to reveal the answer. Test your architecture knowledge.</p></div>
            </div>
            <div style={{ maxWidth: '640px', margin: '0 auto' }}>
              <div className={`flashcard-container ${cardFlipped ? 'flipped' : ''}`} onClick={() => setCardFlipped(!cardFlipped)}>
                <div className="flashcard-inner">
                  <div className="flashcard-front">
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Question {cardIndex + 1} / {FLASHCARDS.length}</span>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, lineHeight: 1.3, color: 'var(--text-primary)' }}>{FLASHCARDS[cardIndex].q}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '24px' }}>👆 Click to flip</p>
                  </div>
                  <div className="flashcard-back">
                    <span style={{ fontSize: '11px', color: 'var(--accent-teal)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>✓ Answer</span>
                    <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-primary)' }}>{FLASHCARDS[cardIndex].a}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px' }}>👆 Click to flip back</p>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn btn-secondary" disabled={cardIndex === 0} onClick={() => { setCardIndex(p => p - 1); setCardFlipped(false); }}>← Previous</button>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{cardIndex + 1} / {FLASHCARDS.length}</span>
                <button className="btn btn-secondary" disabled={cardIndex === FLASHCARDS.length - 1} onClick={() => { setCardIndex(p => p + 1); setCardFlipped(false); }}>Next →</button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ QUIZ ══════════════════════════ */}
        {activeTab === 'quiz' && (
          <div className="fade-in">
            <div className="dashboard-header">
              <div className="header-title-area"><h1>AI & MCP Quiz</h1><p>10 questions on ADK, MCP, and NexusAgent architecture. Answers revealed on submit.</p></div>
              {quizSubmitted && <button className="btn btn-secondary" onClick={resetQuiz}>↺ Retake</button>}
            </div>

            {quizSubmitted && (
              <div className="card" style={{ marginBottom: '24px', textAlign: 'center', padding: '28px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <Award size={44} style={{ color: 'var(--success)', marginBottom: '12px' }} />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, marginBottom: '6px' }}>
                  {quizScore === 10 ? '🏆 Perfect!' : quizScore >= 7 ? '🎯 Great Job!' : '📖 Keep Studying!'}
                </h2>
                <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Score: <strong style={{ color: 'var(--accent-teal)', fontSize: '24px' }}>{quizScore}</strong>/10 — {quizScore * 10}%</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '820px', margin: '0 auto', paddingBottom: '40px' }}>
              {QUIZ_QUESTIONS.map((q, qi) => (
                <section key={qi} className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <span style={{ background: quizSubmitted ? (quizAnswers[qi] === q.correct ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)') : 'rgba(255,255,255,0.06)', color: quizSubmitted ? (quizAnswers[qi] === q.correct ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, flexShrink: 0 }}>Q{qi + 1}</span>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{q.q}</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {q.a.map((choice, ci) => {
                      let cls = 'quiz-choice-btn';
                      if (quizAnswers[qi] === ci) cls += ' selected';
                      if (quizSubmitted) {
                        if (ci === q.correct) cls += ' correct';
                        else if (quizAnswers[qi] === ci) cls += ' incorrect';
                      }
                      return (
                        <button key={ci} className={cls} onClick={() => selectAnswer(qi, ci)}>
                          {quizSubmitted && ci === q.correct && '✓ '}
                          {quizSubmitted && quizAnswers[qi] === ci && ci !== q.correct && '✗ '}
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                  {quizSubmitted && (
                    <div className="quiz-answer-reveal">
                      <strong>✓ Correct: {q.a[q.correct]}</strong><br />{q.explanation}
                    </div>
                  )}
                </section>
              ))}

              {!quizSubmitted && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ marginBottom: '8px', fontSize: '13px', color: quizAnswers.filter(a => a !== null).length === 10 ? 'var(--success)' : 'var(--text-muted)' }}>
                    Answered: {quizAnswers.filter(a => a !== null).length} / 10
                  </p>
                  <button className="btn btn-primary" onClick={submitQuiz} style={{ padding: '12px 40px', fontSize: '15px' }}>Submit Answers</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ SYSTEM ════════════════════════ */}
        {activeTab === 'system' && (
          <div className="fade-in">
            <div className="dashboard-header">
              <div className="header-title-area"><h1>System Control</h1><p>Agent profiles, MCP configuration, security sandbox, and execution trace.</p></div>
            </div>

            <div className="sys-tab-bar">
              {[['agents','🤖 Agents'],['mcp','⚙️ MCP Config'],['sandbox','🛡️ Sandbox'],['logs','🖥️ Console']].map(([id, label]) => (
                <button key={id} className={`sys-tab-pill ${sysTab === id ? 'active' : ''}`} onClick={() => setSysTab(id)}>{label}</button>
              ))}
            </div>

            {/* Agents sub-tab */}
            {sysTab === 'agents' && (
              <div className="grid-3">
                {[
                  { name: 'Planner Agent', color: 'var(--accent-teal)', desc: 'Decomposes unstructured goals into milestones and dependency graphs.', skills: ['Goal decomposition','Milestone mapping'], tools: 'mcp_read_schedule, mcp_write_log' },
                  { name: 'Task Optimizer', color: 'var(--accent-purple)', desc: 'Validates dependency graphs, calculates critical paths, resolves circular conflicts.', skills: ['Topological sort','Dependency resolution'], tools: 'mcp_validate_sandbox' },
                  { name: 'Life Scheduler', color: 'var(--warning)', desc: 'Compares optimized paths against locked calendar slots and assigns exact hours.', skills: ['Calendar-sync','Conflict resolution'], tools: 'mcp_read_schedule, mcp_write_log' },
                ].map(a => (
                  <div key={a.name} className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: a.color, boxShadow: `0 0 8px ${a.color}` }} />
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700 }}>{a.name}</h3>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>{a.desc}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>{a.skills.map(s => <span key={s} className="tag tag-teal">{s}</span>)}</div>
                    <code style={{ fontSize: '11px', color: a.color }}>{a.tools}</code>
                  </div>
                ))}
              </div>
            )}

            {/* MCP sub-tab */}
            {sysTab === 'mcp' && (
              <div className="grid-2">
                <section className="card">
                  <div className="card-title"><Code size={16} style={{ color: 'var(--accent-teal)' }} />Exposed Tool Schemas</div>
                  {[
                    { name: 'mcp_write_log', desc: 'Write high-priority console log entries.', params: 'message (string)' },
                    { name: 'mcp_read_schedule', desc: 'Fetch compiled tasks for a YYYY-MM-DD target date.', params: 'date (string)' },
                    { name: 'mcp_validate_sandbox', desc: 'Test execution patterns in sandbox environments.', params: 'command (string), timeoutMs (number)' },
                  ].map(t => (
                    <div key={t.name} className="mcp-tool-row">
                      <div className="mcp-tool-name">{t.name}</div>
                      <div className="mcp-tool-desc">{t.desc}</div>
                      <div className="mcp-tool-params">Params: <code>{t.params}</code></div>
                    </div>
                  ))}
                </section>
                <section className="card">
                  <div className="card-title"><Layers size={16} style={{ color: 'var(--accent-purple)' }} />JSON-RPC 2.0 Playground</div>
                  <div className="form-group">
                    <textarea className="form-input font-mono" style={{ height: '180px', resize: 'none', fontSize: '12px', background: '#000' }} value={mcpRequest} onChange={e => setMcpRequest(e.target.value)} />
                  </div>
                  <button className="btn btn-primary" onClick={handleMcpSubmit} style={{ width: '100%', marginBottom: '14px' }}>POST to /api/mcp</button>
                  <div className="font-mono" style={{ minHeight: '80px', background: '#040508', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', fontSize: '12px', color: 'var(--accent-teal)', overflowY: 'auto', maxHeight: '140px' }}>
                    {mcpResponse ? <pre>{JSON.stringify(mcpResponse, null, 2)}</pre> : <span style={{ color: 'var(--text-muted)' }}>Response will appear here…</span>}
                  </div>
                </section>
              </div>
            )}

            {/* Sandbox sub-tab */}
            {sysTab === 'sandbox' && (
              <div className="grid-2">
                <section className="card">
                  <div className="card-title"><ShieldCheck size={16} style={{ color: 'var(--success)' }} />Isolation Limits</div>
                  <div className="form-group">
                    <label className="form-label">Memory Limit: {sandboxMemory}MB</label>
                    <input type="range" min="16" max="128" value={sandboxMemory} onChange={e => setSandboxMemory(Number(e.target.value))} style={{ accentColor: 'var(--accent-teal)', width: '100%' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Timeout: {sandboxTimeout}ms</label>
                    <input type="range" min="100" max="5000" step="100" value={sandboxTimeout} onChange={e => setSandboxTimeout(Number(e.target.value))} style={{ accentColor: 'var(--accent-teal)', width: '100%' }} />
                  </div>
                  <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '14px', fontSize: '12px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: '8px' }}>Security Filters Active</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', color: 'var(--text-muted)' }}>
                      {['Process isolation','Memory limits','Command blacklist','Zod schema validation'].map(f => <div key={f}>✓ {f}</div>)}
                    </div>
                  </div>
                </section>
                <section className="card">
                  <div className="card-title"><Terminal size={16} style={{ color: 'var(--accent-purple)' }} />Interactive Terminal</div>
                  <form onSubmit={handleRunSandbox} style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                    <input type="text" className="form-input font-mono" style={{ flexGrow: 1 }} placeholder="echo hello | list-tasks | rm -rf /" value={sandboxCmd} onChange={e => setSandboxCmd(e.target.value)} />
                    <button type="submit" className="btn btn-primary">Run</button>
                  </form>
                  <div className="font-mono" style={{ minHeight: '200px', background: '#040508', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', fontSize: '12px', overflowY: 'auto' }}>
                    {sandboxOutput ? (
                      <div>
                        <div style={{ color: '#fff', marginBottom: '8px' }}>$ {sandboxCmd || 'executed'}</div>
                        <div style={{ color: sandboxOutput.status === 'blocked' ? 'var(--danger)' : 'var(--success)' }}>Status: {sandboxOutput.status?.toUpperCase()}</div>
                        <div style={{ color: 'var(--text-muted)', margin: '4px 0' }}>Time: {sandboxOutput.executionTimeMs}ms | Mem: {sandboxOutput.memoryUsedMb}MB</div>
                        {sandboxOutput.stdout && <div style={{ color: 'var(--accent-teal)', marginTop: '8px', whiteSpace: 'pre' }}>{sandboxOutput.stdout}</div>}
                        {sandboxOutput.securityViolations?.length > 0 && (
                          <div style={{ color: 'var(--danger)', border: '1px dashed var(--danger)', padding: '8px', borderRadius: '6px', marginTop: '10px' }}>
                            🚫 Blocked: {sandboxOutput.securityViolations.join(', ')}
                          </div>
                        )}
                      </div>
                    ) : <span style={{ color: 'var(--text-muted)' }}>Type a command above. Try: echo hello, list-tasks, or rm -rf /</span>}
                  </div>
                </section>
              </div>
            )}

            {/* Logs sub-tab */}
            {sysTab === 'logs' && (
              <section className="console-container">
                <div className="console-header">
                  <div className="console-dots">
                    <div className="console-dot" style={{ background: '#ef4444' }} />
                    <div className="console-dot" style={{ background: '#f59e0b' }} />
                    <div className="console-dot" style={{ background: '#10b981' }} />
                  </div>
                  <span>nexusagent_orchestrator.log</span>
                  <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '11px' }}>● LIVE</span>
                </div>
                <div className="console-body">
                  {state.logs.length === 0
                    ? <span style={{ color: 'var(--text-muted)' }}>Run orchestration to see live execution trace…</span>
                    : state.logs.map((log, i) => <div key={i} className={logClass(log)}>{log}</div>)}
                  <div ref={logsEndRef} />
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
