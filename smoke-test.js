// Usage: npm run test:smoke
// Starts the backend and checks the public dashboard and JSON routes.

const { spawn } = require('child_process');

const port = 39000 + Math.floor(Math.random() * 1000);
const child = spawn(process.execPath, ['server.js'], {
  env: { PORT: String(port) },
  stdio: ['ignore', 'ignore', 'ignore']
});

async function request(pathname) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`);
  return { status: response.status, body: await response.text() };
}

async function main() {
  let lastError;
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const health = await request('/health');
      if (health.status !== 200) throw new Error(`health ${health.status}`);
      const test = await request('/api/test');
      if (test.status !== 200) throw new Error(`test ${test.status}`);
      const status = await request('/api/status');
      if (status.status !== 200) throw new Error(`status ${status.status}`);
      const root = await request('/');
      if (root.status !== 200 || !root.body.includes('NEXUS')) throw new Error(`root ${root.status}`);
      JSON.parse(health.body);
      JSON.parse(test.body);
      JSON.parse(status.body);
      console.log(`Smoke test passed: /health 200, /api/test 200, /api/status 200, / 200`);
      return;
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  throw lastError || new Error('server did not become reachable');
}

main()
  .catch(error => {
    console.error(`Smoke test failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => {
    child.kill('SIGTERM');
  });
