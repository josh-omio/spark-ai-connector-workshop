#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./deploy.sh p01 [source-dir]

Uploads this MCP server to the workshop deploy gateway and restarts the
participant's remote MCP server.

Environment overrides:
  WORKSHOP_DEPLOY_GATEWAY_URL=http://34.38.34.157/_gateway/deploy
  WORKSHOP_DEPLOY_TOKEN=...
  WORKSHOP_TOKEN_FILE=.workshop-token
EOF
}

participant_id="${1:-}"
source_dir="${2:-.}"

if [[ -z "${participant_id}" || "${participant_id}" == "-h" || "${participant_id}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ ! "${participant_id}" =~ ^p[0-9]{2}$ ]]; then
  echo "Participant id must look like p01, p02, ... p21" >&2
  exit 1
fi

if [[ ! -d "${source_dir}" ]]; then
  echo "Source directory does not exist: ${source_dir}" >&2
  exit 1
fi

gateway_url="${WORKSHOP_DEPLOY_GATEWAY_URL:-http://34.38.34.157/_gateway/deploy}"
token_file="${WORKSHOP_TOKEN_FILE:-.workshop-token}"
token="${WORKSHOP_DEPLOY_TOKEN:-}"

if [[ -z "${token}" && -f "${token_file}" ]]; then
  token="$(tr -d '\r\n' < "${token_file}")"
fi

if [[ -z "${token}" ]]; then
  if [[ -t 0 ]]; then
    read -r -s -p "Workshop deploy token: " token
    echo
    if [[ -n "${token}" ]]; then
      printf '%s\n' "${token}" > "${token_file}"
      chmod 600 "${token_file}" 2>/dev/null || true
      echo "Saved token to ${token_file}"
    fi
  else
    echo "Missing workshop deploy token. Set WORKSHOP_DEPLOY_TOKEN or create ${token_file}." >&2
    exit 1
  fi
fi

if [[ -z "${token}" ]]; then
  echo "Workshop deploy token cannot be empty." >&2
  exit 1
fi

archive="$(mktemp "${TMPDIR:-/tmp}/spark-mcp-upload.XXXXXX.tar.gz")"
response_file="$(mktemp "${TMPDIR:-/tmp}/spark-mcp-deploy-response.XXXXXX.json")"
cleanup() {
  rm -f "${archive}" "${response_file}"
}
trap cleanup EXIT

echo "Creating upload archive from ${source_dir}..."
(
  cd "${source_dir}"
  COPYFILE_DISABLE=1 tar --no-xattrs -czf "${archive}" \
    --exclude='.git' \
    --exclude='.DS_Store' \
    --exclude='.env' \
    --exclude='.env.*' \
    --exclude='.workshop-token' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='coverage' \
    --exclude='.turbo' \
    .
)

echo "Uploading ${participant_id} to the workshop deploy gateway..."
http_status="$(
  curl -sS \
    -o "${response_file}" \
    -w "%{http_code}" \
    -X POST \
    -H "content-type: application/gzip" \
    -H "x-participant-id: ${participant_id}" \
    -H "x-workshop-token: ${token}" \
    --data-binary "@${archive}" \
    "${gateway_url}" || true
)"

if [[ ! "${http_status}" =~ ^2 ]]; then
  echo "Deploy failed with HTTP ${http_status}." >&2
  node - "${response_file}" <<'NODE' >&2 || cat "${response_file}" >&2
const fs = await import("node:fs");
const file = process.argv[2];
const body = JSON.parse(fs.readFileSync(file, "utf8"));
console.error(body.message || JSON.stringify(body, null, 2));
if (body.details) console.error(body.details);
NODE
  exit 1
fi

node - "${response_file}" <<'NODE'
const fs = await import("node:fs");
const file = process.argv[2];
const body = JSON.parse(fs.readFileSync(file, "utf8"));

console.log("");
console.log(`Deployed ${body.participantId}.`);
console.log("");
console.log("My MCP Tools:");
console.log("");
console.log(`  ${body.myMcpToolsUrl}`);
console.log("");
console.log("Codex MCP URL:");
console.log("");
console.log(`  ${body.mcpUrl}`);
console.log("");
console.log("Health:");
console.log("");
console.log(`  ${JSON.stringify(body.health ?? { ok: true })}`);
NODE
