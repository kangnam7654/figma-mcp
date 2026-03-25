import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { FigmaBridge } from "../figma-bridge.js";
import { NodeTypeEnum } from "../types.js";

export function registerReadTools(
  server: McpServer,
  bridge: FigmaBridge,
): void {
  server.tool(
    "get_selection",
    "Get the currently selected nodes in Figma.",
    {},
    async () => {
      try {
        const result = await bridge.sendCommand("get_selection");
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
    "get_node_info",
    "Get detailed information about a specific node by its ID.",
    { nodeId: z.string().describe("The ID of the node to inspect") },
    async (params) => {
      try {
        const result = await bridge.sendCommand("get_node_info", params);
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
    "get_nodes_by_type",
    "Find all nodes of a specific type on the current page. Returns up to 100 results.",
    {
      nodeType: NodeTypeEnum.describe("The type of node to search for"),
      parentId: z
        .string()
        .optional()
        .describe("Optional parent node ID to search within"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("get_nodes_by_type", params);
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
    "find_nodes_by_name",
    "Search for nodes by name (substring match) on the current page. Returns up to 100 results.",
    {
      name: z.string().describe("Name or partial name to search for"),
      parentId: z
        .string()
        .optional()
        .describe("Optional parent node ID to search within"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("find_nodes_by_name", params);
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
