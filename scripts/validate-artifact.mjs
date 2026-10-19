import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workerPath = resolve(projectRoot, "dist/server/index.js");
const manifestPath = resolve(projectRoot, "dist/.openai/hosting.json");

const [source, manifest] = await Promise.all([
  readFile(workerPath, "utf8"),
  readFile(manifestPath, "utf8"),
]);
JSON.parse(manifest);

// A data URL forces ESM parsing even though the generated output has no package.json.
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const workerModule = await import(moduleUrl);
assert.equal(
  typeof workerModule.default?.fetch,
  "function",
  `${pathToFileURL(workerPath)} must export default.fetch`,
);

// Exercise the deployed artifact, rather than inferring its provider guard from
// source. Even accidental keys or private flags cannot enable paid routes.
const originalFetch = globalThis.fetch;
let providerCalls = 0;
globalThis.fetch = async () => { providerCalls++; throw new Error('Unexpected outbound request'); };
try {
  for (const suppliedMode of [undefined, 'private', 'local-only', 'privtae']) {
    for (const publicFlag of [undefined, 'false', 'true', 'TRUE']) {
      const env = {NEBIUS_API_KEY:'artifact-test-only',TAVILY_API_KEY:'artifact-test-only',ROWGLASS_PROVIDER_MODE:suppliedMode,ROWGLASS_PUBLIC:publicFlag};
      const statusResponse = await workerModule.default.fetch(new Request('https://review.test/api/status'), env);
      const status = await statusResponse.json();
      assert.equal(status.providerAccess, 'local-only');
      assert.equal(status.configured, false);
      assert.equal(status.sourcesConfigured, false);
      assert.equal(status.liveVerified, false);
      const headers = {'Content-Type':'application/json','Origin':'https://review.test','X-User-Id':'forged-owner','X-Forwarded-For':'127.0.0.1'};
      const agent = await workerModule.default.fetch(new Request('https://review.test/api/agent', {method:'POST',headers,body:JSON.stringify({scenarioId:'missing-customers',sql:'SELECT 1',action:'repair'})}), env);
      assert.equal(agent.status,403);
      assert.equal((await agent.json()).code,'provider_disabled');
      const docs = await workerModule.default.fetch(new Request('https://review.test/api/sources?topic=outer-join',{headers}), env);
      assert.equal(docs.status,403);
      assert.equal(statusResponse.headers.get('Cache-Control'),'no-store');
      assert.match(statusResponse.headers.get('Content-Security-Policy'),/object-src 'none'/);
    }
  }
  assert.equal(providerCalls,0);
} finally {
  globalThis.fetch = originalFetch;
}

console.log('Artifact is valid ESM; 16 environment combinations keep both provider routes disabled with zero outbound calls.');
