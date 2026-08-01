import { readFile } from 'node:fs/promises'
import { URL, fileURLToPath } from 'node:url'

const scriptUrl = new URL('.', import.meta.url)
const snapshotPath = fileURLToPath(new URL('../contracts/openapi.json', scriptUrl))
const backendPath = fileURLToPath(new URL('../../backend/openapi/openapi.json', scriptUrl))

const [snapshot, backend] = await Promise.all([readFile(snapshotPath), readFile(backendPath)])

if (!snapshot.equals(backend)) {
  throw new Error('OpenAPI-снимок front-office не совпадает с backend/openapi/openapi.json.')
}
