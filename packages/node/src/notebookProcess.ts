import { NodeRpcProcess } from '@lvce-editor/rpc'
import { run, stop, stopAll } from './Kernel.ts'
await NodeRpcProcess.create({
  commandMap: { 'Notebook.run': run, 'Notebook.stop': stop },
})

process.on('exit', stopAll)
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    stopAll()
    process.exit(0)
  })
}
