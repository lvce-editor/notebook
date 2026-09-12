import { NodeRpcProcess } from '@lvce-editor/rpc'
import { run, stop } from './Kernel.ts'
await NodeRpcProcess.create({
  commandMap: { 'Notebook.run': run, 'Notebook.stop': stop },
})
