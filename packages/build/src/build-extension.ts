import * as esbuild from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'
import { root } from './root.ts'

const extension = path.join(root, 'packages', 'extension')
const entryPoint = path.join(extension, 'src', 'notebookMain.ts')
const outdir = path.join(extension, 'dist')

fs.rmSync(outdir, { recursive: true, force: true })
fs.mkdirSync(outdir, { recursive: true })

await esbuild.build({
  bundle: true,
  entryPoints: [entryPoint],
  external: ['electron', 'node:*'],
  format: 'esm',
  outfile: path.join(outdir, 'notebookMain.js'),
  platform: 'browser',
  sourcemap: true,
  target: 'esnext',
})

await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, 'packages/node/src/notebookProcess.ts')],
  outfile: path.join(outdir, 'notebookProcess.js'),
  platform: 'node',
  format: 'esm',
  target: 'esnext',
})
fs.copyFileSync(
  path.join(root, 'packages/node/src/kernel.py'),
  path.join(outdir, 'kernel.py'),
)
