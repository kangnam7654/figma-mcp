import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { FigmaBridge } from "../figma-bridge.js";

export function registerUpdateTools(
  server: McpServer,
  bridge: FigmaBridge,
): void {
  server.tool(
    "move_node",
    "Move a node to a new position.",
    {
      nodeId: z.string().describe("ID of the node to move"),
      x: z.number().describe("New X position"),
      y: z.number().describe("New Y position"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("move_node", params);
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
    "resize_node",
    "Resize a node to new dimensions.",
    {
      nodeId: z.string().describe("ID of the node to resize"),
      width: z.number().describe("New width in pixels"),
      height: z.number().describe("New height in pixels"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("resize_node", params);
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
    "rename_node",
    "Rename a node.",
    {
      nodeId: z.string().describe("ID of the node to rename"),
      name: z.string().describe("New name"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("rename_node", params);
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
    "set_opacity",
    "Set the opacity of a node.",
    {
      nodeId: z.string().describe("ID of the node"),
      opacity: z.number().min(0).max(1).describe("Opacity value (0 to 1)"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("set_opacity", params);
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
    "set_corner_radius",
    "Set the corner radius of a node. Supports uniform or per-corner values.",
    {
      nodeId: z.string().describe("ID of the node"),
      radius: z.number().optional().describe("Uniform corner radius"),
      topLeft: z.number().optional().describe("Top-left corner radius"),
      topRight: z.number().optional().describe("Top-right corner radius"),
      bottomLeft: z.number().optional().describe("Bottom-left corner radius"),
      bottomRight: z.number().optional().describe("Bottom-right corner radius"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("set_corner_radius", params);
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
