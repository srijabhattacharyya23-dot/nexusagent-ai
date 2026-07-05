import { z } from 'zod';

// Input Schemas
export const AgentGoalSchema = z.object({
  objective: z.string().min(3, "Objective must be at least 3 characters").max(200, "Objective is too long"),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Target date must be in YYYY-MM-DD format"),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  notes: z.string().optional()
});

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(2).max(100),
  durationMinutes: z.number().int().positive().max(480), // Max 8 hours per task
  dependencies: z.array(z.string()).default([]),
  assignedAgent: z.enum(['Planner', 'Optimizer', 'Scheduler'])
});

export const CommandSchema = z.object({
  command: z.string().min(1, "Command cannot be empty"),
  timeoutMs: z.number().int().positive().max(10000).default(5000),
  memoryLimitMb: z.number().int().positive().max(512).default(128)
});

// Forbidden CLI terms to prevent shell injection / arbitrary execution
const FORBIDDEN_PATTERNS = [
  /rm\s+/i, /del\s+/i, /format\s+/i, /mkfs\s+/i, /sudo\s+/i, /chmod\s+/i, /chown\s+/i,
  />\s*\/etc/i, /\|\s*bash/i, /sh\s+/i, /powershell/i, /cmd\.exe/i, /reg\s+/i, /nuke/i,
  /\.\.\/\.\./, // prevent path traversal
];

// Sandbox CLI command runner simulator
export function executeInSandbox(rawCommand, config = {}) {
  const timeoutMs = config.timeoutMs || 2000;
  const memoryLimitMb = config.memoryLimitMb || 64;

  const result = {
    stdout: '',
    stderr: '',
    exitCode: 0,
    executionTimeMs: 0,
    memoryUsedMb: 0,
    securityViolations: [],
    status: 'success'
  };

  const startTime = Date.now();

  // Validate command shape using zod
  try {
    CommandSchema.parse({ command: rawCommand, timeoutMs, memoryLimitMb });
  } catch (err) {
    result.status = 'error';
    result.exitCode = 1;
    result.stderr = `Input Validation Error: ${err.errors.map(e => e.message).join(', ')}`;
    return result;
  }

  // Security checks
  const violations = [];
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(rawCommand)) {
      violations.push(`Forbidden pattern matched: ${pattern.toString()}`);
    }
  }

  if (violations.length > 0) {
    result.status = 'blocked';
    result.exitCode = 403;
    result.stderr = `SECURITY ALERT: Sandbox blocked command execution.`;
    result.securityViolations = violations;
    return result;
  }

  // Simulated execution of allowed safe CLI tools
  const commandParts = rawCommand.trim().split(/\s+/);
  const toolName = commandParts[0].toLowerCase();
  const args = commandParts.slice(1);

  result.memoryUsedMb = Math.floor(Math.random() * 15) + 12; // simulated basic agent footprint 12-27MB

  if (result.memoryUsedMb > memoryLimitMb) {
    result.status = 'oom';
    result.exitCode = 137;
    result.stderr = `FATAL ERROR: Memory limit of ${memoryLimitMb}MB exceeded (Attempted to use ${result.memoryUsedMb}MB).`;
    result.executionTimeMs = Date.now() - startTime;
    return result;
  }

  // Check timeout
  const mockDuration = Math.floor(Math.random() * 200) + 50; // Mock 50-250ms duration
  if (mockDuration > timeoutMs) {
    result.status = 'timeout';
    result.exitCode = 124;
    result.stderr = `FATAL ERROR: Execution timed out after ${timeoutMs}ms.`;
    result.executionTimeMs = timeoutMs;
    return result;
  }

  result.executionTimeMs = mockDuration;

  switch (toolName) {
    case 'echo':
      result.stdout = args.join(' ');
      break;
    case 'agent-status':
      result.stdout = JSON.stringify({
        system: "NexusAgent AI Orchestrator",
        health: "GREEN",
        uptime: "3600s",
        activeAgents: ["Planner", "Optimizer", "Scheduler"],
        mcpStatus: "CONNECTED"
      }, null, 2);
      break;
    case 'list-tasks':
      result.stdout = "ID    | Task Name                  | Assignee  | Status\n" +
                      "------------------------------------------------------\n" +
                      "T-001 | Analyze schedule conflicts | Optimizer | COMPLETED\n" +
                      "T-002 | Align task timeframes      | Scheduler | PENDING\n" +
                      "T-003 | Compile execution roadmap  | Planner   | RUNNING";
      break;
    case 'optimize-path':
      result.stdout = "Running Topological Sort Optimization...\n" +
                      "Analyzing dependencies: [T-001] -> [T-002]\n" +
                      "Success: Found optimal sequence without circular dependencies.\n" +
                      "Execution Sequence: T-001, then T-002, then T-003.";
      break;
    case 'ls':
    case 'dir':
      result.stdout = "Directory: c:\\Users\\Asus\\KAGGLE\n" +
                      "07/05/2026  09:00 PM    <DIR>          server\n" +
                      "07/05/2026  09:00 PM    <DIR>          src\n" +
                      "07/05/2026  09:00 PM             1,024 package.json\n" +
                      "07/05/2026  09:00 PM               300 vite.config.js\n" +
                      "07/05/2026  09:00 PM               450 index.html";
      break;
    default:
      result.exitCode = 127;
      result.stderr = `Command not found or not supported in sandbox environment: '${toolName}'. Available tools: echo, agent-status, list-tasks, optimize-path, ls, dir.`;
      result.status = 'error';
  }

  return result;
}
