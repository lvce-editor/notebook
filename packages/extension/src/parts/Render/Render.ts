import {
  text,
  VirtualDomElements,
  type VirtualDomNode,
} from '@lvce-editor/virtual-dom-worker'

const dom: readonly VirtualDomNode[] = [
  {
    childCount: 1,
    className: 'Notebook',
    type: VirtualDomElements.Main,
  },
  {
    childCount: 1,
    className: 'NotebookTitle',
    type: VirtualDomElements.H1,
  },
  text('Hello World'),
]

export const render = (): readonly VirtualDomNode[] => dom
