import { expect, jest, test } from '@jest/globals'
const invoke = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const createNodeRpc = jest.fn<() => Promise<{ invoke: typeof invoke }>>()
jest.unstable_mockModule('@lvce-editor/api', () => ({
  createNodeRpc,
  getPlatform: async () => 'web',
  readFile: async () => '',
  writeFile: async () => {},
}))
const { createRuntime } =
  await import('../src/parts/NotebookRuntime/NotebookRuntime.ts')
test('starts the declared RPC lazily, reuses it and releases its kernel', async () => {
  createNodeRpc.mockResolvedValue({ invoke })
  invoke.mockResolvedValue({ outputs: [], execution_count: 1 })
  const runtime = createRuntime()
  await runtime.stop('unused')
  expect(createNodeRpc).not.toHaveBeenCalled()
  await runtime.run('one', 'python3', '1')
  await runtime.run('one', 'python3', '2')
  await runtime.stop('one')
  expect(createNodeRpc).toHaveBeenCalledTimes(1)
  expect(invoke).toHaveBeenLastCalledWith('Notebook.stop', 'one')
})
test('failed RPC startup can be retried', async () => {
  createNodeRpc
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue({ invoke })
  const runtime = createRuntime()
  await expect(runtime.run('retry', 'python3', '1')).rejects.toThrow('offline')
  await expect(runtime.run('retry', 'python3', '1')).resolves.toBeDefined()
})
