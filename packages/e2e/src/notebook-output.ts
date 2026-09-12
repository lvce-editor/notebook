import type { Test } from '@lvce-editor/test-with-playwright'
export const name = 'notebook-output'
export const test: Test = async ({ expect, FileSystem, Locator, Main }) => {
  const tmpDir = await FileSystem.getTmpDir()
  const uri = `${tmpDir}/notebook-output.ipynb`
  await FileSystem.writeFile(
    uri,
    '{"nbformat": 4, "nbformat_minor": 5, "metadata": {"custom": "preserve", "kernelspec": {"name": "python3", "display_name": "Python 3", "language": "python"}}, "cells": [{"cell_type": "code", "id": "initial", "metadata": {}, "source": ["print(42)"], "execution_count": null, "outputs": [{"output_type": "stream", "name": "stdout", "text": "<script>not executable</script>"}]}]}',
  )
  await Main.openUri(uri)
  await expect(Locator('.NotebookOutput')).toHaveText(
    '<script>not executable</script>',
  )
}
