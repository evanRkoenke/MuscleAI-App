import { describe, it, expect } from "vitest";

describe("Google Web Client ID", () => {
  it("should be set and have valid format", () => {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    expect(clientId).toBeDefined();
    expect(clientId).toBeTruthy();
    // Google OAuth client IDs end with .apps.googleusercontent.com
    expect(clientId).toMatch(/\.apps\.googleusercontent\.com$/);
    // Should contain a numeric project ID
    expect(clientId).toMatch(/^\d+-/);
  });
});
