const KEY = "auth:returnTo";

/** Remember where the user was before being sent to sign in. */
export function setAuthReturnTo(path: string) {
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    /* storage unavailable — fall back to the default landing route */
  }
}

/** Read and clear the stored return path. */
export function consumeAuthReturnTo(): string | null {
  try {
    const value = sessionStorage.getItem(KEY);
    if (value) sessionStorage.removeItem(KEY);
    return value && value.startsWith("/") ? value : null;
  } catch {
    return null;
  }
}
