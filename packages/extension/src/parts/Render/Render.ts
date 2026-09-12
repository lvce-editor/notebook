import {
  text,
  VirtualDomElements as E,
  type VirtualDomNode,
} from '@lvce-editor/virtual-dom-worker'
import {
  outputText,
  sourceText,
  type Notebook,
} from '../NotebookDocument/NotebookDocument.ts'
export interface NotebookState {
  notebook: Notebook
  status: string
  error: string
  dirty: boolean
  busy: boolean
  uri: string
}
const button = (
  label: string,
  name: string,
  disabled: boolean,
): VirtualDomNode[] => [
  {
    type: E.Button,
    childCount: 1,
    className: 'NotebookButton',
    name,
    onClick: 'handleNotebookAction',
    disabled,
  },
  text(label),
]
export const render = (state: NotebookState): readonly VirtualDomNode[] => {
  const { notebook, status, error, dirty, busy, uri } = state
  const dom: VirtualDomNode[] = [
    {
      type: E.Main,
      childCount: 3 + notebook.cells.length,
      className: 'Notebook',
    },
    { type: E.H1, childCount: 1, className: 'NotebookTitle' },
    text(`Notebook${dirty ? ' •' : ''}`),
    { type: E.Div, childCount: 4, className: 'NotebookToolbar' },
    ...button('Add code cell', 'add-code', busy || !!error),
    ...button('Add Markdown cell', 'add-markdown', busy || !!error),
    ...button('Save notebook', 'save', busy || !!error || !uri),
    ...button('Stop kernel', 'stop', false),
    { type: E.Div, childCount: 1, className: 'NotebookStatus', role: 'status' },
    text(error || status),
  ]
  notebook.cells.forEach((cell, index) => {
    const outputs = cell.outputs || []
    dom.push(
      {
        type: E.Div,
        childCount: 3 + outputs.length,
        className: 'NotebookCell',
      },
      { type: E.Div, childCount: 1, className: 'NotebookCellType' },
      text(`${cell.cell_type} ${cell.execution_count ?? ''}`),
      {
        type: E.TextArea,
        childCount: 0,
        className: 'NotebookSource',
        ariaLabel: `Cell ${index + 1} source`,
        name: String(index),
        value: sourceText(cell.source),
        onInput: 'handleNotebookInput',
        disabled: busy,
      },
      {
        type: E.Div,
        childCount: cell.cell_type === 'code' ? 2 : 1,
        className: 'NotebookCellActions',
      },
      ...button('Remove cell', `remove:${index}`, busy),
    )
    if (cell.cell_type === 'code')
      dom.push(...button('Run cell', `run:${index}`, busy))
    for (const output of outputs)
      dom.push(
        { type: E.Pre, childCount: 1, className: 'NotebookOutput' },
        text(outputText(output)),
      )
  })
  return dom
}
