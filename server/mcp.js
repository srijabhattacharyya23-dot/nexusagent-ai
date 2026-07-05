import { executeInSandbox } from './sandbox.js';

// Schema & Config for our MCP Server
export const MCP_SERVER_INFO = {
  name: "NexusAgent MCP Server",
  version: "1.0.0",
  protocolVersion: "2024-11-05",
  capabilities: {
    tools: {
      list: true,
      call: true
    },
    resources: {
      list: true,
      read: true
    },
    prompts: {
      list: true,
      get: true
    }
  }
};

// Available Tools list
export const MCP_TOOLS = [
  {
    name: "mcp_write_log",
    description: "Write a high-priority entry to the shared system logs.",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "The content of the log entry to write." }
      },
      required: ["message"]
    }
  },
  {
    name: "mcp_read_schedule",
    description: "Read the current list of scheduled tasks for a specific date.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Target date in YYYY-MM-DD format." }
      },
      required: ["date"]
    }
  },
  {
    name: "mcp_validate_sandbox",
    description: "Submit a command execution request through the security validation sandbox.",
    inputSchema: {
      type: "object",
      properties: {
        command: { type: "string", description: "The command to run in the sandbox." },
        timeoutMs: { type: "number", description: "Enforced timeout threshold (ms)." }
      },
      required: ["command"]
    }
  }
];

// Available Resources list
export const MCP_RESOURCES = [
  {
    uri: "schedule://current",
    name: "Active Orchestrated Schedule",
    description: "The timeline currently compiled by the Life Scheduler agent.",
    mimeType: "application/json"
  },
  {
    uri: "system://logs",
    name: "NexusAgent Execution Logs",
    description: "Live console logging for all multi-agent operations.",
    mimeType: "text/plain"
  }
];

// Available Prompts list
export const MCP_PROMPTS = [
  {
    name: "optimize-schedule-prompt",
    description: "A pre-configured instructions template for optimizing overloaded calendars.",
    arguments: [
      { name: "slotsCount", description: "Number of overlapping tasks to resolve.", required: true }
    ]
  }
];

// JSON-RPC 2.0 MCP Request Handler
export async function mcpHandler(jsonRpcRequest, dbState = {}) {
  const { jsonrpc, id, method, params } = jsonRpcRequest;

  if (jsonrpc !== "2.0") {
    return {
      jsonrpc: "2.0",
      id: id || null,
      error: { code: -32600, message: "Invalid Request: Must be JSON-RPC 2.0" }
    };
  }

  const successResponse = (result) => ({
    jsonrpc: "2.0",
    id,
    result
  });

  const errorResponse = (code, message, data) => ({
    jsonrpc: "2.0",
    id,
    error: { code, message, data }
  });

  try {
    switch (method) {
      case "initialize":
        return successResponse({
          serverInfo: MCP_SERVER_INFO,
          capabilities: MCP_SERVER_INFO.capabilities
        });

      case "tools/list":
        return successResponse({ tools: MCP_TOOLS });

      case "tools/call": {
        const { name, arguments: args } = params || {};
        if (!name) return errorResponse(-32602, "Invalid params: Missing tool name");

        switch (name) {
          case "mcp_write_log": {
            const msg = args?.message;
            if (!msg) return errorResponse(-32602, "Missing 'message' argument");
            const entry = `[MCP Write Log] ${msg}`;
            if (dbState.logs) dbState.logs.push(`[${new Date().toISOString().substring(11, 19)}] ${entry}`);
            return successResponse({
              content: [{ type: "text", text: `Log successfully recorded: "${msg}"` }]
            });
          }

          case "mcp_read_schedule": {
            const date = args?.date;
            if (!date) return errorResponse(-32602, "Missing 'date' argument");
            const timeline = dbState.timeline || [];
            return successResponse({
              content: [{
                type: "text",
                text: JSON.stringify({ date, timelineCount: timeline.length, timeline }, null, 2)
              }]
            });
          }

          case "mcp_validate_sandbox": {
            const cmd = args?.command;
            if (!cmd) return errorResponse(-32602, "Missing 'command' argument");
            const sandboxResult = executeInSandbox(cmd, { timeoutMs: args.timeoutMs });
            return successResponse({
              content: [{
                type: "text",
                text: JSON.stringify(sandboxResult, null, 2)
              }]
            });
          }

          default:
            return errorResponse(-32601, `Method not found: Tool '${name}' does not exist.`);
        }
      }

      case "resources/list":
        return successResponse({ resources: MCP_RESOURCES });

      case "resources/read": {
        const { uri } = params || {};
        if (!uri) return errorResponse(-32602, "Invalid params: Missing resource URI");

        switch (uri) {
          case "schedule://current":
            return successResponse({
              contents: [{
                uri,
                mimeType: "application/json",
                text: JSON.stringify(dbState.timeline || [], null, 2)
              }]
            });

          case "system://logs":
            return successResponse({
              contents: [{
                uri,
                mimeType: "text/plain",
                text: (dbState.logs || []).join("\n")
              }]
            });

          default:
            return errorResponse(-32602, `Resource not found: ${uri}`);
        }
      }

      case "prompts/list":
        return successResponse({ prompts: MCP_PROMPTS });

      case "prompts/get": {
        const { name: promptName, arguments: promptArgs } = params || {};
        if (!promptName) return errorResponse(-32602, "Invalid params: Missing prompt name");

        if (promptName === "optimize-schedule-prompt") {
          const slots = promptArgs?.slotsCount || "3";
          return successResponse({
            description: "Optimize schedule template instructions",
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `You are an expert scheduler. There are ${slots} overlapping slots on the calendar. Provide recommendations on how to merge, delegate, or defer these tasks prioritizing high-importance objectives first.`
                }
              }
            ]
          });
        }
        return errorResponse(-32602, `Prompt not found: ${promptName}`);
      }

      default:
        return errorResponse(-32601, `Method not found: '${method}'`);
    }
  } catch (error) {
    return errorResponse(-32603, `Internal JSON-RPC Error: ${error.message}`);
  }
}
