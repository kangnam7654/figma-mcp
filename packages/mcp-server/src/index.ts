#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createWebSocketServer } from "./websocket-server.js";
import { FigmaBridge } from "./figma-bridge.js";
import { createMcpServer } from "./mcp-server.js";
import { logger } from "./utils/logger.js";

const WS_PORT = parseInt(process.env.WS_PORT || "3055", 10);

async function main(): Promise<void> {
  logger.info("Starting Figma MCP server...");

  // 1. Start WebSocket server
  const wsServer = createWebSocketServer(WS_PORT);

  // 2. Create FigmaBridge (connects to our own WS server as internal client)
  const bridge = new FigmaBridge(`ws://localhost:${WS_PORT}`);
  await bridge.connect();

  // 3. Create MCP server with all tools
  const mcpServer = createMcpServer(bridge);

  // 4. Connect MCP server to stdio transport
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);

  logger.info(`Figma MCP server running. WebSocket on port ${WS_PORT}`);

  // Graceful shutdown
  const shutdown = (): void => {
    logger.info("Shutting down...");
    bridge.disconnect();
    wsServer.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  logger.error("Fatal error:", err);
  process.exit(1);
});
