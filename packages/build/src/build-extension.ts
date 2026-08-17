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
