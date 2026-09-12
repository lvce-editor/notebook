import { expect, test } from '@jest/globals'
import { validate } from '@lvce-editor/virtual-dom-worker'
import {
  newCell,
  newNotebook,
} from '../src/parts/NotebookDocument/NotebookDocument.ts'
import { render } from '../src/parts/Render/Render.ts'
test('renders valid DOM with controls, source and plain text outputs', () => {
  const notebook = newNotebook()
  notebook.cells.push(
    {
      ...newCell('code'),
      outputs: [{ output_type: 'stream', text: '<script>plain</script>' }],
      execution_count: 1,
    },
    newCell('markdown'),
  )
  const dom = render({
    notebook,
    status: 'Ready',
    error: '',
    busy: false,
    dirty: true,
    uri: 'a.ipynb',
  })
  expect(() => validate(dom)).not.toThrow()
  expect(dom).toContainEqual(
    expect.objectContaining({ text: '<script>plain</script>' }),
  )
  expect(dom).toContainEqual(expect.objectContaining({ text: 'Notebook •' }))
})
test('invalid notebook displays an error and disables modification', () => {
  const dom = render({
    notebook: newNotebook(),
    status: '',
    error: 'Invalid JSON',
    busy: false,
    dirty: false,
    uri: '',
  })
  expect(() => validate(dom)).not.toThrow()
  expect(dom).toContainEqual(
    expect.objectContaining({ name: 'save', disabled: true }),
  )
})
