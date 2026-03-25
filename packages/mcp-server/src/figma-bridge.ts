import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import { logger } from "./utils/logger.js";
import {
  ChannelNotJoinedError,
  PluginDisconnectedError,
  CommandTimeoutError,
} from "./utils/errors.js";
import type {
  FigmaCommandRequest,
  FigmaCommandResponse,
  PendingRequest,
  WsClientMessage,
  WsServerMessage,
} from "./types.js";

const DEFAULT_TIMEOUT = 30_000;

export class FigmaBridge {
  private ws: WebSocket | null = null;
  private currentChannel: string | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private connected = false;

  constructor(private readonly wsUrl: string) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.on("open", () => {
        this.connected = true;
        logger.info("FigmaBridge connected to WebSocket server");
        resolve();
      });

      this.ws.on("message", (raw: Buffer) => {
        this.onMessage(raw.toString());
      });

      this.ws.on("close", () => {
        this.connected = false;
        this.currentChannel = null;
        this.rejectAllPending(new PluginDisconnectedError());
        logger.warn("FigmaBridge WebSocket connection closed");
      });

      this.ws.on("error", (err: Error) => {
        this.connected = false;
        logger.error("FigmaBridge WebSocket error:", err.message);
        reject(err);
      });
    });
  }

  async joinChannel(channel: string): Promise<void> {
    if (!this.ws || !this.connected) {
      throw new PluginDisconnectedError();
    }

    const msg: WsClientMessage = { type: "join", channel };
    this.ws.send(JSON.stringify(msg));
    this.currentChannel = channel;
    logger.info(`FigmaBridge joined channel: ${channel}`);
  }

  async sendCommand(
    command: string,
    params: Record<string, unknown> = {},
    timeoutMs: number = DEFAULT_TIMEOUT,
  ): Promise<unknown> {
    if (!this.currentChannel) {
      throw new ChannelNotJoinedError();
    }
    if (!this.ws || !this.connected) {
      throw new PluginDisconnectedError();
    }

    const id = uuidv4();
    const request: FigmaCommandRequest = { id, command, params };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new CommandTimeoutError(command, timeoutMs));
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timer });

      const wsMsg: WsClientMessage = {
        type: "message",
        channel: this.currentChannel!,
        message: request,
      };

      this.ws!.send(JSON.stringify(wsMsg));
      logger.debug(`Sent command: ${command} (id: ${id})`);
    });
  }

  get isConnected(): boolean {
    return this.connected;
  }

  get channel(): string | null {
    return this.currentChannel;
  }

  disconnect(): void {
    this.rejectAllPending(new PluginDisconnectedError());
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.currentChannel = null;
  }

  private onMessage(data: string): void {
    let msg: WsServerMessage;
    try {
      msg = JSON.parse(data) as WsServerMessage;
    } catch {
      logger.warn("FigmaBridge received invalid JSON");
      return;
    }

    if (msg.type !== "message") {
      logger.debug("FigmaBridge received non-message:", msg.type);
      return;
    }

    const response = msg.message as FigmaCommandResponse;
    if (!response || !response.id) {
      logger.debug("FigmaBridge received message without id");
      return;
    }

    const pending = this.pendingRequests.get(response.id);
    if (!pending) {
      logger.debug(`No pending request for id: ${response.id}`);
      return;
    }

    clearTimeout(pending.timer);
    this.pendingRequests.delete(response.id);

    if (response.error) {
      pending.reject(
        new Error(`[${response.error.code}] ${response.error.message}`),
      );
    } else {
      pending.resolve(response.result);
    }
  }

  private rejectAllPending(error: Error): void {
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }
}
