/*
 * auth-config.js — the only file you need to edit to turn on login.
 *
 * Fill these in from your Auth0 dashboard (Applications → your app →
 * Settings). See README.md → "Setting up Auth0" for the full walkthrough.
 *
 * Note: a domain and client ID are public identifiers, not secrets.
 * Auth0's own docs say it's normal and expected to commit them — the
 * security boundary is Auth0's server, not this value being hidden.
 */
window.AUTH_CONFIG = {
  domain: "dev-fwn3ky3d8y6ampro.us.auth0.com",
  clientId: "lV51lFQyDK0xy5Mgu5cFWsL4BgIZfztb",

  // Leave as-is unless you're hosting somewhere other than the page root.
  redirectUri: window.location.origin + window.location.pathname
};
