import { describe, it, expect, afterEach } from "vitest";
import WebSocket from "ws";
import { createWebSocketServer } from "../src/websocket-server.js";
import type { WebSocketServerInstance } from "../src/websocket-server.js";

let server: WebSocketServerInstance;

function getRandomPort(): number {
  return 10000 + Math.floor(Math.random() * 50000);
}

function createClient(port: number): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    ws.on("open", () => resolve(ws));
    ws.on("error", reject);
  });
}

function waitForMessage(ws: WebSocket): Promise<unknown> {
  return new Promise((resolve) => {
    ws.once("message", (data: Buffer) => {
      resolve(JSON.parse(data.toString()));
    });
  });
}

afterEach(() => {
  if (server) {
    server.close();
  }
});

describe("WebSocket Server", () => {
  it("should accept connections", async () => {
    const port = getRandomPort();
    server = createWebSocketServer(port);

    // Wait for server to be ready
    await new Promise<void>((resolve) => server.wss.on("listening", resolve));

    const client = await createClient(port);
    expect(client.readyState).toBe(WebSocket.OPEN);
    client.close();
  });

  it("should handle channel join", async () => {
    const port = getRandomPort();
    server = createWebSocketServer(port);
    await new Promise<void>((resolve) => server.wss.on("listening", resolve));

    const client = await createClient(port);
    const msgPromise = waitForMessage(client);

    client.send(JSON.stringify({ type: "join", channel: "test-ch" }));
    const msg = (await msgPromise) as { type: string; channel: string; message: string };

    expect(msg.type).toBe("system");
    expect(msg.channel).toBe("test-ch");
    expect(server.channels.has("test-ch")).toBe(true);

    client.close();
  });

  it("should broadcast messages to other clients in the same channel", async () => {
    const port = getRandomPort();
    server = createWebSocketServer(port);
    await new Promise<void>((resolve) => server.wss.on("listening", resolve));

    const client1 = await createClient(port);
    const client2 = await createClient(port);

    // Both join same channel
    const join1 = waitForMessage(client1);
    client1.send(JSON.stringify({ type: "join", channel: "ch1" }));
    await join1;

    const join2 = waitForMessage(client2);
    client2.send(JSON.stringify({ type: "join", channel: "ch1" }));
    await join2;

    // Client1 sends message, client2 should receive
    const msgPromise = waitForMessage(client2);
    client1.send(
      JSON.stringify({
        type: "message",
        channel: "ch1",
        message: { hello: "world" },
      })
    );
    const received = (await msgPromise) as {
      type: string;
      channel: string;
      message: { hello: string };
    };

    expect(received.type).toBe("message");
    expect(received.channel).toBe("ch1");
    expect(received.message.hello).toBe("world");

    client1.close();
    client2.close();
  });

  it("should not echo messages back to the sender", async () => {
    const port = getRandomPort();
    server = createWebSocketServer(port);
    await new Promise<void>((resolve) => server.wss.on("listening", resolve));

    const client = await createClient(port);

    const joinMsg = waitForMessage(client);
    client.send(JSON.stringify({ type: "join", channel: "ch1" }));
    await joinMsg;

    // Send a message and wait briefly - sender should not receive it back
    let receivedBack = false;
    client.on("message", (data: Buffer) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === "message") {
        receivedBack = true;
      }
    });

    client.send(
      JSON.stringify({
        type: "message",
        channel: "ch1",
        message: { test: true },
      })
    );

    await new Promise((r) => setTimeout(r, 100));
    expect(receivedBack).toBe(false);

    client.close();
  });

  it("should isolate different channels", async () => {
    const port = getRandomPort();
    server = createWebSocketServer(port);
    await new Promise<void>((resolve) => server.wss.on("listening", resolve));

    const client1 = await createClient(port);
    const client2 = await createClient(port);

    // Join different channels
    const join1 = waitForMessage(client1);
    client1.send(JSON.stringify({ type: "join", channel: "ch-a" }));
    await join1;

    const join2 = waitForMessage(client2);
    client2.send(JSON.stringify({ type: "join", channel: "ch-b" }));
    await join2;

    // Client1 sends to ch-a, client2 (in ch-b) should not receive
    let client2Received = false;
    client2.on("message", () => {
      client2Received = true;
    });

    client1.send(
      JSON.stringify({
        type: "message",
        channel: "ch-a",
        message: { data: "isolated" },
      })
    );

    await new Promise((r) => setTimeout(r, 100));
    expect(client2Received).toBe(false);

    client1.close();
    client2.close();
  });

  it("should clean up channels when client disconnects", async () => {
    const port = getRandomPort();
    server = createWebSocketServer(port);
    await new Promise<void>((resolve) => server.wss.on("listening", resolve));

    const client = await createClient(port);

    const joinMsg = waitForMessage(client);
    client.send(JSON.stringify({ type: "join", channel: "temp-ch" }));
    await joinMsg;

    expect(server.channels.has("temp-ch")).toBe(true);

    client.close();
    await new Promise((r) => setTimeout(r, 100));

    // Channel should be cleaned up since no clients remain
    expect(server.channels.has("temp-ch")).toBe(false);
  });
});
