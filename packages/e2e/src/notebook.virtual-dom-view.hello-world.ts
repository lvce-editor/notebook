import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'notebook.virtual-dom-view.hello-world'

export const test: Test = async ({ Command, expect, Locator }) => {
  await Command.execute('ActivityBar.handleExtensionsChanged')

  const item = Locator('.ActivityBarItem[title="Notebook"]')
  await expect(item).toBeVisible()
  await Command.execute(
    'ActivityBar.handleClick',
    0,
    0,
    0,
    'notebook.views.notebook',
  )
  await expect(item).toHaveAttribute('aria-selected', 'true')

  const runningExtensions = (await Command.execute(
    'ExtensionManagement.getRunningExtensions',
  )) as readonly { readonly id: string }[]
  if (
    runningExtensions.every((extension) => extension.id !== 'builtin.notebook')
  ) {
    throw new Error('Expected builtin.notebook to be running')
  }

  const title = Locator('.NotebookTitle')
  await expect(title).toHaveText('Hello World')
}
