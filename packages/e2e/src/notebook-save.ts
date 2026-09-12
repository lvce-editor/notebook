import type { Test } from '@lvce-editor/test-with-playwright'
export const name = 'notebook-save'
export const test: Test = async ({ expect, FileSystem, Locator, Main }) => {
  const tmpDir = await FileSystem.getTmpDir()
  const uri = `${tmpDir}/notebook-save.ipynb`
  await FileSystem.writeFile(
    uri,
    '{"nbformat": 4, "nbformat_minor": 5, "metadata": {"custom": "preserve", "kernelspec": {"name": "python3", "display_name": "Python 3", "language": "python"}}, "cells": [{"cell_type": "code", "id": "initial", "metadata": {}, "source": ["print(42)"], "execution_count": null, "outputs": []}]}',
  )
  await Main.openUri(uri)
  await Locator('[name="add-markdown"]').click()
  await Locator('.NotebookSource').nth(1).type('# Notes')
  await Locator('[name="save"]').click()
  await expect(Locator('.NotebookStatus')).toHaveText('Notebook saved')
  const saved = JSON.parse(await FileSystem.readFile(uri))
  if (
    saved.cells[1].source !== '# Notes' ||
    saved.metadata.custom !== 'preserve'
  )
    throw new Error('Notebook was not preserved')
}
