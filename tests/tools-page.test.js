import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";

test("My MCP Tools page includes browser-parseable inline scripts", async (t) => {
  const port = await findFreePort();
  const child = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      APP_PORT: String(port),
      MCP_PORT: String(port),
      PARTICIPANT_ID: "p07"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  t.after(() => {
    child.kill();
  });

  await waitForHttp(`http://127.0.0.1:${port}/_system/health`);

  const response = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(response.status, 200);

  const html = await response.text();
  const scripts = Array.from(html.matchAll(/<script>([\s\S]*?)<\/script>/g), (match) => match[1]);
  assert.ok(scripts.length > 0, "expected at least one inline script");

  for (const script of scripts) {
    assert.doesNotThrow(() => new Function(script));
  }
});

async function findFreePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  await new Promise((resolve) => server.close(resolve));

  if (!address || typeof address === "string") {
    throw new Error("Could not allocate a free port.");
  }

  return address.port;
}

async function waitForHttp(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling while the local test server starts.
    }

    await delay(50);
  }

  throw new Error(`Timed out waiting for ${url}`);
}
