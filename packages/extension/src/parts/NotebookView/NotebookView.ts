import type { View, VirtualDomViewInstance } from '@lvce-editor/api'
import { viewId } from '../Constants/Constants.ts'
import { createInstance } from '../CreateInstance/CreateInstance.ts'

export const view: View<VirtualDomViewInstance> = {
  create: createInstance,
  displayName: 'Notebook',
  eventListeners: [
    {
      name: 'handleNotebookAction',
      params: ['handleNotebookAction', 'event.currentTarget.name'],
    },
    {
      name: 'handleNotebookInput',
      params: [
        'handleNotebookInput',
        'event.currentTarget.name',
        'event.currentTarget.value',
      ],
    },
  ],
  icon: 'notebook',
  id: viewId,
  kind: 'virtualDom',
  preferredLocation: 'preview',
  title: 'Notebook',
}
