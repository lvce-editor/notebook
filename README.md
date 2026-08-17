# Notebook

Built-in Jupyter notebook extension for LVCE Editor.

The repository currently contains the starter implementation: a virtual DOM
view that renders **Hello World**. It follows the same workspace and build
layout as the Trello extension so notebook support can grow without changing
the repository structure.

## Development

```sh
npm ci
npm run build
npm test
```

Run `npm run dev` to start the LVCE development server with only this extension
enabled.

## Packages

- `packages/extension` — extension manifest and notebook view
- `packages/build` — development, bundle, and packaging scripts
- `packages/e2e` — browser-level extension tests
- `packages/server` — local LVCE development server dependency
