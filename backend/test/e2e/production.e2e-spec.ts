import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { resolve } from 'node:path';

const productionPort = 3101;
const databaseUrl = process.env.DATABASE_URL;

function startProductionServer(): ChildProcess {
  return spawn('npm', ['run', 'start:prod'], {
    cwd: resolve(__dirname, '../..'),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(productionPort),
      DATABASE_URL: databaseUrl,
    },
    stdio: 'ignore',
  });
}

async function waitForLiveness(): Promise<Response> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(
        `http://127.0.0.1:${productionPort}/health/live`,
      );

      if (response.ok) {
        return response;
      }
    } catch {
      // Server is still starting.
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }

  throw new Error('Production server did not become live');
}

describe('production startup', () => {
  it('запускает build output и корректно обрабатывает SIGTERM', async () => {
    if (databaseUrl === undefined) {
      throw new Error('DATABASE_URL is required for production e2e tests');
    }

    const server = startProductionServer();

    try {
      const response = await waitForLiveness();

      expect(response.status).toBe(200);
      server.kill('SIGTERM');

      const [exitCode, signal] = (await once(server, 'exit')) as [
        number | null,
        NodeJS.Signals | null,
      ];

      expect(exitCode === 0 || signal === 'SIGTERM').toBe(true);
      await expect(
        fetch(`http://127.0.0.1:${productionPort}/health/live`),
      ).rejects.toThrow();
    } finally {
      if (!server.killed) {
        server.kill('SIGTERM');
      }
    }
  });
});
