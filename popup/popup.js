const LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const SCRIPTS = ["kanji", "kana", "romaji"];
const $ = (id) => document.getElementById(id);

function send(msg) {
  return new Promise((resolve) => chrome.runtime.sendMessage(msg, resolve));
}

async function currentHost() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
  try { return new URL(tab.url).hostname; } catch { return null; }
}

function renderWeights(weights) {
  const total = SCRIPTS.reduce((n, k) => n + (weights[k] || 0), 0);
  for (const k of SCRIPTS) {
    $(`w-${k}`).value = weights[k] || 0;
    $(`w-${k}-out`).textContent = total ? `${Math.round(((weights[k] || 0) / total) * 100)}%` : "—";
  }
}

async function renderStats() {
  const s = await send({ type: "getStats" });
  if (!s) return;
  $("stats").innerHTML = `
    <div><b>${s.seenWords}</b><span>words seen</span></div>
    <div><b>${s.exposures}</b><span>exposures</span></div>
    <div><b>${s.known}</b><span>known</span></div>`;
}

async function init() {
  const settings = await chrome.storage.sync.get(null);
  const save = (patch) => chrome.storage.sync.set(patch);

  $("enabled").checked = settings.enabled !== false;
  $("enabled").onchange = (e) => save({ enabled: e.target.checked });

  const levels = new Set(settings.levels || ["N5"]);
  $("levels").innerHTML = LEVELS.map(
    (l) => `<label><input type="checkbox" value="${l}" ${levels.has(l) ? "checked" : ""}><span>${l}</span></label>`
  ).join("");
  $("levels").onchange = () => {
    const chosen = [...$("levels").querySelectorAll("input:checked")].map((i) => i.value);
    save({ levels: chosen });
    renderStats();
  };

  $("density").value = settings.density ?? 5;
  $("densityOut").textContent = `${$("density").value}%`;
  $("density").oninput = (e) => {
    $("densityOut").textContent = `${e.target.value}%`;
    save({ density: Number(e.target.value) });
  };

  $("maxPerPage").value = settings.maxPerPage ?? 30;
  $("maxOut").textContent = $("maxPerPage").value;
  $("maxPerPage").oninput = (e) => {
    $("maxOut").textContent = e.target.value;
    save({ maxPerPage: Number(e.target.value) });
  };

  let weights = { kanji: 60, kana: 30, romaji: 10, ...(settings.scriptWeights || {}) };
  renderWeights(weights);
  for (const k of SCRIPTS) {
    $(`w-${k}`).oninput = (e) => {
      weights = { ...weights, [k]: Number(e.target.value) };
      renderWeights(weights);
      save({ scriptWeights: weights });
    };
  }

  const host = await currentHost();
  const blocklist = settings.blocklist || [];
  const btn = $("blockSite");
  if (!host) {
    btn.hidden = true;
  } else {
    const update = () => {
      btn.textContent = blocklist.includes(host) ? `Enable on ${host}` : `Disable on ${host}`;
    };
    update();
    btn.onclick = () => {
      const i = blocklist.indexOf(host);
      if (i >= 0) blocklist.splice(i, 1);
      else blocklist.push(host);
      save({ blocklist });
      update();
    };
  }

  $("openOptions").onclick = (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  };

  renderStats();
}

init();
