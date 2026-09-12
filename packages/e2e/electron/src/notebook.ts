// cspell:ignore nbformat
import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
export const name = 'notebook-electron'
export const test = async ({
  page,
}: {
  readonly page: Readonly<Pick<Page, 'locator' | 'getByRole'>>
}): Promise<void> => {
  const sources = page.locator('.NotebookSource')
  await expect(sources).toHaveCount(2)
  await page
    .getByRole('button', { exact: true, name: 'Run cell' })
    .nth(0)
    .press('Enter')
  const status = page.locator('.NotebookStatus')
  await expect(status).toHaveText('Cell finished')
  const outputs = page.locator('.NotebookOutput')
  const firstOutput = outputs.nth(0)
  await expect(firstOutput).toHaveText('40\n')
  await page
    .getByRole('button', { exact: true, name: 'Run cell' })
    .nth(1)
    .press('Enter')
  const secondOutput = outputs.nth(1)
  await expect(secondOutput).toHaveText('42')
  await page
    .getByRole('button', { exact: true, name: 'Add Markdown cell' })
    .press('Enter')
  await sources.nth(2).fill('# Desktop notes')
  await page
    .getByRole('button', { exact: true, name: 'Save notebook' })
    .press('Enter')
  const title = page.locator('.NotebookTitle')
  await expect(title).toHaveText('Notebook')
  const saved = JSON.parse(
    await readFile(process.env.NOTEBOOK_TEST_FILE!, 'utf8'),
  )
  expect(saved.cells[2].source).toBe('# Desktop notes')
  expect(saved.cells[1].outputs[0].data['text/plain']).toBe('42')
  expect(saved.metadata.custom).toBe('preserve')
  await page
    .getByRole('button', { exact: true, name: 'Stop kernel' })
    .press('Enter')
  await expect(status).toHaveText('Kernel stopped')
}
