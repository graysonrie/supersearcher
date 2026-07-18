# Super Searcher

A fast desktop file search and navigation app built with [Tauri 2](https://tauri.app/), [Angular 17](https://angular.dev/), and a Rust backend powered by [Tantivy](https://github.com/quickwit-oss/tantivy) for full-text indexing.

Super Searcher crawls your drives in the background, builds a full-text search index, and lets you find and manage files almost instantly.

## Features

- **Full-text file search** – near-instant results powered by a Tantivy search index.
- **Background crawlers** – configurable, multi-threaded indexing of your drives.
- **Whitelist / exclude directories** – control exactly which folders get indexed.
- **File browser** – navigate directories with history, sorting, and drive listing.
- **File operations** – copy/paste, move, delete to recycle bin, open in file explorer, and drag files out of the app.
- **Live directory watching** – results stay in sync as files change on disk.

## Screenshots
<img width="400" height="300" alt="Screenshot 2026-07-18 114906" src="https://github.com/user-attachments/assets/083d2625-47f0-4390-aba6-eae626de44cf" />
<img width="400" height="300" alt="Screenshot 2026-07-18 114820" src="https://github.com/user-attachments/assets/d180d00b-0fd8-4ed2-9cf8-cd7b45b03f4d" />
<img width="400" height="300" alt="Screenshot 2026-07-18 114922" src="https://github.com/user-attachments/assets/a1ec5feb-9dd9-4783-b36d-707ab13bf73c" />


## Tech Stack

| Layer    | Technology                                             |
| -------- | ------------------------------------------------------ |
| Frontend | Angular 17, RxJS                                       |
| Desktop  | Tauri 2                                                |
| Backend  | Rust - Tantivy (search), SeaORM + SQLite (persistence) |

## Prerequisites

Before building, install the following on your machine:

1. **Node.js** (v18 or newer) - https://nodejs.org
2. **Yarn** (Classic) - `npm install --global yarn`
3. **Rust** (stable toolchain) - https://rustup.rs
4. **Tauri system dependencies** - follow the official guide for your OS: https://tauri.app/start/prerequisites/

   - **Windows:** Microsoft C++ Build Tools and the WebView2 runtime (preinstalled on Windows 10/11).
   - **macOS:** Xcode Command Line Tools (`xcode-select --install`).

You can verify your setup with:

```bash
node --version
yarn --version
rustc --version
```

- NOTE: this app has only been tested on Windows currently!

## Getting Started

Clone the repository and install the frontend dependencies:

```bash
git clone https://github.com/graysonrie/supersearcher
cd supersearcher
yarn install
```

Rust dependencies are fetched and compiled automatically by Cargo the first time you run or build the app.

## Running in Development

Start the app in development mode with hot-reloading for the Angular frontend:

```bash
yarn tauri dev
```

This will:

1. Start the Angular dev server on `http://localhost:1420`.
2. Compile the Rust backend.
3. Launch the desktop window.

> The first run compiles the entire Rust backend and may take several minutes. Subsequent runs are incremental and much faster.

### Frontend only

If you want to work on the UI in a browser without the desktop shell:

```bash
yarn start
```

Note that Tauri-specific features (search, file operations, etc.) require the desktop runtime and will not work in a plain browser.

## Building for Production

Produce an optimized, installable bundle for your current platform:

```bash
yarn tauri build
```

The compiled installers and binaries are written to:

```
src-tauri/target/release/bundle/
```

## Configuration

Indexing behavior can be adjusted from within the app's **Settings** page:

- **Whitelisted directories** – folders to include in the index.
- **Excluded directories** – folders to skip while crawling.
- **Crawler count** – number of concurrent indexing workers.

## License

Released under the [MIT License](LICENSE).
