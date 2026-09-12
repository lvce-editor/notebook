import { expect, test } from '@jest/globals'
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
    extra: true,
    cells: [
      {
        ...newCell('markdown'),
        source: ['hello\n', 'world'],
        attachments: { image: {} },
        metadata: { custom: true },
      },
    ],
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
])('rejects invalid cells', (cell) => {
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
    outputText({ output_type: 'error', ename: 'Error', evalue: 'bad' }),
  ).toBe('Error: bad')
  expect(
    outputText({ data: { 'text/plain': '42', 'text/html': '<script>' } }),
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
