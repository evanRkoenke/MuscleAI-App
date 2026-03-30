import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient as createVanillaClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "@/lib/_core/auth";

/**
 * tRPC React client for type-safe API calls inside React components (hooks).
 *
 * IMPORTANT (tRPC v11): The `transformer` must be inside `httpBatchLink`,
 * NOT at the root createClient level. This ensures client and server
 * use the same serialization format (superjson).
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Shared link configuration for both React and vanilla clients.
 */
function createLinks() {
  return [
    httpBatchLink({
      url: `${getApiBaseUrl()}/api/trpc`,
      // tRPC v11: transformer MUST be inside httpBatchLink, not at root
      transformer: superjson,
      async headers() {
        const token = await Auth.getSessionToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      // Custom fetch to include credentials for cookie-based auth
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ];
}

/**
 * Creates the tRPC React client with proper configuration.
 * Call this once in your app's root layout.
 */
export function createTRPCClient() {
  return trpc.createClient({
    links: createLinks(),
  });
}

/**
 * Vanilla (non-React) tRPC client for imperative calls outside of hooks.
 * Use this for cloud sync, subscription restore, and other non-component code.
 *
 * Usage:
 *   import { vanillaTrpc } from "@/lib/trpc";
 *   const result = await vanillaTrpc.sync.getSubscription.query();
 */
export const vanillaTrpc = createVanillaClient<AppRouter>({
  links: createLinks(),
});
