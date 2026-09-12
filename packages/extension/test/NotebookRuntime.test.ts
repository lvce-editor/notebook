import type { createNodeRpc } from '@lvce-editor/api'
import { expect, jest, test } from '@jest/globals'
import { createRuntime } from '../src/parts/NotebookRuntime/NotebookRuntime.ts'
const invoke = jest.fn<(...args: readonly unknown[]) => Promise<unknown>>()
const dispose = jest.fn()
const connect = jest.fn<typeof createNodeRpc>()
const connection = { dispose, invoke } as unknown as Awaited<
  ReturnType<typeof createNodeRpc>
>
test('starts the declared RPC lazily, reuses it and releases its kernel', async () => {
  connect.mockResolvedValue(connection)
  invoke.mockResolvedValue({ execution_count: 1, outputs: [] })
  const runtime = createRuntime(connect)
  await runtime.stop('unused')
  expect(connect).not.toHaveBeenCalled()
  await runtime.run('one', 'python3', '1')
  await runtime.run('one', 'python3', '2')
  await runtime.stop('one')
  expect(connect).toHaveBeenCalledTimes(1)
  expect(invoke).toHaveBeenLastCalledWith('Notebook.stop', 'one')
  expect(dispose).toHaveBeenCalledTimes(1)
})
test('failed RPC startup can be retried', async () => {
  connect
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue(connection)
  const runtime = createRuntime(connect)
  await expect(runtime.run('retry', 'python3', '1')).rejects.toThrow('offline')
  await expect(runtime.run('retry', 'python3', '1')).resolves.toBeDefined()
})
