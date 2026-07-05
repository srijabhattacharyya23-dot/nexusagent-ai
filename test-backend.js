import { executeInSandbox } from './server/sandbox.js';
import { AgentOrchestrator } from './server/agents.js';
import { mcpHandler } from './server/mcp.js';

let failedTestsCount = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    failedTestsCount++;
  } else {
    console.log(`  [PASS] ${message}`);
  }
}

async function runTests() {
  console.log("=========================================");
  console.log(" Starting Automated NexusAgent AI Tests...");
  console.log("=========================================");

  // 1. Sandbox Tests
  console.log("\n[1] Testing Security Sandbox Simulators:");
  
  const echoResult = executeInSandbox("echo Nexus-Activated");
  assert(echoResult.status === "success", "Echo command should run successfully");
  assert(echoResult.stdout === "Nexus-Activated", "Echo output should match parameters");

  const malResult = executeInSandbox("rm -rf /usr/bin");
  assert(malResult.status === "blocked", "Malicious command 'rm -rf' must be blocked");
  assert(malResult.exitCode === 403, "Blocked command should have code 403");
  assert(malResult.securityViolations.length > 0, "Blocked command should include security violations");

  const fakeCmdResult = executeInSandbox("nonexistent-command-name");
  assert(fakeCmdResult.status === "error", "Unknown command should return error status");
  assert(fakeCmdResult.exitCode === 127, "Unknown command should exit with 127");

  // 2. Orchestration Engine Tests
  console.log("\n[2] Testing Multi-Agent Orchestrator:");
  
  const orchestrator = new AgentOrchestrator();
  const workflowResult = await orchestrator.runWorkflow(
    "Build a learning curriculum",
    "2026-07-06",
    "high"
  );

  assert(workflowResult.success === true, "Orchestration workflow should run successfully");
  assert(workflowResult.plan.length > 0, "Planner should generate sub-tasks");
  assert(workflowResult.optimized.length === workflowResult.plan.length, "Optimizer should order all planner tasks");
  assert(workflowResult.timeline.length > 0, "Scheduler should schedule tasks on calendar");
  
  // Verify schedule has timeSlots
  assert(workflowResult.timeline[0].timeSlot !== undefined, "Scheduled tasks should have slot times");

  // 3. MCP JSON-RPC Tests
  console.log("\n[3] Testing MCP JSON-RPC Server Implementation:");

  const dbState = { logs: [], timeline: [] };

  const initResponse = await mcpHandler({
    jsonrpc: "2.0",
    id: 100,
    method: "initialize",
    params: {}
  }, dbState);

  assert(initResponse.id === 100, "Response ID must match request ID");
  assert(initResponse.result.serverInfo.name === "NexusAgent MCP Server", "Server name should be matching");

  const toolCallResponse = await mcpHandler({
    jsonrpc: "2.0",
    id: 101,
    method: "tools/call",
    params: {
      name: "mcp_write_log",
      arguments: {
        message: "Automated test script verification log entry"
      }
    }
  }, dbState);

  assert(toolCallResponse.id === 101, "Response ID should match tool call request ID");
  assert(toolCallResponse.result.content[0].text.includes("successfully recorded"), "Response should confirm success logging");
  assert(dbState.logs.length === 1, "State logs should have exactly 1 record added");

  console.log("\n=========================================");
  if (failedTestsCount === 0) {
    console.log(" ALL TESTS PASSED SUCCESSFULLY! ✅");
    console.log("=========================================");
    process.exit(0);
  } else {
    console.error(` ${failedTestsCount} TEST(S) FAILED! ❌`);
    console.log("=========================================");
    process.exit(1);
  }
}

runTests();
