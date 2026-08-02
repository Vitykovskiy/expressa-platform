import type { Request, Response } from 'express';
import { createApplication, startServer } from '../../../src/main';
import { DatabaseService } from '../../../src/platform/database/database.service';

const writeDelayMs = 1_000;

async function bootstrapFixture(): Promise<void> {
  const app = await createApplication();
  const adapter = app.getHttpAdapter().getInstance();

  adapter.post('/test/graceful-shutdown/write', async (request: Request, response: Response) => {
    const runId = request.header('x-e2e-run-id');

    if (runId === undefined) {
      response.status(400).end();
      return;
    }

    const query = `/* graceful-shutdown-write:${runId} */
      WITH pause AS (SELECT pg_sleep($1))
      INSERT INTO graceful_shutdown_e2e_writes (run_id)
      SELECT $2 FROM pause`;

    try {
      await app.get(DatabaseService).connectionPool.query(query, [
        writeDelayMs / 1_000,
        runId,
      ]);
      response.status(201).json({ runId });
    } catch (error) {
      response.status(500).json({ error: String(error) });
    }
  });

  await startServer(app);
  const server = app.getHttpServer();
  const address = server.address();

  if (address === null || typeof address === 'string') {
    throw new Error('Graceful shutdown fixture did not bind a TCP port');
  }

  process.send?.({ type: 'ready', port: address.port });
}

void bootstrapFixture();
