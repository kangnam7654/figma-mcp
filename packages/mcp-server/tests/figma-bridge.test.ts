import { describe, it, expect, beforeEach, afterEach } from "vitest";
import WebSocket from "ws";
import { createWebSocketServer } from "../src/websocket-server.js";
import { FigmaBridge } from "../src/figma-bridge.js";
import type { WebSocketServerInstance } from "../src/websocket-server.js";
import type { FigmaCommandRequest } from "../src/types.js";

let server: WebSocketServerInstance;
let bridge: FigmaBridge;
let port: number;

function getRandomPort(): number {
  return 10000 + Math.floor(Math.random() * 50000);
}

beforeEach(async () => {
  port = getRandomPort();
  server = createWebSocketServer(port);
  await new Promise<void>((resolve) => server.wss.on("listening", resolve));

  bridge = new FigmaBridge(`ws://localhost:${port}`);
  await bridge.connect();
});

afterEach(() => {
  bridge.disconnect();
  server.close();
});

describe("FigmaBridge", () => {
  it("should connect to WebSocket server", () => {
    expect(bridge.isConnected).toBe(true);
  });

  it("should join a channel", async () => {
    await bridge.joinChannel("test-channel");
    expect(bridge.channel).toBe("test-channel");
  });

  it("should throw when sending command without joining channel", async () => {
    await expect(bridge.sendCommand("test")).rejects.toThrow(
      "No channel joined"
    );
  });

  it("should send command and receive response", async () => {
    await bridge.joinChannel("cmd-test");

    // Create a mock Figma plugin client
    const mockPlugin = new WebSocket(`ws://localhost:${port}`);
    await new Promise<void>((resolve) => mockPlugin.on("open", resolve));

    // Mock plugin joins same channel
    const joinMsg = new Promise<void>((resolve) => {
      mockPlugin.once("message", () => resolve());
    });
    mockPlugin.send(JSON.stringify({ type: "join", channel: "cmd-test" }));
    await joinMsg;

    // Mock plugin listens for commands and responds
    mockPlugin.on("message", (data: Buffer) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === "message" && msg.message?.command) {
        const request = msg.message as FigmaCommandRequest;
        // Send response
        mockPlugin.send(
          JSON.stringify({
            type: "message",
            channel: "cmd-test",
            message: {
              id: request.id,
              result: { status: "ok", received: request.command },
            },
          })
        );
      }
    });

    const result = (await bridge.sendCommand("create_rectangle", {
      x: 10,
      y: 20,
    })) as { status: string; received: string };

    expect(result.status).toBe("ok");
    expect(result.received).toBe("create_rectangle");

    mockPlugin.close();
  });

  it("should timeout if no response received", async () => {
    await bridge.joinChannel("timeout-test");

    // No mock plugin to respond = timeout
    await expect(
      bridge.sendCommand("some_command", {}, 200)
    ).rejects.toThrow("timed out");
  });

  it("should handle error responses from plugin", async () => {
    await bridge.joinChannel("err-test");

    const mockPlugin = new WebSocket(`ws://localhost:${port}`);
    await new Promise<void>((resolve) => mockPlugin.on("open", resolve));

    const joinMsg = new Promise<void>((resolve) => {
      mockPlugin.once("message", () => resolve());
    });
    mockPlugin.send(JSON.stringify({ type: "join", channel: "err-test" }));
    await joinMsg;

    mockPlugin.on("message", (data: Buffer) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === "message" && msg.message?.command) {
        const request = msg.message as FigmaCommandRequest;
        mockPlugin.send(
          JSON.stringify({
            type: "message",
            channel: "err-test",
            message: {
              id: request.id,
              error: {
                code: "NODE_NOT_FOUND",
                message: "Node not found",
              },
            },
          })
        );
      }
    });

    await expect(
      bridge.sendCommand("get_node_info", { nodeId: "bad-id" })
    ).rejects.toThrow("NODE_NOT_FOUND");

    mockPlugin.close();
  });

  it("should clean up after disconnect", () => {
    bridge.disconnect();
    expect(bridge.isConnected).toBe(false);
    expect(bridge.channel).toBeNull();
  });
});
