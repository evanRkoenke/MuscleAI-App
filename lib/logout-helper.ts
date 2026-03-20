import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";

/**
 * Full logout: clears Manus OAuth session (server cookie + native token)
 * and local cached user info. Call this before clearing app-context auth state.
 */
export async function performFullLogout(): Promise<void> {
  try {
    await Api.logout();
  } catch (err) {
    console.warn("[Logout] Server logout failed (continuing):", err);
  }
  try {
    await Auth.removeSessionToken();
    await Auth.clearUserInfo();
  } catch (err) {
    console.warn("[Logout] Token cleanup failed:", err);
  }
}
