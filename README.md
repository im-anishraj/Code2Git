<div align="center">
  <img src="assets/readme.png" alt="Code2Git" width="640">

  <h3>Solve on LeetCode, LeetCode CN &amp; GeeksforGeeks — it lands on GitHub automatically.</h3>

  <p>
    <a href="https://github.com/im-anishraj/Code2Git/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="license"></a>
    <a href="https://chromewebstore.google.com/u/1/detail/code2git/geodebjjkeochpcpjdkclmjbpkjbihnd"><img src="https://img.shields.io/chrome-web-store/v/geodebjjkeochpcpjdkclmjbpkjbihnd.svg" alt="chrome-webstore-version"></a>
    <a href="https://chromewebstore.google.com/u/1/detail/code2git/geodebjjkeochpcpjdkclmjbpkjbihnd"><img src="https://img.shields.io/chrome-web-store/d/geodebjjkeochpcpjdkclmjbpkjbihnd.svg" alt="chrome-webstore-users"></a>
    <a href="https://chromewebstore.google.com/u/1/detail/code2git/geodebjjkeochpcpjdkclmjbpkjbihnd"><img src="https://img.shields.io/chrome-web-store/rating/geodebjjkeochpcpjdkclmjbpkjbihnd.svg" alt="chrome-webstore-rating"></a>
    <a href="https://github.com/im-anishraj/Code2Git/graphs/contributors"><img src="https://img.shields.io/github/contributors/im-anishraj/Code2Git" alt="contributors"></a>
    <a href="https://github.com/im-anishraj/Code2Git/commits/main"><img src="https://img.shields.io/github/last-commit/im-anishraj/Code2Git" alt="last-commit"></a>
    <a href="https://github.com/im-anishraj/Code2Git/stargazers"><img src="https://img.shields.io/github/stars/im-anishraj/Code2Git?style=social" alt="stars"></a>
  </p>

  <p>
    <a href="#installation">Install</a> •
    <a href="#features">Features</a> •
    <a href="#supported-platforms">Platforms</a> •
    <a href="#roadmap">Roadmap</a> •
    <a href="#contributing">Contributing</a>
  </p>
</div>

<br>

## Table of Contents

- [What is Code2Git?](#what-is-code2git)
- [Why Code2Git?](#why-code2git)
- [Features](#features)
- [Demo](#demo)
- [Supported Platforms](#supported-platforms)
- [Supported UI](#supported-ui)
- [How It Works](#how-it-works)
- [Installation](#installation)
- [Setup](#setup)
- [Roadmap](#roadmap)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## What is Code2Git?

Code2Git is a Chrome extension that automatically pushes your code to GitHub the moment you pass all tests on **LeetCode**, **LeetCode CN**, or **GeeksforGeeks**.

## Why Code2Git?

Your solved problems end up scattered across platforms, with no single place to show your work. Copying each accepted solution to GitHub by hand is slow and easy to forget. Code2Git removes that step entirely — solve the problem, and it's already on GitHub.

## Features

- ⚡ **Zero-effort sync** — pass the tests, and your solution is pushed to GitHub automatically. No copy-pasting, no manual commits.
- 🌐 **Multi-platform** — one extension across LeetCode (English), LeetCode CN, and GeeksforGeeks.
- 🔒 **Private by default** — your solutions go to a private repo unless you choose otherwise.
- 🔁 **Manual sync** — resync your latest submission, or push older ones, with one click.
- 📊 **Progress at a glance** — open the extension popup any time to see what you've solved.
- 🧩 **Layout-aware** — works with both the classic and the new dynamic LeetCode UI.

## Demo

<h1 align="center">
    <img src="assets/extension/4.png" alt="Code2Git popup on a LeetCode submission" width="800">
</h1>

## Supported Platforms

| Platform                                        | Status         | Notes                             |
| ----------------------------------------------- | -------------- | --------------------------------- |
| [LeetCode.com](https://leetcode.com/)           | ✅ Supported   | English UI, old & dynamic layouts |
| [LeetCode.cn](https://leetcode.cn/) (力扣)      | ✅ Supported   | Chinese UI                        |
| [GeeksforGeeks](https://www.geeksforgeeks.org/) | ✅ Supported   |                                   |
| HackerRank                                      | 🚧 In progress | See [Roadmap](#roadmap)           |

## Supported UI

Code2Git works with GeeksforGeeks and two different LeetCode UIs:

1. The **old layout**, or
2. The new **"dynamic layout"**

> [!WARNING]
> There are known issues when using the plugin with LeetCode's non-dynamic new layout. Stick to one of the two layouts above for a reliable sync.

## How It Works

Code2Git watches for a successful submission and pushes it to your configured GitHub repo in the background.

> [!NOTE]
> If you edit the code too quickly after submitting, the push can fail to catch your final version. Wait about 4 seconds (until the spinner stops) after submitting — and before switching languages, editors, or typing again — while the layout stays as-is. This is a known limitation; PRs to fix it are very welcome.

In the meantime, use the **manual sync** button next to the notes icon:

- After a successful submission, if auto-sync didn't catch it.
- On an older submission — select it first, then hit manual sync.

## Installation

### 1. Chrome Web Store _(recommended)_

<div align="center">
    <a href="https://chromewebstore.google.com/u/1/detail/code2git/geodebjjkeochpcpjdkclmjbpkjbihnd" rel="Download Code2Git">
        <img src="assets/chrome-readme.png" alt="Download Code2Git" width="300" />
    </a>
</div>

Installs and updates itself automatically — this is the preferred way to get Code2Git.

### 2. Manual Installation

1. Create your own OAuth app in GitHub → [github.com/settings/applications/new](https://github.com/settings/applications/new), and keep `CLIENT_ID` / `CLIENT_SECRET` confidential.
   - **Application name:** _(your choice)_
   - **Homepage URL:** `https://github.com/im-anishraj/Code2Git`
   - **Authorization callback URL:** `https://github.com/`
2. Download the project as a [release ZIP](https://github.com/im-anishraj/Code2Git/releases) or clone this repo.
3. Run `npm run setup` to install the developer dependencies.
4. Add your `CLIENT_ID` and `CLIENT_SECRET` to `src/js/authorize.js` and `src/js/oauth2.js`.
5. Go to [chrome://extensions](chrome://extensions) and enable [Developer mode](https://www.mstoic.com/enable-developer-mode-in-chrome/) (top right).
6. Click **Load unpacked** and select the Code2Git folder.

## Setup

1. Launch the extension after installing.
2. Click **Authorize with GitHub** to connect your account.
3. Click **Get Started** to set up an existing or new repo (private by default).
4. Start solving on LeetCode or GFG — click the extension icon any time to view your progress.

## Roadmap

- [x] LeetCode.com
- [x] LeetCode.cn
- [x] GeeksforGeeks
- [ ] HackerRank _(in progress)_
- [ ] More platforms — [request one](https://github.com/im-anishraj/Code2Git/labels/feature)

## Troubleshooting

<details>
<summary>My submission didn't get pushed</summary>
<br>
Make sure you waited ~4 seconds after submitting before touching the editor again — see <a href="#how-it-works">How It Works</a>. If it still didn't sync, select the submission and use the manual sync button next to the notes icon.
</details>

<details>
<summary>The extension behaves oddly on LeetCode</summary>
<br>
Switch to the old layout or the new dynamic layout. The non-dynamic new layout has known compatibility issues.
</details>

## Contributing

Contributions, issues, and feature requests are welcome — this project grows with its community.

| Command               | Description                        |
| --------------------- | ---------------------------------- |
| `npm run`             | Show available commands            |
| `npm run setup`       | Install dependencies               |
| `npm run format`      | Auto-format JavaScript, HTML/CSS   |
| `npm run format-test` | Test if code is formatted properly |
| `npm run lint`        | Lint JavaScript                    |
| `npm run lint-test`   | Test if code is linted properly    |

1. Fork the repo and create your branch from `main`.
2. Make your changes and run `npm run format` and `npm run lint`.
3. Open a pull request describing what you changed and why.

## License

Code2Git is [licensed under the Apache License 2.0](https://github.com/im-anishraj/Code2Git/blob/main/LICENSE).

## Support

If Code2Git saves you time, consider starring the repo — it helps others find it and keeps development going.

<a href="https://github.com/im-anishraj/Code2Git/stargazers">
  <img src="https://api.star-history.com/svg?repos=im-anishraj/Code2Git&type=Date" alt="Star History Chart" width="600">
</a>
