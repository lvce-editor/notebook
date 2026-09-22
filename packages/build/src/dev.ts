import * as esbuild from 'esbuild'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { root } from './root.ts'

await import('./build-extension.ts')

const extension = path.join(root, 'packages', 'extension')
const context = await esbuild.context({
  bundle: true,
  entryPoints: [path.join(extension, 'src', 'notebookMain.ts')],
  external: ['electron', 'node:*'],
  format: 'esm',
  outfile: path.join(extension, 'dist', 'notebookMain.js'),
  platform: 'browser',
  sourcemap: true,
  target: 'esnext',
})

await context.rebuild()
await context.watch()

const serverPackagePath = path.join(root, 'packages', 'server', 'package.json')
const serverRequire = createRequire(serverPackagePath)
const serverPath = serverRequire.resolve('@lvce-editor/server/bin/server.js')
const server = spawn(
  process.execPath,
  [
    serverPath,
    '--only-extension=packages/extension',
    '--test-path=packages/e2e',
  ],
  {
    cwd: root,
    env: { ...process.env, PORT: process.env.PORT || '3000' },
    stdio: 'inherit',
  },
)

const stop = async (): Promise<void> => {
  server.kill()
  await context.dispose()
}

process.on('SIGINT', async () => {
  await stop()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await stop()
  process.exit(0)
})

server.on('exit', async (code) => {
  await context.dispose()
  process.exit(code ?? 0)
})
