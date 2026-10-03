const $ = (id) => document.getElementById(id);
const send = (msg) => new Promise((resolve) => chrome.runtime.sendMessage(msg, resolve));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

let data = null;

function render() {
  const level = $("level").value;
  const filter = $("filter").value;
  const q = $("search").value.trim().toLowerCase();
  const rows = [];
  for (const [lvl, entries] of Object.entries(data.vocab)) {
    if (level && lvl !== level) continue;
    for (const e of entries) {
      const p = data.progress[e.ja] || {};
      if (filter === "seen" && !p.seen) continue;
      if (filter === "known" && !p.known) continue;
      if (filter === "unseen" && p.seen) continue;
      if (q && ![e.ja, e.kana, e.romaji, ...e.en].some((s) => s.toLowerCase().includes(q))) continue;
      rows.push(`<tr>
        <td>${lvl}</td><td class="ja">${esc(e.ja)}</td><td class="ja">${esc(e.kana)}</td>
        <td>${esc(e.romaji)}</td><td>${esc(e.en.join(", "))}</td>
        <td class="num">${p.seen || 0}</td>
        <td><input type="checkbox" data-ja="${esc(e.ja)}" ${p.known ? "checked" : ""}></td></tr>`);
    }
  }
  $("rows").innerHTML = rows.join("") || `<tr><td colspan="7">No words match.</td></tr>`;
}

async function load() {
  data = await send({ type: "getVocab" });
  render();
}

async function init() {
  const { blocklist = [] } = await chrome.storage.sync.get("blocklist");
  $("blocklist").value = blocklist.join("\n");
  // Accept domains or pasted URLs, e.g. "https://www.github.com/foo" -> "github.com".
  const toDomain = (s) => s.trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/[\/?#:].*$/, "").replace(/^www\./, "");
  const saveBlocklist = (e) => {
    const list = [...new Set(e.target.value.split(/[\s,]+/).map(toDomain).filter(Boolean))];
    chrome.storage.sync.set({ blocklist: list });
    return list;
  };
  $("blocklist").oninput = saveBlocklist;
  $("blocklist").onchange = (e) => { e.target.value = saveBlocklist(e).join("\n"); };

  for (const l of ["N5", "N4", "N3", "N2", "N1"]) $("level").add(new Option(l, l));
  ["level", "filter"].forEach((id) => ($(id).onchange = render));
  $("search").oninput = render;

  $("rows").onchange = async (e) => {
    const ja = e.target.dataset.ja;
    if (!ja) return;
    await send({ type: "setKnown", ja, known: e.target.checked });
    (data.progress[ja] ||= { seen: 0 }).known = e.target.checked;
  };

  $("reset").onclick = async () => {
    if (!confirm("Reset all exposure counts and known words?")) return;
    await send({ type: "resetProgress" });
    load();
  };

  load();
}

init();
