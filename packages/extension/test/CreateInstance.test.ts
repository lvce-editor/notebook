import { expect, test } from '@jest/globals'
import { createInstance } from '../src/parts/CreateInstance/CreateInstance.ts'
import { newNotebook } from '../src/parts/NotebookDocument/NotebookDocument.ts'
import type { NotebookRuntime } from '../src/parts/NotebookRuntime/NotebookRuntime.ts'
const setup = async (
  overrides: Partial<NotebookRuntime> = {},
  content = JSON.stringify(newNotebook()),
) => {
  let written = ''
  const runtime: NotebookRuntime = {
    readFile: async () => content,
    writeFile: async (_uri, value) => {
      written = value
    },
    getPlatform: async () => 'electron',
    run: async () => ({
      outputs: [{ output_type: 'stream', text: '42' }],
      execution_count: 1,
    }),
    stop: async () => {},
    ...overrides,
  }
  const instance = await createInstance(
    {
      uid: 1,
      viewId: 'notebook',
      uri: 'file:///a.ipynb',
      requestRerender: async () => {},
      showContextMenu: async () => {},
    },
    runtime,
  )
  return {
    instance,
    written: () => written,
    text: async () => JSON.stringify(await instance.render()),
  }
}
test('creates code and Markdown cells, edits and removes cells, and saves valid JSON', async () => {
  const { instance, written } = await setup()
  await instance.handleNotebookAction('add-code')
  await instance.handleNotebookAction('add-markdown')
  instance.handleNotebookInput('0', 'print(42)')
  instance.handleNotebookInput('1', '# Title')
  await instance.handleNotebookAction('remove:0')
  await instance.handleNotebookAction('save')
  expect(JSON.parse(written()).cells).toEqual([
    expect.objectContaining({ cell_type: 'markdown', source: '# Title' }),
  ])
  expect(instance.saveState()).toEqual({ uri: 'file:///a.ipynb' })
  expect(instance.renderActionsDom()).toEqual([])
})
test('runs code and saves its outputs and execution count', async () => {
  const { instance, written, text } = await setup()
  await instance.handleNotebookAction('add-code')
  await instance.handleNotebookAction('run:0')
  expect(await text()).toContain('42')
  await instance.handleNotebookAction('save')
  expect(JSON.parse(written()).cells[0].execution_count).toBe(1)
})
test('web explains unsupported execution without starting a process', async () => {
  let calls = 0
  const { instance, text } = await setup({
    getPlatform: async () => 'web',
    run: async () => {
      calls++
      throw new Error('unexpected')
    },
  })
  await instance.handleNotebookAction('add-code')
  await instance.handleNotebookAction('run:0')
  expect(await text()).toContain('Code execution is not supported on the web')
  expect(calls).toBe(0)
})
test('invalid files cannot be overwritten', async () => {
  const { instance, written, text } = await setup({}, '{}')
  await instance.handleNotebookAction('add-code')
  instance.handleNotebookInput('0', 'bad')
  await instance.handleNotebookAction('save')
  expect(written()).toBe('')
  expect(await text()).toContain('Expected a Jupyter notebook')
})
test('save failure retains draft and reports the error', async () => {
  const { instance, text } = await setup({
    writeFile: async () => {
      throw new Error('disk full')
    },
  })
  await instance.handleNotebookAction('add-code')
  await instance.handleNotebookAction('save')
  expect(await text()).toContain('disk full')
  expect(instance.saveState().content).toBeDefined()
})
test('execution failure is shown and editing remains possible', async () => {
  const { instance, text } = await setup({
    run: async () => {
      throw new Error('missing kernel')
    },
  })
  await instance.handleNotebookAction('add-code')
  await instance.handleNotebookAction('run:0')
  await instance.handleNotebookAction('add-markdown')
  expect(await text()).toContain('missing kernel')
  expect(await text()).toContain('markdown')
})
test('stop and disposal release the kernel and ignore subsequent events', async () => {
  let stops = 0
  const { instance, text } = await setup({
    stop: async () => {
      stops++
    },
  })
  await instance.handleNotebookAction('stop')
  expect(await text()).toContain('Kernel stopped')
  await instance.dispose()
  await instance.handleNotebookAction('add-code')
  instance.handleNotebookInput('0', 'x')
  expect(stops).toBe(2)
  expect(instance.saveState().content).toBeUndefined()
})
test('unknown actions and nonexistent cells do nothing', async () => {
  const { instance } = await setup()
  instance.handleNotebookInput('99', 'x')
  await instance.handleNotebookAction('remove:99')
  await instance.handleNotebookAction('run:99')
  await instance.handleNotebookAction('unknown')
  expect(instance.saveState().content).toBeUndefined()
})
test('restores unsaved content', async () => {
  const content = JSON.stringify(newNotebook())
  const instance = await createInstance({
    uid: 2,
    viewId: 'notebook',
    state: { uri: 'file:///a.ipynb', content },
    requestRerender: async () => {},
    showContextMenu: async () => {},
  })
  expect(instance.saveState().content).toBe(content)
})
test('empty view can create cells without a file', async () => {
  const instance = await createInstance()
  await instance.handleNotebookAction('add-code')
  await instance.handleNotebookAction('save')
  expect(instance.saveState().uri).toBe('')
})
test('busy execution prevents edits and disposal discards its result', async () => {
  let finish!: (result: {
    outputs: Record<string, unknown>[]
    execution_count: number
  }) => void
  const { instance } = await setup({
    run: () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  })
  await instance.handleNotebookAction('add-code')
  const running = instance.handleNotebookAction('run:0')
  while (!finish) await Promise.resolve()
  instance.handleNotebookInput('0', 'ignored')
  await instance.handleNotebookAction('add-markdown')
  await instance.dispose()
  finish({
    outputs: [{ output_type: 'stream', text: 'stale' }],
    execution_count: 1,
  })
  await running
  const notebook = JSON.parse(instance.saveState().content!)
  expect(notebook.cells).toHaveLength(1)
  expect(notebook.cells[0].source).toBe('')
  expect(notebook.cells[0].outputs).toEqual([])
})
