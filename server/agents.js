import { AgentGoalSchema } from './sandbox.js';

// Base ADK Agent definition
export class ADKAgent {
  constructor(name, skills = [], tools = []) {
    this.name = name;
    this.skills = skills;
    this.tools = tools;
    this.logs = [];
  }

  log(message) {
    const timestamp = new Date().toISOString().substring(11, 19);
    this.logs.push(`[${timestamp}] [${this.name}] ${message}`);
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

// 1. Planner Agent
export class PlannerAgent extends ADKAgent {
  constructor() {
    super(
      'Planner Agent',
      ['goal-decomposition', 'milestone-setting', 'prioritization'],
      ['mcp_read_schedule', 'mcp_write_log']
    );
  }

  execute(goalInput) {
    this.clearLogs();
    this.log(`Received objective: "${goalInput.objective}"`);

    // Validation using sandbox schemas
    const validation = AgentGoalSchema.safeParse(goalInput);
    if (!validation.success) {
      const errorMsg = validation.error.errors.map(e => e.message).join(', ');
      this.log(`Validation Failed: ${errorMsg}`);
      throw new Error(`Planner input validation failed: ${errorMsg}`);
    }

    this.log(`Decomposing goal into executable sub-tasks...`);

    // Smart mock decomposition based on common themes
    const obj = goalInput.objective.toLowerCase();
    let tasks = [];

    if (obj.includes('launch') || obj.includes('product') || obj.includes('project')) {
      tasks = [
        { id: 'T1', title: 'Define specifications & scope', durationMinutes: 60, dependencies: [], assignedAgent: 'Planner' },
        { id: 'T2', title: 'Code initial prototype implementation', durationMinutes: 180, dependencies: ['T1'], assignedAgent: 'Planner' },
        { id: 'T3', title: 'Perform local sandbox testing', durationMinutes: 90, dependencies: ['T2'], assignedAgent: 'Optimizer' },
        { id: 'T4', title: 'Deploy release version to staging', durationMinutes: 60, dependencies: ['T3'], assignedAgent: 'Scheduler' }
      ];
    } else if (obj.includes('exam') || obj.includes('study') || obj.includes('learn')) {
      tasks = [
        { id: 'T1', title: 'Gather study syllabus & review materials', durationMinutes: 45, dependencies: [], assignedAgent: 'Planner' },
        { id: 'T2', title: 'Read core textbook theory sections', durationMinutes: 120, dependencies: ['T1'], assignedAgent: 'Planner' },
        { id: 'T3', title: 'Solve sample practice problems', durationMinutes: 90, dependencies: ['T2'], assignedAgent: 'Optimizer' },
        { id: 'T4', title: 'Take comprehensive timed mock exam', durationMinutes: 150, dependencies: ['T3'], assignedAgent: 'Scheduler' }
      ];
    } else {
      // Default fallback breakdown
      tasks = [
        { id: 'T1', title: 'Research topic and gather references', durationMinutes: 60, dependencies: [], assignedAgent: 'Planner' },
        { id: 'T2', title: 'Draft main implementation plan outline', durationMinutes: 90, dependencies: ['T1'], assignedAgent: 'Planner' },
        { id: 'T3', title: 'Optimize resource constraints & costs', durationMinutes: 60, dependencies: ['T2'], assignedAgent: 'Optimizer' },
        { id: 'T4', title: 'Schedule calendar slots & notify team', durationMinutes: 45, dependencies: ['T3'], assignedAgent: 'Scheduler' }
      ];
    }

    this.log(`Successfully split goal into ${tasks.length} sub-tasks.`);
    return {
      success: true,
      objective: goalInput.objective,
      targetDate: goalInput.targetDate,
      priority: goalInput.priority,
      tasks
    };
  }
}

// 2. Task Optimization Agent
export class TaskOptimizationAgent extends ADKAgent {
  constructor() {
    super(
      'Task Optimization Agent',
      ['topological-sorting', 'dependency-resolution', 'effort-estimation'],
      ['mcp_validate_sandbox']
    );
  }

  execute(plannerOutput) {
    this.clearLogs();
    const { tasks, objective } = plannerOutput;
    this.log(`Analyzing dependencies for ${tasks.length} tasks...`);

    // Check for circular dependencies & run topological sort
    const adjList = {};
    const inDegree = {};
    const taskMap = {};

    tasks.forEach(t => {
      adjList[t.id] = [];
      inDegree[t.id] = 0;
      taskMap[t.id] = t;
    });

    tasks.forEach(t => {
      t.dependencies.forEach(depId => {
        if (adjList[depId]) {
          adjList[depId].push(t.id);
          inDegree[t.id]++;
        } else {
          this.log(`Warning: Task ${t.id} references non-existent dependency ${depId}`);
        }
      });
    });

    // Queue for sorting
    const queue = [];
    Object.keys(inDegree).forEach(id => {
      if (inDegree[id] === 0) {
        queue.push(id);
      }
    });

    const orderedIds = [];
    while (queue.length > 0) {
      const curr = queue.shift();
      orderedIds.push(curr);

      adjList[curr].forEach(neighbor => {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      });
    }

    // If orderedIds.length is less than tasks.length, there is a cycle!
    if (orderedIds.length < tasks.length) {
      this.log(`CRITICAL: Circular dependency detected in planner tasks!`);
      throw new Error("Circular dependency detected during task optimization.");
    }

    const orderedTasks = orderedIds.map(id => {
      const task = taskMap[id];
      // Estimate optimal focus weight/score based on priorities and duration
      const complexity = task.durationMinutes > 120 ? 'High' : (task.durationMinutes > 60 ? 'Medium' : 'Low');
      return {
        ...task,
        complexity,
        executionOrder: orderedIds.indexOf(id) + 1
      };
    });

    this.log(`Topological sort complete. Optimal path: ${orderedIds.join(' -> ')}`);
    return {
      success: true,
      objective,
      orderedTasks
    };
  }
}

// 3. Life Scheduler Agent
export class LifeSchedulerAgent extends ADKAgent {
  constructor() {
    super(
      'Life Scheduler Agent',
      ['calendar-sync', 'conflict-resolution', 'timeframe-allocation'],
      ['mcp_read_schedule', 'mcp_write_log']
    );
    // Mock user schedule conflicts
    this.lockedBlocks = [
      { start: '12:00', end: '13:00', label: 'Lunch Break' },
      { start: '15:00', end: '16:00', label: 'Weekly Team Synch' }
    ];
  }

  execute(optimizerOutput, targetDate) {
    this.clearLogs();
    const { orderedTasks, objective } = optimizerOutput;
    this.log(`Starting scheduling for target date: ${targetDate}`);
    this.log(`Analyzing user calendar for standard conflicts on date...`);

    this.lockedBlocks.forEach(block => {
      this.log(`Found locked event: ${block.label} (${block.start} - ${block.end})`);
    });

    let currentHour = 9; // Start work at 9:00 AM
    let currentMinute = 0;
    const timeline = [];

    const formatTime = (h, m) => {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      return `${hh}:${mm}`;
    };

    const addMinutes = (h, m, duration) => {
      let newM = m + duration;
      let newH = h + Math.floor(newM / 60);
      newM = newM % 60;
      return [newH, newM];
    };

    const isConflicting = (startH, startM, endH, endM) => {
      const sVal = startH * 60 + startM;
      const eVal = endH * 60 + endM;

      for (const block of this.lockedBlocks) {
        const [bsH, bsM] = block.start.split(':').map(Number);
        const [beH, beM] = block.end.split(':').map(Number);
        const bsVal = bsH * 60 + bsM;
        const beVal = beH * 60 + beM;

        // Check intersection
        if (sVal < beVal && eVal > bsVal) {
          return block;
        }
      }
      return null;
    };

    orderedTasks.forEach(task => {
      let duration = task.durationMinutes;
      let [nextH, nextM] = addMinutes(currentHour, currentMinute, duration);

      // Check conflict
      let conflict = isConflicting(currentHour, currentMinute, nextH, nextM);

      while (conflict) {
        this.log(`Conflict detected for "${task.title}" with "${conflict.label}". Pushing task past conflict.`);
        // Move current time to the end of the conflicting block
        const [ceH, ceM] = conflict.end.split(':').map(Number);
        currentHour = ceH;
        currentMinute = ceM;

        [nextH, nextM] = addMinutes(currentHour, currentMinute, duration);
        conflict = isConflicting(currentHour, currentMinute, nextH, nextM);
      }

      const slotStart = formatTime(currentHour, currentMinute);
      const slotEnd = formatTime(nextH, nextM);

      timeline.push({
        ...task,
        timeSlot: `${slotStart} - ${slotEnd}`,
        status: 'Scheduled'
      });

      this.log(`Allocated slot for "${task.title}": ${slotStart} - ${slotEnd}`);

      // Advance current time
      currentHour = nextH;
      currentMinute = nextM;

      // Give 10 minutes buffer after task
      [currentHour, currentMinute] = addMinutes(currentHour, currentMinute, 10);
    });

    this.log(`Successfully compiled final synchronized calendar.`);
    return {
      success: true,
      objective,
      targetDate,
      timeline
    };
  }
}

// Orchestrator to synchronize agent executions
export class AgentOrchestrator {
  constructor() {
    this.planner = new PlannerAgent();
    this.optimizer = new TaskOptimizationAgent();
    this.scheduler = new LifeSchedulerAgent();
  }

  async runWorkflow(objective, targetDate, priority) {
    const runLogs = [];
    const pushLogs = (agentLogs) => {
      runLogs.push(...agentLogs);
    };

    try {
      // Step 1: Planning
      const plannerOutput = this.planner.execute({ objective, targetDate, priority });
      pushLogs(this.planner.getLogs());

      // Step 2: Optimization
      const optimizerOutput = this.optimizer.execute(plannerOutput);
      pushLogs(this.optimizer.getLogs());

      // Step 3: Life Scheduling
      const schedulerOutput = this.scheduler.execute(optimizerOutput, targetDate);
      pushLogs(this.scheduler.getLogs());

      return {
        success: true,
        objective,
        targetDate,
        priority,
        plan: plannerOutput.tasks,
        optimized: optimizerOutput.orderedTasks,
        timeline: schedulerOutput.timeline,
        logs: runLogs
      };
    } catch (error) {
      runLogs.push(`[CRITICAL ORCHESTRATION ERROR] ${error.message}`);
      return {
        success: false,
        error: error.message,
        logs: runLogs
      };
    }
  }
}
