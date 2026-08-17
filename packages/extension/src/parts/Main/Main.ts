import {
  activate as activateExtensionApi,
  executeCommand,
  registerCommand,
  registerView,
} from '@lvce-editor/api'
import { viewId } from '../Constants/Constants.ts'
import * as NotebookView from '../NotebookView/NotebookView.ts'

const state = {
  isActivated: false,
}

export const activate = async (): Promise<void> => {
  const { isActivated } = state
  if (isActivated) {
    return
  }
  state.isActivated = true
  await activateExtensionApi()
  registerView(NotebookView.view)
  registerCommand({
    execute() {
      return executeCommand('Layout.toggleSideBarView', viewId)
    },
    id: 'notebook.show',
  })
}

export const deactivate = (): void => {}
