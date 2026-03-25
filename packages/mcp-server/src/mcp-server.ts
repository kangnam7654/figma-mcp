import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { FigmaBridge } from "./figma-bridge.js";
import { registerAllTools } from "./tools/index.js";

export function createMcpServer(bridge: FigmaBridge): McpServer {
  const server = new McpServer({
    name: "figma-mcp",
    version: "0.1.0",
  });

  registerAllTools(server, bridge);

  return server;
}
