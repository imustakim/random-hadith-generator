import { describe, expect, it } from "vitest";
import { resolveE2EPort } from "../e2e/port";

describe("resolveE2EPort", () => {
  it("defaults to 3100 when E2E_PORT is unset", () => {
    expect(resolveE2EPort(undefined)).toBe(3100);
  });

  it("treats an empty or whitespace-only value as unset", () => {
    expect(resolveE2EPort("")).toBe(3100);
    expect(resolveE2EPort("   ")).toBe(3100);
  });

  it("parses a valid port", () => {
    expect(resolveE2EPort("3111")).toBe(3111);
    expect(resolveE2EPort(" 8080 ")).toBe(8080);
  });

  it.each(["abc", "31.5", "3100x", "-1", "0", "65536", "1e3", "NaN"])(
    "rejects %j with an error naming E2E_PORT and the value",
    (value) => {
      expect(() => resolveE2EPort(value)).toThrow(
        `E2E_PORT must be an integer between 1 and 65535, got "${value}"`,
      );
    },
  );
});
