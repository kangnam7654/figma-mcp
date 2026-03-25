import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { FigmaBridge } from "../figma-bridge.js";

export function registerLayoutTools(
  server: McpServer,
  bridge: FigmaBridge,
): void {
  server.tool(
    "set_layout_mode",
    "Configure auto-layout on a frame node.",
    {
      nodeId: z.string().describe("ID of the frame node"),
      mode: z
        .enum(["NONE", "HORIZONTAL", "VERTICAL"])
        .describe("Layout direction"),
      spacing: z.number().optional().describe("Spacing between items"),
      paddingTop: z.number().optional().describe("Top padding"),
      paddingRight: z.number().optional().describe("Right padding"),
      paddingBottom: z.number().optional().describe("Bottom padding"),
      paddingLeft: z.number().optional().describe("Left padding"),
      primaryAxisAlignItems: z
        .enum(["MIN", "CENTER", "MAX", "SPACE_BETWEEN"])
        .optional()
        .describe("Primary axis alignment"),
      counterAxisAlignItems: z
        .enum(["MIN", "CENTER", "MAX"])
        .optional()
        .describe("Counter axis alignment"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("set_layout_mode", params);
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
