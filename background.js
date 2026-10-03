// Service worker: owns the vocabulary data and the progress store.

const LEVELS = ["N5", "N4", "N3", "N2", "N1"];

const DEFAULT_SETTINGS = {
  enabled: true,
  levels: ["N5"],
  density: 15, // percent of eligible matches that get replaced
  maxPerPage: 60,
  // Sites where words are never replaced (subdomains included). Editable in options.
  blocklist: [
    "github.com", "gitlab.com", "bitbucket.org", "stackoverflow.com",
    "docs.google.com", "mail.google.com", "outlook.live.com", "outlook.office.com"
  ],
  showEnglish: false, // show the English word in grey after each replaced word
  // Relative weights (%) for which script a replaced word is shown in.
  scriptWeights: { kanji: 60, kana: 30, romaji: 10 }
};

let vocabCache = null;

async function loadVocab() {
  if (vocabCache) return vocabCache;
  const out = {};
  await Promise.all(
    LEVELS.map(async (level) => {
      const res = await fetch(chrome.runtime.getURL(`data/${level.toLowerCase()}.json`));
      out[level] = await res.json();
    })
  );
  vocabCache = out;
  return out;
}

async function getSettings() {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...stored };
}

async function getProgress() {
  const { progress } = await chrome.storage.local.get({ progress: {} });
  return progress;
}

async function updateProgress(mutate) {
  const progress = await getProgress();
  mutate(progress);
  await chrome.storage.local.set({ progress });
  return progress;
}

chrome.runtime.onInstalled.addListener(async () => {
  // Fill in any missing settings without clobbering existing ones.
  const stored = await chrome.storage.sync.get(null);
  const missing = Object.fromEntries(Object.entries(DEFAULT_SETTINGS).filter(([k]) => !(k in stored)));
  if (Object.keys(missing).length) await chrome.storage.sync.set(missing);
});

const handlers = {
  async getPageData() {
    const [settings, vocab, progress] = await Promise.all([getSettings(), loadVocab(), getProgress()]);
    const words = [];
    for (const level of settings.levels) {
      for (const entry of vocab[level] || []) {
        if (!progress[entry.ja]?.known) words.push({ ...entry, level });
      }
    }
    return { settings, words };
  },

  async getVocab() {
    const [vocab, progress] = await Promise.all([loadVocab(), getProgress()]);
    return { vocab, progress };
  },

  async markSeen({ words }) {
    const now = Date.now();
    await updateProgress((p) => {
      for (const ja of words) {
        const rec = (p[ja] ||= { seen: 0, known: false });
        rec.seen += 1;
        rec.lastSeen = now;
      }
    });
    return { ok: true };
  },

  async setKnown({ ja, known }) {
    await updateProgress((p) => {
      const rec = (p[ja] ||= { seen: 0, known: false });
      rec.known = known;
    });
    return { ok: true };
  },

  async resetProgress() {
    await chrome.storage.local.set({ progress: {} });
    return { ok: true };
  },

  async getStats() {
    const [settings, vocab, progress] = await Promise.all([getSettings(), loadVocab(), getProgress()]);
    const recs = Object.values(progress);
    const active = settings.levels.reduce((n, l) => n + (vocab[l]?.length || 0), 0);
    return {
      seenWords: recs.filter((r) => r.seen > 0).length,
      exposures: recs.reduce((n, r) => n + (r.seen || 0), 0),
      known: recs.filter((r) => r.known).length,
      activeWords: active
    };
  }
};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const handler = handlers[msg?.type];
  if (!handler) return false;
  handler(msg)
    .then(sendResponse)
    .catch((err) => sendResponse({ error: String(err) }));
  return true; // async response
});
