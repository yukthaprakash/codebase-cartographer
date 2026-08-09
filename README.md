# AI Codebase Cartographer

![CI](https://github.com/yukthaprakash/codebase-cartographer/actions/workflows/ci.yml/badge.svg)

A VS Code extension that scans an open workspace, extracts file-level dependencies, summarizes each file with an LLM, and renders an interactive dependency graph in a Webview — helping engineers understand unfamiliar codebases in minutes instead of hours.

---

## Install

**Option 1 — Download the packaged extension (fastest)**
1. Go to [Releases](https://github.com/yukthaprakash/codebase-cartographer/releases) and download the latest `.vsix` file.
2. In VS Code: Extensions panel → `...` menu → **Install from VSIX...** → select the downloaded file.

> No release published yet? Run `npm run package` locally to build `ai-codebase-cartographer-0.0.1.vsix`, or clone and run from source using Quick Start below.

**Option 2 — Run from source**
```bash
git clone https://github.com/yukthaprakash/codebase-cartographer.git
cd codebase-cartographer
npm install
```

---

## Quick Start

1. Set your OpenAI key (required for AI summaries — the extension still scans and graphs your workspace without it, just skips summaries):
```bash
   export OPENAI_API_KEY="sk-..."
```
2. Build and launch:
```bash
   npm run compile
```
3. In VS Code, press `F5` to open the Extension Development Host.
4. In the new window: `Command Palette` (`Ctrl+Shift+P` / `Cmd+Shift+P`) → **Cartographer: Generate Dependency Map**.

---

## Features

- Scans `.ts`, `.tsx`, `.js`, and `.jsx` files
- Extracts `import`, `export`, dynamic `import()`, and `require()` relationships using `@babel/parser`
- Generates concise 1–2 sentence AI summaries per file via OpenAI
- Caches summaries in `.cartographer-cache.json` for fast re-runs
- Interactive D3 force-directed graph in a VS Code Webview — zoom, pan, hover-to-preview, click-to-open-file

---

## How It Works (Architecture)

1. **Workspace scanning** (`src/scanner.ts`) — walks the workspace, parses files with `@babel/parser`, builds a `{ nodes, edges }` dependency graph.
2. **Summarization** (`src/llm.ts`) — batches file contents, calls OpenAI, caches results in `.cartographer-cache.json`.
3. **Webview** (`src/webview.ts` + `media/`) — sends the graph and summaries to the frontend; `media/webview.js` renders the D3 graph and posts open-file messages back to the extension host.

---

## Demo

![Demo GIF](./media/demo.gif)

*(Record a short GIF of the graph panel rendering after running the command, save it to `media/demo.gif`, and commit it.)*

---

## Tech Stack

- TypeScript, Node.js, VS Code Extension API
- AST parsing with `@babel/parser` for robust import extraction
- OpenAI SDK for code summarization
- D3.js for the interactive dependency graph

**What I learned:** integrating an LLM into a developer tool requires careful batching and caching to control cost and latency; VS Code Webviews need careful asset loading and secure message passing between the extension host and the frontend.

---

## Dev Notes

- Command ID: `cartographer.generateMap`
- Command title: `Cartographer: Generate Dependency Map`
- Activation event: `onCommand:cartographer.generateMap`
- Build: `npm run compile`
- Package: `npm run package` (requires `vsce`)

---

## Production considerations

- API keys: prefer storing `cartographer.openaiApiKey` in VS Code settings or use environment variables for CI; never commit secrets. See `.env.example` for local testing.
- Cost & rate limits: summarization uses OpenAI — large workspaces may incur costs and rate limits. The extension batches requests, retries on transient failures, and caches results in `.cartographer-cache.json`.
- Privacy: code snippets may be sent to the LLM provider. Avoid running the extension on private or regulated code unless permitted by your organization.

## Publishing checklist

- Set `publisher` in `package.json` to your Marketplace publisher ID.
- Verify `LICENSE` is present (MIT included).
- Ensure `.vscodeignore` excludes dev files; run `vsce package` and confirm VSIX contents.
- Add a demo GIF at `media/demo.gif` for the README.


## License

MIT — see [LICENSE](./LICENSE).
