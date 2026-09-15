import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { root } from './root.ts'

await import('./build-extension.ts')
const directory = join(root, '.tmp', 'electron-notebook')
await mkdir(directory, { recursive: true })
const file = join(directory, 'acceptance.ipynb')
await writeFile(
  file,
  JSON.stringify({
    cells: [
      {
        cell_type: 'code',
        execution_count: null,
        id: 'a',
        metadata: {},
        outputs: [],
        source: 'value = 40\nprint(value)',
      },
      {
        cell_type: 'code',
        execution_count: null,
        id: 'b',
        metadata: {},
        outputs: [],
        source: 'value + 2',
      },
    ],
    metadata: { custom: 'preserve' },
    nbformat: 4,
    nbformat_minor: 5,
  }),
)
const child = spawn(
  process.execPath,
  [
    join(
      root,
      'node_modules/@lvce-editor/test-with-playwright/bin/test-with-playwright.js',
    ),
    '--test-path=electron',
    '--filter=notebook.ts',
    '--runtime=electron',
    `--electron-arg=${file}`,
  ],
  {
    cwd: join(root, 'packages/e2e'),
    env: {
      ...process.env,
      NOTEBOOK_TEST_FILE: file,
      ONLY_EXTENSION: join(root, 'packages/extension'),
    },
    stdio: 'inherit',
  },
)
child.on('error', (error) => {
  console.error(error)
  process.exitCode = 1
})
child.on('exit', (code) => {
  process.exitCode = code ?? 1
})
