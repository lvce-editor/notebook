import type { VirtualDomViewInstance } from '@lvce-editor/api'
import { render } from '../Render/Render.ts'

export const createInstance = (): VirtualDomViewInstance => {
  return {
    render,
    renderActionsDom: () => [],
  }
}
