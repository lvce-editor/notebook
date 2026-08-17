import { access, cp, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path, { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { root } from './root.ts'

const extensionId = 'builtin.notebook'

const serverPackagePath = join(root, 'packages', 'server', 'package.json')
const serverRequire = createRequire(serverPackagePath)
const sharedProcessPath = serverRequire.resolve('@lvce-editor/shared-process')
const sharedProcess = await import(pathToFileURL(sharedProcessPath).toString())

await import('./build.ts')
await cp(join(root, 'dist'), join(root, 'dist2'), {
  recursive: true,
  force: true,
})

const { commitHash } = await sharedProcess.exportStatic({
  extensionPath: 'packages/extension',
  testPath: 'packages/e2e',
  root,
})
const extensionDirectory = join(
  root,
  'dist',
  commitHash,
  'extensions',
  extensionId,
)
await cp(join(root, 'dist2'), extensionDirectory, {
  recursive: true,
  force: true,
})

const manifestPath = join(extensionDirectory, 'extension.json')
await access(manifestPath)
const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
  readonly browser?: string
}
if (!manifest.browser) {
  throw new Error(`${manifestPath} must define a browser entry`)
}
await access(join(extensionDirectory, manifest.browser))
