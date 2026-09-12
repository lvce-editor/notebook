import * as esbuildNode from 'esbuild'
import { packageExtension } from '@lvce-editor/package-extension'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path, { join } from 'node:path'
import { type Plugin, rollup } from 'rollup'
import esbuild from 'rollup-plugin-esbuild'
import { root } from './root.ts'

const extension = path.join(root, 'packages', 'extension')
const output = path.join(root, 'dist')
const require = createRequire(import.meta.url)
const commonjs = require('@rollup/plugin-commonjs') as () => Plugin

fs.rmSync(output, { recursive: true, force: true })
fs.mkdirSync(path.join(output, 'media'), { recursive: true })
fs.copyFileSync(join(root, 'README.md'), join(output, 'README.md'))
fs.copyFileSync(
  join(extension, 'extension.json'),
  join(output, 'extension.json'),
)
fs.copyFileSync(
  join(extension, 'media', 'notebook.css'),
  join(output, 'media', 'notebook.css'),
)
fs.copyFileSync(
  join(extension, 'media', 'notebook.svg'),
  join(output, 'media', 'notebook.svg'),
)

const bundle = await rollup({
  input: join(extension, 'src', 'notebookMain.ts'),
  external: ['electron', 'node:*'],
  plugins: [
    nodeResolve({ browser: true }),
    commonjs(),
    esbuild({ target: 'esnext' }),
  ],
  treeshake: { moduleSideEffects: false },
})

await bundle.write({
  file: join(output, 'dist', 'notebookMain.js'),
  format: 'esm',
})
await bundle.close()

await esbuildNode.build({
  bundle: true,
  entryPoints: [join(root, 'packages/node/src/notebookProcess.ts')],
  outfile: join(output, 'dist/notebookProcess.js'),
  external: ['electron', 'node:*'],
  banner: {
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
  platform: 'node',
  format: 'esm',
  target: 'esnext',
})
fs.copyFileSync(
  join(root, 'packages/node/src/kernel.py'),
  join(output, 'dist/kernel.py'),
)

await packageExtension({
  highestCompression: true,
  inDir: output,
  outFile: join(root, 'extension.tar.br'),
})
