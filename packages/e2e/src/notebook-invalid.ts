import type { Test } from '@lvce-editor/test-with-playwright'
export const name = 'notebook-invalid'
export const test: Test = async ({ expect, FileSystem, Locator, Main }) => {
  const tmpDir = await FileSystem.getTmpDir()
  const uri = `${tmpDir}/notebook-invalid.ipynb`
  await FileSystem.writeFile(uri, '{}')
  await Main.openUri(uri)
  await expect(Locator('.NotebookStatus')).toHaveText(
    'Error: Expected a Jupyter notebook in nbformat 4',
  )
  await expect(Locator('.NotebookCell')).toHaveCount(0)
}
