import { expect, test } from '@jest/globals'
import { readFile } from 'node:fs/promises'

test('declares the built-in notebook view', async () => {
  const content = await readFile(
    new URL('../extension.json', import.meta.url),
    'utf8',
  )
  const manifest = JSON.parse(content) as {
    readonly activation: readonly string[]
    readonly id: string
    readonly repository: string
    readonly views: readonly { readonly id: string }[]
  }

  expect(manifest.id).toBe('builtin.notebook')
  expect(manifest.repository).toBe('https://github.com/lvce-editor/notebook')
  expect(manifest.activation).toContain('onView:notebook.views.notebook')
  expect(manifest.views).toContainEqual(
    expect.objectContaining({ id: 'notebook.views.notebook' }),
  )
})
