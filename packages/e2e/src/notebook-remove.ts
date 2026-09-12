import type { Test } from '@lvce-editor/test-with-playwright'
export const name = 'notebook-remove'
export const test: Test = async ({ expect, FileSystem, Locator, Main }) => {
  const tmpDir = await FileSystem.getTmpDir()
  const uri = `${tmpDir}/notebook-remove.ipynb`
  await FileSystem.writeFile(
    uri,
    '{"nbformat": 4, "nbformat_minor": 5, "metadata": {"custom": "preserve", "kernelspec": {"name": "python3", "display_name": "Python 3", "language": "python"}}, "cells": [{"cell_type": "code", "id": "initial", "metadata": {}, "source": ["print(42)"], "execution_count": null, "outputs": []}]}',
  )
  await Main.openUri(uri)
  await Locator('[name="remove:0"]').click()
  await expect(Locator('.NotebookCell')).toHaveCount(0)
  await Locator('[name="add-code"]').click()
  await expect(Locator('.NotebookCell')).toHaveCount(1)
}
