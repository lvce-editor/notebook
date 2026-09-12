// cspell:ignore nbformat kernelspec ename evalue ipykernel
import type { Test } from '@lvce-editor/test-with-playwright'
import { action } from './_notebook.ts'
export const name = 'notebook-execute'
export const test: Test = async ({
  Command,
  expect,
  FileSystem,
  Locator,
  Main,
}) => {
  const tmpDir = await FileSystem.getTmpDir()
  const uri = `${tmpDir}/execute.ipynb`
  await FileSystem.writeFile(
    uri,
    JSON.stringify({
      cells: [
        {
          cell_type: 'code',
          execution_count: null,
          id: 'a',
          metadata: {},
          outputs: [],
          source: 'value = 40\nprint(value)',
        },
        {
          cell_type: 'code',
          execution_count: null,
          id: 'b',
          metadata: {},
          outputs: [],
          source: 'value + 2',
        },
      ],
      metadata: {},
      nbformat: 4,
      nbformat_minor: 5,
    }),
  )
  await Main.openUri(uri)
  await action(Command, 'run:0')
  if ((await Command.execute('Layout.getPlatform')) === 1) {
    const element1 = Locator('.NotebookStatus')
    await expect(element1).toHaveText(
      'Code execution is not supported on the web',
    )
    return
  }
  const element2 = Locator('.NotebookOutput')
  await expect(element2).toHaveText('40\n')
  await action(Command, 'run:1')
  const element3 = Locator('.NotebookOutput').nth(1)
  await expect(element3).toHaveText('42')
  await action(Command, 'stop')
  const element4 = Locator('.NotebookStatus')
  await expect(element4).toHaveText('Kernel stopped')
}
