import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { FigmaBridge } from "../figma-bridge.js";

export function registerConnectionTools(
  server: McpServer,
  bridge: FigmaBridge,
): void {
  server.tool(
    "join_channel",
    "Join a WebSocket channel to connect to a Figma plugin instance. Use the channel name shown in the Figma plugin UI.",
    { channel: z.string().describe("Channel name displayed in the Figma plugin") },
    async ({ channel }) => {
      try {
        await bridge.joinChannel(channel);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ success: true, channel }),
            },
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
    "get_connection_status",
    "Check the current WebSocket connection and channel status.",
    {},
    async () => {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              connected: bridge.isConnected,
              channel: bridge.channel,
            }),
          },
        ],
      };
    },
  );
}
