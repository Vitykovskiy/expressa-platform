import { execFileSync } from 'node:child_process'
import { URL, fileURLToPath } from 'node:url'

const frontOfficeDirectory = fileURLToPath(new URL('..', import.meta.url))
const repositoryDirectory = fileURLToPath(new URL('../..', import.meta.url))
const image = 'mcr.microsoft.com/playwright@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e'

execFileSync(
  'docker',
  [
    'run',
    '--rm',
    '--ipc=host',
    '--volume',
    `${repositoryDirectory}:/workspace`,
    '--volume',
    'expressa-front-office-visual-node-modules:/workspace/front-office/node_modules',
    '--workdir',
    '/workspace/front-office',
    image,
    'bash',
    '-lc',
    'npm ci && npm run test:visual:inner',
  ],
  {
    cwd: frontOfficeDirectory,
    stdio: 'inherit',
  },
)
