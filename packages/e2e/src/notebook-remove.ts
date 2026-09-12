// cspell:ignore nbformat kernelspec ename evalue ipykernel
import type { Test } from '@lvce-editor/test-with-playwright'
import { action } from './_notebook.ts'
export const name = 'notebook-remove'
export const test: Test = async ({
  Command,
  expect,
  FileSystem,
  Locator,
  Main,
}) => {
  const tmpDir = await FileSystem.getTmpDir()
  const uri = `${tmpDir}/notebook-remove.ipynb`
  await FileSystem.writeFile(
    uri,
    '{"nbformat": 4, "nbformat_minor": 5, "metadata": {"custom": "preserve", "kernelspec": {"name": "python3", "display_name": "Python 3", "language": "python"}}, "cells": [{"cell_type": "code", "id": "initial", "metadata": {}, "source": ["print(42)"], "execution_count": null, "outputs": []}]}',
  )
  await Main.openUri(uri)
  await action(Command, 'remove:0')
  const element1 = Locator('.NotebookCell')
  await expect(element1).toHaveCount(0)
  await action(Command, 'add-code')
  const element2 = Locator('.NotebookCell')
  await expect(element2).toHaveCount(1)
}
