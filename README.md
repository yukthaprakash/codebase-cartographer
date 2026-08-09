# AI Codebase Cartographer

A VS Code extension that scans an open workspace, extracts file-level dependencies, summarizes each file with an LLM, and renders an interactive dependency graph in a Webview.

## Current Status

- Command: `Cartographer: Generate Dependency Map`
- Activation: `onCommand:cartographer.generateMap`
- Scans `.ts`, `.tsx`, `.js`, and `.jsx` files.
- Extracts `import`, `export`, dynamic `import()`, and `require()` relationships with `@babel/parser`.
- Calls OpenAI via `OPENAI_API_KEY` to generate 1-2 sentence summaries per file.
- Caches summaries in `.cartographer-cache.json` for faster reruns.
- Renders a D3 force-directed graph in a VS Code Webview.
- Supports hover preview and click-to-open file navigation.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
# AI Codebase Cartographer

One-line: A VS Code extension that scans a codebase, summarizes each file with an LLM, and renders an interactive dependency graph to help engineers quickly understand unfamiliar projects.

Why it matters: Saves onboarding time by surfacing module intent and relationships across a codebase.

---

## Quick start (clone & run)

1. Clone and install:

```bash
git clone <repo-url>
cd codebase-cartographer
npm install
```

2. Set your OpenAI key (required for summaries):

```bash
export OPENAI_API_KEY="sk-..."
```

3. Build and run in VS Code:

```bash
npm run compile
# In VS Code: Press F5 to open Extension Development Host
# In the host window: Command Palette → "Cartographer: Generate Dependency Map"
```

If you don't provide `OPENAI_API_KEY`, the extension will still scan the workspace but will skip LLM summaries.

---

## Features

- Scans `.ts`, `.tsx`, `.js`, and `.jsx` files and extracts `import`/`require` dependencies.
- Generates concise 1–2 sentence file summaries via OpenAI.
- Caches summaries in `.cartographer-cache.json` for fast re-runs.
- Interactive D3 force-directed graph in a VS Code Webview with zoom/pan, hover previews, and click-to-open file navigation.

---

## How it works (architecture)

1. Workspace scanning (`src/scanner.ts`) — walks the workspace, parses files with `@babel/parser`, and builds a `{ nodes, edges }` graph.
2. Summarization (`src/llm.ts`) — batches file contents, calls OpenAI, and stores results in `.cartographer-cache.json`.
3. Webview (`src/webview.ts` + `media/`) — sends graph+summaries to the frontend; `media/webview.js` renders the D3 graph and posts open-file messages back to the extension host.

---

## Demo (insert your GIF/screenshot here)

Replace this line with your demo asset. Example markdown to insert in this spot:

`![Demo GIF](./media/demo.gif)`

Place the GIF at `media/demo.gif` (or update the path above) and commit it.

---

## Tech stack & learnings

- TypeScript, Node.js, VS Code Extension API
- AST parsing with `@babel/parser` for robust import extraction
- OpenAI (`openai` SDK) for concise code summarization
- D3.js for interactive graph visualization inside a VS Code Webview

What I learned: integrating an LLM into a developer tool requires careful batching and caching to control cost and latency; Webviews need careful asset loading and secure message passing.

---

## Dev notes

- Command: `Cartographer: Generate Dependency Map`
- Activation: `onCommand:cartographer.generateMap`
- Build: `npm run compile`
- Package: `npm run package` (requires `vsce`)

Before publishing: add a `repository` and `license` to `package.json`, set a real `publisher`, and add a `.vscodeignore` to reduce VSIX size.

---

## License

Add a `LICENSE` file (e.g., MIT) before publishing.
