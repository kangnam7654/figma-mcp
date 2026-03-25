import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { FigmaBridge } from "../figma-bridge.js";
import { FillSchema, StrokeSchema, EffectSchema } from "../types.js";

export function registerStylingTools(
  server: McpServer,
  bridge: FigmaBridge,
): void {
  server.tool(
    "set_fills",
    "Set the fill colors of a node.",
    {
      nodeId: z.string().describe("ID of the node"),
      fills: z.array(FillSchema).describe("Array of fill definitions"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("set_fills", params);
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
    "set_strokes",
    "Set the stroke/border of a node.",
    {
      nodeId: z.string().describe("ID of the node"),
      strokes: z.array(StrokeSchema).describe("Array of stroke definitions"),
      strokeWeight: z.number().optional().describe("Stroke weight in pixels"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("set_strokes", params);
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
    "set_effects",
    "Set effects (shadows, blurs) on a node.",
    {
      nodeId: z.string().describe("ID of the node"),
      effects: z.array(EffectSchema).describe("Array of effect definitions"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("set_effects", params);
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
    "set_text",
    "Set text content and style properties on a text node. Requires font loading.",
    {
      nodeId: z.string().describe("ID of the text node"),
      text: z.string().describe("New text content"),
      fontSize: z.number().optional().describe("Font size"),
      fontFamily: z.string().optional().describe("Font family"),
      fontWeight: z.number().optional().describe("Font weight (e.g. 400, 700)"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("set_text", params, 60_000);
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
