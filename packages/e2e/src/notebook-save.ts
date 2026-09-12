// cspell:ignore nbformat kernelspec ename evalue ipykernel
import type { Test } from '@lvce-editor/test-with-playwright'
import { action } from './_notebook.ts'
export const name = 'notebook-save'
export const test: Test = async ({
  Command,
  expect,
  FileSystem,
  Locator,
  Main,
}) => {
  const tmpDir = await FileSystem.getTmpDir()
  const uri = `${tmpDir}/notebook-save.ipynb`
  await FileSystem.writeFile(
    uri,
    '{"nbformat": 4, "nbformat_minor": 5, "metadata": {"custom": "preserve", "kernelspec": {"name": "python3", "display_name": "Python 3", "language": "python"}}, "cells": [{"cell_type": "code", "id": "initial", "metadata": {}, "source": ["print(42)"], "execution_count": null, "outputs": []}]}',
  )
  await Main.openUri(uri)
  await action(Command, 'add-markdown')
  await action(Command, '1', '# Notes')
  await action(Command, 'save')
  const element1 = Locator('.NotebookTitle')
  await expect(element1).toHaveText('Notebook')
  const saved = JSON.parse(await FileSystem.readFile(uri))
  if (
    saved.cells[1].source !== '# Notes' ||
    saved.metadata.custom !== 'preserve'
  )
    throw new Error('Notebook was not preserved')
}
