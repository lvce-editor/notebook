import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { fileURLToPath } from 'node:url'
interface Session {
  process: ChildProcessWithoutNullStreams
  pending?: {
    resolve(value: unknown): void
    reject(error: Error): void
    timer: ReturnType<typeof setTimeout>
  }
  buffer: string
  stderr: string
}
const sessions = new Map<string, Session>()
export const stop = (id: string): void => {
  const session = sessions.get(id)
  if (!session) return
  sessions.delete(id)
  if (session.pending) {
    clearTimeout(session.pending.timer)
    session.pending.reject(new Error('Kernel stopped'))
    delete session.pending
  }
  session.process.stdin.end()
  session.process.kill()
}
const start = (id: string, kernel: string): Session => {
  const child = spawn(
    process.env.NOTEBOOK_PYTHON ||
      (process.platform === 'win32' ? 'python' : 'python3'),
    ['-u', fileURLToPath(new URL('./kernel.py', import.meta.url)), kernel],
    { stdio: 'pipe' },
  )
  const session: Session = { process: child, buffer: '', stderr: '' }
  sessions.set(id, session)
  const fail = (error: Error) => {
    if (sessions.get(id) !== session) return
    if (session.pending) {
      clearTimeout(session.pending.timer)
      session.pending.reject(error)
      delete session.pending
    }
    stop(id)
  }
  child.on('error', fail)
  child.on('exit', () =>
    fail(
      new Error(
        `Kernel exited. Install Python with jupyter_client and ipykernel. ${session.stderr}`,
      ),
    ),
  )
  child.stdin.on('error', fail)
  child.stderr.on('data', (data: Buffer) => {
    session.stderr = (session.stderr + data.toString()).slice(-4000)
  })
  child.stdout.on('data', (data: Buffer) => {
    session.buffer += data.toString()
    if (session.buffer.length > 8 * 1024 * 1024) {
      fail(new Error('Notebook output exceeded 8 MB'))
      return
    }
    const newline = session.buffer.indexOf('\n')
    if (newline < 0 || !session.pending) return
    try {
      const result: unknown = JSON.parse(session.buffer.slice(0, newline))
      session.buffer = session.buffer.slice(newline + 1)
      clearTimeout(session.pending.timer)
      session.pending.resolve(result)
      delete session.pending
    } catch {
      fail(new Error('Invalid kernel response'))
    }
  })
  return session
}
export const run = async (
  id: string,
  kernel: string,
  source: string,
): Promise<unknown> => {
  if (
    typeof id !== 'string' ||
    typeof kernel !== 'string' ||
    typeof source !== 'string'
  )
    throw new TypeError('Invalid execution request')
  const session = sessions.get(id) || start(id, kernel)
  if (session.pending) throw new Error('A cell is already running')
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      stop(id)
    }, 90_000)
    session.pending = { resolve, reject, timer }
    session.process.stdin.write(`${JSON.stringify({ source })}\n`)
  })
}
process.on('exit', () => {
  for (const id of sessions.keys()) stop(id)
})
