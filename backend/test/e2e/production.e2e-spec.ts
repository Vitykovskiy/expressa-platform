import { execFileSync, fork, spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createServer, type AddressInfo } from 'node:net';
import { resolve } from 'node:path';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
const coldProductionStartupTimeoutMs = 30_000;
const livenessWaitTimeoutMs = 25_000;
const livenessPollIntervalMs = 100;
const childOutputLimit = 4_000;
const shutdownTimeoutMs = 5_000;

function rehearseMigrationsAndSeed(): void {
  for (const script of ['migrate', 'seed', 'seed'] as const) {
    execFileSync('npm', ['run', script], {
      cwd: resolve(__dirname, '../..'),
      env: process.env,
      stdio: 'pipe',
    });
  }
}

function sanitizeOutput(output: string): string {
  return output
    .replace(
      /"authorization"\s*:\s*"bearer\s+[^"]*"/gi,
      '"authorization":"[redacted]"',
    )
    .replace(
      /\bauthorization\s*:\s*bearer\s+\S+/gi,
      'Authorization: [redacted]',
    )
    .replace(
      /\b[a-z][a-z\d+.-]*:\/\/[^\s'"]*@[^\s'"]*/gi,
      '[redacted url]',
    )
    .replace(
      /\b(password|token|secret)\s*[:=]\s*\S+/gi,
      '$1=[redacted]',
    );
}

function captureOutput(stream: NodeJS.ReadableStream): () => string {
  let output = '';

  stream.setEncoding('utf8');
  stream.on('data', (chunk: string) => {
    output = `${output}${chunk}`.slice(-childOutputLimit);
  });

  return () => sanitizeOutput(output);
}

async function getAvailablePort(): Promise<number> {
  const listener = createServer();

  await new Promise<void>((resolveListen, rejectListen) => {
    listener.once('error', rejectListen);
    listener.listen(0, '127.0.0.1', () => {
      listener.off('error', rejectListen);
      resolveListen();
    });
  });

  const address = listener.address();

  if (address === null || typeof address === 'string') {
    throw new Error('Could not reserve an ephemeral localhost port');
  }

  await new Promise<void>((resolveClose, rejectClose) => {
    listener.close((error) => {
      if (error === undefined) {
        resolveClose();
        return;
      }

      rejectClose(error);
    });
  });

  return (address as AddressInfo).port;
}

function startProductionServer(port: number): {
  output: () => string;
  server: ChildProcess;
} {
  const server = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', [
    'run',
    'start:prod',
  ], {
    cwd: resolve(__dirname, '../..'),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(port),
      DATABASE_URL: databaseUrl,
    },
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const readStandardOutput = captureOutput(server.stdout);
  const readStandardError = captureOutput(server.stderr);

  return {
    server,
    output: () =>
      `stdout:\n${readStandardOutput()}\nstderr:\n${readStandardError()}`,
  };
}

function startGracefulShutdownFixture(port: number): {
  output: () => string;
  server: ChildProcess;
} {
  const server = fork(
    resolve(__dirname, 'fixtures/graceful-shutdown.fixture.ts'),
    [],
    {
      cwd: resolve(__dirname, '../..'),
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(port),
        DATABASE_URL: databaseUrl,
      },
      execArgv: ['-r', 'ts-node/register'],
      silent: true,
    },
  );
  if (server.stdout === null || server.stderr === null) {
    throw new Error('Graceful shutdown fixture did not expose output streams');
  }

  const readStandardOutput = captureOutput(server.stdout);
  const readStandardError = captureOutput(server.stderr);

  return {
    server,
    output: () =>
      `stdout:\n${readStandardOutput()}\nstderr:\n${readStandardError()}`,
  };
}

function childFailure(message: string, output: () => string): Error {
  return new Error(`${message}\n${output()}`);
}

async function resolveBeforeTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  error: Error,
): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolveTimeout, rejectTimeout) => {
        timeout = setTimeout(() => rejectTimeout(error), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
  }
}

async function waitForLiveness(
  server: ChildProcess,
  url: string,
  output: () => string,
): Promise<Response> {
  for (
    let elapsedMs = 0;
    elapsedMs < livenessWaitTimeoutMs;
    elapsedMs += livenessPollIntervalMs
  ) {
    if (server.exitCode !== null || server.signalCode !== null) {
      throw childFailure('Production server exited before becoming live', output);
    }

    try {
      const response = await fetch(`${url}/health/live`);

      if (response.ok) {
        return response;
      }
    } catch {
      // Server is still starting.
    }

    await new Promise((resolveDelay) =>
      setTimeout(resolveDelay, livenessPollIntervalMs),
    );
  }

  throw childFailure('Production server did not become live', output);
}

async function stopProductionServer(
  server: ChildProcess,
): Promise<[number | null, NodeJS.Signals | null]> {
  if (server.exitCode !== null || server.signalCode !== null) {
    return [server.exitCode, server.signalCode];
  }

  const exit = once(server, 'exit') as Promise<[
    number | null,
    NodeJS.Signals | null,
  ]>;

  if (process.platform === 'win32') {
    server.kill('SIGTERM');
  } else if (server.pid !== undefined) {
    process.kill(-server.pid, 'SIGTERM');
  } else {
    throw new Error('Production server has no process identifier');
  }

  return exit;
}

async function stopGracefulShutdownFixture(
  server: ChildProcess,
): Promise<[number | null, NodeJS.Signals | null]> {
  if (server.exitCode !== null || server.signalCode !== null) {
    return [server.exitCode, server.signalCode];
  }

  const exit = once(server, 'exit') as Promise<[
    number | null,
    NodeJS.Signals | null,
  ]>;
  server.kill('SIGTERM');
  return resolveBeforeTimeout(
    exit,
    shutdownTimeoutMs,
    new Error('Graceful shutdown fixture did not exit in time'),
  );
}

async function waitForFixturePort(
  server: ChildProcess,
  output: () => string,
): Promise<number> {
  const message = once(server, 'message') as Promise<[
    { port?: unknown; type?: unknown },
  ]>;
  const [result] = await resolveBeforeTimeout(
    message,
    livenessWaitTimeoutMs,
    childFailure('Graceful shutdown fixture did not start', output),
  );

  if (result.type !== 'ready' || typeof result.port !== 'number') {
    throw childFailure('Graceful shutdown fixture returned an invalid port', output);
  }

  return result.port;
}

async function waitForWriteStart(pool: Pool, runId: string): Promise<void> {
  for (
    let elapsedMs = 0;
    elapsedMs < livenessWaitTimeoutMs;
    elapsedMs += livenessPollIntervalMs
  ) {
    const result = await pool.query<{ active: boolean }>(
      `SELECT EXISTS (
        SELECT 1
        FROM pg_stat_activity
        WHERE query LIKE $1
          AND state = 'active'
      ) AS active`,
      [`%graceful-shutdown-write:${runId}%`],
    );

    if (result.rows[0]?.active === true) {
      return;
    }

    await new Promise((resolveDelay) =>
      setTimeout(resolveDelay, livenessPollIntervalMs),
    );
  }

  throw new Error('Graceful shutdown write did not start before SIGTERM');
}

async function waitForRejectedRequest(url: string): Promise<Response | undefined> {
  for (
    let elapsedMs = 0;
    elapsedMs < shutdownTimeoutMs;
    elapsedMs += livenessPollIntervalMs
  ) {
    try {
      const response = await fetch(`${url}/health/live`);

      if (!response.ok) {
        return response;
      }
    } catch {
      return undefined;
    }

    await new Promise((resolveDelay) =>
      setTimeout(resolveDelay, livenessPollIntervalMs),
    );
  }

  throw new Error('New request remained accepted during graceful shutdown');
}

describe('sanitizeOutput', () => {
  it('скрывает Authorization и userinfo URL полностью', () => {
    const output = [
      'Authorization: Bearer test-token',
      'authorization : bearer test-token',
      '{"authorization":"Bearer test-token"}',
      'DATABASE_URL=postgresql://user:password@database:5432/expressa',
      'https://user:password@example.test/path',
    ].join('\n');

    expect(sanitizeOutput(output)).toBe(
      [
        'Authorization: [redacted]',
        'Authorization: [redacted]',
        '{"authorization":"[redacted]"}',
        'DATABASE_URL=[redacted url]',
        '[redacted url]',
      ].join('\n'),
    );
  });
});

describe('production startup', () => {
  it('запускает build output и корректно обрабатывает SIGTERM', async () => {
    if (databaseUrl === undefined) {
      throw new Error('DATABASE_URL is required for production e2e tests');
    }

    rehearseMigrationsAndSeed();

    const port = await getAvailablePort();
    const url = `http://127.0.0.1:${port}`;
    const { output, server } = startProductionServer(port);

    try {
      const response = await waitForLiveness(server, url, output);

      expect(response.status).toBe(200);
      expect(server.exitCode).toBeNull();
      await expect(fetch(`http://localhost:${port}/health/live`)).resolves.toMatchObject({
        status: 200,
      });
      await expect(fetch(`${url}/health/ready`)).resolves.toMatchObject({
        status: 200,
      });

      const [exitCode, signal] = await stopProductionServer(server);

      expect(exitCode === 0 || signal === 'SIGTERM').toBe(true);
      await expect(fetch(`${url}/health/live`)).rejects.toThrow();
    } finally {
      if (server.exitCode === null && server.signalCode === null) {
        await stopProductionServer(server);
      }
    }
  }, coldProductionStartupTimeoutMs);

  it(
    'фиксирует local baseline health API без ошибок',
    async () => {
      if (databaseUrl === undefined) {
        throw new Error('DATABASE_URL is required for production e2e tests');
      }

      const port = await getAvailablePort();
      const url = `http://127.0.0.1:${port}`;
      const { output, server } = startProductionServer(port);

      try {
        await waitForLiveness(server, url, output);
        const timingsMs: number[] = [];

        for (let attempt = 0; attempt < 5; attempt += 1) {
          const startedAt = performance.now();
          const response = await fetch(`${url}/health/ready`);

          timingsMs.push(Math.round(performance.now() - startedAt));
          expect(response.status).toBe(200);
        }

        expect(timingsMs).toHaveLength(5);
        expect(timingsMs.every((timingMs) => Number.isFinite(timingMs) && timingMs >= 0)).toBe(
          true,
        );
        console.info('local health API baseline', JSON.stringify({ errorRate: 0, timingsMs }));
      } finally {
        if (server.exitCode === null && server.signalCode === null) {
          await stopProductionServer(server);
        }
      }
    },
    coldProductionStartupTimeoutMs,
  );

  it('завершает начатую DB-запись до остановки SIGTERM и отвергает новые запросы', async () => {
    if (databaseUrl === undefined) {
      throw new Error('DATABASE_URL is required for production e2e tests');
    }

    const observer = new Pool({ connectionString: databaseUrl });
    const port = await getAvailablePort();
    const { output, server } = startGracefulShutdownFixture(port);

    try {
      await observer.query(
        `CREATE TABLE IF NOT EXISTS graceful_shutdown_e2e_writes (
          run_id uuid PRIMARY KEY
        )`,
      );
      const port = await waitForFixturePort(server, output);
      const url = `http://127.0.0.1:${port}`;
      const runId = randomUUID();
      const write = fetch(`${url}/test/graceful-shutdown/write`, {
        method: 'POST',
        headers: { 'x-e2e-run-id': runId },
      });

      await waitForWriteStart(observer, runId);
      const shutdown = stopGracefulShutdownFixture(server);
      const rejection = await waitForRejectedRequest(url);

      expect(rejection?.status ?? 503).toBe(503);
      await expect(write).resolves.toMatchObject({ status: 201 });

      const committed = await observer.query<{ run_id: string }>(
        'SELECT run_id FROM graceful_shutdown_e2e_writes WHERE run_id = $1',
        [runId],
      );
      expect(committed.rows).toHaveLength(1);
      await expect(shutdown).resolves.toEqual([0, null]);
      await expect(fetch(`${url}/health/live`)).rejects.toThrow();
    } finally {
      if (server.exitCode === null && server.signalCode === null) {
        await stopGracefulShutdownFixture(server);
      }
      await observer.query('DROP TABLE IF EXISTS graceful_shutdown_e2e_writes');
      await observer.end();
    }
  }, coldProductionStartupTimeoutMs);
});
