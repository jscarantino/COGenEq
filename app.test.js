const fs = require("fs");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(new URL("../index.html", "file://" + __filename).pathname, "utf8");
const dom = new JSDOM(html, { runScripts: "outside-only", pretendToBeVisual: true, url: "https://example.com/" });
const w = dom.window;

// minimal localStorage
const mem = {};
Object.defineProperty(w, "localStorage", { value: {
  getItem: k => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: k => { delete mem[k]; }
}});
w.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){} });
w.alert = () => {}; w.confirm = () => true; w.prompt = () => "Test firm";

w.eval(fs.readFileSync(new URL("../assets/", "file://" + __filename).pathname + "rubric.js", "utf8"));
w.eval(fs.readFileSync(new URL("../assets/", "file://" + __filename).pathname + "app.js", "utf8"));

const d = w.document;
const q = s => d.querySelector(s);
const fail = [];
const ok = (c, m) => { console.log((c ? "  pass  " : "  FAIL  ") + m); if (!c) fail.push(m); };

console.log("\n-- render --");
ok(d.querySelectorAll(".dim").length === 10, "10 dimension cards rendered");
ok(d.querySelectorAll(".ind").length === 21, "21 indicators rendered");
ok(d.querySelectorAll(".anchor").length === 105, "105 anchors rendered (21 x 5)");
ok(d.querySelectorAll("#nav a[data-dim]").length === 10, "10 rail links");
ok(q("#ramp").children.length === 5, "scale ramp has 5 steps");
ok(q("#cautions").children.length === 6, "6 cautions listed");
ok(q("#sumBody").querySelectorAll("tr").length === 11, "summary table has 10 rows + total");
ok(q("#tNum").textContent.includes("/100"), "headline shows /100");

console.log("\n-- scoring --");
const click = el => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));

// all anchors to 4 -> 100
d.querySelectorAll('.anchor[data-v="4"]').forEach(click);
ok(q("#tNum").textContent.startsWith("100"), "all 4s gives 100  (got " + q("#tNum").textContent.trim() + ")");
ok(q("#tBand").textContent === "Leading", "band reads Leading");

// all to 0 -> 0
d.querySelectorAll('.anchor[data-v="0"]').forEach(click);
ok(q("#tNum").textContent.startsWith("0"), "all 0s gives 0  (got " + q("#tNum").textContent.trim() + ")");
ok(q("#tBand").textContent === "Absent", "band reads Absent");

// all to 2 -> 50
d.querySelectorAll('.anchor[data-v="2"]').forEach(click);
ok(q("#tNum").textContent.startsWith("50"), "all 2s gives 50  (got " + q("#tNum").textContent.trim() + ")");
ok(q("#tBand").textContent === "Developing", "band reads Developing");

// toggle off one anchor deselects it
const a = q('.anchor[data-ind="A1.1"][data-v="2"]');
click(a);
ok(a.getAttribute("aria-pressed") === "false", "clicking a selected anchor clears it");
ok(q("#tProg").textContent.startsWith("20 of 21"), "progress drops to 20 of 21  (got " + q("#tProg").textContent + ")");
click(a);

console.log("\n-- not applicable --");
// mark A3.1 n/a: dimension A3 (weight 6) should leave the denominator
click(q('[data-na="A3.1"]'));
const totalRow = q("#sumBody").querySelector("tr.total");
ok(/94/.test(totalRow.textContent), "applicable weight falls to 94  (row: " + totalRow.textContent.replace(/\s+/g," ").trim() + ")");
ok(q("#tNum").textContent.startsWith("50"), "all-2s score stays 50 after an N/A");
ok(q("#ds-A3").textContent === "n/a", "A3 dimension reads n/a");
click(q('[data-na="A3.1"]'));

console.log("\n-- partial N/A redistributes within a dimension --");
// B1 has 3 indicators, weight 15. N/A one, set the other two to 4 -> full 15
click(q('[data-na="B1.1"]'));
click(q('.anchor[data-ind="B1.2"][data-v="4"]'));
click(q('.anchor[data-ind="B1.3"][data-v="4"]'));
ok(q("#ds-B1").textContent === "15.0", "B1 earns its full 15 pts from 2 of 3 indicators  (got " + q("#ds-B1").textContent + ")");

console.log("\n-- notes --");
click(q('[data-note="A1.1"]'));
const ta = q("#nt-A1\\.1");
ok(ta && !ta.hidden, "evidence note opens");
ta.value = "Partnership deck, p14";
ta.dispatchEvent(new w.Event("input", { bubbles: true }));
ta.dispatchEvent(new w.Event("focusout", { bubbles: true }));
ok(q('[data-note="A1.1"]').textContent === "Evidence note saved", "note button reflects saved state");
ok(JSON.parse(mem["gender-equity-rubric"]).assessments[JSON.parse(mem["gender-equity-rubric"]).activeId].scores["A1.1"].note === "Partnership deck, p14", "note persisted to storage");

console.log("\n-- assessments --");
const before = Object.keys(JSON.parse(mem["gender-equity-rubric"]).assessments).length;
click(q("#btnNew"));
const after = Object.keys(JSON.parse(mem["gender-equity-rubric"]).assessments).length;
ok(after === before + 1, "new assessment created");
ok(q("#pick").options.length === after, "picker lists both");
ok(q("#tProg").textContent === "Nothing rated yet" || q("#tProg").textContent.startsWith("0 of"), "new assessment starts empty  (got " + q("#tProg").textContent + ")");

console.log("\n-- theme --");
click(q("#btnTheme"));
ok(d.documentElement.getAttribute("data-theme") === "dark", "theme toggles to dark");
click(q("#btnTheme"));
ok(d.documentElement.getAttribute("data-theme") === "light", "theme toggles back");

console.log("\n" + (fail.length ? fail.length + " FAILURE(S)" : "all checks passed"));
process.exit(fail.length ? 1 : 0);
