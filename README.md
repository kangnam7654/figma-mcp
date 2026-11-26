# figma-mcp

An MCP server that lets an MCP client such as Claude Code create, read, update and
delete elements in a Figma document. This is a personal open-source project. It is
not related to any employer's work.

The Figma REST API is read-only for visual elements, so this project drives the
Figma Plugin API through a small plugin that connects to the server over WebSocket.

## How it works

```
MCP client ──stdio──> MCP server (Node.js) ──WebSocket :3055──> Figma plugin UI (ui.html)
                                                                   │ postMessage
                                                                   v
                                                          plugin code (code.js) ──> Figma Plugin API
```

- `packages/mcp-server` runs one Node.js process. It speaks MCP over stdio and also
  starts a WebSocket server (port `3055`, or `WS_PORT`). Messages are routed by
  channel name. Logs go to stderr because stdout is reserved for MCP.
- `FigmaBridge` connects to that WebSocket server, joins a channel and sends
  commands as `{ id, command, params }`. Each response is matched by its UUID;
  a command times out after 30 seconds.
- `packages/figma-plugin` is a development plugin. `ui.html` holds the WebSocket
  client because the plugin sandbox (`code.js`) has no network access. The two
  halves exchange messages with `postMessage`, and `code.js` calls the Plugin API.

## Requirements

- Node.js and pnpm (workspace with `packages/*`)
- Figma desktop app, to load a development plugin

## Setup

```bash
pnpm install
pnpm build        # builds packages/mcp-server/dist and packages/figma-plugin/code.js
```

Recent pnpm versions block dependency build scripts by default. If `pnpm install`
stops on `esbuild`, approve it with `pnpm approve-builds` or install with
`--ignore-scripts`.

### Register the MCP server

Add the built entry point as a stdio server in your MCP client. For example:

```json
{
  "mcpServers": {
    "figma": {
      "command": "node",
      "args": ["/absolute/path/to/figma-mcp/packages/mcp-server/dist/index.js"],
      "env": { "WS_PORT": "3055" }
    }
  }
}
```

For development, `pnpm --filter figma-mcp-server dev` runs the server from source
with `tsx --watch`.

### Load the Figma plugin

1. In the Figma desktop app, import `packages/figma-plugin/manifest.json` as a
   development plugin and run "Figma MCP Bridge".
2. Keep the port at `3055` (or your `WS_PORT`) and press **Connect**.
3. The plugin shows a generated channel name. Ask the MCP client to call
   `join_channel` with that name.

The manifest only allows `ws://localhost:3055` and `http://localhost:3055` in
development. Change `devAllowedDomains` if you use another port.

## Tools

The server registers 36 tools (`server.tool` calls in `packages/mcp-server/src/tools/`).
The two connection tools run in the server; the other 34 are handled by the plugin.

| Group | Tools |
|---|---|
| Connection | `join_channel`, `get_connection_status` |
| Document and pages | `get_document_info`, `list_pages`, `create_page`, `delete_page`, `set_current_page` |
| Read | `get_selection`, `get_node_info`, `get_nodes_by_type`, `find_nodes_by_name` |
| Create | `create_frame`, `create_rectangle`, `create_ellipse`, `create_text`, `create_component`, `create_section` |
| Update | `move_node`, `resize_node`, `rename_node`, `set_opacity`, `set_corner_radius` |
| Styling | `set_fills`, `set_strokes`, `set_effects`, `set_text` |
| Layout | `set_layout_mode` |
| Delete | `delete_node`, `delete_nodes` |
| Variables and styles | `get_local_variables`, `get_variable_collections`, `create_variable_collection`, `create_variable`, `update_variable`, `delete_variable`, `get_styles` |

Search tools return at most 100 nodes. Text tools load the required font before
editing text.

## Tests

```bash
pnpm --filter figma-mcp-server test
```

Vitest covers the WebSocket server, `FigmaBridge` and the create tools
(`packages/mcp-server/tests/`). The tests do not open Figma; the end-to-end path
through the plugin is checked manually in the Figma desktop app.

## Design notes

The implementation plan, message protocols and design decisions are in
[`docs/llm/figma-mcp-design.md`](docs/llm/figma-mcp-design.md) (Korean).
