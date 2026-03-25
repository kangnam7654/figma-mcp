import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { FigmaBridge } from "../figma-bridge.js";
import { VariableTypeEnum } from "../types.js";

export function registerVariableTools(
  server: McpServer,
  bridge: FigmaBridge,
): void {
  server.tool(
    "get_local_variables",
    "List local variables, optionally filtered by collection.",
    {
      collectionId: z
        .string()
        .optional()
        .describe("Optional collection ID to filter by"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("get_local_variables", params);
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
    "get_variable_collections",
    "List all variable collections in the document.",
    {},
    async () => {
      try {
        const result = await bridge.sendCommand("get_variable_collections");
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
    "create_variable_collection",
    "Create a new variable collection.",
    {
      name: z.string().describe("Collection name"),
      modes: z
        .array(z.string())
        .optional()
        .describe("Mode names (first mode is renamed, additional modes are added)"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand(
          "create_variable_collection",
          params,
        );
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
    "create_variable",
    "Create a new variable in a collection.",
    {
      name: z.string().describe("Variable name"),
      collectionId: z.string().describe("Collection ID to add the variable to"),
      resolvedType: VariableTypeEnum.describe("Variable type"),
      value: z
        .union([z.string(), z.number(), z.boolean()])
        .optional()
        .describe("Initial value for the default mode"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("create_variable", params);
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
    "update_variable",
    "Update a variable's value for a specific mode.",
    {
      variableId: z.string().describe("Variable ID"),
      modeId: z.string().describe("Mode ID to update the value for"),
      value: z
        .union([z.string(), z.number(), z.boolean()])
        .describe("New value"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("update_variable", params);
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
    "delete_variable",
    "Delete a variable.",
    {
      variableId: z.string().describe("ID of the variable to delete"),
    },
    async (params) => {
      try {
        const result = await bridge.sendCommand("delete_variable", params);
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
    "get_styles",
    "List all local styles (paint, text, effect, grid) in the document.",
    {},
    async () => {
      try {
        const result = await bridge.sendCommand("get_styles");
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
