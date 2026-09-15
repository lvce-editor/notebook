// cspell:ignore nbformat Notebookbuiltin
import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'extension.notebook-disabled-by-default'

export const test: Test = async ({
  Command,
  expect,
  ExtensionDetail,
  FileSystem,
  Locator,
  Main,
  QuickPick,
  RunningExtensions,
}) => {
  const extensionId = 'builtin.notebook'
  await ExtensionDetail.open(extensionId)
  const extensionName = Locator('.ExtensionDetailName')
  await expect(extensionName).toHaveText('Notebookbuiltin')
  const enable = Locator('[name="Enable"]')
  await expect(enable).toBeVisible()
  const install = Locator('[name="Install"]')
  await expect(install).toBeHidden()
  const disable = Locator('[name="Disable"]')
  await expect(disable).toBeHidden()

  await QuickPick.open()
  await QuickPick.setValue('>Notebook: Show')
  const quickPickItem = Locator('.QuickPickItem', { hasText: 'Notebook: Show' })
  await expect(quickPickItem).toBeHidden()
  await Command.execute('Viewlet.closeWidget', 'QuickPick')
  await RunningExtensions.show()
  const runningExtensionId = Locator('.RunningExtensionId', {
    hasText: extensionId,
  })
  await expect(runningExtensionId).toBeHidden()

  const tmpDir = await FileSystem.getTmpDir()
  const uri = `${tmpDir}/bundled-notebook.ipynb`
  await FileSystem.writeFile(
    uri,
    JSON.stringify({
      cells: [
        {
          cell_type: 'code',
          execution_count: null,
          metadata: {},
          outputs: [],
          source: ['print(42)'],
        },
      ],
      metadata: {},
      nbformat: 4,
      nbformat_minor: 5,
    }),
  )
  await Main.openUri(uri)
  const notebookSource = Locator('.NotebookSource')
  await expect(notebookSource).toBeHidden()
  await Main.closeAllEditors()

  await ExtensionDetail.open(extensionId)
  await ExtensionDetail.handleClickEnable()
  try {
    const disable2 = Locator('[name="Disable"]')
    await expect(disable2).toBeVisible()
    await Main.openUri(uri)
    const notebookSource2 = Locator('.NotebookSource')
    await expect(notebookSource2).toHaveValue('print(42)')
    const notebookTitle = Locator('.NotebookTitle')
    await expect(notebookTitle).toHaveText('Notebook')
  } finally {
    await Main.closeAllEditors()
    await ExtensionDetail.open(extensionId)
    await ExtensionDetail.handleClickDisable()
  }
}
