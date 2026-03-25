# Figma CRUD MCP Server 설계문서

## 목적

Figma 디자인 요소(파일/페이지, 노드, 스타일/변수)를 Claude Code에서 CRUD할 수 있는 MCP 서버를 구현하라. Figma REST API는 시각 요소에 대해 읽기 전용이므로 Plugin API + WebSocket 방식을 사용한다. 완료 조건: 35개 MCP 도구가 등록되고, Figma Desktop 플러그인과 WebSocket으로 연결되어 create_rectangle → Figma 문서에 사각형 생성이 동작한다.

## 아키텍처

```
Claude Code → MCP 서버 (stdio + WebSocket 서버) ← WebSocket → Figma 플러그인 (ui.html ↔ code.js) → Figma Plugin API
```

- MCP 서버: stdio 트랜스포트로 Claude Code와 통신, 내장 WebSocket 서버(포트 3055)로 Figma 플러그인과 통신
- Figma 플러그인: ui.html이 WebSocket 클라이언트, code.js가 Figma Plugin API 호출. 둘은 postMessage로 통신
- code.js는 QuickJS 샌드박스에서 실행되어 네트워크 접근 불가. ui.html은 iframe에서 실행되어 네트워크 접근 가능

## 파일 변경 목록

### 루트
| 파일 | 변경 내용 |
|------|---------|
| `package.json` | pnpm 워크스페이스 루트 설정 |
| `pnpm-workspace.yaml` | packages/* 워크스페이스 정의 |
| `tsconfig.base.json` | 공유 TypeScript 설정 (ES2022, Node16, strict) |

### packages/mcp-server/
| 파일 | 변경 내용 |
|------|---------|
| `package.json` | 의존성: @modelcontextprotocol/sdk, ws, uuid, zod |
| `tsconfig.json` | base 확장, outDir: dist |
| `src/types.ts` | 메시지 프로토콜 타입, Zod 스키마 (Fill, Stroke, Effect) |
| `src/utils/logger.ts` | stderr 로거 (stdout은 MCP stdio 전용) |
| `src/utils/errors.ts` | ChannelNotJoinedError, PluginDisconnectedError, CommandTimeoutError |
| `src/websocket-server.ts` | WebSocket 서버, 채널 기반 메시지 라우팅 |
| `src/figma-bridge.ts` | FigmaBridge 클래스: sendCommand + UUID 요청-응답 매칭 |
| `src/tools/connection.ts` | join_channel, get_connection_status |
| `src/tools/document.ts` | get_document_info, list_pages, create_page, delete_page, set_current_page |
| `src/tools/read.ts` | get_selection, get_node_info, get_nodes_by_type, find_nodes_by_name |
| `src/tools/create.ts` | create_frame, create_rectangle, create_ellipse, create_text, create_component, create_section |
| `src/tools/update.ts` | move_node, resize_node, rename_node, set_opacity, set_corner_radius |
| `src/tools/styling.ts` | set_fills, set_strokes, set_effects, set_text |
| `src/tools/layout.ts` | set_layout_mode |
| `src/tools/delete.ts` | delete_node, delete_nodes |
| `src/tools/variables.ts` | 변수/컬렉션 CRUD 9개 도구 |
| `src/tools/index.ts` | registerAllTools 오케스트레이터 |
| `src/mcp-server.ts` | McpServer 인스턴스 생성 + 도구 등록 |
| `src/index.ts` | 진입점: WS서버 + Bridge + MCP서버 조립, 종료 핸들링 |

### packages/figma-plugin/
| 파일 | 변경 내용 |
|------|---------|
| `manifest.json` | name, api, main, ui, networkAccess 설정 |
| `package.json` | @figma/plugin-typings dev 의존성 |
| `tsconfig.json` | target ES2020, module None |
| `ui.html` | WebSocket 클라이언트 + 연결 UI + postMessage 브릿지 |
| `code.ts` | 명령 디스패처 + 35개 Figma API 핸들러 |

## 구현 순서

1. 루트 설정 파일 생성 (package.json, pnpm-workspace.yaml, tsconfig.base.json)
2. mcp-server 패키지 설정 (package.json, tsconfig.json) + figma-plugin 패키지 설정
3. pnpm install
4. `src/types.ts` 작성 — 모든 파일이 의존하는 타입 정의
5. `src/utils/logger.ts`, `src/utils/errors.ts` 작성
6. `src/websocket-server.ts` 작성 — createWebSocketServer(port) 함수
7. `src/figma-bridge.ts` 작성 — FigmaBridge 클래스
8. `src/tools/connection.ts` 작성 — registerConnectionTools(server, bridge)
9. `src/tools/document.ts` 작성 — registerDocumentTools(server, bridge)
10. `src/tools/read.ts` 작성 — registerReadTools(server, bridge)
11. `src/tools/create.ts` 작성 — registerCreateTools(server, bridge)
12. `src/tools/update.ts` 작성 — registerUpdateTools(server, bridge)
13. `src/tools/styling.ts` 작성 — registerStylingTools(server, bridge)
14. `src/tools/layout.ts` 작성 — registerLayoutTools(server, bridge)
15. `src/tools/delete.ts` 작성 — registerDeleteTools(server, bridge)
16. `src/tools/variables.ts` 작성 — registerVariableTools(server, bridge)
17. `src/tools/index.ts` 작성 — registerAllTools
18. `src/mcp-server.ts` 작성 — createMcpServer(bridge)
19. `src/index.ts` 작성 — main() 진입점
20. `packages/figma-plugin/ui.html` 작성
21. `packages/figma-plugin/code.ts` 작성
22. 테스트 작성 (websocket-server, figma-bridge, tools)

## 함수/API 시그니처

### websocket-server.ts
```typescript
function createWebSocketServer(port: number): { wss: WebSocketServer; channels: Map<string, Set<WebSocket>>; close: () => void }
```

### figma-bridge.ts
```typescript
class FigmaBridge {
  constructor(wsUrl: string)
  connect(): Promise<void>
  joinChannel(channel: string): Promise<void>
  sendCommand(command: string, params?: Record<string, unknown>, timeoutMs?: number): Promise<unknown>
  get isConnected(): boolean
  get channel(): string | null
  disconnect(): void
}
```

### 도구 등록 함수 (각 tools/*.ts)
```typescript
function registerConnectionTools(server: McpServer, bridge: FigmaBridge): void
function registerDocumentTools(server: McpServer, bridge: FigmaBridge): void
function registerReadTools(server: McpServer, bridge: FigmaBridge): void
function registerCreateTools(server: McpServer, bridge: FigmaBridge): void
function registerUpdateTools(server: McpServer, bridge: FigmaBridge): void
function registerStylingTools(server: McpServer, bridge: FigmaBridge): void
function registerLayoutTools(server: McpServer, bridge: FigmaBridge): void
function registerDeleteTools(server: McpServer, bridge: FigmaBridge): void
function registerVariableTools(server: McpServer, bridge: FigmaBridge): void
function registerAllTools(server: McpServer, bridge: FigmaBridge): void
```

### mcp-server.ts
```typescript
function createMcpServer(bridge: FigmaBridge): McpServer
```

## 메시지 프로토콜

### WebSocket 채널 프로토콜
```typescript
interface WsClientMessage {
  type: "join" | "leave" | "message";
  channel: string;
  message?: unknown;
}
interface WsServerMessage {
  type: "system" | "message" | "error";
  channel?: string;
  message: unknown;
}
```

### 명령 프로토콜 (MCP ↔ Plugin)
```typescript
interface FigmaCommandRequest {
  id: string;       // UUID v4
  command: string;   // e.g. "create_rectangle"
  params: Record<string, unknown>;
}
interface FigmaCommandResponse {
  id: string;
  result?: unknown;
  error?: { code: string; message: string };
}
```

### 플러그인 내부 (ui.html ↔ code.js)
```typescript
// ui → code
parent.postMessage({ pluginMessage: { type: "execute-command", id, command, params } }, '*')
// code → ui
figma.ui.postMessage({ type: "command-result" | "command-error", id, result?, error? })
```

## 제약 조건

- stdout은 MCP stdio 전용. 로깅은 반드시 stderr로 출력하라
- code.js는 QuickJS 샌드박스이므로 네트워크 호출 불가. WebSocket은 ui.html에서만 사용하라
- create_text, set_text 시 figma.loadFontAsync() 호출 필수. await하라
- findAll/findOne은 대규모 문서에서 느릴 수 있음. 결과를 100개로 제한하라
- WebSocket 포트는 WS_PORT 환경변수로 설정 가능, 기본값 3055
- manifest.json의 networkAccess.devAllowedDomains에 ws://localhost 허용 필수

## 의사결정

- **MCP+WS 통합 프로세스** 채택. 기각: 별도 WS 서버 프로세스 (참조 구현처럼 3개 프로세스는 사용자 경험이 나쁨)
- **Node.js 런타임** 채택. 기각: Bun (호환성 문제, 추가 설치 부담)
- **server.tool() v1 API** 채택. 기각: registerTool() v2 API (pre-alpha, 불안정)
- **pnpm workspaces** 채택. 기각: npm workspaces (의존성 호이스팅 문제), turborepo (불필요한 복잡성)
