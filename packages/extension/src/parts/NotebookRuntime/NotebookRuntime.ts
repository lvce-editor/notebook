import {
  createNodeRpc,
  getPlatform,
  readFile,
  writeFile,
} from '@lvce-editor/api'
export interface ExecutionResult {
  execution_count: number | null
  outputs: Record<string, unknown>[]
}
export interface NotebookRuntime {
  getPlatform(): Promise<string>
  readFile(uri: string): Promise<string>
  run(id: string, kernel: string, source: string): Promise<ExecutionResult>
  stop(id: string): Promise<void>
  writeFile(uri: string, content: string): Promise<void>
}
type Connection = Awaited<ReturnType<typeof createNodeRpc>>
export const createRuntime = (
  connect: typeof createNodeRpc = createNodeRpc,
): NotebookRuntime => {
  let rpcPromise: Promise<Connection> | undefined
  const rpc = async (): Promise<Connection> => {
    rpcPromise ??= connect({ id: 'builtin.notebook.kernel' })
    try {
      return await rpcPromise
    } catch (error) {
      rpcPromise = undefined
      throw error
    }
  }
  return {
    getPlatform,
    readFile,
    async run(id, kernel, source): Promise<ExecutionResult> {
      const connection = await rpc()
      return connection.invoke('Notebook.run', id, kernel, source)
    },
    async stop(id): Promise<void> {
      const pending = rpcPromise
      rpcPromise = undefined
      if (!pending) return
      const connection = await pending
      try {
        await connection.invoke('Notebook.stop', id)
      } finally {
        await connection.dispose()
      }
    },
    writeFile,
  }
}
