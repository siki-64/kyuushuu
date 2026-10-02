# Nihongo Drift

A Chrome extension (Manifest V3, no build step) for passive Japanese vocabulary immersion. As you browse, it swaps a small share of English words on the page for their Japanese equivalent. Hover a swapped word to see its kanji, kana, romaji, original English and JLPT level, or mark it **Known** so it stops appearing.

## Install
1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select this folder.

## Settings (popup)
- **On/off** toggle, plus **Disable on this site**.
- **JLPT levels**: N5–N1 (default N5).
- **Words replaced (%)**: share of matching English words that get swapped (1–100%). **Max words per page** caps the total.
- **Script mix**: relative weights for showing a word as **kanji**, **kana** or **romaji**. Each replaced word picks a script at random using these weights (default 60 / 30 / 10).

The options page lists every word with its exposure count and lets you toggle **known**, edit the site blocklist and reset progress.

## How it works
- `background.js` loads `data/*.json`, stores settings in `chrome.storage.sync` and progress in `chrome.storage.local` (`{ [ja]: { seen, known, lastSeen } }`).
- `content/content.js` walks the page's text nodes and skips code, inputs, editable areas and pages already in Japanese. It matches English words, including rough -s/-ed forms, and swaps a share of them for Japanese. A `MutationObserver` covers dynamically loaded content.

## Vocabulary data
The word lists are hand-curated, and the JLPT level assignments are approximate. To edit them, change `tools/build_data.py` and run `python3 tools/build_data.py` to regenerate `data/`.

## Testing
`NODE_PATH=$(npm root -g) node test/e2e.js` loads the extension in Chromium with Playwright and checks replacement, skipped elements, dynamic content, the tooltip, marking a word known and disabling the extension.
