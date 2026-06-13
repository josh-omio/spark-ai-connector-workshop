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

3. Ask Codex to explain the three starter tools.
4. Ask Codex to change, remove, or add tools for your own use case.
5. When you are ready, ask Codex to deploy your MCP server.
6. Open the My MCP Tools page that Codex shows you after deployment.

You do not need to understand every file in this repo. Codex will read
`AGENTS.md`, which has the detailed workshop instructions.

## What Is In This Folder

- `README.md`: the file you are reading now
- `AGENTS.md`: instructions for Codex
- `server.js`: the starter MCP server and My MCP Tools page
- `deploy.sh`: the deploy helper Codex will use
- `package.json`: the small Node.js project file

## The Starter Tools

The starter MCP server begins with three tools:

- search for plugins
- inspect plugin details
- recommend plugins for a task

During the workshop, you can ask Codex to reshape this tool menu.

## My MCP Tools Page

The My MCP Tools page shows the tools your MCP server currently gives to the AI.

This page is not the plugin marketplace. Think of it this way:

- the plugin marketplace is the system your tools can talk to
- My MCP Tools is the menu of tools your AI can use

After deployment, Codex will show you a local link like this:

```text
http://127.0.0.1:3101/
```

The number may be different depending on your participant number.

## If Something Gets Stuck

Ask Codex what happened and show the facilitator the error message.

If Codex asks for your participant number, use the number assigned to you during
the workshop.
