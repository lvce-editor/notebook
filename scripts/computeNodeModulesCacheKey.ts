import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const locations = [
  'package.json',
  'package-lock.json',
  '.github/workflows/pr.yml',
  '.github/workflows/ci.yml',
  '.github/workflows/release.yml',
  '.nvmrc',
  'scripts/computeNodeModulesCacheKey.ts',
]

const hash = createHash('sha1')
for (const location of locations) {
  hash.update(await readFile(join(root, location), 'utf8'))
}
process.stdout.write(hash.digest('hex'))
