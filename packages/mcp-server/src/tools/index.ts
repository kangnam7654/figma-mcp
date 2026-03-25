import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { FigmaBridge } from "../figma-bridge.js";
import { registerConnectionTools } from "./connection.js";
import { registerDocumentTools } from "./document.js";
import { registerReadTools } from "./read.js";
import { registerCreateTools } from "./create.js";
import { registerUpdateTools } from "./update.js";
import { registerStylingTools } from "./styling.js";
import { registerLayoutTools } from "./layout.js";
import { registerDeleteTools } from "./delete.js";
import { registerVariableTools } from "./variables.js";

export function registerAllTools(
  server: McpServer,
  bridge: FigmaBridge,
): void {
  registerConnectionTools(server, bridge);
  registerDocumentTools(server, bridge);
  registerReadTools(server, bridge);
  registerCreateTools(server, bridge);
  registerUpdateTools(server, bridge);
  registerStylingTools(server, bridge);
  registerLayoutTools(server, bridge);
  registerDeleteTools(server, bridge);
  registerVariableTools(server, bridge);
}
