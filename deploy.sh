#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./deploy.sh p01 [source-dir]

Syncs a local MCP service into the participant's remote workshop container and
starts it there.

Environment overrides:
  WORKSHOP_VM=spark-workshop-ai-connector
  WORKSHOP_ZONE=europe-west1-b
  WORKSHOP_PROJECT=vertex-playground-429621
  WORKSHOP_START_COMMAND='npm run dev'
  WORKSHOP_INSTALL_COMMAND='npm install'
  WORKSHOP_LOCAL_MCP_PORT=3101
  WORKSHOP_SKIP_TUNNEL=0
  WORKSHOP_OPEN_BROWSER=1
EOF
}

participant_id="${1:-}"
source_dir="${2:-.}"

if [[ -z "${participant_id}" || "${participant_id}" == "-h" || "${participant_id}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ ! "${participant_id}" =~ ^p[0-9]{2}$ ]]; then
  echo "Participant id must look like p01, p02, ... p20" >&2
  exit 1
fi

if [[ ! -d "${source_dir}" ]]; then
  echo "Source directory does not exist: ${source_dir}" >&2
  exit 1
fi

number_part="${participant_id#p}"
participant_num=$((10#${number_part}))

vm="${WORKSHOP_VM:-spark-workshop-ai-connector}"
zone="${WORKSHOP_ZONE:-europe-west1-b}"
project="${WORKSHOP_PROJECT:-vertex-playground-429621}"
start_command="${WORKSHOP_START_COMMAND:-npm run dev}"
install_command="${WORKSHOP_INSTALL_COMMAND:-npm install}"
local_mcp_port="${WORKSHOP_LOCAL_MCP_PORT:-$((3100 + participant_num))}"
remote_workspace="/srv/workshop/participants/${participant_id}"
tools_url="http://127.0.0.1:${local_mcp_port}/"
mcp_url="http://127.0.0.1:${local_mcp_port}/mcp"
health_url="http://127.0.0.1:${local_mcp_port}/_system/health"

gcloud_args=(compute ssh "${vm}" --zone="${zone}")
if [[ -n "${project}" ]]; then
  gcloud_args+=(--project="${project}")
fi

quote() {
  printf "%q" "$1"
}

remote_workspace_q="$(quote "${remote_workspace}")"
participant_id_q="$(quote "${participant_id}")"
start_command_q="$(quote "${start_command}")"
install_command_q="$(quote "${install_command}")"

remote_command="
set -euo pipefail
sudo mkdir -p ${remote_workspace_q}
sudo find ${remote_workspace_q} -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf -- {} +
sudo tar -xzf - -C ${remote_workspace_q} --no-same-owner
sudo chown -R 1001:1001 ${remote_workspace_q}
sudo WORKSHOP_START_COMMAND=${start_command_q} WORKSHOP_INSTALL_COMMAND=${install_command_q} /usr/local/bin/workshop-restart-mcp ${participant_id_q}
"

echo "Deploying ${source_dir} to ${vm}:${remote_workspace}"

(
  cd "${source_dir}"
  COPYFILE_DISABLE=1 tar --no-xattrs -czf - \
    --exclude='.git' \
    --exclude='.DS_Store' \
    --exclude='.env' \
    --exclude='.env.*' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='coverage' \
    --exclude='.turbo' \
    .
) | gcloud "${gcloud_args[@]}" --command="${remote_command}"

tunnel_status="Skipped"
if [[ "${WORKSHOP_SKIP_TUNNEL:-0}" != "1" ]]; then
  if curl -fsS --max-time 2 "${health_url}" >/dev/null 2>&1; then
    tunnel_status="Already running on ${local_mcp_port}"
  else
    echo "Starting local tunnel for ${participant_id} on port ${local_mcp_port}..."
    if gcloud "${gcloud_args[@]}" -- -f -N -o ExitOnForwardFailure=yes -L "${local_mcp_port}:127.0.0.1:${local_mcp_port}"; then
      tunnel_status="Started on ${local_mcp_port}"

      for _ in 1 2 3 4 5; do
        if curl -fsS --max-time 2 "${health_url}" >/dev/null 2>&1; then
          break
        fi
        sleep 1
      done
    else
      tunnel_status="Could not start automatically"
    fi
  fi

  if [[ "${WORKSHOP_OPEN_BROWSER:-1}" != "0" ]] \
    && command -v open >/dev/null 2>&1 \
    && curl -fsS --max-time 2 "${health_url}" >/dev/null 2>&1; then
    open "${tools_url}"
  fi
fi

cat <<EOF

Deployed ${participant_id}.

Tunnel: ${tunnel_status}

My MCP Tools:

  ${tools_url}

Codex MCP URL:

  ${mcp_url}

If the tunnel did not start, open a separate terminal and keep this running:

  gcloud compute ssh ${vm} --zone=${zone}${project:+ --project=${project}} -- -N -L ${local_mcp_port}:127.0.0.1:${local_mcp_port}

To deploy without starting the tunnel, run:

  WORKSHOP_SKIP_TUNNEL=1 ./deploy.sh ${participant_id}

Remote logs:

  gcloud compute ssh ${vm} --zone=${zone}${project:+ --project=${project}} --command='sudo docker exec spark-${participant_id} tail -f /tmp/workshop-mcp.log'
EOF
