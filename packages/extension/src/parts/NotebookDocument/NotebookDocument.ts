export interface Cell {
  [key: string]: unknown
  cell_type: 'code' | 'markdown' | 'raw'
  metadata: Record<string, unknown>
  source: string | string[]
  outputs?: Record<string, unknown>[]
  execution_count?: number | null
}
export interface Notebook {
  [key: string]: unknown
  cells: Cell[]
  metadata: Record<string, unknown>
  nbformat: number
  nbformat_minor: number
}
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
export const sourceText = (value: unknown): string =>
  Array.isArray(value) ? value.join('') : typeof value === 'string' ? value : ''
export const parseNotebook = (content: string): Notebook => {
  const data: unknown = JSON.parse(content)
  if (
    !object(data) ||
    data.nbformat !== 4 ||
    !Number.isInteger(data.nbformat_minor) ||
    !object(data.metadata) ||
    !Array.isArray(data.cells)
  ) {
    throw new Error('Expected a Jupyter notebook in nbformat 4')
  }
  for (const cell of data.cells) {
    if (
      !object(cell) ||
      !['code', 'markdown', 'raw'].includes(String(cell.cell_type)) ||
      !object(cell.metadata) ||
      !(
        typeof cell.source === 'string' ||
        (Array.isArray(cell.source) &&
          cell.source.every((line: unknown) => typeof line === 'string'))
      )
    ) {
      throw new Error('Invalid notebook cell')
    }
    if (
      cell.cell_type === 'code' &&
      (!Array.isArray(cell.outputs) ||
        !cell.outputs.every(object) ||
        !(
          cell.execution_count === null ||
          Number.isInteger(cell.execution_count)
        ))
    ) {
      throw new Error('Invalid code cell outputs or execution count')
    }
  }
  return data as unknown as Notebook
}
export const newNotebook = (): Notebook => ({
  cells: [],
  metadata: {
    kernelspec: {
      name: 'python3',
      display_name: 'Python 3',
      language: 'python',
    },
  },
  nbformat: 4,
  nbformat_minor: 5,
})
export const newCell = (kind: 'code' | 'markdown'): Cell => ({
  cell_type: kind,
  id: crypto.randomUUID(),
  metadata: {},
  source: '',
  ...(kind === 'code' ? { outputs: [], execution_count: null } : {}),
})
export const outputText = (output: Record<string, unknown>): string => {
  if (output.output_type === 'stream') return sourceText(output.text)
  if (output.output_type === 'error') return `${output.ename}: ${output.evalue}`
  if (object(output.data)) return sourceText(output.data['text/plain'])
  return ''
}
export const kernelName = (notebook: Notebook): string => {
  const spec = notebook.metadata.kernelspec
  if (object(spec) && typeof spec.name === 'string') return spec.name
  return 'python3'
}
