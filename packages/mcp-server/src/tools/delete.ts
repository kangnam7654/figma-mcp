import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { FigmaBridge } from "../figma-bridge.js";

export function registerDeleteTools(
  server: McpServer,
  bridge: FigmaBridge,
): void {
  server.tool(
    "delete_node",
    "Delete a single node from the Figma document.",
    {
      nodeId: z.string().describe("ID of the node to delete"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("delete_node", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (error) {
        return {
          content: [
            { type: "text" as const, text: `Error: ${(error as Error).message}` },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "delete_nodes",
    "Delete multiple nodes from the Figma document.",
    {
      nodeIds: z
        .array(z.string())
        .describe("Array of node IDs to delete"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("delete_nodes", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (error) {
        return {
          content: [
            { type: "text" as const, text: `Error: ${(error as Error).message}` },
          ],
          isError: true,
        };
      }
    },
  );
}
