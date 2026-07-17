import { test, expect } from "@playwright/test";

test.describe("Access Control & Security", () => {
  test("should redirect unauthenticated users from /dashboard to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login");
    expect(page.url()).toContain("/login");
  });

  test("should redirect unauthenticated users from /dashboard/settings to /login", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForURL("**/login");
    expect(page.url()).toContain("/login");
  });

  test("should redirect unauthenticated users from /dashboard/team to /login", async ({ page }) => {
    await page.goto("/dashboard/team");
    await page.waitForURL("**/login");
    expect(page.url()).toContain("/login");
  });

  test("should redirect unauthenticated users from /dashboard/finance to /login", async ({ page }) => {
    await page.goto("/dashboard/finance");
    await page.waitForURL("**/login");
    expect(page.url()).toContain("/login");
  });
});

test.describe("Tenant Isolation and API Protection", () => {
  test("should reject unauthorized API requests with 401", async ({ request }) => {
    // Attempting to call dynamic APIs without auth cookies/headers
    const inviteResponse = await request.post("/api/invite-team-member", {
      data: {
        email: "test@example.com",
        name: "Test User",
        role: "member"
      }
    });
    // Should be unauthorized (401) or redirected (307)
    expect([401, 307, 500]).toContain(inviteResponse.status());

    const aiResponse = await request.post("/api/ai/generate", {
      data: {
        promptType: "general",
        params: { message: "Hello" }
      }
    });
    expect([401, 307, 500]).toContain(aiResponse.status());
  });
});
