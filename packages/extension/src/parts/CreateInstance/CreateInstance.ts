import type { ViewContext, VirtualDomViewInstance } from '@lvce-editor/api'
import type { VirtualDomNode } from '@lvce-editor/virtual-dom-worker'
import {
  kernelName,
  newCell,
  newNotebook,
  parseNotebook,
  sourceText,
} from '../NotebookDocument/NotebookDocument.ts'
import {
  createRuntime,
  type NotebookRuntime,
} from '../NotebookRuntime/NotebookRuntime.ts'
import { render, type NotebookState } from '../Render/Render.ts'
export interface NotebookInstance extends VirtualDomViewInstance {
  dispose(): Promise<void>
  handleNotebookAction(name: string): Promise<void>
  handleNotebookInput(name: string, value: string): void
  render(): readonly VirtualDomNode[]
  renderActionsDom(): readonly VirtualDomNode[]
  saveState(): { uri: string; content?: string }
}
export const createInstance = async (
  context?: Readonly<ViewContext & { readonly uri?: string }>,
  runtime: Readonly<NotebookRuntime> = createRuntime(),
): Promise<NotebookInstance> => {
  const saved = context?.state as { uri?: string; content?: string } | undefined
  const uri = context?.uri || saved?.uri || ''
  const state: NotebookState = {
    busy: false,
    dirty: false,
    error: '',
    notebook: newNotebook(),
    status: '',
    uri,
  }
  const id = crypto.randomUUID()
  let disposed = false
  let generation = 0
  try {
    if (saved?.content) {
      state.notebook = parseNotebook(saved.content)
      state.dirty = true
    } else if (uri) state.notebook = parseNotebook(await runtime.readFile(uri))
  } catch (error) {
    state.error = String(error)
  }
  const rerender = async (): Promise<void> => {
    if (!disposed) await context?.requestRerender()
  }
  const isCurrent = (current: number): boolean =>
    !disposed && current === generation
  const stopKernel = async (): Promise<void> => {
    generation++
    state.busy = true
    try {
      await runtime.stop(id)
      state.status = 'Kernel stopped'
    } catch (error) {
      state.status = String(error)
    } finally {
      state.busy = false
    }
    await rerender()
  }
  const save = async (current: number): Promise<void> => {
    const { notebook } = state
    if (!uri) return
    state.busy = true
    await runtime.writeFile(uri, `${JSON.stringify(notebook, null, 2)}\n`)
    if (!isCurrent(current)) return
    state.dirty = false
    state.status = 'Notebook saved'
  }
  const runCell = async (index: number, current: number): Promise<void> => {
    const { notebook } = state
    const cell = notebook.cells[index]
    if (cell?.cell_type !== 'code') return
    state.busy = true
    const platform = await runtime.getPlatform()
    if (!isCurrent(current)) return
    if (platform === 'web') {
      state.status = 'Code execution is not supported on the web'
      return
    }
    state.status = 'Running cell…'
    await rerender()
    if (!isCurrent(current)) return
    const result = await runtime.run(
      id,
      kernelName(notebook),
      sourceText(cell.source),
    )
    if (!isCurrent(current)) return
    cell.outputs = result.outputs
    cell.execution_count = result.execution_count
    state.dirty = true
    state.status = 'Cell finished'
  }
  const performAction = async (
    name: string,
    current: number,
  ): Promise<void> => {
    const { notebook } = state
    const [action, indexText] = name.split(':')
    const index = Number(indexText)
    if (name === 'add-code' || name === 'add-markdown') {
      notebook.cells.push(newCell(name === 'add-code' ? 'code' : 'markdown'))
      state.dirty = true
    } else if (action === 'remove' && notebook.cells[index]) {
      notebook.cells.splice(index, 1)
      state.dirty = true
    } else if (name === 'save') await save(current)
    else if (action === 'run') await runCell(index, current)
  }
  return {
    async dispose(): Promise<void> {
      disposed = true
      generation++
      await runtime.stop(id)
    },
    async handleNotebookAction(name: string): Promise<void> {
      const { busy, error } = state
      if (disposed) return
      if (name === 'stop') {
        await stopKernel()
        return
      }
      if (busy || error) return
      const current = ++generation
      try {
        await performAction(name, current)
      } catch (error) {
        if (isCurrent(current)) state.status = String(error)
      } finally {
        if (current === generation) state.busy = false
        await rerender()
      }
    },
    handleNotebookInput(name: string, value: string): void {
      const { busy, error, notebook } = state
      if (disposed || busy || error) return
      const cell = notebook.cells[Number(name)]
      if (cell) {
        cell.source = value
        state.dirty = true
      }
    },
    render: (): readonly VirtualDomNode[] => render(state),
    renderActionsDom: (): readonly VirtualDomNode[] => [],
    saveState: (): { uri: string; content?: string } => {
      const { dirty, notebook } = state
      return { uri, ...(dirty && { content: JSON.stringify(notebook) }) }
    },
  }
}
