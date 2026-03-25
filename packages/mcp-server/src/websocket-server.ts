import { WebSocketServer, WebSocket } from "ws";
import { logger } from "./utils/logger.js";
import type { WsClientMessage, WsServerMessage } from "./types.js";

export interface WebSocketServerInstance {
  wss: WebSocketServer;
  channels: Map<string, Set<WebSocket>>;
  close: () => void;
}

export function createWebSocketServer(
  port: number,
): WebSocketServerInstance {
  const wss = new WebSocketServer({ port });
  const channels = new Map<string, Set<WebSocket>>();
  const clientChannels = new Map<WebSocket, Set<string>>();

  wss.on("connection", (ws: WebSocket) => {
    logger.info("New WebSocket client connected");
    clientChannels.set(ws, new Set());

    ws.on("message", (raw: Buffer) => {
      let msg: WsClientMessage;
      try {
        msg = JSON.parse(raw.toString()) as WsClientMessage;
      } catch {
        sendToClient(ws, {
          type: "error",
          message: "Invalid JSON message",
        });
        return;
      }

      if (!msg.type || !msg.channel) {
        sendToClient(ws, {
          type: "error",
          message: "Missing 'type' or 'channel' field",
        });
        return;
      }

      switch (msg.type) {
        case "join":
          joinChannel(ws, msg.channel);
          break;
        case "leave":
          leaveChannel(ws, msg.channel);
          break;
        case "message":
          broadcastToChannel(ws, msg.channel, msg.message);
          break;
      }
    });

    ws.on("close", () => {
      logger.info("WebSocket client disconnected");
      const joined = clientChannels.get(ws);
      if (joined) {
        for (const ch of joined) {
          const clients = channels.get(ch);
          if (clients) {
            clients.delete(ws);
            if (clients.size === 0) {
              channels.delete(ch);
            }
          }
        }
      }
      clientChannels.delete(ws);
    });

    ws.on("error", (err: Error) => {
      logger.error("WebSocket client error:", err.message);
    });
  });

  function joinChannel(ws: WebSocket, channel: string): void {
    if (!channels.has(channel)) {
      channels.set(channel, new Set());
    }
    channels.get(channel)!.add(ws);
    clientChannels.get(ws)?.add(channel);

    sendToClient(ws, {
      type: "system",
      channel,
      message: `Joined channel: ${channel}`,
    });
    logger.info(`Client joined channel: ${channel}`);
  }

  function leaveChannel(ws: WebSocket, channel: string): void {
    const clients = channels.get(channel);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) {
        channels.delete(channel);
      }
    }
    clientChannels.get(ws)?.delete(channel);

    sendToClient(ws, {
      type: "system",
      channel,
      message: `Left channel: ${channel}`,
    });
    logger.info(`Client left channel: ${channel}`);
  }

  function broadcastToChannel(
    sender: WebSocket,
    channel: string,
    message: unknown,
  ): void {
    const clients = channels.get(channel);
    if (!clients) {
      sendToClient(sender, {
        type: "error",
        channel,
        message: `Channel "${channel}" does not exist`,
      });
      return;
    }

    const payload = JSON.stringify({
      type: "message",
      channel,
      message,
    } satisfies WsServerMessage);

    for (const client of clients) {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  function sendToClient(ws: WebSocket, msg: WsServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  wss.on("listening", () => {
    logger.info(`WebSocket server listening on port ${port}`);
  });

  function close(): void {
    for (const client of wss.clients) {
      client.close();
    }
    wss.close();
  }

  return { wss, channels, close };
}
