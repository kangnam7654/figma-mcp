import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { FigmaBridge } from "../figma-bridge.js";

export function registerDocumentTools(
  server: McpServer,
  bridge: FigmaBridge,
): void {
  server.tool(
    "get_document_info",
    "Get the current Figma document name and list of pages.",
    {},
    async () => {
      try {
        const result = await bridge.sendCommand("get_document_info");
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
    "list_pages",
    "List all pages in the current Figma document.",
    {},
    async () => {
      try {
        const result = await bridge.sendCommand("list_pages");
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
    "create_page",
    "Create a new page in the Figma document.",
    { name: z.string().describe("Name for the new page") },
    async (params) => {
      try {
        const result = await bridge.sendCommand("create_page", params);
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
    "delete_page",
    "Delete a page from the Figma document by its ID.",
    { pageId: z.string().describe("ID of the page to delete") },
    async (params) => {
      try {
        const result = await bridge.sendCommand("delete_page", params);
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
    "set_current_page",
    "Navigate to a specific page in the Figma document.",
    { pageId: z.string().describe("ID of the page to navigate to") },
    async (params) => {
      try {
        const result = await bridge.sendCommand("set_current_page", params);
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
