import { describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn(async () => null) }));

describe("POST /api/ai/chat — kimlik doğrulama", () => {
  it("oturum yoksa 401 döner ve model sağlayıcısına hiç ulaşmaz", async () => {
    const { POST } = await import("@/app/api/ai/chat/route");
    const request = new Request("http://localhost/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "Yarın hangi servisler var?" }] }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.message).toMatch(/oturum/i);
  });
});
