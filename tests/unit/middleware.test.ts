import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "../../middleware";
import { SESSION_COOKIE_NAME } from "@/server/auth/constants";

function makeRequest(pathname: string, cookie?: string) {
  return new NextRequest(`http://localhost${pathname}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

describe("route protection middleware", () => {
  it("redirects private routes without a session cookie", () => {
    const response = middleware(makeRequest("/dashboard"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login?next=%2Fdashboard");
  });

  it("allows private routes when a session cookie exists", () => {
    const response = middleware(
      makeRequest("/clientes", `${SESSION_COOKIE_NAME}=token`),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects login to dashboard when a session cookie exists", () => {
    const response = middleware(
      makeRequest("/login", `${SESSION_COOKIE_NAME}=token`),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });
});
