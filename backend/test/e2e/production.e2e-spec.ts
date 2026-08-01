import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { createServer, type AddressInfo } from 'node:net';
import { resolve } from 'node:path';

const databaseUrl = process.env.DATABASE_URL;
const coldProductionStartupTimeoutMs = 30_000;
const livenessWaitTimeoutMs = 25_000;
const livenessPollIntervalMs = 100;
const childOutputLimit = 4_000;

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

function childFailure(message: string, output: () => string): Error {
  return new Error(`${message}\n${output()}`);
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

      const [exitCode, signal] = await stopProductionServer(server);

      expect(exitCode === 0 || signal === 'SIGTERM').toBe(true);
      await expect(fetch(`${url}/health/live`)).rejects.toThrow();
    } finally {
      if (server.exitCode === null && server.signalCode === null) {
        await stopProductionServer(server);
      }
    }
  }, coldProductionStartupTimeoutMs);
});
