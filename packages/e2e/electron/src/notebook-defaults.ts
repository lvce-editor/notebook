import type { ElectronApplication, Page } from '@playwright/test'
// cspell:ignore nbformat Notebookbuiltin
import { _electron, expect } from '@playwright/test'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const name = 'notebook-defaults'

export const test = async ({
  electronApp,
}: {
  readonly electronApp: Readonly<ElectronApplication>
}): Promise<void> => {
  const executablePath = await electronApp.evaluate(({ app }) =>
    app.getPath('exe'),
  )
  await electronApp.close()
  const profile = await mkdtemp(join(tmpdir(), 'notebook-defaults-'))
  let app: ElectronApplication | undefined
  try {
    const config = join(profile, 'config/lvce')
    await mkdir(config, { recursive: true })
    // Persisted LVCE key codes for Ctrl+Alt+1 and Ctrl+Alt+2.
    await writeFile(
      join(config, 'keybindings.json'),
      JSON.stringify([
        {
          args: ['extension-detail:///builtin.notebook'],
          command: 'Main.openUri',
          key: 2580,
          source: 'User',
        },
        { command: 'Main.closeAllEditors', key: 2581, source: 'User' },
        {
          args: ['running-extensions:///1'],
          command: 'Main.openUri',
          key: 2582,
          source: 'User',
        },
      ]),
    )
    const notebook = join(profile, 'example.ipynb')
    await writeFile(
      notebook,
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
    const env: Record<string, string> = {}
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) env[key] = value
    }
    delete env.ELECTRON_RUN_AS_NODE
    for (const kind of ['CONFIG', 'DATA', 'STATE', 'CACHE']) {
      env[`XDG_${kind}_HOME`] = join(profile, kind.toLowerCase())
    }
    const launch = async (): Promise<Page> => {
      app = await _electron.launch({
        args: [
          '--no-sandbox',
          `--user-data-dir=${join(profile, 'chromium')}`,
          notebook,
        ],
        env,
        executablePath,
      })
      const childPaths = await app.evaluate(() =>
        ['CONFIG', 'DATA', 'STATE', 'CACHE'].map(
          (kind) => process.env[`XDG_${kind}_HOME`],
        ),
      )
      expect(childPaths).toEqual(
        ['config', 'data', 'state', 'cache'].map((kind) => join(profile, kind)),
      )
      const page = await app.firstWindow()
      const workbench2 = page.locator('.Workbench')
      await expect(workbench2).toBeVisible()
      // Wait for the requested document, not just the startup workbench shell.
      const document = page.locator('.Editor, .Notebook').first()
      await expect(document).toBeVisible()
      const documentTab = page.locator('.MainTabSelected .TabTitle')
      await expect(documentTab).toHaveText('example.ipynb')
      return page
    }
    const openDetail = async (
      page: Readonly<Pick<Page, 'bringToFront' | 'locator'>>,
    ): Promise<void> => {
      await page.bringToFront()
      const extensions = page.locator('.Extensions')
      if (!(await extensions.isVisible())) {
        // eslint-disable-next-line e2e/no-direct-click -- open the installed extensions through the activity bar
        await page.locator('.ActivityBarItem[title^="Extensions"]').click()
      }
      const search = extensions.locator('input[type="search"]')
      await search.fill('@id:builtin.notebook')
      const notebookItem = extensions.locator('.ExtensionListItem', {
        hasText: 'Notebook',
      })
      // eslint-disable-next-line e2e/no-direct-click -- open the bundled extension details through its search result
      await notebookItem.click()
      const extensionName = page.locator('.ExtensionDetailName')
      await expect(extensionName).toHaveText('Notebookbuiltin')
    }
    let page = await launch()
    const notebookSource = page.locator('.NotebookSource')
    await expect(notebookSource).toBeHidden()
    await openDetail(page)
    const install = page.locator('[name="Install"]')
    await expect(install).toBeHidden()
    const disable2 = page.locator('[name="Disable"]')
    await expect(disable2).toBeHidden()
    const initialEnable = page.locator('[name="Enable"]')
    await expect(initialEnable).toBeVisible()
    await page.keyboard.press('Control+Shift+P')
    const quickPickInput = page.locator('.QuickPick input')
    await quickPickInput.fill('>Notebook: Show')
    const notebookCommand = page.getByRole('option', {
      exact: true,
      name: 'Notebook: Show',
    })
    await expect(notebookCommand).toBeHidden()
    await page.keyboard.press('Escape')
    await page.keyboard.press('Control+Alt+3')
    const runningExtensions = page.locator('.RunningExtensions')
    await expect(runningExtensions).toBeVisible()
    const runningNotebook = page.locator('.RunningExtensionId', {
      hasText: 'builtin.notebook',
    })
    await expect(runningNotebook).toBeHidden()
    await openDetail(page)
    // eslint-disable-next-line e2e/no-direct-click -- enable the bundled extension through its detail action
    await page.locator('[name="Enable"]').click()
    await expect(disable2).toBeVisible()
    const enablementPath = join(
      profile,
      'data/lvce/extensions/disabled-extensions.json',
    )
    await expect
      .poll(
        async () =>
          JSON.parse(await readFile(enablementPath, 'utf8')).enabledExtensions,
      )
      .toContain('builtin.notebook')
    await app!.close()
    app = undefined

    page = await launch()
    await openDetail(page)
    const enable = page.locator('[name="Enable"]')
    await expect(enable).toBeHidden()
    const reopenedDisable = page.locator('[name="Disable"]')
    await expect(reopenedDisable).toBeVisible()
    await page.keyboard.press('Control+Alt+2')
    // eslint-disable-next-line e2e/no-direct-click -- return to the notebook workspace
    await page.locator('.ActivityBarItem[title^="Explorer"]').click()
    await page
      .getByRole('treeitem', { exact: true, name: 'example.ipynb' })
      .dblclick()
    const reopenedSource = page.locator('.NotebookSource')
    await expect(reopenedSource).toHaveValue('print(42)')
    expect(
      JSON.parse(await readFile(enablementPath, 'utf8')).enabledExtensions,
    ).toEqual(['builtin.notebook'])
  } finally {
    await app?.close()
    await rm(profile, { force: true, recursive: true })
  }
}
