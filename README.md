# Notebook

Jupyter notebook extension for LVCE Editor. Opening an `.ipynb` file shows its
cells, editable source, and text outputs. Add code or Markdown cells, remove
cells, and use **Save notebook** to write changes. Notebook metadata,
attachments, rich output data, and unknown fields are preserved. Unsaved edits
are included in restored view state. Markdown cells currently use a source
editor; outputs are displayed as plain text.

## Execute cells

Requires LVCE Editor 0.107.4 or newer.

Native LVCE uses a separate Node process and a Jupyter kernel. Install Python,
then `python3 -m pip install jupyter_client ipykernel`. On Windows use `python`.
Set `NOTEBOOK_PYTHON` to select a Python executable if needed. The notebook's
kernelspec selects the kernel; notebooks without one use `python3`.

Click **Run cell** to execute code. Variables persist between cells in the same
open notebook. Standard output, expression results and Python errors appear
below the cell and are saved with the notebook. **Stop kernel** cancels current
execution and resets variables; the next run starts a fresh kernel. Closing the
view releases its kernel. Execution is limited to 90 seconds per request and
8 MB of output. Code runs with your local user permissions; opening a notebook
does not execute its cells.

The web platform displays **Code execution is not supported on the web**.
Notebook editing and saving remain available there.

## Development

The devcontainer installs Node, Python and the Jupyter dependencies.

```sh
npm ci
python3 -m pip install jupyter_client ipykernel
npm run dev
```

`npm test` runs unit tests and native kernel integration tests.
`npm run e2e:headless` exercises notebook files through LVCE.
`npm run build` packages the extension including the native kernel bridge.

Packages: `extension` contains the view and document model; `node` owns native
kernel processes; `build` contains build scripts; `e2e` contains browser tests;
`server` supplies the LVCE development runtime.
