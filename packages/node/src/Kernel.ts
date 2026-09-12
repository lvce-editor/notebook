// cspell:ignore nbformat kernelspec ename evalue ipykernel
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { fileURLToPath } from 'node:url'
interface Session {
  buffer: string
  pending?: {
    resolve(value: unknown): void
    reject(error: Error): void
    timer: ReturnType<typeof setTimeout>
  }
  process: ChildProcessWithoutNullStreams
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
    ['-u', fileURLToPath(new URL('kernel.py', import.meta.url)), kernel],
    { stdio: 'pipe' },
  )
  const session: Session = { buffer: '', process: child, stderr: '' }
  sessions.set(id, session)
  const fail = (error: Error): void => {
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
  child.stderr.setEncoding('utf8')
  child.stderr.on('data', (data: string) => {
    session.stderr = (session.stderr + data).slice(-4000)
  })
  child.stdout.setEncoding('utf8')
  child.stdout.on('data', (data: string) => {
    session.buffer += data
    if (session.buffer.length > 8 * 1024 * 1024) {
      fail(new Error('Notebook output exceeded 8 MB'))
      return
    }
    const newline = session.buffer.indexOf('\n')
    if (newline === -1 || !session.pending) return
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
    session.pending = { reject, resolve, timer }
    session.process.stdin.write(`${JSON.stringify({ source })}\n`)
  })
}
export const stopAll = (): void => {
  for (const id of sessions.keys()) stop(id)
}
