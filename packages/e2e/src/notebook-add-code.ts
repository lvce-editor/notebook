import type { Test } from '@lvce-editor/test-with-playwright'
export const name = 'notebook-add-code'
export const test: Test = async ({ expect, FileSystem, Locator, Main }) => {
  const tmpDir = await FileSystem.getTmpDir()
  const uri = `${tmpDir}/notebook-add-code.ipynb`
  await FileSystem.writeFile(
    uri,
    '{"nbformat": 4, "nbformat_minor": 5, "metadata": {"custom": "preserve", "kernelspec": {"name": "python3", "display_name": "Python 3", "language": "python"}}, "cells": [{"cell_type": "code", "id": "initial", "metadata": {}, "source": ["print(42)"], "execution_count": null, "outputs": []}]}',
  )
  await Main.openUri(uri)
  await Locator('[name="add-code"]').click()
  await expect(Locator('.NotebookCell')).toHaveCount(2)
  await expect(Locator('.NotebookSource').nth(1)).toHaveValue('')
}
