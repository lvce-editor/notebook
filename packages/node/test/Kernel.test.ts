import { test } from 'node:test'
import assert from 'node:assert/strict'
import { run, stop } from '../src/Kernel.ts'
test('Jupyter executes cells with persistent state, streams, expression output and errors', async () => {
  try {
    const first = (await run(
      'test',
      'python3',
      'value = 40\nprint("hello")',
    )) as any
    assert.equal(first.execution_count, 1)
    assert.equal(first.outputs[0].text, 'hello\n')
    const second = (await run('test', 'python3', 'value + 2')) as any
    assert.equal(second.outputs[0].data['text/plain'], '42')
    assert.equal(second.execution_count, 2)
    const error = (await run('test', 'python3', '1/0')) as any
    assert.equal(error.outputs[0].ename, 'ZeroDivisionError')
    const fourth = (await run('test', 'python3', 'print(value)')) as any
    assert.equal(fourth.outputs[0].text, '40\n')
  } finally {
    stop('test')
  }
})
test('stop cancels execution and repeated stop is harmless', async () => {
  const execution = run('stop', 'python3', 'import time\ntime.sleep(60)')
  const rejection = assert.rejects(execution, /Kernel stopped/)
  stop('stop')
  stop('stop')
  await rejection
})
test('rejects concurrent execution in one notebook', async () => {
  const first = run('busy', 'python3', '1')
  const rejection = assert.rejects(first, /Kernel stopped/)
  await assert.rejects(run('busy', 'python3', '2'), /already running/)
  stop('busy')
  await rejection
})
test('reports missing kernels', async () => {
  try {
    await assert.rejects(
      run('missing', 'no-such-notebook-kernel', '1'),
      /Kernel exited/,
    )
  } finally {
    stop('missing')
  }
})
