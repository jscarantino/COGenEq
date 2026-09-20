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

// ---------------------------------------------------------------------
// Login gate — a separate JSDOM instance, since auth.js sets a flag
// that changes how app.js boots and we don't want that leaking into
// the suite above.
// ---------------------------------------------------------------------

function testGate(label, configured, mockClient, run) {
  const dom2 = new JSDOM(html, { runScripts: "outside-only", pretendToBeVisual: true, url: "https://example.com/" });
  const w2 = dom2.window;
  const mem2 = {};
  Object.defineProperty(w2, "localStorage", { value: {
    getItem: k => (k in mem2 ? mem2[k] : null),
    setItem: (k, v) => { mem2[k] = String(v); },
    removeItem: k => { delete mem2[k]; }
  }});
  w2.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){} });

  w2.AUTH_CONFIG = configured
    ? { domain: "test-tenant.us.auth0.com", clientId: "abc123", redirectUri: "https://example.com/" }
    : { domain: "YOUR-TENANT.us.auth0.com", clientId: "YOUR-CLIENT-ID", redirectUri: "https://example.com/" };

  if (mockClient !== null) {
    w2.auth0 = { createAuth0Client: async () => mockClient };
  }

  w2.eval(fs.readFileSync("rubric/assets/auth.js", "utf8"));
  w2.eval(fs.readFileSync("rubric/assets/rubric.js", "utf8"));
  w2.eval(fs.readFileSync("rubric/assets/app.js", "utf8"));

  // readyState is "complete" by the time we eval into an already-parsed
  // document, so auth.js has already called start() once on its own.
  // Await it directly rather than racing a synthetic event.
  return w2.__RUBRIC_AUTH_START__().then(() => run(w2, dom2));
}

(async () => {
  console.log("\n-- login gate: not configured --");
  await testGate("unconfigured", false, null, (w2) => {
    const d2 = w2.document;
    ok(!d2.getElementById("gate").hidden, "gate is shown when auth-config.js has placeholder values");
    ok(d2.getElementById("appRoot").hidden, "app stays hidden when not configured");
    ok(!d2.getElementById("gateUnconfigured").hidden, "the 'not configured' message is shown, not a login button");
  });

  console.log("\n-- login gate: configured, signed out --");
  const unauth = {
    isAuthenticated: async () => false,
    loginWithRedirect: () => { unauth._loginCalled = true; },
    handleRedirectCallback: async () => {}
  };
  await testGate("signed-out", true, unauth, (w2) => {
    const d2 = w2.document;
    ok(!d2.getElementById("gate").hidden, "gate is shown when signed out");
    ok(d2.getElementById("appRoot").hidden, "app is hidden when signed out");
    ok(!d2.getElementById("gateSignedOut").hidden, "the sign-in view is shown");
    const btn = d2.getElementById("btnLogin");
    ok(typeof btn.onclick === "function", "the login button is wired up");
    btn.onclick();
    ok(unauth._loginCalled === true, "clicking login calls loginWithRedirect");
  });

  console.log("\n-- login gate: configured, signed in --");
  const auth = {
    isAuthenticated: async () => true,
    handleRedirectCallback: async () => {},
    logout: (opts) => { auth._logoutOpts = opts; }
  };
  await testGate("signed-in", true, auth, (w2) => {
    const d2 = w2.document;
    ok(d2.getElementById("gate").hidden, "gate is hidden once authenticated");
    ok(!d2.getElementById("appRoot").hidden, "app becomes visible once authenticated");
    ok(d2.getElementById("tNum") && d2.getElementById("tNum").textContent.includes("/100"), "the rubric app actually booted after login (not just unhidden)");
    const logoutBtn = d2.getElementById("btnLogout");
    ok(!!logoutBtn, "a log out button is added to the bar");
    logoutBtn.click();
    ok(!!auth._logoutOpts, "log out calls the Auth0 client's logout method");
  });

  console.log("\n-- login gate: Auth0 unreachable --");
  const broken = { createAuth0Client: async () => { throw new Error("network down"); } };
  await new Promise(resolve => {
    const dom3 = new JSDOM(html, { runScripts: "outside-only", pretendToBeVisual: true, url: "https://example.com/" });
    const w3 = dom3.window;
    w3.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
    w3.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){} });
    w3.AUTH_CONFIG = { domain: "test-tenant.us.auth0.com", clientId: "abc123", redirectUri: "https://example.com/" };
    w3.auth0 = broken;
    w3.eval(fs.readFileSync("rubric/assets/auth.js", "utf8"));
    w3.eval(fs.readFileSync("rubric/assets/rubric.js", "utf8"));
    w3.eval(fs.readFileSync("rubric/assets/app.js", "utf8"));
    w3.document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => {
        const d3 = w3.document;
        ok(!d3.getElementById("gateError").hidden, "a connection failure shows the error view, not a silent blank page");
        ok(d3.getElementById("gateErrorMsg").textContent.includes("network down"), "the underlying error message is surfaced for debugging");
        resolve();
      }, 0);
    });
    w3.document.dispatchEvent(new w3.Event("DOMContentLoaded", { bubbles: true }));
  });

  console.log("\n" + (fail.length ? fail.length + " FAILURE(S) TOTAL" : "all checks passed, including login gate"));
  process.exit(fail.length ? 1 : 0);
})();
