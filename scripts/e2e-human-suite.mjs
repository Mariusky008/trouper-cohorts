import { spawn } from "node:child_process";

const args = new Set(process.argv.slice(2));
const jsonMode = args.has("--json");

const checks = [
  { name: "human-access", command: "npm", args: ["run", "e2e:human-access"] },
  { name: "human-radar", command: "npm", args: ["run", "e2e:human-radar"] },
  { name: "human-smart-scan", command: "npm", args: ["run", "e2e:human-smart-scan"] },
];

function runCheck(check) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(check.command, check.args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on("close", (code, signal) => {
      const durationMs = Date.now() - startedAt;
      const passed = code === 0 && !signal;
      resolve({
        name: check.name,
        command: `${check.command} ${check.args.join(" ")}`,
        passed,
        exitCode: code ?? null,
        signal: signal ?? null,
        durationMs,
        stdoutTail: stdout.slice(-4000),
        stderrTail: stderr.slice(-4000),
      });
    });
  });
}

async function main() {
  const startedAt = Date.now();
  const results = [];

  for (const check of checks) {
    const result = await runCheck(check);
    results.push(result);
    if (!result.passed) {
      break;
    }
  }

  const passed = results.length === checks.length && results.every((result) => result.passed);
  const summary = {
    suite: "popey-human-e2e",
    passed,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    checks: results,
  };

  if (!jsonMode) {
    console.log(
      `[E2E-SUITE] ${passed ? "PASSED" : "FAILED"} (${results.filter((result) => result.passed).length}/${checks.length})`
    );
    console.log("[E2E-SUITE] Use `npm run e2e:human-ci` to emit machine-readable JSON.");
  }

  console.log(JSON.stringify(summary, null, jsonMode ? 0 : 2));

  if (!passed) process.exit(1);
}

main().catch((error) => {
  const payload = {
    suite: "popey-human-e2e",
    passed: false,
    error: error instanceof Error ? error.message : String(error),
  };
  console.error("[E2E-SUITE] Fatal error.");
  console.error(JSON.stringify(payload, null, jsonMode ? 0 : 2));
  process.exit(1);
});
