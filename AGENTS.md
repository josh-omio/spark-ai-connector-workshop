# Workshop Codex Instructions

This repository is a participant MCP server for the Spark AI Connector workshop.

## Participant Assignment

Set your assigned participant ID before asking Codex to deploy or inspect the remote
server:

```text
PARTICIPANT_ID=pXX
```

Replace `pXX` with your assigned ID, such as `p01`, `p02`, or `p20`.

`PARTICIPANT_ID` must be filled in before Codex deploys or checks the deployed
MCP server. If `PARTICIPANT_ID` is still `pXX`, stop and prompt the user for
their participant number before proceeding. Never guess a participant ID.

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

Participant ports exist inside the VM, but participants should use the public
gateway URLs instead of raw ports:

- MCP port formula: `3100 + participant number`
- `p01` MCP port: `3101`
- `p02` MCP port: `3102`
- `p20` MCP port: `3120`
- Preview ports follow the same pattern with `5101` through `5120`

Default public workshop URLs:

- Shared plugin marketplace: `https://spark-ai-connector-workshop.qa.omio.tech/`
- Deploy gateway: `https://spark-ai-connector-workshop.qa.omio.tech/_gateway/deploy`
- My MCP Tools: `https://spark-ai-connector-workshop.qa.omio.tech/tools/PARTICIPANT_ID/`
- Codex MCP URL: `https://spark-ai-connector-workshop.qa.omio.tech/mcp/PARTICIPANT_ID`

## What To Build

Build a Streamable HTTP MCP server that exposes curated tools over the workshop
plugin marketplace. The plugin marketplace is a shared external system. The MCP
server is the menu of tools the AI can use.

Shared plugin marketplace UI:

```text
https://spark-ai-connector-workshop.qa.omio.tech/
```

The server must:

- listen on port `3000`;
- expose the MCP endpoint at `/mcp`;
- keep tool names and descriptions clear for non-technical reviewers;
- use the marketplace APIs as backend ingredients, not expose every API endpoint
  one-to-one as a tool unless that is intentionally part of the exercise.

Inside the deployed participant container, `REGISTRY_API_URL` points to the
shared plugin marketplace API. Use `process.env.REGISTRY_API_URL` when MCP tools
need marketplace facts such as plugins, skills, usage, stars, owners, review
status, submissions, feedback, or plugin ideas. For this workshop, marketplace
API endpoints provide facts and MCP tools provide opinions such as
recommendations, comparisons, assessments, summaries, and next steps.

## My MCP Tools Page

The My MCP Tools page is part of the participant MCP server. It is not part of
the plugin marketplace.

- `http://localhost:3000/mcp` is the MCP endpoint Codex uses.
- `http://localhost:3000/` is a browser page that shows the tools currently
  exposed by that same MCP server.
- after deployment, the public My MCP Tools URL is
  `https://spark-ai-connector-workshop.qa.omio.tech/tools/PARTICIPANT_ID/`.
- after deployment, the public MCP URL is
  `https://spark-ai-connector-workshop.qa.omio.tech/mcp/PARTICIPANT_ID`.
- The page should display the MCP tool menu: tool names, descriptions, input
  schemas, and examples.
- The plugin marketplace APIs are the backend ingredients that MCP tools can
  call. Do not describe those marketplace API endpoints as "My MCP Tools".
- Explain the page as a readable view of the MCP tools the participant is
  building, so non-technical readers can understand what changed without reading
  code.

## Participant Database

Inside the deployed participant container, `DATABASE_URL` points to that
participant's own Postgres database on the shared workshop VM.

- Use `process.env.DATABASE_URL` when adding SSO, sessions, tool usage tables,
  or other participant-owned state.
- Use `db.js` for Postgres access instead of creating a new connection pattern.
- Do not hardcode database credentials in source files.
- Treat the database as workshop state, not production data.
- Each participant gets a separate database named after their participant ID,
  such as `mcp_p01` for `p01`.
- For the engineer section, verify database behavior through code exposed by
  the participant MCP server, such as a temporary tool or health/debug endpoint,
  then deploy through `./deploy.sh PARTICIPANT_ID`.

## Common Commands

In the commands below, replace `PARTICIPANT_ID` before running anything.

Deploy the current repository to your participant container whenever you change
the MCP server, its tools, or the My MCP Tools page:

```bash
./deploy.sh PARTICIPANT_ID
```

For example:

```bash
./deploy.sh p01
```

`deploy.sh` uploads the code through the workshop deploy gateway, restarts the
participant MCP server, and prints the My MCP Tools URL plus the Codex MCP URL.
It does not require `gcloud`, SSH, or a local tunnel for the default workshop
flow.

If `deploy.sh` asks for a workshop deploy token, ask the participant to enter the
facilitator-provided token. Do not commit the token. It may be cached locally in
`.workshop-token`, which is ignored by git.

Before running `./deploy.sh PARTICIPANT_ID`, check whether `.workshop-token`
exists or `WORKSHOP_DEPLOY_TOKEN` is already set. If neither exists, ask the
participant for the facilitator-provided workshop deploy token, write it to
`.workshop-token`, run `chmod 600 .workshop-token` when possible, and then
deploy.

After deployment, use:

- My MCP Tools: `https://spark-ai-connector-workshop.qa.omio.tech/tools/PARTICIPANT_ID/`
- Codex MCP URL: `https://spark-ai-connector-workshop.qa.omio.tech/mcp/PARTICIPANT_ID`

## Codex Working Rules

- Before deploying, confirm `PARTICIPANT_ID` has been replaced with a real value.
- If `PARTICIPANT_ID` is still `pXX`, prompt the user for their participant
  number before proceeding.
- Substitute `PARTICIPANT_ID` in commands before running them.
- Use `./deploy.sh PARTICIPANT_ID` whenever the user wants to deploy updates to
  their MCP server or the My MCP Tools page.
- Do not deploy to another participant's ID.
- Do not commit secrets, tokens, `.env` files, or local credentials.
- Prefer changing MCP tool names, descriptions, schemas, and handlers over adding
  unrelated infrastructure.
- After editing tools, deploy again and refresh the `My MCP Tools` viewer to see
  what the AI can currently use.
- If deployment fails, report the gateway error clearly. Do not ask the
  participant to configure `gcloud` or SSH. Ask the facilitator for VM-side logs
  only if the gateway error says the remote container failed to start.
