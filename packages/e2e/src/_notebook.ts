import type { Test } from '@lvce-editor/test-with-playwright'
export const action = async (
  Command: Readonly<Parameters<Test>[0]['Command']>,
  name: string,
  value?: string,
): Promise<void> => {
  const states = await Command.execute('Viewlet.getAllStates')
  const view = Object.values(states).find(
    (entry: any) => entry.viewId === 'notebook.views.notebook',
  ) as any
  if (!view) throw new Error('Notebook view not found')
  await Command.execute(
    'Viewlet.executeViewletCommand',
    view.uid,
    'handleViewCommand',
    value === undefined ? 'handleNotebookAction' : 'handleNotebookInput',
    name,
    ...(value === undefined ? [] : [value]),
  )
}
