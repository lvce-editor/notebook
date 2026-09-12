import {
  createNodeRpc,
  getPlatform,
  readFile,
  writeFile,
} from '@lvce-editor/api'
export interface ExecutionResult {
  outputs: Record<string, unknown>[]
  execution_count: number | null
}
export interface NotebookRuntime {
  readFile(uri: string): Promise<string>
  writeFile(uri: string, content: string): Promise<void>
  getPlatform(): Promise<string>
  run(id: string, kernel: string, source: string): Promise<ExecutionResult>
  stop(id: string): Promise<void>
}
export const createRuntime = (): NotebookRuntime => {
  let rpcPromise: ReturnType<typeof createNodeRpc> | undefined
  const rpc = () => {
    rpcPromise ??= createNodeRpc({ id: 'builtin.notebook.kernel' }).catch(
      (error: unknown) => {
        rpcPromise = undefined
        throw error
      },
    )
    return rpcPromise
  }
  return {
    getPlatform,
    readFile,
    writeFile,
    async run(id, kernel, source) {
      return (await rpc()).invoke('Notebook.run', id, kernel, source)
    },
    async stop(id) {
      if (rpcPromise) await (await rpcPromise).invoke('Notebook.stop', id)
    },
  }
}
