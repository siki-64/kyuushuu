const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const ext = path.resolve(__dirname, "..");
  const ctx = await chromium.launchPersistentContext("", {
    headless: false,
    executablePath: "/opt/pw-browsers/chromium",
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`, "--headless=new"]
  });
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent("serviceworker");
  // Let onInstalled write its defaults first, then override them.
  await sw.evaluate(() => new Promise((r) => setTimeout(r, 500)));
  await sw.evaluate(() => chrome.storage.sync.set({ enabled: true, levels: ["N5", "N4"], density: 100, maxPerPage: 100, scriptWeights: { kanji: 34, kana: 33, romaji: 33 } }));
  const page = await ctx.newPage();
  const url = "file://" + path.join(__dirname, "page.html");
  await page.goto(url);
  await page.waitForSelector(".jpimm-word", { timeout: 5000 });
  await page.evaluate(() => { document.getElementById("dyn").textContent = "The cat drinks milk."; });
  await page.waitForSelector("#dyn .jpimm-word", { timeout: 5000 }).catch(() => {});
  const r = await page.evaluate(() => ({
    count: document.querySelectorAll(".jpimm-word").length,
    scripts: [...document.querySelectorAll(".jpimm-word")].reduce((m, s) => (m[s.dataset.script] = (m[s.dataset.script] || 0) + 1, m), {}),
    code: document.getElementById("code").textContent,
    inp: document.getElementById("inp").value,
    dyn: document.getElementById("dyn").innerHTML
  }));
  console.log(JSON.stringify(r, null, 1));
  const nums = await page.$$eval("#nums .jpimm-word", (els) => els.map((e) => `${e.dataset.en}=${e.dataset.ja}`));
  console.log("nums:", nums.join(" "));
  if (!nums.includes("ten thousand=一万")) throw new Error("phrase match failed");
  if (!r.count || r.code !== "const water = fire + dog; // eat drink" || r.inp !== "water dog cat eat") throw new Error("bad");
  if (!r.dyn.includes("jpimm-word")) throw new Error("mutation observer failed");
  await page.hover(".jpimm-word");
  await page.waitForSelector("#jpimm-tooltip.jpimm-visible");
  await page.screenshot({ path: path.join(__dirname, "screenshot.png") });
  // Mark known reverts.
  const ja = await page.getAttribute(".jpimm-word", "data-ja");
  await page.click(".jpimm-tt-known");
  await page.waitForTimeout(500);
  const left = await page.locator(`.jpimm-word[data-ja="${ja}"]`).count();
  console.log("known reverted:", left === 0);
  const prog = await sw.evaluate(() => chrome.storage.local.get("progress"));
  console.log("progress entries:", Object.keys(prog.progress).length, "known:", prog.progress[ja]?.known);
  // Disabled.
  // Let onInstalled write its defaults first, then override them.
  await sw.evaluate(() => new Promise((r) => setTimeout(r, 500)));
  await sw.evaluate(() => chrome.storage.sync.set({ enabled: false }));
  await page.reload(); await page.waitForTimeout(1500);
  console.log("disabled count:", await page.locator(".jpimm-word").count());
  await ctx.close();
})().catch((e) => { console.error(e); process.exit(1); });
