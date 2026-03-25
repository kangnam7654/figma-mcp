import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { FigmaBridge } from "../figma-bridge.js";
import { FillSchema } from "../types.js";

export function registerCreateTools(
  server: McpServer,
  bridge: FigmaBridge,
): void {
  server.tool(
    "create_frame",
    "Create a new frame node in Figma.",
    {
      name: z.string().optional().describe("Frame name"),
      x: z.number().optional().default(0).describe("X position"),
      y: z.number().optional().default(0).describe("Y position"),
      width: z.number().optional().default(100).describe("Width in pixels"),
      height: z.number().optional().default(100).describe("Height in pixels"),
      parentId: z.string().optional().describe("Parent node ID to insert into"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("create_frame", params);
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
    "create_rectangle",
    "Create a new rectangle node in Figma.",
    {
      name: z.string().optional().describe("Rectangle name"),
      x: z.number().optional().default(0).describe("X position"),
      y: z.number().optional().default(0).describe("Y position"),
      width: z.number().optional().default(100).describe("Width in pixels"),
      height: z.number().optional().default(100).describe("Height in pixels"),
      fills: z.array(FillSchema).optional().describe("Fill colors"),
      parentId: z.string().optional().describe("Parent node ID to insert into"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("create_rectangle", params);
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
    "create_ellipse",
    "Create a new ellipse (circle/oval) node in Figma.",
    {
      name: z.string().optional().describe("Ellipse name"),
      x: z.number().optional().default(0).describe("X position"),
      y: z.number().optional().default(0).describe("Y position"),
      width: z.number().optional().default(100).describe("Width in pixels"),
      height: z.number().optional().default(100).describe("Height in pixels"),
      fills: z.array(FillSchema).optional().describe("Fill colors"),
      parentId: z.string().optional().describe("Parent node ID to insert into"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("create_ellipse", params);
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
    "create_text",
    "Create a new text node in Figma. Requires font loading, may take a moment.",
    {
      text: z.string().describe("Text content"),
      name: z.string().optional().describe("Node name"),
      x: z.number().optional().default(0).describe("X position"),
      y: z.number().optional().default(0).describe("Y position"),
      fontSize: z.number().optional().default(14).describe("Font size"),
      fontFamily: z.string().optional().default("Inter").describe("Font family"),
      fills: z.array(FillSchema).optional().describe("Text color"),
      parentId: z.string().optional().describe("Parent node ID to insert into"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("create_text", params, 60_000);
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
    "create_component",
    "Create a new component node in Figma.",
    {
      name: z.string().optional().describe("Component name"),
      x: z.number().optional().default(0).describe("X position"),
      y: z.number().optional().default(0).describe("Y position"),
      width: z.number().optional().default(100).describe("Width in pixels"),
      height: z.number().optional().default(100).describe("Height in pixels"),
      parentId: z.string().optional().describe("Parent node ID to insert into"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("create_component", params);
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
    "create_section",
    "Create a new section node in Figma.",
    {
      name: z.string().describe("Section name"),
      x: z.number().optional().default(0).describe("X position"),
      y: z.number().optional().default(0).describe("Y position"),
      width: z.number().optional().default(500).describe("Width in pixels"),
      height: z.number().optional().default(500).describe("Height in pixels"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("create_section", params);
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
