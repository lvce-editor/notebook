import { expect, test } from '@jest/globals'
import { createInstance } from '../src/parts/CreateInstance/CreateInstance.ts'

test('creates a view with an empty actions area', () => {
  const instance = createInstance()

  expect(instance.renderActionsDom?.()).toEqual([])
})
