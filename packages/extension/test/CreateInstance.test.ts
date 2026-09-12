import { expect, test } from '@jest/globals'
import type { NotebookRuntime } from '../src/parts/NotebookRuntime/NotebookRuntime.ts'
import { createInstance } from '../src/parts/CreateInstance/CreateInstance.ts'
import { newNotebook } from '../src/parts/NotebookDocument/NotebookDocument.ts'
const setup = async (
  overrides: Readonly<Partial<NotebookRuntime>> = {},
  content = JSON.stringify(newNotebook()),
): Promise<{
  instance: Awaited<ReturnType<typeof createInstance>>
  written: () => string
  text: () => Promise<string>
}> => {
  let written = ''
  const runtime: NotebookRuntime = {
    getPlatform: async () => 'electron',
    readFile: async () => content,
    run: async () => ({
      execution_count: 1,
      outputs: [{ output_type: 'stream', text: '42' }],
    }),
    stop: async () => {},
    writeFile: async (_uri, value) => {
      written = value
    },
    ...overrides,
  }
  const instance = await createInstance(
    {
      requestRerender: async () => {},
      showContextMenu: async () => {},
      uid: 1,
      uri: 'file:///a.ipynb',
      viewId: 'notebook',
    },
    runtime,
  )
  return {
    instance,
    text: async (): Promise<string> => JSON.stringify(instance.render()),
    written: (): string => written,
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
  const { instance, text, written } = await setup()
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
  const { instance, text, written } = await setup({}, '{}')
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
    requestRerender: async () => {},
    showContextMenu: async () => {},
    state: { content, uri: 'file:///a.ipynb' },
    uid: 2,
    viewId: 'notebook',
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
  const deferred = Promise.withResolvers<{
    execution_count: number
    outputs: Record<string, unknown>[]
  }>()
  const started = Promise.withResolvers<void>()
  const { instance } = await setup({
    run: () => {
      started.resolve()
      return deferred.promise
    },
  })
  await instance.handleNotebookAction('add-code')
  const running = instance.handleNotebookAction('run:0')
  await started.promise
  instance.handleNotebookInput('0', 'ignored')
  await instance.handleNotebookAction('add-markdown')
  await instance.dispose()
  deferred.resolve({
    execution_count: 1,
    outputs: [{ output_type: 'stream', text: 'stale' }],
  })
  await running
  const notebook = JSON.parse(instance.saveState().content!)
  expect(notebook.cells).toHaveLength(1)
  expect(notebook.cells[0].source).toBe('')
  expect(notebook.cells[0].outputs).toEqual([])
})
