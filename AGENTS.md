# Workshop Codex Instructions

This repository is a participant MCP server for the Spark AI Connector workshop.

## Participant Assignment

Set your assigned participant ID before asking Codex to deploy or inspect the remote
server:

```text
PARTICIPANT_ID=pXX
```

Replace `pXX` with your assigned ID, such as `p01`, `p02`, or `p20`.

`PARTICIPANT_ID` must be filled in before Codex deploys, opens tunnels, checks
logs, or interacts with the VM. If `PARTICIPANT_ID` is still `pXX`, stop and
prompt the user for their participant number before proceeding. Never guess a participant ID.

If the user gives a participant number like "1" or "participant 1", convert it
to the matching participant ID such as `p01`, update the `PARTICIPANT_ID=...`
line in this file, and then continue.

## Remote Workshop Environment

- GCP project: `vertex-playground-429621`
- VM: `spark-workshop-ai-connector`
- Zone: `europe-west1-b`
- Container name: `spark-${PARTICIPANT_ID}`
- Remote workspace: `/srv/workshop/participants/${PARTICIPANT_ID}`
- Container workspace: `/workspace/mcp_workshop`
- MCP server port inside the container: `3000`
- MCP endpoint inside the container: `http://localhost:3000/mcp`
- My MCP Tools viewer inside the container: `http://localhost:3000/`

Participant ports on the VM are derived from the participant number:

- MCP port formula: `3100 + participant number`
- `p01` MCP port: `3101`
- `p02` MCP port: `3102`
- `p20` MCP port: `3120`
- Preview ports follow the same pattern with `5101` through `5120`

## What To Build

Build a Streamable HTTP MCP server that exposes curated tools over the workshop
plugin marketplace. The plugin marketplace is the external system. The MCP server
is the menu of tools the AI can use.

The server must:

- listen on port `3000`;
- expose the MCP endpoint at `/mcp`;
- keep tool names and descriptions clear for non-technical reviewers;
- use the marketplace APIs as backend ingredients, not expose every API endpoint
  one-to-one as a tool unless that is intentionally part of the exercise.

## My MCP Tools Page

The My MCP Tools page is part of the participant MCP server. It is not part of
the plugin marketplace.

- `http://localhost:3000/mcp` is the MCP endpoint Codex uses.
- `http://localhost:3000/` is a browser page that shows the tools currently
  exposed by that same MCP server.
- The page should display the MCP tool menu: tool names, descriptions, input
  schemas, and examples.
- The plugin marketplace APIs are the backend ingredients that MCP tools can
  call. Do not describe those marketplace API endpoints as "My MCP Tools".

## Common Commands

In the commands below, replace `PARTICIPANT_ID` and `LOCAL_MCP_PORT` before
running anything. For example, `p01` uses `LOCAL_MCP_PORT=3101`.

Deploy the current repository to your participant container whenever you change
the MCP server, its tools, or the My MCP Tools page:

```bash
./deploy.sh PARTICIPANT_ID
```

For example:

```bash
./deploy.sh p01
```

`deploy.sh` copies the code into the participant container, restarts the MCP
server, tries to start the local SSH tunnel, and opens the My MCP Tools page when
possible.

Tail the remote MCP logs:

```bash
gcloud compute ssh spark-workshop-ai-connector \
  --zone=europe-west1-b \
  --project=vertex-playground-429621 \
  --command='sudo docker exec spark-PARTICIPANT_ID tail -f /tmp/workshop-mcp.log'
```

Open an SSH tunnel from your MacBook to your participant MCP endpoint:

```bash
gcloud compute ssh spark-workshop-ai-connector \
  --zone=europe-west1-b \
  --project=vertex-playground-429621 \
  -- -N -L LOCAL_MCP_PORT:127.0.0.1:LOCAL_MCP_PORT
```

Use `3101` for `p01`, `3102` for `p02`, and so on.

Usually, do not ask non-technical participants to run this raw tunnel command.
Use `./deploy.sh PARTICIPANT_ID` first; only use the raw command if the script
reports that the tunnel could not start automatically.

After the tunnel is running:

- My MCP Tools: `http://127.0.0.1:LOCAL_MCP_PORT/`
- Codex MCP URL: `http://127.0.0.1:LOCAL_MCP_PORT/mcp`

## Codex Working Rules

- Before deploying, confirm `PARTICIPANT_ID` has been replaced with a real value.
- If `PARTICIPANT_ID` is still `pXX`, prompt the user for their participant
  number before proceeding.
- Substitute `PARTICIPANT_ID` and `LOCAL_MCP_PORT` in commands before running
  them.
- Use `./deploy.sh PARTICIPANT_ID` whenever the user wants to deploy updates to
  their MCP server or the My MCP Tools page.
- Do not deploy to another participant's ID.
- Do not commit secrets, tokens, `.env` files, or local credentials.
- Prefer changing MCP tool names, descriptions, schemas, and handlers over adding
  unrelated infrastructure.
- After editing tools, deploy again and refresh the `My MCP Tools` viewer to see
  what the AI can currently use.
- If deployment fails, inspect `/tmp/workshop-mcp.log` in the participant
  container before guessing at fixes.
