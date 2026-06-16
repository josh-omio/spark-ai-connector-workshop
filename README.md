# Spark AI Connector Workshop

Welcome. This is your starter kit for the workshop.

You will use Codex Desktop to change a small AI connector. The connector gives
the AI a menu of tools it can use. In this workshop, those tools help the AI work
with a demo plugin marketplace.

## What You Need To Do

1. Open this folder in Codex Desktop.
2. Tell Codex your participant number, for example:

```text
My participant number is 1. Please set me up for the workshop.
```

3. Ask Codex to explain the two starter tools.
4. Ask Codex to change, remove, or add tools for your own use case.
5. When you are ready, ask Codex to deploy your MCP server.
6. Open the My MCP Tools page that Codex shows you after deployment.

You do not need to understand every file in this repo. Codex will read
`AGENTS.md`, which has the detailed workshop instructions.

## What Is In This Folder

- `README.md`: the file you are reading now
- `AGENTS.md`: instructions for Codex
- `server.js`: the starter MCP server and My MCP Tools page
- `db.js`: a small Postgres helper for the engineer section
- `scripts/db-check.js`: a safe database read/write check
- `deploy.sh`: the deploy helper Codex will use
- `package.json`: the small Node.js project file

## The Starter Tools

The starter MCP server begins with two factual marketplace tools:

- search for plugins
- inspect plugin details

During the workshop, you can ask Codex to reshape this tool menu.

## My MCP Tools Page

The My MCP Tools page shows the tools your MCP server currently gives to the AI.

This page is not the plugin marketplace. Think of it this way:

- the plugin marketplace is the shared external system your tools can talk to
- My MCP Tools is a friendly view of the tools you are building for the AI to use

For this part of the workshop, pretend you are an engineer building MCP tools for
other people to use. The My MCP Tools page shows what you have built in a more
readable format, so you can understand the idea without reading code.

The shared plugin marketplace is here:

```text
http://34.38.34.157/
```

When deployed, your MCP server can call the shared plugin marketplace API through
`REGISTRY_API_URL`.

After deployment, Codex will show you a link like this:

```text
http://34.38.34.157/tools/p01/
```

Your participant number gives you your own My MCP Tools link. Participant 1 uses
`http://34.38.34.157/tools/p01/`, participant 2 uses
`http://34.38.34.157/tools/p02/`, and so on.

Codex will deploy through the workshop deploy gateway. You do not need to set up
Google Cloud or SSH for the normal workshop flow. If Codex asks for a workshop
deploy token, use the token provided by the facilitator.

## For The Engineer Section

When your MCP server is deployed, it also has access to a participant-specific
Postgres database through `DATABASE_URL`. Codex will use this when you ask it to
add SSO, sessions, tool usage tables, or other server-side state.

Engineers use the same deploy flow as everyone else:

```bash
./deploy.sh p01
```

For database work, ask Codex to add a small MCP tool or temporary health/debug
endpoint that reads or writes through `db.js`, deploy it, and test it through
your public MCP URL or My MCP Tools page.

## If Something Gets Stuck

Ask Codex what happened and show the facilitator the error message.

If Codex asks for your participant number, use the number assigned to you during
the workshop.
