import {
  AriaRoles,
  text,
  VirtualDomElements as E,
  type VirtualDomNode,
} from '@lvce-editor/virtual-dom-worker'
import {
  outputText,
  sourceText,
  type Notebook,
  type DeepReadonly,
} from '../NotebookDocument/NotebookDocument.ts'
const handleNotebookAction = 'handleNotebookAction'
const handleNotebookInput = 'handleNotebookInput'
export interface NotebookState {
  busy: boolean
  dirty: boolean
  error: string
  notebook: Notebook
  status: string
  uri: string
}
const titleNode: VirtualDomNode = {
  childCount: 1,
  className: 'NotebookTitle',
  type: E.H1,
}
const toolbarNode: VirtualDomNode = {
  childCount: 4,
  className: 'NotebookToolbar',
  type: E.Div,
}
const statusNode: VirtualDomNode = {
  childCount: 1,
  className: 'NotebookStatus',
  role: AriaRoles.Status,
  type: E.Div,
}
const cellTypeNode: VirtualDomNode = {
  childCount: 1,
  className: 'NotebookCellType',
  type: E.Div,
}
const outputNode: VirtualDomNode = {
  childCount: 1,
  className: 'NotebookOutput',
  type: E.Pre,
}
const button = (
  label: string,
  name: string,
  disabled: boolean,
): VirtualDomNode[] => [
  {
    childCount: 1,
    className: 'NotebookButton',
    disabled,
    name,
    onClick: handleNotebookAction,
    type: E.Button,
  },
  text(label),
]
export const render = (
  state: DeepReadonly<NotebookState>,
): readonly VirtualDomNode[] => {
  const { busy, dirty, error, notebook, status, uri } = state
  const dom: VirtualDomNode[] = [
    {
      childCount: 3 + notebook.cells.length,
      className: 'Notebook',
      type: E.Main,
    },
    titleNode,
    text(`Notebook${dirty ? ' •' : ''}`),
    toolbarNode,
    ...button('Add code cell', 'add-code', busy || !!error),
    ...button('Add Markdown cell', 'add-markdown', busy || !!error),
    ...button('Save notebook', 'save', busy || !!error || !uri),
    ...button('Stop kernel', 'stop', false),
    statusNode,
    text(error || status),
  ]
  for (const [index, cell] of notebook.cells.entries()) {
    const outputs = cell.outputs || []
    dom.push(
      {
        childCount: 3 + outputs.length,
        className: 'NotebookCell',
        type: E.Div,
      },
      cellTypeNode,
      text(`${cell.cell_type} ${cell.execution_count ?? ''}`),
      {
        ariaLabel: `Cell ${index + 1} source`,
        childCount: 0,
        className: 'NotebookSource',
        disabled: busy,
        name: String(index),
        onInput: handleNotebookInput,
        type: E.TextArea,
        value: sourceText(cell.source),
      },
      {
        childCount: cell.cell_type === 'code' ? 2 : 1,
        className: 'NotebookCellActions',
        type: E.Div,
      },
      ...button('Remove cell', `remove:${index}`, busy),
    )
    if (cell.cell_type === 'code')
      dom.push(...button('Run cell', `run:${index}`, busy))
    for (const output of outputs) dom.push(outputNode, text(outputText(output)))
  }
  return dom
}
