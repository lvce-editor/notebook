import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { root } from './root.ts'

const locations = [
  'package.json',
  'package-lock.json',
  '.github/workflows/pr.yml',
  '.github/workflows/ci.yml',
  '.github/workflows/release.yml',
  '.nvmrc',
  'packages/build/src/computeNodeModulesCacheKey.ts',
]

const hash = createHash('sha1')
for (const location of locations) {
  hash.update(await readFile(join(root, location), 'utf8'))
}
process.stdout.write(hash.digest('hex'))
