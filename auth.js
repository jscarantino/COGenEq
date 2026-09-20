/*
 * auth.js — login gate.
 *
 * What this does: hides the rubric behind an Auth0 sign-in screen, so
 * someone opening the bare URL sees a login form instead of the app.
 *
 * What this does NOT do: protect the underlying files. GitHub Pages
 * serves every file in the repository to anyone who requests it by
 * URL — that is what static hosting is. assets/rubric.js is fetchable
 * directly, with or without this gate. This screen stops a casual
 * visitor from *seeing the rendered app*; it does not make the rubric's
 * content confidential. If that distinction matters for your use case,
 * see the README section "What this protects, and what it doesn't."
 *
 * Requires an Auth0 tenant and application (free tier is enough) and
 * assets/auth-config.js filled in with your domain and client ID.
 */
(function () {
  "use strict";

  window.__RUBRIC_GATED__ = true;

  function $(id) { return document.getElementById(id); }

  function configured() {
    var c = window.AUTH_CONFIG;
    return !!(c && c.domain && c.clientId &&
      c.domain.indexOf("YOUR-TENANT") === -1 &&
      c.clientId.indexOf("YOUR-CLIENT-ID") === -1);
  }

  function showGate(view, message) {
    $("gate").hidden = false;
    $("appRoot").hidden = true;
    $("gateUnconfigured").hidden = view !== "unconfigured";
    $("gateSignedOut").hidden = view !== "signed-out";
    $("gateError").hidden = view !== "error";
    if (message) $("gateErrorMsg").textContent = message;
  }

  function showApp() {
    $("gate").hidden = true;
    $("appRoot").hidden = false;
    if (typeof window.__bootRubricApp === "function") {
      window.__bootRubricApp();
    }
  }

  function addLogoutButton(client) {
    var bar = document.querySelector(".bar-spacer");
    if (!bar || $("btnLogout")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn";
    btn.id = "btnLogout";
    btn.textContent = "Log out";
    btn.addEventListener("click", function () {
      client.logout({ logoutParams: { returnTo: window.AUTH_CONFIG.redirectUri } });
    });
    bar.insertAdjacentElement("afterend", btn);
  }

  async function start() {
    if (!configured()) {
      showGate("unconfigured");
      return;
    }

    if (typeof window.auth0 === "undefined") {
      showGate("error", "The Auth0 script did not load. Check your network connection, or that assets/vendor/auth0-spa-js.production.js is present if you're self-hosting it.");
      return;
    }

    var client;
    try {
      client = await window.auth0.createAuth0Client({
        domain: window.AUTH_CONFIG.domain,
        clientId: window.AUTH_CONFIG.clientId,
        authorizationParams: { redirect_uri: window.AUTH_CONFIG.redirectUri },
        cacheLocation: "localstorage"
      });
    } catch (e) {
      showGate("error", "Could not reach Auth0 (" + (e && e.message ? e.message : "unknown error") + "). Check the domain in assets/auth-config.js.");
      return;
    }

    // Coming back from the Auth0 redirect with a code in the URL.
    if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
      try {
        await client.handleRedirectCallback();
      } catch (e) {
        showGate("error", "Sign-in did not complete (" + (e && e.message ? e.message : "unknown error") + "). Try logging in again.");
        return;
      }
      window.history.replaceState({}, document.title, window.AUTH_CONFIG.redirectUri);
    }

    var authenticated = false;
    try {
      authenticated = await client.isAuthenticated();
    } catch (e) {
      authenticated = false;
    }

    if (authenticated) {
      addLogoutButton(client);
      showApp();
      return;
    }

    showGate("signed-out");
    $("btnLogin").onclick = function () {
      client.loginWithRedirect();
    };
  }

  // Exposed so the test suite can invoke the gate deterministically
  // instead of racing a synthetic DOMContentLoaded event. Production
  // code should never call this directly — it always runs via the
  // event listener below.
  window.__RUBRIC_AUTH_START__ = start;

  document.addEventListener("DOMContentLoaded", start);
})();
