const STATE_KEY = "freshmart_github_oauth_state";
const REDIRECT_KEY = "freshmart_github_redirect";

const callbackUrl = () => {
  if (process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI) return process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI;
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/social-callback`;
};

const randomState = () => {
  const values = new Uint32Array(4);
  window.crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(16)).join("");
};

export const startGitHubLogin = (redirectTo = "/") => {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  if (!clientId) throw new Error("NEXT_PUBLIC_GITHUB_CLIENT_ID is not configured.");
  const state = randomState();
  sessionStorage.setItem(STATE_KEY, state);
  sessionStorage.setItem(REDIRECT_KEY, redirectTo || "/");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl(),
    scope: "read:user user:email",
    state,
  });
  window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
};

export const consumeGitHubState = (state: string | null) => {
  const expected = sessionStorage.getItem(STATE_KEY);
  const redirectTo = sessionStorage.getItem(REDIRECT_KEY) || "/";
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(REDIRECT_KEY);
  return { ok: Boolean(state && expected && state === expected), redirectTo };
};
