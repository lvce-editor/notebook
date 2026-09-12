// cspell:ignore nbformat kernelspec ename evalue ipykernel
import type { Test } from '@lvce-editor/test-with-playwright'
export const name = 'notebook-invalid'
export const test: Test = async ({ expect, FileSystem, Locator, Main }) => {
  const tmpDir = await FileSystem.getTmpDir()
  const uri = `${tmpDir}/notebook-invalid.ipynb`
  await FileSystem.writeFile(uri, '{}')
  await Main.openUri(uri)
  const element1 = Locator('.NotebookStatus')
  await expect(element1).toHaveText(
    'Error: Expected a Jupyter notebook in nbformat 4',
  )
  const element2 = Locator('.NotebookCell')
  await expect(element2).toHaveCount(0)
}
