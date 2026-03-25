import { z } from "zod";

// --- WebSocket Channel Protocol ---

export interface WsClientMessage {
  type: "join" | "leave" | "message";
  channel: string;
  message?: unknown;
}

export interface WsServerMessage {
  type: "system" | "message" | "error";
  channel?: string;
  message: unknown;
}

// --- Command Protocol (MCP Server <-> Figma Plugin) ---

export interface FigmaCommandRequest {
  id: string;
  command: string;
  params: Record<string, unknown>;
}

export interface FigmaCommandResponse {
  id: string;
  result?: unknown;
  error?: {
    code: string;
    message: string;
  };
}

// --- Pending Request (internal to FigmaBridge) ---

export interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

// --- Zod Schemas for Tool Parameters ---

export const FillSchema = z.object({
  type: z.literal("SOLID").default("SOLID"),
  color: z.string().describe("Hex color, e.g. '#FF0000'"),
  opacity: z.number().min(0).max(1).optional(),
});

export const StrokeSchema = z.object({
  type: z.literal("SOLID").default("SOLID"),
  color: z.string().describe("Hex color, e.g. '#000000'"),
  opacity: z.number().min(0).max(1).optional(),
});

export const EffectSchema = z.object({
  type: z.enum([
    "DROP_SHADOW",
    "INNER_SHADOW",
    "LAYER_BLUR",
    "BACKGROUND_BLUR",
  ]),
  color: z.string().optional().describe("Hex color for shadow effects"),
  offset: z
    .object({ x: z.number(), y: z.number() })
    .optional()
    .describe("Offset for shadow effects"),
  radius: z.number().describe("Blur radius"),
  visible: z.boolean().default(true),
});

export const NodeTypeEnum = z.enum([
  "FRAME",
  "RECTANGLE",
  "ELLIPSE",
  "TEXT",
  "COMPONENT",
  "SECTION",
  "GROUP",
  "INSTANCE",
  "LINE",
  "VECTOR",
  "BOOLEAN_OPERATION",
]);

export const VariableTypeEnum = z.enum([
  "COLOR",
  "FLOAT",
  "STRING",
  "BOOLEAN",
]);
