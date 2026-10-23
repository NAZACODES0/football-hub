import { createAuthClient } from "better-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "bearer_token";

// Signs in with a bearer token (stored in localStorage) because the website and the
// API live on different domains, where browsers block cookies.
export const authClient = createAuthClient({
  baseURL: API_URL,
  fetchOptions: {
    auth: {
      type: "Bearer",
      token: () => {
        try {
          return window.localStorage.getItem(TOKEN_KEY) ?? "";
        } catch {
          return "";
        }
      },
    },
    onSuccess: (ctx) => {
      const token = ctx.response.headers.get("set-auth-token");
      if (token) {
        try {
          window.localStorage.setItem(TOKEN_KEY, token);
        } catch {
          // storage blocked: signing in will not persist
        }
      }
    },
  },
});
