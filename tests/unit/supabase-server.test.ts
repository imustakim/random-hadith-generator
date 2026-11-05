import type { CookieMethodsServer } from "@supabase/ssr";
import { RequestCookiesAdapter } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { RequestCookies } from "next/dist/server/web/spec-extension/cookies";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const cookieStore = vi.hoisted(() => ({
  getAll: vi.fn(() => [{ name: "sb-token", value: "abc" }]),
  set: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));

type CookieAdapter = Required<CookieMethodsServer>;
const adapters = vi.hoisted(() => [] as unknown[]);
vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: { cookies: unknown },
  ) => {
    adapters.push(options.cookies);
    return {};
  },
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";

/** The cookie adapter the server client hands to `@supabase/ssr`. */
async function cookieAdapter(): Promise<CookieAdapter> {
  await createSupabaseServerClient();
  return adapters.at(-1) as CookieAdapter;
}

/** The error Next itself throws when a Server Component writes a cookie. */
function readOnlyError(): unknown {
  try {
    RequestCookiesAdapter.seal(new RequestCookies(new Headers())).set("a", "1");
  } catch (error) {
    return error;
  }
  throw new Error("Next's sealed cookie store did not throw on set");
}

const SET_ALL_HEADERS = {};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "a-test-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
  adapters.length = 0;
});

describe("createSupabaseServerClient cookie adapter", () => {
  it("reads every cookie from the request's cookie store", async () => {
    const adapter = await cookieAdapter();

    expect(adapter.getAll()).toEqual([{ name: "sb-token", value: "abc" }]);
  });

  it("writes each cookie with its options when the store is writable", async () => {
    const adapter = await cookieAdapter();

    await adapter.setAll(
      [
        { name: "a", value: "1", options: { path: "/" } },
        { name: "b", value: "2", options: { httpOnly: true } },
      ],
      SET_ALL_HEADERS,
    );

    expect(cookieStore.set).toHaveBeenCalledTimes(2);
    expect(cookieStore.set).toHaveBeenNthCalledWith(1, "a", "1", { path: "/" });
    expect(cookieStore.set).toHaveBeenNthCalledWith(2, "b", "2", {
      httpOnly: true,
    });
  });

  it("ignores the error a read-only cookie store throws (Server Components)", async () => {
    cookieStore.set.mockImplementationOnce(() => {
      throw readOnlyError();
    });
    const adapter = await cookieAdapter();

    expect(() =>
      adapter.setAll([{ name: "a", value: "1", options: {} }], SET_ALL_HEADERS),
    ).not.toThrow();
    expect(cookieStore.set).toHaveBeenCalledTimes(1);
  });

  it("rethrows any other error instead of swallowing it", async () => {
    cookieStore.set.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const adapter = await cookieAdapter();

    expect(() =>
      adapter.setAll([{ name: "a", value: "1", options: {} }], SET_ALL_HEADERS),
    ).toThrow("boom");
  });
});
