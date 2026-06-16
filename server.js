import http from "node:http";

const participantId = process.env.PARTICIPANT_ID ?? "local";
const mcpPort = Number(process.env.MCP_PORT ?? 3000);
const appPort = Number(process.env.APP_PORT ?? 5173);

const mcpTools = [
  {
    name: "search_plugins",
    title: "Search plugins",
    description: "Find marketplace plugins by task, category, tag, or owner.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Task, keyword, or problem to search for."
        },
        category: {
          type: "string",
          description: "Optional marketplace category, such as Support or Analytics."
        },
        owner: {
          type: "string",
          description: "Optional owner or publisher team."
        },
        tag: {
          type: "string",
          description: "Optional tag to narrow the search."
        }
      },
      additionalProperties: false
    },
    exampleRequest: "Find plugins for support ticket routing.",
    connectsTo: "Plugin Marketplace"
  },
  {
    name: "get_plugin_details",
    title: "Get plugin details",
    description: "Inspect one marketplace plugin, including metadata and available skills.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Plugin ID, such as support-triage."
        }
      },
      required: ["id"],
      additionalProperties: false
    },
    exampleRequest: "Show me the details for support-triage.",
    connectsTo: "Plugin Marketplace"
  }
];

const startedAt = new Date().toISOString();

function handleRequest(req, res) {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && url.pathname === "/_system/health") {
    sendJson(res, 200, {
      ok: true,
      participantId,
      tools: mcpTools.length,
      startedAt
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/tools") {
    sendJson(res, 200, toolsViewModel());
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    sendHtml(res, renderToolsPage());
    return;
  }

  if (url.pathname === "/mcp") {
    handleMcpRequest(req, res);
    return;
  }

  sendJson(res, 404, { error: "not_found" });
}

async function handleMcpRequest(req, res) {
  if (req.method === "GET") {
    sendJson(res, 200, {
      name: "workshop-participant-mcp",
      participantId,
      message: "POST JSON-RPC requests here. Open / to view My MCP Tools.",
      tools: mcpTools.map(({ name, description }) => ({ name, description }))
    });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method_not_allowed" });
    return;
  }

  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    sendJson(res, 400, jsonRpcError(null, -32700, "Invalid JSON."));
    return;
  }

  const response = handleJsonRpc(body);
  sendJson(res, 200, response);
}

function handleJsonRpc(message) {
  const id = message?.id ?? null;

  if (message?.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return jsonRpcError(id, -32600, "Invalid JSON-RPC request.");
  }

  if (message.method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2025-06-18",
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: "workshop-participant-mcp",
          version: "0.1.0"
        }
      }
    };
  }

  if (message.method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools: mcpTools.map(toMcpTool)
      }
    };
  }

  if (message.method === "tools/call") {
    const toolName = message.params?.name;
    const tool = mcpTools.find((candidate) => candidate.name === toolName);

    if (!tool) {
      return jsonRpcError(id, -32602, `Unknown tool: ${toolName}`);
    }

    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: `${tool.name} is wired as a workshop starter tool. Replace this handler with a real marketplace API call.`
          }
        ],
        structuredContent: {
          tool: tool.name,
          arguments: message.params?.arguments ?? {}
        }
      }
    };
  }

  if (message.method === "ping") {
    return {
      jsonrpc: "2.0",
      id,
      result: {}
    };
  }

  return jsonRpcError(id, -32601, `Unknown method: ${message.method}`);
}

function toMcpTool(tool) {
  return {
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: tool.inputSchema
  };
}

function toolsViewModel() {
  return {
    participantId,
    checkedAt: new Date().toISOString(),
    endpoint: "/mcp",
    tools: mcpTools
  };
}

function renderToolsPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My MCP Tools</title>
  <style>
    :root {
      --paper: #f5f7fc;
      --card: #ffffff;
      --ink: #132968;
      --soft: #637096;
      --faint: #8390b8;
      --border: #dfe6f5;
      --coral: #fa6b6b;
      --blue: #5e90cc;
      --blue-soft: #e9f0fb;
      --green: #0f8463;
      --green-soft: #e0f1ec;
      color: var(--ink);
      background: var(--paper);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-width: 320px;
      min-height: 100vh;
      background: var(--paper);
    }

    button, input { font: inherit; }

    .shell {
      min-height: 100vh;
      padding: 28px;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      border-radius: 12px;
      background: var(--ink);
      color: #ffffff;
      padding: 22px 24px;
    }

    .eyebrow {
      margin: 0 0 6px;
      color: #acceef;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-size: 28px;
      line-height: 1.1;
    }

    .subtitle {
      margin: 6px 0 0;
      color: #dfeafa;
      font-size: 14px;
    }

    .refreshButton {
      min-height: 42px;
      border: 0;
      border-radius: 8px;
      background: var(--coral);
      color: #ffffff;
      padding: 0 18px;
      font-weight: 700;
      cursor: pointer;
    }

    .statusGrid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-top: 18px;
    }

    .statusCard, .toolCard, .rawPanel {
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--card);
      box-shadow: 0 1px 2px rgba(19, 41, 104, 0.06);
    }

    .statusCard {
      padding: 14px 16px;
    }

    .statusCard span {
      display: block;
      color: var(--faint);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .statusCard strong {
      display: block;
      margin-top: 5px;
      overflow-wrap: anywhere;
      font-size: 17px;
    }

    .contentHeader {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 16px;
      margin-top: 30px;
    }

    .contentHeader h2 {
      margin: 0;
      font-size: 23px;
    }

    .contentHeader span {
      color: var(--soft);
      font-weight: 650;
    }

    .toolGrid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .toolCard {
      display: grid;
      gap: 14px;
      padding: 18px;
    }

    .toolTopline {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 12px;
    }

    .toolCard h3 {
      margin: 0;
      font-size: 19px;
    }

    .toolName {
      border-radius: 999px;
      background: var(--blue-soft);
      color: var(--ink);
      padding: 4px 10px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }

    .description {
      margin: 0;
      color: var(--soft);
      line-height: 1.5;
    }

    .inputList {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .inputList li {
      border-radius: 999px;
      background: #eef2fa;
      color: #435183;
      padding: 5px 10px;
      font-size: 12px;
      font-weight: 650;
    }

    .metaBlock {
      display: grid;
      gap: 5px;
      border-top: 1px solid var(--border);
      padding-top: 12px;
      color: var(--soft);
      font-size: 13px;
    }

    .metaBlock strong {
      color: var(--ink);
    }

    .rawPanel {
      margin-top: 18px;
      padding: 14px 16px;
    }

    summary {
      cursor: pointer;
      font-weight: 700;
    }

    pre {
      overflow: auto;
      max-height: 420px;
      margin: 12px 0 0;
      border-radius: 8px;
      background: #101a3d;
      color: #edf3ff;
      padding: 14px;
      font-size: 12px;
      line-height: 1.5;
    }

    .empty {
      margin-top: 16px;
      border: 1.5px dashed #bac7e6;
      border-radius: 10px;
      background: var(--card);
      padding: 38px 20px;
      text-align: center;
      color: var(--soft);
    }

    @media (max-width: 760px) {
      .shell { padding: 18px; }
      .topbar, .contentHeader { align-items: stretch; flex-direction: column; }
      .statusGrid { grid-template-columns: 1fr; }
      .refreshButton { width: 100%; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">Workshop MCP</p>
        <h1>My MCP Tools</h1>
        <p class="subtitle">What the AI can currently use from your MCP server</p>
      </div>
      <button class="refreshButton" id="refreshButton" type="button">Refresh</button>
    </header>

    <section class="statusGrid" aria-label="MCP status">
      <div class="statusCard"><span>Participant</span><strong id="participant">-</strong></div>
      <div class="statusCard"><span>MCP server</span><strong id="serverStatus">Checking</strong></div>
      <div class="statusCard"><span>Tools found</span><strong id="toolCount">0</strong></div>
      <div class="statusCard"><span>Last checked</span><strong id="checkedAt">-</strong></div>
    </section>

    <section>
      <div class="contentHeader">
        <div>
          <p class="eyebrow">Tool menu</p>
          <h2>Available Tools</h2>
        </div>
        <span id="endpoint">/mcp</span>
      </div>
      <div id="tools" class="toolGrid"></div>
      <div id="empty" class="empty" hidden>No tools are currently exposed by this MCP server.</div>
    </section>

    <details class="rawPanel">
      <summary>Technical details</summary>
      <pre id="rawJson">{}</pre>
    </details>
  </main>

  <script>
    const state = {
      previousTools: new Map()
    };

    const elements = {
      participant: document.getElementById("participant"),
      serverStatus: document.getElementById("serverStatus"),
      toolCount: document.getElementById("toolCount"),
      checkedAt: document.getElementById("checkedAt"),
      endpoint: document.getElementById("endpoint"),
      tools: document.getElementById("tools"),
      empty: document.getElementById("empty"),
      rawJson: document.getElementById("rawJson"),
      refreshButton: document.getElementById("refreshButton")
    };

    elements.refreshButton.addEventListener("click", loadTools);
    loadTools();

    async function loadTools() {
      elements.serverStatus.textContent = "Checking";

      try {
        const response = await fetch("api/tools", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Request failed: " + response.status);
        }

        const data = await response.json();
        renderTools(data);
      } catch (error) {
        elements.serverStatus.textContent = "Unavailable";
        elements.rawJson.textContent = JSON.stringify({
          error: error instanceof Error ? error.message : String(error)
        }, null, 2);
      }
    }

    function renderTools(data) {
      const tools = Array.isArray(data.tools) ? data.tools : [];
      elements.participant.textContent = data.participantId || "local";
      elements.serverStatus.textContent = "Running";
      elements.toolCount.textContent = String(tools.length);
      elements.checkedAt.textContent = data.checkedAt
        ? new Date(data.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "-";
      const proxiedParticipant = window.location.pathname.match(/^\/tools\/(p[0-9]{2})(?:\/|$)/);
      elements.endpoint.textContent = proxiedParticipant ? \`/mcp/\${proxiedParticipant[1]}\` : (data.endpoint || "/mcp");
      elements.rawJson.textContent = JSON.stringify(data, null, 2);
      elements.empty.hidden = tools.length > 0;
      elements.tools.innerHTML = tools.map(renderToolCard).join("");
      state.previousTools = new Map(tools.map((tool) => [tool.name, tool]));
    }

    function renderToolCard(tool) {
      const properties = tool.inputSchema?.properties || {};
      const required = new Set(tool.inputSchema?.required || []);
      const inputs = Object.keys(properties);
      const inputItems = inputs.length
        ? inputs.map((name) => "<li>" + escapeHtml(name) + (required.has(name) ? " required" : "") + "</li>").join("")
        : "<li>No inputs</li>";

      return [
        '<article class="toolCard">',
        '  <div class="toolTopline">',
        '    <h3>' + escapeHtml(tool.title || tool.name) + '</h3>',
        '    <span class="toolName">' + escapeHtml(tool.name) + '</span>',
        '  </div>',
        '  <p class="description">' + escapeHtml(tool.description || "") + '</p>',
        '  <ul class="inputList">' + inputItems + '</ul>',
        '  <div class="metaBlock">',
        '    <span><strong>Example:</strong> ' + escapeHtml(tool.exampleRequest || "Ask the AI to use this tool.") + '</span>',
        '    <span><strong>Connects to:</strong> ' + escapeHtml(tool.connectsTo || "MCP server") + '</span>',
        '  </div>',
        '</article>'
      ].join("");
    }

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    }
  </script>
</body>
</html>`;
}

function jsonRpcError(id, code, message) {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message
    }
  };
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "content-type": "application/json; charset=utf-8"
  });

  if (status === 204) {
    res.end();
    return;
  }

  res.end(JSON.stringify(data));
}

function sendHtml(res, html) {
  res.writeHead(200, {
    "content-type": "text/html; charset=utf-8"
  });
  res.end(html);
}

async function readBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

function listen(port, label) {
  const server = http.createServer(handleRequest);
  server.listen(port, "0.0.0.0", () => {
    console.log(`${label} listening on :${port}`);
  });
}

listen(mcpPort, "MCP server and My MCP Tools page");

if (appPort !== mcpPort) {
  listen(appPort, "My MCP Tools preview");
}
