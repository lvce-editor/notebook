// cspell:ignore nbformat kernelspec ename evalue ipykernel
export interface Cell {
  [key: string]: unknown
  cell_type: 'code' | 'markdown' | 'raw'
  execution_count?: number | null
  metadata: Record<string, unknown>
  outputs?: Record<string, unknown>[]
  source: string | string[]
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
export const sourceText = (value: unknown): string => {
  if (Array.isArray(value)) return value.join('')
  return typeof value === 'string' ? value : ''
}
export const parseNotebook = (content: string): Notebook => {
  const data: unknown = JSON.parse(content)
  if (
    !object(data) ||
    data.nbformat !== 4 ||
    !Number.isSafeInteger(data.nbformat_minor) ||
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
          Number.isSafeInteger(cell.execution_count)
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
      display_name: 'Python 3',
      language: 'python',
      name: 'python3',
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
  ...(kind === 'code' && { execution_count: null, outputs: [] }),
})
export const outputText = (
  output: Readonly<Record<string, unknown>>,
): string => {
  if (output.output_type === 'stream') return sourceText(output.text)
  if (output.output_type === 'error') return `${output.ename}: ${output.evalue}`
  if (object(output.data)) return sourceText(output.data['text/plain'])
  return ''
}
export const kernelName = (notebook: DeepReadonly<Notebook>): string => {
  const spec = notebook.metadata.kernelspec
  if (object(spec) && typeof spec.name === 'string') return spec.name
  return 'python3'
}

export type DeepReadonly<T> = T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T
