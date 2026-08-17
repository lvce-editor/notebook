import * as config from '@lvce-editor/eslint-config'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...config.default,
  ...config.recommendedRegex,
  ...config.recommendedTsconfig,
  ...config.recommendedVirtualDom,
  ...config.recommendedActions,
  {
    rules: {
      'e2e/no-imports': 'off',
      'github-actions/action-versions': 'off',
      'github-actions/ci-versions': 'off',
      'sonarjs/void-use': 'off',
    },
  },
])
