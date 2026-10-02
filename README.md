# Kyuushuu 吸収: Passive Japanese Absorption

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
There are about 4,200 words (N5 474 · N4 451 · N3 1,356 · N2 782 · N1 1,163) and about 5,600 English match keys. Numbers (two–ten, hundred, thousand, ten thousand, hundred thousand, million, billion), seasons, colors, months and weekdays are included. Multi-word keys such as "ten thousand" match as one word. They come from two sources:
- A small hand-curated core list in `tools/build_data.py`, which has priority.
- The open JLPT lists from [open-anki-jlpt-decks](https://github.com/jamsinclair/open-anki-jlpt-decks) (MIT, see `tools/sources/LICENSE`). Their English glosses come from [JMdict](https://www.edrdg.org/jmdict/j_jmdict.html) (© EDRDG, CC BY-SA 4.0).

When several Japanese words share an English gloss, the easiest level wins. Function words and very ambiguous English words are excluded. Romaji is generated automatically. JLPT levels are unofficial estimates.

To regenerate `data/`, run `python3 tools/build_data.py`.

## Testing
`NODE_PATH=$(npm root -g) node test/e2e.js` loads the extension in Chromium with Playwright and checks replacement, skipped elements, dynamic content, the tooltip, marking a word known and disabling the extension.
