import { expect, test } from '@jest/globals'
// cspell:ignore nbformat kernelspec ename evalue ipykernel
import {
  kernelName,
  newCell,
  newNotebook,
  outputText,
  parseNotebook,
  sourceText,
} from '../src/parts/NotebookDocument/NotebookDocument.ts'
test('preserves metadata, multiline source, attachments, outputs and unknown fields', () => {
  const notebook = {
    ...newNotebook(),
    cells: [
      {
        ...newCell('markdown'),
        attachments: { image: {} },
        metadata: { custom: true },
        source: ['hello\n', 'world'],
      },
    ],
    extra: true,
  }
  expect(parseNotebook(JSON.stringify(notebook))).toEqual(notebook)
  expect(sourceText(notebook.cells[0].source)).toBe('hello\nworld')
})
test.each(['null', '[]', '{}', '{"nbformat":3}', '{invalid'])(
  'rejects invalid notebook %s',
  (content) => {
    expect(() => parseNotebook(content)).toThrow()
  },
)
test.each([
  { cell_type: 'unknown' },
  { ...newCell('code'), source: [1] },
  { ...newCell('code'), outputs: null },
  { ...newCell('code'), execution_count: 'x' },
  { ...newCell('markdown'), metadata: [] },
])('rejects invalid cells', (cell: unknown) => {
  expect(() =>
    parseNotebook(JSON.stringify({ ...newNotebook(), cells: [cell] })),
  ).toThrow()
})
test('accepts code output and raw cells', () => {
  const notebook = {
    ...newNotebook(),
    cells: [newCell('code'), { ...newCell('markdown'), cell_type: 'raw' }],
  }
  expect(parseNotebook(JSON.stringify(notebook))).toEqual(notebook)
})
test('normalizes output text without rendering HTML', () => {
  expect(outputText({ output_type: 'stream', text: ['a', 'b'] })).toBe('ab')
  expect(
    outputText({ ename: 'Error', evalue: 'bad', output_type: 'error' }),
  ).toBe('Error: bad')
  expect(
    outputText({ data: { 'text/html': '<script>', 'text/plain': '42' } }),
  ).toBe('42')
  expect(outputText({ data: { 'text/html': '<script>' } })).toBe('')
  expect(outputText({})).toBe('')
  expect(sourceText(null)).toBe('')
})
test('uses the declared kernel with a Python fallback', () => {
  expect(kernelName(newNotebook())).toBe('python3')
  expect(kernelName({ ...newNotebook(), metadata: {} })).toBe('python3')
  expect(
    kernelName({
      ...newNotebook(),
      metadata: { kernelspec: { name: 'custom' } },
    }),
  ).toBe('custom')
})
