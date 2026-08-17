import { expect, test } from '@jest/globals'
import { VirtualDomElements } from '@lvce-editor/virtual-dom-worker'
import { render } from '../src/parts/Render/Render.ts'

test('renders hello world', () => {
  expect(render()).toEqual([
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
    {
      childCount: 0,
      text: 'Hello World',
      type: VirtualDomElements.Text,
    },
  ])
})
