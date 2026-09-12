import type { ViewContext } from '@lvce-editor/api'
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
export const createInstance = async (
  context?: ViewContext & { uri?: string },
  runtime: NotebookRuntime = createRuntime(),
) => {
  const saved = context?.state as { uri?: string; content?: string } | undefined
  const uri = context?.uri || saved?.uri || ''
  const state: NotebookState = {
    notebook: newNotebook(),
    status: '',
    error: '',
    busy: false,
    dirty: false,
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
  const rerender = async () => {
    if (!disposed) await context?.requestRerender()
  }
  return {
    render: () => render(state),
    renderActionsDom: () => [],
    saveState: () => ({
      uri,
      ...(state.dirty ? { content: JSON.stringify(state.notebook) } : {}),
    }),
    async dispose() {
      disposed = true
      generation++
      await runtime.stop(id)
    },
    handleNotebookInput(name: string, value: string) {
      if (disposed || state.busy || state.error) return
      const cell = state.notebook.cells[Number(name)]
      if (cell) {
        cell.source = value
        state.dirty = true
      }
    },
    async handleNotebookAction(name: string) {
      if (disposed) return
      if (name === 'stop') {
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
        return
      }
      if (state.busy || state.error) return
      const current = ++generation
      const [action, indexText] = name.split(':')
      const cell = state.notebook.cells[Number(indexText)]
      try {
        if (name === 'add-code' || name === 'add-markdown') {
          state.notebook.cells.push(
            newCell(name === 'add-code' ? 'code' : 'markdown'),
          )
          state.dirty = true
        } else if (action === 'remove' && cell) {
          state.notebook.cells.splice(Number(indexText), 1)
          state.dirty = true
        } else if (name === 'save' && uri) {
          state.busy = true
          await runtime.writeFile(
            uri,
            `${JSON.stringify(state.notebook, null, 2)}\n`,
          )
          if (disposed || current !== generation) return
          state.dirty = false
          state.status = 'Notebook saved'
        } else if (action === 'run' && cell?.cell_type === 'code') {
          state.busy = true
          if ((await runtime.getPlatform()) === 'web') {
            state.status = 'Code execution is not supported on the web'
            return
          }
          if (disposed || current !== generation) return
          state.status = 'Running cell…'
          await rerender()
          const result = await runtime.run(
            id,
            kernelName(state.notebook),
            sourceText(cell.source),
          )
          if (disposed || current !== generation) return
          cell.outputs = result.outputs
          cell.execution_count = result.execution_count
          state.dirty = true
          state.status = 'Cell finished'
        }
      } catch (error) {
        if (!disposed && current === generation) state.status = String(error)
      } finally {
        if (current === generation) state.busy = false
        await rerender()
      }
    },
  }
}
