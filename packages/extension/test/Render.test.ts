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
      execution_count: 1,
      outputs: [{ output_type: 'stream', text: '<script>plain</script>' }],
    },
    newCell('markdown'),
  )
  const dom = render({
    busy: false,
    dirty: true,
    error: '',
    notebook,
    status: 'Ready',
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
    busy: false,
    dirty: false,
    error: 'Invalid JSON',
    notebook: newNotebook(),
    status: '',
    uri: '',
  })
  expect(() => validate(dom)).not.toThrow()
  expect(dom).toContainEqual(
    expect.objectContaining({ disabled: true, name: 'save' }),
  )
})
