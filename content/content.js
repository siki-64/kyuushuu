// Content script: swaps a small share of English words for Japanese ones.
(() => {
  if (window.__jpimmLoaded) return;
  window.__jpimmLoaded = true;

  const SKIP_TAGS = new Set([
    "SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT", "OPTION",
    "CODE", "PRE", "KBD", "SAMP", "SVG", "MATH", "CANVAS", "IFRAME", "TITLE"
  ]);
  const WORD_RE = /[A-Za-z]+(?:'[a-z]+)?/g;
  const MAX_PER_WORD = 2;

  let settings = null;
  let lookup = null; // lowercase English form -> entry
  let replacedCount = 0;
  const perWord = new Map(); // ja -> count on this page
  const seenThisPage = new Set();
  const pendingSeen = new Set();
  let tooltip = null;

  function send(msg) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(msg, (res) => {
          if (chrome.runtime.lastError) resolve(null);
          else resolve(res);
        });
      } catch {
        resolve(null); // extension reloaded / context invalidated
      }
    });
  }

  function isBlocked(hostname, blocklist) {
    return blocklist.some((d) => {
      d = d.trim().toLowerCase();
      return d && (hostname === d || hostname.endsWith("." + d));
    });
  }

  // Rough inflection support: base, -s/-es, -ed/-d.
  function forms(word) {
    const w = word.toLowerCase();
    const out = [w];
    if (w.includes(" ")) return out;
    out.push(w.endsWith("s") || w.endsWith("x") || w.endsWith("ch") || w.endsWith("sh") ? w + "es" : w + "s");
    if (/[^aeiou]y$/.test(w)) out.push(w.slice(0, -1) + "ies");
    if (w.endsWith("e")) out.push(w + "d");
    else if (/[^aeiou]y$/.test(w)) out.push(w.slice(0, -1) + "ied");
    else out.push(w + "ed");
    return out;
  }

  function buildLookup(words) {
    const map = new Map();
    for (const entry of words) {
      entry.en.forEach((en, i) => {
        // Only the first gloss gets inflected forms, to limit false matches.
        const variants = i === 0 ? forms(en) : [en.toLowerCase()];
        for (const f of variants) if (!map.has(f)) map.set(f, entry);
      });
    }
    return map;
  }

  function shouldSkip(node) {
    for (let el = node.parentElement; el; el = el.parentElement) {
      if (SKIP_TAGS.has(el.tagName)) return true;
      if (el.isContentEditable) return true;
      if (el.classList.contains("jpimm-word") || el.id === "jpimm-tooltip") return true;
    }
    return false;
  }

  // Pick kanji / kana / romaji at random according to the user's weights.
  function pickScript() {
    const w = settings.scriptWeights || {};
    const options = [["kanji", w.kanji], ["kana", w.kana], ["romaji", w.romaji]]
      .map(([k, v]) => [k, Math.max(0, Number(v) || 0)]);
    const total = options.reduce((n, [, v]) => n + v, 0);
    if (!total) return "kanji";
    let r = Math.random() * total;
    for (const [k, v] of options) {
      if ((r -= v) < 0) return k;
    }
    return "kanji";
  }

  function displayText(entry, script) {
    if (script === "kana") return entry.kana;
    if (script === "romaji") return entry.romaji;
    return entry.ja;
  }

  function makeSpan(entry, original) {
    const span = document.createElement("span");
    span.className = "jpimm-word";
    const script = pickScript();
    span.textContent = displayText(entry, script);
    span.dataset.script = script;
    span.dataset.en = original;
    span.dataset.ja = entry.ja;
    span.dataset.kana = entry.kana;
    span.dataset.romaji = entry.romaji;
    span.dataset.level = entry.level;
    if (script !== "romaji") span.lang = "ja";
    return span;
  }

  function processTextNode(node) {
    const text = node.nodeValue;
    if (!text || text.trim().length < 2) return;
    WORD_RE.lastIndex = 0;
    let match;
    let last = 0;
    let frag = null;
    while ((match = WORD_RE.exec(text))) {
      if (replacedCount >= settings.maxPerPage) break;
      const word = match[0];
      // Skip acronyms / shouting, which are rarely the plain word.
      if (word.length > 1 && word === word.toUpperCase()) continue;
      const entry = lookup.get(word.toLowerCase());
      if (!entry) continue;
      if ((perWord.get(entry.ja) || 0) >= MAX_PER_WORD) continue;
      if (Math.random() * 100 >= settings.density) continue;

      frag ||= document.createDocumentFragment();
      frag.appendChild(document.createTextNode(text.slice(last, match.index)));
      frag.appendChild(makeSpan(entry, word));
      last = match.index + word.length;
      replacedCount++;
      perWord.set(entry.ja, (perWord.get(entry.ja) || 0) + 1);
      if (!seenThisPage.has(entry.ja)) {
        seenThisPage.add(entry.ja);
        pendingSeen.add(entry.ja);
      }
    }
    if (!frag) return;
    frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }

  function collectTextNodes(root) {
    const nodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (shouldSkip(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT)
    });
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }

  const idle = window.requestIdleCallback || ((cb) => setTimeout(() => cb({ timeRemaining: () => 10 }), 1));

  function processRoot(root) {
    const queue = collectTextNodes(root);
    const step = (deadline) => {
      while (queue.length && replacedCount < settings.maxPerPage && deadline.timeRemaining() > 1) {
        const node = queue.shift();
        if (node.isConnected) processTextNode(node);
      }
      if (queue.length && replacedCount < settings.maxPerPage) idle(step);
      flushSeen();
    };
    idle(step);
  }

  let flushTimer = null;
  function flushSeen() {
    if (!pendingSeen.size || flushTimer) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      const words = [...pendingSeen];
      pendingSeen.clear();
      send({ type: "markSeen", words });
    }, 1000);
  }

  // ---- Tooltip ----
  function ensureTooltip() {
    if (tooltip) return tooltip;
    tooltip = document.createElement("div");
    tooltip.id = "jpimm-tooltip";
    tooltip.innerHTML = `
      <div class="jpimm-tt-ja"></div>
      <div class="jpimm-tt-kana"></div>
      <div class="jpimm-tt-en"></div>
      <div class="jpimm-tt-row">
        <span class="jpimm-tt-level"></span>
        <button type="button" class="jpimm-tt-known">✓ Known</button>
      </div>`;
    document.documentElement.appendChild(tooltip);
    tooltip.addEventListener("mouseleave", hideTooltip);
    tooltip.querySelector(".jpimm-tt-known").addEventListener("click", onKnown);
    return tooltip;
  }

  let hideTimer = null;
  let currentSpan = null;

  function showTooltip(span) {
    clearTimeout(hideTimer);
    const tt = ensureTooltip();
    currentSpan = span;
    tt.querySelector(".jpimm-tt-ja").textContent = span.dataset.ja;
    tt.querySelector(".jpimm-tt-kana").textContent = `${span.dataset.kana} · ${span.dataset.romaji}`;
    tt.querySelector(".jpimm-tt-en").textContent = span.dataset.en;
    tt.querySelector(".jpimm-tt-level").textContent = `JLPT ${span.dataset.level}`;
    const btn = tt.querySelector(".jpimm-tt-known");
    btn.disabled = false;
    btn.textContent = "✓ Known";
    tt.classList.add("jpimm-visible");
    const r = span.getBoundingClientRect();
    const ttRect = tt.getBoundingClientRect();
    let top = r.bottom + 6;
    if (top + ttRect.height > window.innerHeight) top = r.top - ttRect.height - 6;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - ttRect.width - 8));
    tt.style.top = `${top}px`;
    tt.style.left = `${left}px`;
  }

  function hideTooltip() {
    hideTimer = setTimeout(() => tooltip?.classList.remove("jpimm-visible"), 200);
  }

  async function onKnown(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!currentSpan) return;
    const ja = currentSpan.dataset.ja;
    e.currentTarget.disabled = true;
    e.currentTarget.textContent = "Saved";
    await send({ type: "setKnown", ja, known: true });
    // Revert every instance of this word on the page back to English.
    document.querySelectorAll(`.jpimm-word[data-ja="${CSS.escape(ja)}"]`).forEach((s) => {
      s.replaceWith(document.createTextNode(s.dataset.en));
    });
    for (const [k, v] of lookup) if (v.ja === ja) lookup.delete(k);
    tooltip.classList.remove("jpimm-visible");
  }

  document.addEventListener("mouseover", (e) => {
    const span = e.target.closest?.(".jpimm-word");
    if (span) showTooltip(span);
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest?.(".jpimm-word") && !tooltip?.contains(e.relatedTarget)) hideTooltip();
  });
  document.addEventListener("mouseover", (e) => {
    if (tooltip && tooltip.contains(e.target)) clearTimeout(hideTimer);
  });

  // ---- SPA support ----
  function observe() {
    const pending = new Set();
    let timer = null;
    const obs = new MutationObserver((mutations) => {
      if (replacedCount >= settings.maxPerPage) return obs.disconnect();
      for (const m of mutations) {
        for (const n of m.addedNodes) {
          if (n.nodeType === Node.TEXT_NODE && n.parentElement && !n.parentElement.closest(".jpimm-word, #jpimm-tooltip")) {
            pending.add(n.parentElement);
          } else if (n.nodeType === Node.ELEMENT_NODE && !n.classList.contains("jpimm-word") && n.id !== "jpimm-tooltip") {
            pending.add(n);
          }
        }
      }
      if (pending.size && !timer) {
        timer = setTimeout(() => {
          timer = null;
          const roots = [...pending].filter((n) => n.isConnected);
          pending.clear();
          roots.forEach(processRoot);
        }, 500);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  async function init() {
    if (!document.body) return;
    const data = await send({ type: "getPageData" });
    if (!data || data.error) return;
    settings = data.settings;
    if (!settings.enabled) return;
    if (isBlocked(location.hostname.toLowerCase(), settings.blocklist || [])) return;
    if (/^ja\b/i.test(document.documentElement.lang)) return; // already Japanese
    lookup = buildLookup(data.words);
    if (!lookup.size) return;
    processRoot(document.body);
    observe();
  }

  init();
})();
