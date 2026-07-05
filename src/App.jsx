import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  Settings, 
  ShieldCheck, 
  Terminal, 
  RotateCcw, 
  Calendar, 
  Clock, 
  Layers, 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  ChevronRight,
  Code,
  User,
  Sliders,
  CalendarDays,
  ListTodo,
  Timer,
  BookOpen,
  HelpCircle,
  Volume2,
  Bookmark,
  Award
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [state, setState] = useState({
    objective: '',
    targetDate: '',
    priority: 'medium',
    timeline: [],
    logs: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dashboard Goal Form State
  const [goalObjective, setGoalObjective] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [goalPriority, setGoalPriority] = useState('medium');

  // Sandbox State
  const [sandboxCmd, setSandboxCmd] = useState('');
  const [sandboxOutput, setSandboxOutput] = useState(null);
  const [sandboxMemory, setSandboxMemory] = useState(64);
  const [sandboxTimeout, setSandboxTimeout] = useState(2000);

  // MCP Client Playground State
  const [mcpRequest, setMcpRequest] = useState(
    JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "mcp_write_log",
        arguments: {
          message: "Triggered from NexusAgent dashboard"
        }
      }
    }, null, 2)
  );
  const [mcpResponse, setMcpResponse] = useState(null);
  const [mcpTab, setMcpTab] = useState('tools'); // 'tools', 'playground'

  // ADK Multi-Agent Graph Compilation node states
  const [graphStates, setGraphStates] = useState({
    start: 'completed',
    planner: 'completed',
    optimizer: 'completed',
    examStudy: 'completed',
    scheduler: 'completed',
    end: 'completed'
  });

  // To-Do & Study Planner State
  const [todos, setTodos] = useState([
    { id: 1, text: "Decompose learning syllabus via Planner Agent", completed: true, priority: "high" },
    { id: 2, text: "Run topological sorting to fix task overlaps", completed: true, priority: "high" },
    { id: 3, text: "Execute sandbox validation for code checks", completed: false, priority: "medium" },
    { id: 4, text: "Review Active Recall flashcards", completed: false, priority: "low" },
    { id: 5, text: "Sync conflicts via Life Scheduler", completed: false, priority: "high" }
  ]);
  const [todoInput, setTodoInput] = useState('');
  const [todoPriority, setTodoPriority] = useState('medium');

  // Pomodoro Timer & Synthesized Soundscape State
  const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const [timerType, setTimerType] = useState('focus'); // 'focus' | 'short' | 'long'
  const [soundscape, setSoundscape] = useState('none'); // 'none' | 'lofi' | 'rain' | 'drone' | 'whitenoise'
  const audioCtxRef = useRef(null);
  const sourceNodesRef = useRef({});

  // Flashcards State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const flashcards = [
    { question: "What is Model Context Protocol (MCP)?", answer: "An open standard proposed by Anthropic that connects client models directly to local tool schemas, resource URIs, and pre-built prompts." },
    { question: "What is the ADK (Agent Development Kit) system?", answer: "An orchestration pattern defining concrete agents with local skills (milestones, graph sorting, conflict checks) synchronized by a master script." },
    { question: "How does the Task Optimization Agent order tasks?", answer: "It checks the dependency matrix of sub-tasks, detects cycles, and runs a Topological Sort to organize execution linearly." },
    { question: "Explain the Security Sandbox execution checks.", answer: "It sanitizes agent parameters, runs code schemas through a Zod validator, blocks illegal strings (e.g., 'rm ', 'sudo '), and restricts CPU time/RAM limit." },
    { question: "What is Active Recall in study methodologies?", answer: "A cognitive science process where memory is stimulated through quick testing retrieval loop cycles rather than passive review reading." }
  ];

  // 10-Question Quiz Maker State
  const [quizAnswers, setQuizAnswers] = useState(Array(10).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const quizQuestions = [
    { q: "What protocol handles communications between client LLMs and local tools?", a: ["JSON-RPC 2.0 (MCP)", "HTTP/3 REST", "GraphQL", "XML SOAP"], correct: 0 },
    { q: "What algorithm resolves linear task dependencies in NexusAgent?", a: ["Dijkstra Sorter", "Topological Sort", "Binary Search Tree", "QuickSort Partition"], correct: 1 },
    { q: "Which agent decomposes the initial unstructured goal objective?", a: ["Task Optimization Agent", "Planner Agent", "Life Scheduler Agent", "Sandbox Monitor"], correct: 1 },
    { q: "How does the Life Scheduler Agent handle calendar overlap conflicts?", a: ["Cancels tasks", "Defers tasks past locked slots", "Overwrites prior slots", "Crashes process"], correct: 1 },
    { q: "Which component executes agent CLI tools safely?", a: ["Vite Dev Server", "Express Route", "Security Sandbox", "Zod Validator"], correct: 2 },
    { q: "What is the core request format in the MCP specifications?", a: ["JSON-RPC 2.0", "Markdown", "XML Payload", "Protocol Buffers"], correct: 0 },
    { q: "Which tool validates agent schemas in the sandbox?", a: ["CORS", "Lucide React", "Express JSON", "Zod Schemas"], correct: 3 },
    { q: "What is the URI of the active timeline resource in our MCP server?", a: ["db://sqlite", "system://logs", "schedule://current", "file://task"], correct: 2 },
    { q: "What dot color represents a running agent node in the visualizer?", a: ["White dot", "Orange dot", "Green dot", "Red dot"], correct: 1 },
    { q: "What is the main benefit of ADK Agent synchronization?", a: ["Bypasses Zod security", "Runs offline without keys", "Minimizes RAM to zero", "Requires cloud credentials"], correct: 1 }
  ];

  const logsEndRef = useRef(null);

  // Fetch state on mount
  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      const data = await res.json();
      setState(data);
      setGoalObjective(data.objective);
      setGoalDate(data.targetDate);
      setGoalPriority(data.priority);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to connect to NexusAgent orchestrator.");
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Chronological logger scroll
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.logs]);

  // Pomodoro countdown clock effect
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      playBeepAlert();
      alert("Pomodoro timer completed!");
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // Soundscape soundtrack selector effect
  useEffect(() => {
    startSynth(soundscape);
    return () => stopSynth();
  }, [soundscape]);

  // Web Audio Synthesizer: programmatically build offline audio waveforms
  const startSynth = (type) => {
    try {
      if (type === 'none') {
        stopSynth();
        return;
      }
      
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      
      stopSynth();

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const dest = ctx.destination;

      if (type === 'whitenoise') {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = buffer;
        noiseNode.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;

        const gain = ctx.createGain();
        gain.gain.value = 0.12;

        noiseNode.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        noiseNode.start(0);

        sourceNodesRef.current.noiseNode = noiseNode;
        sourceNodesRef.current.gain = gain;
      }
      else if (type === 'drone') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        
        osc1.type = 'sine';
        osc1.frequency.value = 60; // low C

        osc2.type = 'triangle';
        osc2.frequency.value = 60.5; // detuned detuned

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 120;

        const gain = ctx.createGain();
        gain.gain.value = 0.25;

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        osc1.start(0);
        osc2.start(0);

        sourceNodesRef.current.osc1 = osc1;
        sourceNodesRef.current.osc2 = osc2;
        sourceNodesRef.current.gain = gain;
      }
      else if (type === 'rain') {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const rainNode = ctx.createBufferSource();
        rainNode.buffer = buffer;
        rainNode.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 0.8;

        const gain = ctx.createGain();
        gain.gain.value = 0.08;

        rainNode.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        rainNode.start(0);

        sourceNodesRef.current.rainNode = rainNode;
        sourceNodesRef.current.gain = gain;
      }
      else if (type === 'lofi') {
        // Slow modulated triangle oscillators chords (Am7)
        const freqs = [110.00, 130.81, 164.81, 196.00];
        const oscs = [];
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 280;

        const gain = ctx.createGain();
        gain.gain.value = 0.18;

        freqs.forEach(f => {
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.value = f;
          osc.detune.value = Math.random() * 6 - 3;
          osc.connect(filter);
          osc.start(0);
          oscs.push(osc);
        });

        const sweep = ctx.createOscillator();
        sweep.frequency.value = 0.12;
        const sweepGain = ctx.createGain();
        sweepGain.gain.value = 60;

        sweep.connect(sweepGain);
        sweepGain.connect(filter.frequency);
        sweep.start(0);

        filter.connect(gain);
        gain.connect(dest);

        sourceNodesRef.current.oscs = oscs;
        sourceNodesRef.current.sweep = sweep;
        sourceNodesRef.current.gain = gain;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const stopSynth = () => {
    try {
      const nodes = sourceNodesRef.current;
      if (nodes.noiseNode) { nodes.noiseNode.stop(); delete nodes.noiseNode; }
      if (nodes.rainNode) { nodes.rainNode.stop(); delete nodes.rainNode; }
      if (nodes.osc1) { nodes.osc1.stop(); delete nodes.osc1; }
      if (nodes.osc2) { nodes.osc2.stop(); delete nodes.osc2; }
      if (nodes.sweep) { nodes.sweep.stop(); delete nodes.sweep; }
      if (nodes.oscs) {
        nodes.oscs.forEach(o => o.stop());
        delete nodes.oscs;
      }
      if (nodes.gain) { nodes.gain.disconnect(); delete nodes.gain; }
    } catch (err) {
      console.error(err);
    }
  };

  const playBeepAlert = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Goal Orchestration with graph animations
  const handleOrchestrate = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    setGraphStates({
      start: 'idle',
      planner: 'idle',
      optimizer: 'idle',
      examStudy: 'idle',
      scheduler: 'idle',
      end: 'idle'
    });

    const setStepState = (step, val) => {
      setGraphStates(prev => ({ ...prev, [step]: val }));
    };

    // Sequential highlights
    setTimeout(() => setStepState('start', 'running'), 0);
    setTimeout(() => { setStepState('start', 'completed'); setStepState('planner', 'running'); }, 400);
    setTimeout(() => { setStepState('planner', 'completed'); setStepState('optimizer', 'running'); }, 800);
    setTimeout(() => { setStepState('optimizer', 'completed'); setStepState('examStudy', 'running'); }, 1200);
    setTimeout(() => { setStepState('examStudy', 'completed'); setStepState('scheduler', 'running'); }, 1600);
    setTimeout(() => { setStepState('scheduler', 'completed'); setStepState('end', 'running'); }, 2000);
    setTimeout(() => setStepState('end', 'completed'), 2400);

    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objective: goalObjective,
          targetDate: goalDate,
          priority: goalPriority
        })
      });
      const data = await res.json();
      if (res.ok) {
        setTimeout(async () => {
          await fetchState();
          setLoading(false);
        }, 2500);
      } else {
        setError(data.error || "Orchestration failed.");
        setLoading(false);
      }
    } catch (err) {
      setError("Connection failure during orchestration.");
      setLoading(false);
    }
  };

  // Run Sandbox command
  const handleRunSandbox = async (e) => {
    e.preventDefault();
    if (!sandboxCmd.trim()) return;
    try {
      const res = await fetch('/api/sandbox/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: sandboxCmd,
          timeoutMs: sandboxTimeout,
          memoryLimitMb: sandboxMemory
        })
      });
      const data = await res.json();
      setSandboxOutput(data);
      setSandboxCmd('');
      await fetchState();
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Custom MCP JSON-RPC Request
  const handleMcpSubmit = async () => {
    try {
      const parsedRequest = JSON.parse(mcpRequest);
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedRequest)
      });
      const data = await res.json();
      setMcpResponse(data);
      await fetchState();
    } catch (err) {
      setMcpResponse({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: `Parse Error: ${err.message}` }
      });
    }
  };

  // Reset backend state
  const handleReset = async () => {
    try {
      await fetch('/api/reset', { method: 'POST' });
      await fetchState();
      setGraphStates({
        start: 'completed',
        planner: 'completed',
        optimizer: 'completed',
        examStudy: 'completed',
        scheduler: 'completed',
        end: 'completed'
      });
      setSandboxOutput(null);
      setSandboxCmd('');
      setError(null);
    } catch (err) {
      console.error(err);
    }
  };

  // To-Do Helpers
  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!todoInput.trim()) return;
    setTodos(prev => [
      ...prev,
      { id: Date.now(), text: todoInput, completed: false, priority: todoPriority }
    ]);
    setTodoInput('');
  };

  const toggleTodo = (id) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTodo = (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  // Pomodoro Helpers
  const selectTimerType = (type, secs) => {
    setTimerType(type);
    setTimeLeft(secs);
    setTimerActive(false);
  };

  const formatTimerTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Quiz Sorter Sorter
  const handleSelectQuizAnswer = (qIdx, choiceIdx) => {
    if (quizSubmitted) return;
    const newAnswers = [...quizAnswers];
    newAnswers[qIdx] = choiceIdx;
    setQuizAnswers(newAnswers);
  };

  const submitQuiz = () => {
    let score = 0;
    quizQuestions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct) score++;
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const resetQuiz = () => {
    setQuizAnswers(Array(10).fill(null));
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  // Helper: Get agent log styling
  const getLogClassName = (logText) => {
    if (logText.includes('[System]')) return 'console-log system';
    if (logText.includes('[Planner Agent]')) return 'console-log agent-planner';
    if (logText.includes('[Task Optimization Agent]')) return 'console-log agent-optimizer';
    if (logText.includes('[Life Scheduler Agent]')) return 'console-log agent-scheduler';
    if (logText.includes('[Sandbox]')) return 'console-log sandbox';
    if (logText.includes('SECURITY ALERT') || logText.includes('ERROR')) return 'console-log security-alert';
    return 'console-log';
  };

  // Helper: Graph node status dots
  const renderStatusDot = (status) => {
    let color = '#ffffff'; // White (idle)
    let shadow = 'rgba(255, 255, 255, 0.2)';
    let animationClass = '';

    if (status === 'running') {
      color = '#f59e0b'; // Orange (running)
      shadow = 'rgba(245, 158, 11, 0.5)';
      animationClass = 'pulse-orange-dot';
    } else if (status === 'completed') {
      color = '#10b981'; // Green (completed)
      shadow = 'rgba(16, 185, 129, 0.5)';
    }

    return (
      <span 
        className={animationClass}
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 8px ${shadow}`,
          display: 'inline-block',
          marginLeft: '6px'
        }}
      />
    );
  };

  return (
    <div className="app-container">
      {/* Sidebar Panel */}
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">NexusAgent AI</span>
        </div>

        <nav className="nav-links">
          <button 
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          
          <button 
            className={`nav-link ${activeTab === 'planner' ? 'active' : ''}`}
            onClick={() => setActiveTab('planner')}
          >
            <ListTodo size={18} />
            Study Task Planner
          </button>

          <button 
            className={`nav-link ${activeTab === 'pomodoro' ? 'active' : ''}`}
            onClick={() => setActiveTab('pomodoro')}
          >
            <Timer size={18} />
            Pomodoro & Sounds
          </button>

          <button 
            className={`nav-link ${activeTab === 'flashcards' ? 'active' : ''}`}
            onClick={() => setActiveTab('flashcards')}
          >
            <BookOpen size={18} />
            Study Flashcards
          </button>

          <button 
            className={`nav-link ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            <HelpCircle size={18} />
            AI & MCP Quiz
          </button>

          <button 
            className={`nav-link ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => setActiveTab('agents')}
          >
            <Cpu size={18} />
            Agent Profile
          </button>
          
          <button 
            className={`nav-link ${activeTab === 'mcp' ? 'active' : ''}`}
            onClick={() => setActiveTab('mcp')}
          >
            <Settings size={18} />
            MCP Config
          </button>
          
          <button 
            className={`nav-link ${activeTab === 'sandbox' ? 'active' : ''}`}
            onClick={() => setActiveTab('sandbox')}
          >
            <ShieldCheck size={18} />
            Security Sandbox
          </button>
          
          <button 
            className={`nav-link ${activeTab === 'demo' ? 'active' : ''}`}
            onClick={() => setActiveTab('demo')}
          >
            <Terminal size={18} />
            Console Trace
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="mcp-status-badge">
            <span className="status-dot"></span>
            <span>MCP Protocol Host: 3000</span>
          </div>
          <button className="btn btn-secondary" onClick={handleReset}>
            <RotateCcw size={14} />
            Reset Systems
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="main-content">
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* 1. DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <>
            <header className="dashboard-header">
              <div className="header-title-area">
                <h1>Dashboard Control</h1>
                <p>Synchronized ADK orchestration of Planner, Optimizer and Scheduler agents.</p>
              </div>
              <div className="actions-row">
                <button className="btn btn-secondary" onClick={fetchState}>Refresh State</button>
              </div>
            </header>

            {/* Orchestrator Form */}
            <section className="card" style={{ marginBottom: '24px' }}>
              <div className="card-title">
                <Layers size={18} style={{ color: 'var(--accent-teal)' }} />
                Initialize Multi-Agent Objective Run
              </div>
              <form onSubmit={handleOrchestrate} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Active Goal Objective</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Launch study beta program" 
                    value={goalObjective} 
                    onChange={e => setGoalObjective(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Target Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={goalDate} 
                    onChange={e => setGoalDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Priority</label>
                  <select 
                    className="form-input" 
                    value={goalPriority} 
                    onChange={e => setGoalPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '45px' }}>
                  <Play size={16} />
                  {loading ? 'Compiling...' : 'Start Execution'}
                </button>
              </form>
            </section>

            {/* ADK Multi-Agent Graph Compilation */}
            <section className="card" style={{ marginBottom: '24px' }}>
              <div className="card-title" style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                <Sliders size={16} style={{ color: 'var(--accent-purple)' }} />
                ADK Multi-Agent Graph Compilation
              </div>
              <div className="graph-container" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 12px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                overflowX: 'auto',
                gap: '8px'
              }}>
                <div className="graph-node-box" style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>Start <span style={{ color: 'var(--text-muted)' }}>(Input Data)</span></span>
                  {renderStatusDot(graphStates.start)}
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                <div className="graph-node-box" style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>Planner Agent <span style={{ color: 'var(--accent-teal)' }}>(Orchestration)</span></span>
                  {renderStatusDot(graphStates.planner)}
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                <div className="graph-node-box" style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>Task Optimizer <span style={{ color: 'var(--accent-purple)' }}>(Eisenhower)</span></span>
                  {renderStatusDot(graphStates.optimizer)}
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                <div className="graph-node-box" style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>Exam Study <span style={{ color: '#ff007f' }}>(Active Recall)</span></span>
                  {renderStatusDot(graphStates.examStudy)}
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                <div className="graph-node-box" style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>Life Scheduler <span style={{ color: 'var(--warning)' }}>(Conflict Check)</span></span>
                  {renderStatusDot(graphStates.scheduler)}
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                <div className="graph-node-box" style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>End <span style={{ color: 'var(--success)' }}>(Final State)</span></span>
                  {renderStatusDot(graphStates.end)}
                </div>
              </div>
            </section>

            {/* Dashboard grid boxes */}
            <div className="grid-3" style={{ marginBottom: '24px' }}>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <User size={16} style={{ color: 'var(--accent-teal)' }} />
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>Active AGENTs</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Planner Agent</span>
                    <span style={{ color: 'var(--success)' }}>ONLINE</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Task Optimizer</span>
                    <span style={{ color: 'var(--success)' }}>ONLINE</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Exam Study Agent</span>
                    <span style={{ color: 'var(--success)' }}>ONLINE</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Life Scheduler</span>
                    <span style={{ color: 'var(--success)' }}>ONLINE</span>
                  </div>
                </div>
              </div>

              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <Code size={16} style={{ color: 'var(--accent-purple)' }} />
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>LOCAL MCP TOOLS</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--accent-purple)' }} />
                    <code>mcp_write_log</code>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--accent-purple)' }} />
                    <code>mcp_read_schedule</code>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--accent-purple)' }} />
                    <code>mcp_validate_sandbox</code>
                  </div>
                </div>
              </div>

              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <CalendarDays size={16} style={{ color: 'var(--warning)' }} />
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>SCHEDULED SLOTS ({state.timeline.length})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', maxHeight: '115px', overflowY: 'auto' }}>
                  {state.timeline.length === 0 ? (
                    <span style={{ color: 'var(--text-muted)' }}>No slots scheduled yet.</span>
                  ) : (
                    state.timeline.map(task => (
                      <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '2px' }}>
                        <span style={{ fontWeight: '500', color: 'var(--accent-teal)' }}>{task.timeSlot}</span>
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '120px' }}>{task.title}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <section className="card">
              <div className="card-title">
                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                Active Compiled Calendar Timeline ({state.targetDate})
              </div>
              {state.timeline.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  No active timeline compiled. Enter a goal above to coordinate.
                </div>
              ) : (
                <div className="timeline-list">
                  {state.timeline.map((task) => (
                    <div 
                      key={task.id} 
                      className={`timeline-item ${
                        task.assignedAgent === 'Planner' ? 'planner-task' : 
                        task.assignedAgent === 'Optimizer' ? 'optimizer-task' : 'scheduler-task'
                      }`}
                    >
                      <div className="timeline-slot">{task.timeSlot}</div>
                      <div className="timeline-details">
                        <div className="timeline-title">{task.title}</div>
                        <div className="timeline-meta">
                          <span className="tag tag-teal">Agent: {task.assignedAgent}</span>
                          <span className="tag tag-purple">Seq: {task.executionOrder}</span>
                          <span className="tag tag-yellow">Effort: {task.complexity}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--success)' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></span>
                        {task.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* 2. STUDY TASK PLANNER VIEW */}
        {activeTab === 'planner' && (
          <>
            <header className="dashboard-header">
              <div className="header-title-area">
                <h1>Study Task Planner</h1>
                <p>Track your local milestones, add notes, and check items to coordinate study workflows.</p>
              </div>
            </header>

            <div className="grid-2">
              <section className="card">
                <div className="card-title">
                  <ListTodo size={18} style={{ color: 'var(--accent-teal)' }} />
                  Add Study Task
                </div>
                <form onSubmit={handleAddTodo} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Task Description</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Read Section 2 notes" 
                      value={todoInput}
                      onChange={e => setTodoInput(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select 
                      className="form-input" 
                      value={todoPriority} 
                      onChange={e => setTodoPriority(e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary">Add Task</button>
                </form>
              </section>

              <section className="card">
                <div className="card-title">
                  <Bookmark size={18} style={{ color: 'var(--accent-purple)' }} />
                  Study Task Checklist ({todos.filter(t => !t.completed).length} remaining)
                </div>
                <div className="todo-list-container">
                  {todos.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No tasks found.</div>
                  ) : (
                    todos.map(t => (
                      <div key={t.id} className={`todo-item ${t.completed ? 'completed' : ''}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input 
                            type="checkbox" 
                            checked={t.completed} 
                            onChange={() => toggleTodo(t.id)}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--accent-teal)', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '14px' }}>{t.text}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className={`tag ${t.priority === 'high' ? 'tag-yellow' : (t.priority === 'medium' ? 'tag-purple' : 'tag-teal')}`}>
                            {t.priority}
                          </span>
                          <button 
                            onClick={() => removeTodo(t.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '13px' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </>
        )}

        {/* 3. POMODORO TIMER VIEW */}
        {activeTab === 'pomodoro' && (
          <>
            <header className="dashboard-header">
              <div className="header-title-area">
                <h1>Pomodoro & Offline Soundscapes</h1>
                <p>Run focus sprints. Toggle synthesized offline background noise to focus without internet dependencies.</p>
              </div>
            </header>

            <div className="grid-2">
              <section className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <button 
                    className={`btn ${timerType === 'focus' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => selectTimerType('focus', 1500)}
                  >
                    Focus (25m)
                  </button>
                  <button 
                    className={`btn ${timerType === 'short' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => selectTimerType('short', 300)}
                  >
                    Short Break (5m)
                  </button>
                  <button 
                    className={`btn ${timerType === 'long' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => selectTimerType('long', 900)}
                  >
                    Long Break (15m)
                  </button>
                </div>

                <div className="pomodoro-display">
                  {formatTimerTime(timeLeft)}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button className="btn btn-primary" onClick={() => setTimerActive(!timerActive)}>
                    {timerActive ? 'Pause' : 'Start'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => selectTimerType(timerType, timerType === 'focus' ? 1500 : (timerType === 'short' ? 300 : 900))}>
                    Reset
                  </button>
                </div>
              </section>

              <section className="card">
                <div className="card-title">
                  <Volume2 size={18} style={{ color: 'var(--accent-teal)' }} />
                  Timer Soundscapes (Web Audio Synth)
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                  These soundtracks are <strong>synthesized locally in real time</strong> using oscillator and gain filters, ensuring complete offline functionality.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button 
                    className={`btn ${soundscape === 'none' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSoundscape('none')}
                    style={{ justifyContent: 'flex-start' }}
                  >
                    🔇 None (Silence)
                  </button>
                  <button 
                    className={`btn ${soundscape === 'lofi' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSoundscape('lofi')}
                    style={{ justifyContent: 'flex-start' }}
                  >
                    🎵 Warm Lofi Chords (Triangle pads + slow sweep)
                  </button>
                  <button 
                    className={`btn ${soundscape === 'rain' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSoundscape('rain')}
                    style={{ justifyContent: 'flex-start' }}
                  >
                    🌧️ Rainforest (Filtered bandpass noise)
                  </button>
                  <button 
                    className={`btn ${soundscape === 'drone' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSoundscape('drone')}
                    style={{ justifyContent: 'flex-start' }}
                  >
                    🌌 Cosmical Drone (Detuned deep sine waves)
                  </button>
                  <button 
                    className={`btn ${soundscape === 'whitenoise' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSoundscape('whitenoise')}
                    style={{ justifyContent: 'flex-start' }}
                  >
                    💨 White Noise (Filtered soft static)
                  </button>
                </div>
              </section>
            </div>
          </>
        )}

        {/* 4. FLASHCARDS VIEW */}
        {activeTab === 'flashcards' && (
          <>
            <header className="dashboard-header">
              <div className="header-title-area">
                <h1>AI & MCP Flashcards</h1>
                <p>Test your conceptual understanding of multi-agent and Model Context Protocol details.</p>
              </div>
            </header>

            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div 
                className={`flashcard-container ${cardFlipped ? 'flipped' : ''}`}
                onClick={() => setCardFlipped(!cardFlipped)}
              >
                <div className="flashcard-inner">
                  <div className="flashcard-front">
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>
                      Question {currentCardIndex + 1} of {flashcards.length}
                    </span>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '600' }}>
                      {flashcards[currentCardIndex].question}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px' }}>
                      Click Card to Flip
                    </p>
                  </div>
                  <div className="flashcard-back">
                    <span style={{ fontSize: '12px', color: 'var(--accent-teal)', textTransform: 'uppercase', marginBottom: '12px' }}>
                      Answer Explanation
                    </span>
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#fff' }}>
                      {flashcards[currentCardIndex].answer}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px' }}>
                      Click Card to Flip
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  className="btn btn-secondary" 
                  disabled={currentCardIndex === 0}
                  onClick={() => { setCurrentCardIndex(prev => prev - 1); setCardFlipped(false); }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Card {currentCardIndex + 1} / {flashcards.length}
                </span>
                <button 
                  className="btn btn-secondary" 
                  disabled={currentCardIndex === flashcards.length - 1}
                  onClick={() => { setCurrentCardIndex(prev => prev + 1); setCardFlipped(false); }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {/* 5. QUIZ MAKER VIEW */}
        {activeTab === 'quiz' && (
          <>
            <header className="dashboard-header">
              <div className="header-title-area">
                <h1>AI & MCP Multi-Agent Quiz Maker</h1>
                <p>Answer these 10 questions to test your architectural knowledge of ADK and MCP.</p>
              </div>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
              {quizQuestions.map((q, qIdx) => (
                <section key={qIdx} className="card">
                  <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
                    Q{qIdx + 1}: {q.q}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {q.a.map((choice, choiceIdx) => {
                      let btnClass = 'quiz-choice-btn';
                      if (quizAnswers[qIdx] === choiceIdx) btnClass += ' selected';
                      
                      if (quizSubmitted) {
                        if (choiceIdx === q.correct) {
                          btnClass += ' correct';
                        } else if (quizAnswers[qIdx] === choiceIdx) {
                          btnClass += ' incorrect';
                        }
                      }

                      return (
                        <button 
                          key={choiceIdx} 
                          className={btnClass}
                          onClick={() => handleSelectQuizAnswer(qIdx, choiceIdx)}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}

              <section className="card" style={{ textAlign: 'center', padding: '30px' }}>
                {quizSubmitted ? (
                  <div>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                      <Award size={48} style={{ color: 'var(--success)', margin: '0 auto 12px auto' }} />
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '700', marginBottom: '6px' }}>
                        Quiz Completed!
                      </h2>
                      <p style={{ fontSize: '16px' }}>
                        Your Score: <strong style={{ color: 'var(--accent-teal)' }}>{quizScore} / 10</strong> ({quizScore * 10}%)
                      </p>
                    </div>
                    <button className="btn btn-secondary" onClick={resetQuiz}>Retake Quiz</button>
                  </div>
                ) : (
                  <div>
                    <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      Ensure you answer all 10 questions before submitting.
                    </p>
                    <button 
                      className="btn btn-primary" 
                      onClick={submitQuiz}
                      disabled={quizAnswers.some(a => a === null)}
                    >
                      Submit Answers
                    </button>
                  </div>
                )}
              </section>
            </div>
          </>
        )}

        {/* 6. AGENTS TAB */}
        {activeTab === 'agents' && (
          <>
            <header className="dashboard-header">
              <div className="header-title-area">
                <h1>Agent Integration Profile</h1>
                <p>Defined operational skills, credentials, and constraints for synced autonomous actors.</p>
              </div>
            </header>

            <div className="grid-3" style={{ marginBottom: '24px' }}>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--accent-teal)' }}></div>
                  <h3 style={{ fontSize: '17px', fontFamily: 'var(--font-display)' }}>Planner Agent</h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                  Responsible for dissecting unstructured high-level goal inputs and parsing milestones, sub-tasks, and structural dependencies.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div><strong>Core Skills:</strong></div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <span className="tag tag-teal">Goal decomposition</span>
                    <span className="tag tag-teal">milestones mapping</span>
                  </div>
                  <div style={{ marginTop: '8px' }}><strong>Default Tools:</strong></div>
                  <code style={{ fontSize: '11px', color: 'var(--accent-teal)' }}>mcp_read_schedule, mcp_write_log</code>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--accent-purple)' }}></div>
                  <h3 style={{ fontSize: '17px', fontFamily: 'var(--font-display)' }}>Optimization Agent</h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                  Validates tasks dependencies graphs, calculates execution critical-paths, and resolves circular conflicts.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div><strong>Core Skills:</strong></div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <span className="tag tag-purple">topological sort</span>
                    <span className="tag tag-purple">dependency resolution</span>
                  </div>
                  <div style={{ marginTop: '8px' }}><strong>Default Tools:</strong></div>
                  <code style={{ fontSize: '11px', color: 'var(--accent-purple)' }}>mcp_validate_sandbox</code>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--warning)' }}></div>
                  <h3 style={{ fontSize: '17px', fontFamily: 'var(--font-display)' }}>Life Scheduler Agent</h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                  Compares optimized action paths against active Google calendar events/locked slots, handles scheduling, and assigns exact hours.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div><strong>Core Skills:</strong></div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <span className="tag tag-yellow">calendar-sync</span>
                    <span className="tag tag-yellow">conflict resolution</span>
                  </div>
                  <div style={{ marginTop: '8px' }}><strong>Default Tools:</strong></div>
                  <code style={{ fontSize: '11px', color: 'var(--warning)' }}>mcp_read_schedule, mcp_write_log</code>
                </div>
              </div>
            </div>

            <section className="card">
              <div className="card-title">
                <Info size={18} style={{ color: 'var(--info)' }} />
                Orchestration Methodologies
              </div>
              <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                <p style={{ marginBottom: '12px' }}>
                  NexusAgent AI uses an **Agent Orchestrator** loop that runs sequential synchronization logic:
                </p>
                <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li><strong>Goal Ingestion:</strong> The Planner parses the objective. If constraints are unmet (violating Zod schemas), the run fails immediately.</li>
                  <li><strong>Optimization Path:</strong> Graph nodes (tasks) are sorted topologically. Circular nodes raise structural workflow warnings.</li>
                  <li><strong>Calendar Synthesis:</strong> The Scheduler slots items, pushing tasks past pre-determined locked lunch breaks (12:00 - 13:00) and team syncs (15:00 - 16:00) automatically.</li>
                </ol>
              </div>
            </section>
          </>
        )}

        {/* 7. MCP CONFIG TAB */}
        {activeTab === 'mcp' && (
          <>
            <header className="dashboard-header">
              <div className="header-title-area">
                <h1>Model Context Protocol (MCP) Server Configuration</h1>
                <p>Review available server capabilities, tools schemas, and resources exposed to AI agents.</p>
              </div>
            </header>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <button 
                className={`btn ${mcpTab === 'tools' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMcpTab('tools')}
              >
                Exposed Schemas
              </button>
              <button 
                className={`btn ${mcpTab === 'playground' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMcpTab('playground')}
              >
                MCP JSON-RPC Client Playground
              </button>
            </div>

            {mcpTab === 'tools' ? (
              <div className="grid-2">
                <section className="card">
                  <div className="card-title" style={{ fontSize: '16px' }}>
                    <Code size={16} style={{ color: 'var(--accent-teal)' }} />
                    Active Protocol Tools (JSON-RPC 2.0)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--accent-teal)' }}>mcp_write_log</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0' }}>Write high-priority console log entries.</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Params: <code>message (string)</code></div>
                    </div>
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--accent-teal)' }}>mcp_read_schedule</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0' }}>Fetch calculated tasks for a YYYY-MM-DD target date.</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Params: <code>date (string)</code></div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--accent-teal)' }}>mcp_validate_sandbox</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0' }}>Test execution patterns in sandbox environments.</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Params: <code>command (string), timeoutMs (number)</code></div>
                    </div>
                  </div>
                </section>

                <section className="card">
                  <div className="card-title" style={{ fontSize: '16px' }}>
                    <Layers size={16} style={{ color: 'var(--accent-purple)' }} />
                    Exposed Resources & Prompts
                  </div>
                  <h4 style={{ fontSize: '14px', marginBottom: '8px', color: '#fff' }}>Exposed URIs:</h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    <li>
                      <div style={{ fontWeight: '600', color: '#fff' }}>schedule://current</div>
                      <div style={{ fontSize: '12px' }}>Returns current compiled timeline json.</div>
                    </li>
                    <li>
                      <div style={{ fontWeight: '600', color: '#fff' }}>system://logs</div>
                      <div style={{ fontSize: '12px' }}>Returns running console tracing log array.</div>
                    </li>
                  </ul>

                  <h4 style={{ fontSize: '14px', marginBottom: '8px', color: '#fff' }}>Registered Templates:</h4>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <div style={{ fontWeight: '600', color: '#fff' }}>optimize-schedule-prompt</div>
                    <div style={{ fontSize: '12px', margin: '4px 0' }}>Prompt instructions template for resolving calendar overlaps.</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Args: <code>slotsCount</code></div>
                  </div>
                </section>
              </div>
            ) : (
              <div className="grid-2">
                <section className="card">
                  <div className="card-title">JSON-RPC 2.0 Request Payload</div>
                  <div className="form-group">
                    <textarea 
                      className="form-input font-mono" 
                      style={{ height: '220px', resize: 'none', fontSize: '13px', background: '#000' }}
                      value={mcpRequest}
                      onChange={e => setMcpRequest(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary" onClick={handleMcpSubmit} style={{ width: '100%' }}>
                    Post to /api/mcp
                  </button>
                </section>

                <section className="card">
                  <div className="card-title">Server Response Output</div>
                  <div 
                    className="font-mono" 
                    style={{ 
                      height: '275px', 
                      background: '#06070a', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '6px', 
                      padding: '16px',
                      fontSize: '12px',
                      overflowY: 'auto',
                      color: 'var(--accent-teal)'
                    }}
                  >
                    {mcpResponse ? (
                      <pre>{JSON.stringify(mcpResponse, null, 2)}</pre>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Send a payload on the left to inspect JSON-RPC response.</span>
                    )}
                  </div>
                </section>
              </div>
            )}
          </>
        )}

        {/* 8. SECURITY SANDBOX TAB */}
        {activeTab === 'sandbox' && (
          <>
            <header className="dashboard-header">
              <div className="header-title-area">
                <h1>Security Sandbox Execution</h1>
                <p>Run agent CLI commands and script validation safely. Exploits and forbidden terms are dynamically blocked.</p>
              </div>
            </header>

            <div className="grid-2" style={{ marginBottom: '24px' }}>
              <section className="card">
                <div className="card-title">Configure Isolation Limits</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Simulated Execution Memory Limit: {sandboxMemory}MB</label>
                    <input 
                      type="range" 
                      min="16" 
                      max="128" 
                      value={sandboxMemory} 
                      onChange={e => setSandboxMemory(Number(e.target.value))}
                      style={{ accentColor: 'var(--accent-teal)' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Simulated Timeout Enforced: {sandboxTimeout}ms</label>
                    <input 
                      type="range" 
                      min="100" 
                      max="5000" 
                      step="100"
                      value={sandboxTimeout} 
                      onChange={e => setSandboxTimeout(Number(e.target.value))}
                      style={{ accentColor: 'var(--accent-teal)' }}
                    />
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <strong>Security Filters Engaged:</strong>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <div>✓ Process isolation check</div>
                      <div>✓ Memory limits filter</div>
                      <div>✓ Command blacklisting</div>
                      <div>✓ Schema validator</div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="card-title">Interactive Terminal Sandbox</div>
                <form onSubmit={handleRunSandbox} style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                  <input 
                    type="text" 
                    className="form-input font-mono" 
                    style={{ flexGrow: 1 }}
                    placeholder="e.g. echo hello, list-tasks, optimize-path, rm -rf /"
                    value={sandboxCmd}
                    onChange={e => setSandboxCmd(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary">Run CLI</button>
                </form>

                <div 
                  className="font-mono" 
                  style={{ 
                    flexGrow: 1,
                    minHeight: '180px',
                    background: '#06070a', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '6px', 
                    padding: '16px',
                    fontSize: '12px',
                    overflowY: 'auto'
                  }}
                >
                  {sandboxOutput ? (
                    <div>
                      <div style={{ color: '#fff', marginBottom: '8px' }}>$ Executing run payload...</div>
                      <div style={{ color: sandboxOutput.status === 'blocked' ? 'var(--danger)' : 'var(--text-secondary)' }}>
                        <strong>Status:</strong> {sandboxOutput.status.toUpperCase()}
                      </div>
                      <div style={{ color: 'var(--text-muted)', margin: '4px 0' }}>
                        Time: {sandboxOutput.executionTimeMs}ms | Memory: {sandboxOutput.memoryUsedMb}MB | Code: {sandboxOutput.exitCode}
                      </div>
                      
                      {sandboxOutput.stdout && (
                        <div style={{ color: 'var(--accent-teal)', marginTop: '8px', whiteSpace: 'pre' }}>
                          <strong>STDOUT:</strong><br />
                          {sandboxOutput.stdout}
                        </div>
                      )}
                      
                      {sandboxOutput.stderr && (
                        <div style={{ color: 'var(--danger)', marginTop: '8px', whiteSpace: 'pre' }}>
                          <strong>STDERR:</strong><br />
                          {sandboxOutput.stderr}
                        </div>
                      )}

                      {sandboxOutput.securityViolations.length > 0 && (
                        <div style={{ color: 'var(--danger)', border: '1px dashed var(--danger)', padding: '8px', borderRadius: '4px', marginTop: '10px' }}>
                          <strong>Violated Rules:</strong>
                          <ul style={{ paddingLeft: '16px', marginTop: '4px' }}>
                            {sandboxOutput.securityViolations.map((v, i) => <li key={i}>{v}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Type command above to execute inside the simulated isolation shell. Try standard CLI inputs or forbidden parameters.</span>
                  )}
                </div>
              </section>
            </div>
          </>
        )}

        {/* 9. CONSOLE TRACE TAB */}
        {activeTab === 'demo' && (
          <>
            <header className="dashboard-header">
              <div className="header-title-area">
                <h1>Console Execution Tracing</h1>
                <p>Detailed chronological walkthrough of Planner, Optimization and Life Scheduler logs synchronized over HTTP.</p>
              </div>
            </header>

            <section className="console-container">
              <div className="console-header">
                <div className="console-dots">
                  <div className="console-dot" style={{ backgroundColor: '#ef4444' }}></div>
                  <div className="console-dot" style={{ backgroundColor: '#f59e0b' }}></div>
                  <div className="console-dot" style={{ backgroundColor: '#10b981' }}></div>
                </div>
                <span>nexusagent_orchestrator.log</span>
                <span className="font-mono">LIVE TRACE</span>
              </div>
              <div className="console-body">
                {state.logs.map((log, index) => (
                  <div key={index} className={getLogClassName(log)}>
                    {log}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
