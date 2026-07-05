import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { AgentOrchestrator } from './server/agents.js';
import { mcpHandler } from './server/mcp.js';
import { executeInSandbox } from './server/sandbox.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory Database state
const dbState = {
  objective: "Launch product beta sprint",
  targetDate: new Date().toISOString().substring(0, 10),
  priority: "high",
  timeline: [
    { id: "T1", title: "Define specifications & scope", durationMinutes: 60, dependencies: [], assignedAgent: "Planner", complexity: "Low", executionOrder: 1, timeSlot: "09:00 - 10:00", status: "Scheduled" },
    { id: "T2", title: "Code initial prototype implementation", durationMinutes: 180, dependencies: ["T1"], assignedAgent: "Planner", complexity: "High", executionOrder: 2, timeSlot: "10:10 - 13:10", status: "Scheduled" },
    { id: "T3", title: "Perform local sandbox testing", durationMinutes: 90, dependencies: ["T2"], assignedAgent: "Optimizer", complexity: "Medium", executionOrder: 3, timeSlot: "13:20 - 14:50", status: "Scheduled" },
    { id: "T4", title: "Deploy release version to staging", durationMinutes: 60, dependencies: ["T3"], assignedAgent: "Scheduler", complexity: "Low", executionOrder: 4, timeSlot: "16:00 - 17:00", status: "Scheduled" }
  ],
  logs: [
    `[${new Date().toISOString().substring(11, 19)}] [System] NexusAgent AI Bootstrapped successfully.`,
    `[${new Date().toISOString().substring(11, 19)}] [Planner Agent] Pre-loaded default objective details.`,
    `[${new Date().toISOString().substring(11, 19)}] [Life Scheduler Agent] Synced 2 conflict calendar slots.`
  ]
};

const orchestrator = new AgentOrchestrator();

// API: Get active state
app.get('/api/state', (req, res) => {
  res.json(dbState);
});

// API: Orchestrate Agents
app.post('/api/orchestrate', async (req, res) => {
  const { objective, targetDate, priority } = req.body;
  if (!objective || !targetDate || !priority) {
    return res.status(400).json({ error: "Missing required orchestration fields" });
  }

  const timestamp = new Date().toISOString().substring(11, 19);
  dbState.logs.push(`[${timestamp}] [System] Orchestrating Multi-Agent flow for objective: "${objective}"`);
  
  const result = await orchestrator.runWorkflow(objective, targetDate, priority);
  
  if (result.success) {
    dbState.objective = result.objective;
    dbState.targetDate = result.targetDate;
    dbState.priority = result.priority;
    dbState.timeline = result.timeline;
    dbState.logs.push(...result.logs);
    res.json({ success: true, timeline: result.timeline });
  } else {
    dbState.logs.push(...result.logs);
    res.status(500).json({ success: false, error: result.error });
  }
});

// API: MCP Protocol Route
app.post('/api/mcp', async (req, res) => {
  const response = await mcpHandler(req.body, dbState);
  res.json(response);
});

// API: Sandbox run simulator
app.post('/api/sandbox/run', (req, res) => {
  const { command, timeoutMs, memoryLimitMb } = req.body;
  const result = executeInSandbox(command, { timeoutMs, memoryLimitMb });
  const timestamp = new Date().toISOString().substring(11, 19);
  dbState.logs.push(`[${timestamp}] [Sandbox] Executed CLI: "${command}" | Exit Code: ${result.exitCode} | Status: ${result.status}`);
  res.json(result);
});

// API: Reset DB state
app.post('/api/reset', (req, res) => {
  const timestamp = new Date().toISOString().substring(11, 19);
  dbState.objective = "Launch product beta sprint";
  dbState.targetDate = new Date().toISOString().substring(0, 10);
  dbState.priority = "high";
  dbState.timeline = [
    { id: "T1", title: "Define specifications & scope", durationMinutes: 60, dependencies: [], assignedAgent: "Planner", complexity: "Low", executionOrder: 1, timeSlot: "09:00 - 10:00", status: "Scheduled" },
    { id: "T2", title: "Code initial prototype implementation", durationMinutes: 180, dependencies: ["T1"], assignedAgent: "Planner", complexity: "High", executionOrder: 2, timeSlot: "10:10 - 13:10", status: "Scheduled" },
    { id: "T3", title: "Perform local sandbox testing", durationMinutes: 90, dependencies: ["T2"], assignedAgent: "Optimizer", complexity: "Medium", executionOrder: 3, timeSlot: "13:20 - 14:50", status: "Scheduled" },
    { id: "T4", title: "Deploy release version to staging", durationMinutes: 60, dependencies: ["T3"], assignedAgent: "Scheduler", complexity: "Low", executionOrder: 4, timeSlot: "16:00 - 17:00", status: "Scheduled" }
  ];
  dbState.logs = [
    `[${timestamp}] [System] Database state reset to default.`,
    `[${timestamp}] [Planner Agent] Pre-loaded default objective details.`,
    `[${timestamp}] [Life Scheduler Agent] Synced 2 conflict calendar slots.`
  ];
  res.json({ success: true });
});

// Vite middleware configuration for serving the frontend React application
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  const vite = await import('vite');
  const viteDevServer = await vite.createServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(viteDevServer.middlewares);
}

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` NexusAgent AI Orchestrator running on:  `);
  console.log(` http://localhost:${PORT}                 `);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'} `);
  console.log(`=========================================`);
});
